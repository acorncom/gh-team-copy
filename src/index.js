import {
  createTeam,
  getOrgTeamMembers,
  getOrgTeams,
  validateOrg,
} from './github';
import Promise from 'bluebird';
import inquirer from 'inquirer';

/**
 * 4. Give a summary of actions taken at the end
 * retain public visibility levels
 */
const gatherRepoNames = inquirer.prompt([{
  type: 'input',
  name: 'sourceOrgName',
  message: 'Source github org',
  validate: (orgToValidate) => new Promise((resolve) => {
    validateOrg(orgToValidate, resolve);
  }),
}, {
  type: 'input',
  name: 'targetOrgName',
  message: 'Target github org',
  validate: (orgToValidate) => new Promise((resolve) => {
    validateOrg(orgToValidate, resolve);
  }),
}]);

const findTeamsToCopy = (teams) => {
  return inquirer.prompt([{
    type: 'checkbox',
    name: 'teamsToCopy',
    message: 'Select teams to copy',
    choices: teams.map(team => {
      return { name: team.name, checked: true };
    }),
  }]).then(selectedTeams => {
    return Promise.resolve(
      teams.filter(team => selectedTeams.teamsToCopy.indexOf(team.name) !== -1 )
    );
  });
};

let sourceOrgName, targetOrgName;

let actionsPerformed = {
  teamsSkipped: [],
  teamsCreated: [],
  membersInvited: [],
};

const copyTeams = (teamsToCopy) => {
  let teamCreationPromises = [];
  return getOrgTeams({ org: targetOrgName }).then(targetRepoTeams => {
    const targetRepoTeamsSlugs = targetRepoTeams.map(team => { return team.slug });

    teamsToCopy.map(teamInfo => {
      if (targetRepoTeamsSlugs.indexOf(teamInfo.slug) === -1) {
        teamCreationPromises.push(
          createTeam({
            org: targetOrgName,
            name: teamInfo.name,
            permission: teamInfo.permission,
          })
        )
        actionsPerformed.teamsCreated.push(teamInfo.name);
      } else {
        actionsPerformed.teamsSkipped.push(teamInfo.name);
      }
    });

    return Promise.all(teamCreationPromises).then(teams => {
      targetRepoTeams = targetRepoTeams.concat(teams);
      return Promise.resolve({ teamsToCopy, targetRepoTeams });
    });
  }).then(({teamsToCopy, targetRepoTeams}) => {
    targetRepoTeams.map(team => {
      console.log(team);
    });
  });
};

gatherRepoNames.then(repoNames => {
  sourceOrgName = repoNames.sourceOrgName;
  targetOrgName = repoNames.targetOrgName;

  getOrgTeams({org: sourceOrgName})
    .then(findTeamsToCopy)
    .then(copyTeams);

});
