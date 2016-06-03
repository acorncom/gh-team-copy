#!/usr/bin/env node

import {
  addToTeam,
  createTeam,
  getOrgTeams,
  getTeamMembers
} from './github';
import { promptForOrgs, promptForTeamsToCopy } from './prompts';
import Promise from 'bluebird';
import chalk from 'chalk';

const sectionHeader = chalk.red.bold.underline;
const subHeader = chalk.green.bold.underline;
const items = chalk.blue;

(async function main() {
  let actionsPerformed = {
    teamsSkipped: [],
    teamsCreated: [],
    membersCopied: {}
  };

  let orgs = await promptForOrgs();
  let { sourceOrgName, targetOrgName } = orgs;

  const sourceOrgTeams = await getOrgTeams({org: sourceOrgName});
  let targetOrgTeams = await getOrgTeams({ org: targetOrgName });

  const teamsToCopy = await promptForTeamsToCopy(sourceOrgTeams);
  const targetRepoTeamsSlugs = targetOrgTeams.map(team => { return team.slug; });
  let teamCreationPromises = [];

  teamsToCopy.map(teamInfo => {
    if (targetRepoTeamsSlugs.indexOf(teamInfo.slug) === -1) {
      teamCreationPromises.push(
        createTeam({
          org: targetOrgName,
          name: teamInfo.name,
          description: teamInfo.description,
          privacy: teamInfo.privacy
        })
      );
      actionsPerformed.teamsCreated.push(teamInfo.name);
    } else {
      actionsPerformed.teamsSkipped.push(teamInfo.name);
    }
    actionsPerformed.membersCopied[teamInfo.name] = [];
  });

  let teams = await Promise.all(teamCreationPromises);
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
        actionsPerformed.membersCopied[targetTeam.name].push(member);
        addMembersPromises.push(
          addToTeam({ id: targetTeam.id, user: member})
        );
      });
    });
  });

  await Promise.all(addMembersPromises);

  // finally!!!
  if (actionsPerformed.teamsCreated.length > 0) {
    console.log('\n' + sectionHeader('Teams created:') +' ' + actionsPerformed.teamsCreated.join(', '));
  }

  if (actionsPerformed.teamsSkipped.length > 0) {
    console.log('\n' + sectionHeader('Teams skipped(because they already exist):') + ' ' + actionsPerformed.teamsSkipped.join(', '));
  }

  Object.keys(actionsPerformed.membersCopied).map(teamName => {
    console.log('\n' + subHeader('Team name:') + ' ' + teamName);
    console.log(items('Members: ' ) + ' ' + actionsPerformed.membersCopied[teamName].join(', ') +'\n');
  });

})();
