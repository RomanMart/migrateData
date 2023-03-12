const batchGetItemsFrom = async (documentClient, learningItemCodes) => {
    const items = [];
    const iterations = Math.ceil(learningItemCodes.length / BATCHSIZE);
    for (let i = 0; i < iterations; i++) {
      const keys = learningItemCodes.slice(i * BATCHSIZE, (i + 1) * BATCHSIZE).map((code) => getKey({ code }));
      const { Responses } = await documentClient.batchGet({
        RequestItems: {
          [TABLENAME]: {
            Keys: keys,
          },
        },
      }).promise();
      items.push(...Responses[TABLENAME]);
    }
    return items;
};

const updateDuration = async (documentClient, { templateParams }) => {
    const templates = await getTemplatesByParams(documentClient, { templateParams });
    const itemsCodes = getItemsCodes(templates);
  
    const learningItems = await batchGetItemsFrom(documentClient, itemsCodes);
    const templateItemsByCodes = formatItems(learningItems);
    const putItems = getItemsToUpdate({ templates, templateItemsByCodes });
    await TemplateDao.batchWriteTemplates(documentClient, { putItems });
  };

  module.exports = {
    updateDuration,
  };