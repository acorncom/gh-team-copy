import Promise from 'bluebird';
import inquirer from 'inquirer';


export const gatherRepoNames = inquirer.prompt([{
  type: 'input',
  name: 'sourceOrgName',
  message: 'Source github org',
  validate: (orgToValidate) => new Promise((resolve) => {
    validateOrg(orgToValidate, resolve);
  })
}, {
  type: 'input',
  name: 'targetOrgName',
  message: 'Target github org',
  validate: (orgToValidate) => new Promise((resolve) => {
    validateOrg(orgToValidate, resolve);
  })
}]);

export const findTeamsToCopy = (teams) => {
  return inquirer.prompt([{
    type: 'checkbox',
    name: 'teamsToCopy',
    message: 'Select teams to copy',
    choices: teams.map(team => {
      return { name: team.name, checked: true };
    })
  }]).then(selectedTeams => {
    return Promise.resolve(
      teams.filter(team => selectedTeams.teamsToCopy.indexOf(team.name) !== -1 )
    );
  });
};


