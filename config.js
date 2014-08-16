var config = {};

// should end in /
config.rootUrl = process.env.ROOT_URL || 'http://localhost:3000/';

config.facebook = {
  appId: process.env.FACEBOOK_APPID || 'YOUR_APP_ID',
  appSecret: process.env.FACEBOOK_APPSECRET || 'YOUR_APP_SECRET',
  appNamespace: process.env.FACEBOOK_APPNAMESPACE || '',
  redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login/callback'
};

module.exports = config;
