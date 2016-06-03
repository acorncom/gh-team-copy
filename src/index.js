#!/usr/bin/env node

import {
  addToTeam,
  createTeam,
  getOrgTeams,
  getTeamMembers,
  validateOrg
} from './github';
import { findTeamsToCopy, gatherRepoNames } from './prompts';
import Promise from 'bluebird';
import chalk from 'chalk';

const sectionHeader = chalk.red.bold.underline;
const subHeader = chalk.green.bold.underline;
const items = chalk.blue;

let sourceOrgName, targetOrgName;

let actionsPerformed = {
  teamsSkipped: [],
  teamsCreated: [],
  membersCopied: {}
};

const createGHTeams = () => {
  return getOrgTeams({ org: targetOrgName }).then(targetRepoTeams => {
    const targetRepoTeamsSlugs = targetRepoTeams.map(team => { return team.slug; });
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

    return Promise.all(teamCreationPromises).then(teams => {
      targetRepoTeams = targetRepoTeams.concat(teams);
      return Promise.resolve({ teamsToCopy, targetRepoTeams });
    });
  });
};

const setupTeams = (teamsToCopy) => {
  return createGHTeams().then( ({teamsToCopy, targetRepoTeams}) => {

    const sourceTeamMemberInfoPromises = teamsToCopy.map(team => {
      return getTeamMembers({ id: team.id, per_page: 100}).then((members) => {
        return { id: team.slug, members: members.map(m => m.login) };
      });
    });

    Promise.all(sourceTeamMemberInfoPromises).then(sourceTeamMemberInfo => {

      let addMembersPromises = [];
      sourceTeamMemberInfo.map(team => {
        targetRepoTeams.filter(t => t.slug === team.id).map(targetTeam => {
          team.members.map(member => {
            actionsPerformed.membersCopied[targetTeam.name].push(member);
            addMembersPromises.push(
              addToTeam({ id: targetTeam.id, user: member})
            );
          });
        });
      });

      Promise.all(addMembersPromises).then(() => {
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
      });

    });
  });
};

gatherRepoNames.then(repoNames => {
  sourceOrgName = repoNames.sourceOrgName;
  targetOrgName = repoNames.targetOrgName;

  getOrgTeams({org: sourceOrgName})
    .then(findTeamsToCopy)
    .then(setupTeams);

});
