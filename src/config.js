import { promptForGHCreds } from './prompts';

export default async function initializeConfig() {
  let github = {};

  let {userName, password} = await promptForGHCreds();
  github.userName = userName;
  github.password = password;

  return {
    debug: process.env.GH_TEAM_DEBUG ? process.env.GH_TEAM_DEBUG : false,
    github
  };
};

