export default {
  github: {
    userName: process.env.GH_USER_NAME,
    password: process.env.GH_PASSWORD
  },
  debug: process.env.GH_DEBUG ? process.env.GH_DEBUG: true
};
