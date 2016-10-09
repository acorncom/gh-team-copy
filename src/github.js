import getConfig from './config';
import GitHubApi from 'github';
import Promise from 'bluebird';
import chalk from 'chalk';

export default async function initGithub() {

  const config = await getConfig();

  const github = new GitHubApi({
    version: '3.0.0',
    protocol: 'https',
    debug: config.debug,
    timeout: 5000,
    Promise,
    headers: {
      'user-agent': 'GitHub-Copy-Teams'
    }
  });

  process.on('unhandledRejection', (err) => {
    console.error(chalk.red.bold(`\n Unexpected error. Reason: ${err.message}`));
    process.exit();
  });

  github.authenticate({
    type: 'basic',
    username: config.github.userName,
    password: config.github.password
  });

  let orgIdsOfUser;
  github.users.getOrgs({}).then((orgs) => {
    orgIdsOfUser = orgs.map(org => org.id);
  });

  const validateOrg = (orgToValidate, doneFn) => {

    const assertIfOrgIsValid = (orgName) => {
      if (!orgName || orgName.trim() === '') {
        return doneFn('Enter a valid org name');
      }
      github.orgs.get({ org: orgName}).then((org)=> {
        if (orgIdsOfUser.indexOf(org.id) === -1) {
          return doneFn(`User doesn't belong to ${orgName} and its required for this script to work`);
        }
        return doneFn(true);
      }, () => {
        return doneFn(`${orgName} doesn't exist on GitHub`);
      });
    };

    assertIfOrgIsValid(orgToValidate);

  };

  return {
    addToTeam:      github.orgs.addTeamMembership,
    createTeam:     github.orgs.createTeam,
    getOrgTeams:    github.orgs.getTeams,
    getReposForOrg: github.repos.getForOrg,
    getTeamMembers: github.orgs.getTeamMembers,
    validateOrg
  };

};

