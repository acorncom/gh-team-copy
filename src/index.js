import {
	getOrgTeamMembers,
	getOrgTeams,
	validateOrgs,
} from './github';

const sourceOrg = process.argv[2];
const targetOrg = process.argv[3];

validateOrgs([sourceOrg, targetOrg]);

getOrgTeams({org: sourceOrg}).then(teams => {
	teams.map(team => {
		getOrgTeamMembers({ id: team.id }).then(members => {
			console.log(team, members);
		});
	});
});


