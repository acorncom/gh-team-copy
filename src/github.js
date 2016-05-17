import config from './config';
import GitHubApi from 'github';
import Promise from 'bluebird';

const github = new GitHubApi({
    version: "3.0.0",
    //debug: true,
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
const getOrg            = Promise.promisify(github.orgs.get);
export const getOrgTeams       = Promise.promisify(github.orgs.getTeams);
export const getOrgTeamMembers = Promise.promisify(github.orgs.getTeamMembers);
const getUserOrgs       = Promise.promisify(github.user.getOrgs);


export const validateOrgs = (orgsToValidate) => {
	let orgIdsOfUser;

	const assertIfOrgIsValid = (orgName) => {
		if (!orgName || orgName.trim() === '') {
			console.error(`${orgName} is not a valid org name`);
			process.exit(1);
		}
		getOrg({ org: orgName}).then((org)=> {
			if (orgIdsOfUser.indexOf(org.id) === -1) {
				console.error(`User doesn't belong to ${orgName} and its required for this script to work`);
				process.exit(1);
			}
		}, () => {
			console.error(`${orgName} doesn't exist on GitHub`);
			process.exit(1);
		});
	};

	getUserOrgs({}).then(function(orgs) {
		orgIdsOfUser = orgs.map(org => org.id);
		orgsToValidate.map(assertIfOrgIsValid);
	});

};


