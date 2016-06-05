#!/usr/bin/env node

import {
  addToTeam,
  createTeam,
  getOrgTeams,
  getReposForOrg,
  getTeamMembers
} from './github';
import {
  promptForOrgs,
  promptForReposToAssociate,
  promptForTeamsToCopy
} from './prompts';

import Promise from 'bluebird';
import summarize from './summary';

(async function main() {
  let actionsPerformed = {
    teamsSkipped: [],
    teamsCreated: [],
    membersCopied: {},
    associatedRepos: {}
  };

  let orgs = await promptForOrgs();
  let { sourceOrgName, targetOrgName } = orgs;

  const sourceOrgTeams = await getOrgTeams({ org: sourceOrgName });
  let targetOrgTeams = await getOrgTeams({ org: targetOrgName });

  const teamsToCopy = await promptForTeamsToCopy(sourceOrgTeams);
  const targetRepoTeamsSlugs = targetOrgTeams.map(team => { return team.slug; });

  const teamsToBeCreated = teamsToCopy.filter(teamInfo => {
    actionsPerformed.membersCopied[teamInfo.name] = [];
    if (targetRepoTeamsSlugs.indexOf(teamInfo.slug) === -1) {
      return teamInfo;
    } else {
      actionsPerformed.teamsSkipped.push(teamInfo.name);
      return false;
    }
  });

  const targetOrgRepos = await getReposForOrg({ org: targetOrgName });

  const createGHTeam = async function(teamInfo) {
    let {reposToAssociate} = await promptForReposToAssociate(targetOrgRepos, teamInfo.name);

    actionsPerformed.teamsCreated.push(teamInfo.name);
    actionsPerformed.associatedRepos[teamInfo.name] = reposToAssociate;

    reposToAssociate = reposToAssociate.map(repo => `${targetOrgName}/${repo}`);

    return await createTeam({
      org: targetOrgName,
      name: teamInfo.name,
      description: teamInfo.description,
      privacy: teamInfo.privacy,
      repo_names: reposToAssociate
    });
  };

  let teams = await Promise.mapSeries(teamsToBeCreated, createGHTeam);
  targetOrgTeams = targetOrgTeams.concat(teams);

  const sourceTeamMemberInfo = await Promise.all(
    teamsToCopy.map(async function(team) {
      let members = await getTeamMembers({ id: team.id, per_page: 100});
      return { id: team.slug, members: members.map(m => m.login) };
    })
  );

  let addMembersPromises = [];
  sourceTeamMemberInfo.map(team => {
    targetOrgTeams.filter(t => t.slug === team.id).map(targetTeam => {
      team.members.map(member => {
        addMembersPromises.push(
          addToTeam({ id: targetTeam.id, user: member })
        );
        actionsPerformed.membersCopied[targetTeam.name].push(member);
      });
    });
  });

  await Promise.all(addMembersPromises);
  summarize(actionsPerformed);

})();
