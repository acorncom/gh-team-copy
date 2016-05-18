import config from './config';
import GitHubApi from 'github';
import Promise from 'bluebird';

const github = new GitHubApi({
  version: "3.0.0",
  protocol: "https",
  timeout: 5000,
  headers: {
    "user-agent": "GitHub-Copy-Teams" // GitHub is happy with a unique user agent
  }
});

github.authenticate({
  type: "basic",
  username: config.github.userName,
  password: config.github.password
});


/** Promise based APIs FTW! **/
const getOrg                   = Promise.promisify(github.orgs.get);
const getUserOrgs              = Promise.promisify(github.user.getOrgs);
export const getOrgTeams       = Promise.promisify(github.orgs.getTeams);
export const getOrgTeamMembers = Promise.promisify(github.orgs.getTeamMembers);

let orgIdsOfUser;
getUserOrgs({}).then((orgs) => {
  orgIdsOfUser = orgs.map(org => org.id);
});

export const validateOrg = (orgToValidate, doneFn) => {

  const assertIfOrgIsValid = (orgName) => {
    if (!orgName || orgName.trim() === '') {
      return doneFn(`Enter a valid org name`);
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
