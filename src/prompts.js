import Promise from 'bluebird';
import inquirer from 'inquirer';
import { validateOrg } from './github';

export const promptForOrgs = () => {
  return inquirer.prompt([{
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
};

export const promptForTeamsToCopy = (teams) => {
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

export const promptForReposToAssociate = (repos, teamName) => {
  return inquirer.prompt([{
    type: 'checkbox',
    name: 'reposToAssociate',
    message: `Select repos to associate to team '${teamName}'`,
    choices: repos.map(repo => {
      return { name: repo.name, checked: true };
    })
  }]);
};

