import { promptForGHCreds } from './prompts';

export default async function initializeConfig() {
  let { userName, password } = await promptForGHCreds();

  return {
    debug: process.env.GH_TEAM_DEBUG ? process.env.GH_TEAM_DEBUG : false,
    github: {
      userName,
      password
    }
  };
};

