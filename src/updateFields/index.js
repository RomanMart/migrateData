const { updateTemplates, updateLearningItems } = require('./update');

exports.handler = async () => {
  await updateTemplates();
  await updateLearningItems();
};