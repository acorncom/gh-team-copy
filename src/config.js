import nconf from 'nconf';
import userHome from 'user-home';
import chalk from 'chalk';
import { promptForGHCreds } from './prompts';

export default async function initializeConfig() {
  const configFile =`${userHome}/.gh-team-copy.json`;

  nconf.file('secure-file', {
    file: configFile,
    secure: {
      secret: 'Ember makes the web a better place!',
      alg: 'aes-256-ctr'
    }
  });

  let github = nconf.get('github') ? nconf.get('github') : {};

  if (!nconf.get('github')) {
    let {userName, password} = await promptForGHCreds();
    nconf.set('github:userName', userName);
    nconf.set('github:password', password);
    github.userName = userName;
    github.password = password;
    nconf.save();
    console.log(chalk.bold.green(`Config saved at ${configFile}`));
  }

  nconf.defaults({ debug: false });

  return {
    debug: nconf.get('debug'),
    github
  };
};

