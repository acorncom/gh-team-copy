import getConfig from './config';
import GitHubApi from 'github';
import Promise from 'bluebird';

export default async function initGithub() {

  const config = await getConfig();

  const github = new GitHubApi({
    version: '3.0.0',
    protocol: 'https',
    debug: config.debug,
    timeout: 5000,
    headers: {
      'user-agent': 'GitHub-Copy-Teams' // GitHub is happy with a unique user agent
    }
  });

  github.authenticate({
    type: 'basic',
    username: config.github.userName,
    password: config.github.password
  });


  /** Promise based APIs FTW! **/
  const getOrg         = Promise.promisify(github.orgs.get);
  const getUserOrgs    = Promise.promisify(github.users.getOrgs);
  const addToTeam      = Promise.promisify(github.orgs.addTeamMembership);
  const createTeam     = Promise.promisify(github.orgs.createTeam);
  const getTeamMembers = Promise.promisify(github.orgs.getTeamMembers);
  const getOrgTeams    = Promise.promisify(github.orgs.getTeams);
  const getReposForOrg = Promise.promisify(github.repos.getForOrg);

  let orgIdsOfUser;
  getUserOrgs({}).then((orgs) => {
    orgIdsOfUser = orgs.map(org => org.id);
  });

  const validateOrg = (orgToValidate, doneFn) => {

    const assertIfOrgIsValid = (orgName) => {
      if (!orgName || orgName.trim() === '') {
        return doneFn('Enter a valid org name');
      }
      getOrg({ org: orgName}).then((org)=> {
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
    addToTeam,
    createTeam,
    getOrgTeams,
    getReposForOrg,
    getTeamMembers,
    validateOrg
  };
};
