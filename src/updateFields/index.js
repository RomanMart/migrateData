var AWS = require('aws-sdk');

const credentials = new AWS.SharedIniFileCredentials({ profile: 'amdocs-learn-prod-eu-west-1' });
AWS.config.credentials = credentials;
AWS.config.update({
  region: 'eu-west-1',
});
const { updateTemplates, updateLearningItems } = require('./update');


  (async () => await updateTemplates())();
  //(async () => await updateLearningItems())();