import {
  createTeam,
  getTeamMembers,
  getOrgTeams,
  validateOrg,
  addToTeam,
} from './github';
import Promise from 'bluebird';
import inquirer from 'inquirer';
import chalk from 'chalk';

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
  membersCopied: {},
};

const copyTeams = (teamsToCopy) => {
  let teamCreationPromises = [];
  return getOrgTeams({ org: targetOrgName }).then(targetRepoTeams => {
    const targetRepoTeamsSlugs = targetRepoTeams.map(team => { return team.slug; });

    teamsToCopy.map(teamInfo => {
      if (targetRepoTeamsSlugs.indexOf(teamInfo.slug) === -1) {
        teamCreationPromises.push(
          createTeam({
            org: targetOrgName,
            name: teamInfo.name,
            description: teamInfo.description,
            privacy: teamInfo.privacy,
          })
        )
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
  }).then(({teamsToCopy, targetRepoTeams}) => {

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
          })});
      });

      Promise.all(addMembersPromises).then(() => {
        const sectionHeader = chalk.red.bold.underline;
        const subHeader = chalk.green.bold.underline;
        const items = chalk.blue;
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

    })
  });
};

gatherRepoNames.then(repoNames => {
  sourceOrgName = repoNames.sourceOrgName;
  targetOrgName = repoNames.targetOrgName;

  getOrgTeams({org: sourceOrgName})
    .then(findTeamsToCopy)
    .then(copyTeams);

});
