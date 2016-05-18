import {
  getOrgTeamMembers,
  getOrgTeams,
  validateOrg,
} from './github';
import Promise from 'bluebird';
import inquirer from 'inquirer';

/**
 *
 * 1. Get all team + its members info from both source and target orgs
 * 2. If a team name from parent org doesn't exist in the target, create it
 * 3. If someone from parent team doesn't belong to target org's team, add them
 * 4. Give a summary of actions taken at the end
 */
const gatherRepoNames = inquirer.prompt([{
  type: 'input',
  name: 'sourceRepoName',
  message: 'Source github org',
  validate: (orgToValidate) => new Promise((resolve) => {
    validateOrg(orgToValidate, resolve);
  }),
}, {
  type: 'input',
  name: 'targetRepoName',
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

gatherRepoNames.then(repoNames => {

  const {sourceRepoName, targetRepoName} = repoNames;
  let sourceRepoTeams;

  getOrgTeams({org: sourceRepoName}).then(teams => {
    sourceRepoTeams = teams;
    findTeamsToCopy(teams).then(teamsToCopy => {
      console.log(teamsToCopy);
    });
  });

});

