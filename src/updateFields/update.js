const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1", apiVersion: "2006-03-01" });
const XLSX = require("xlsx");
const {
  getTemplates,
  batchWriteTemplates,
  getLearningItems,
  batchWriteLearningItems,
} = require("./dao");

const S3Bucket = "importdatatestbuck";
const templatesSheetName = "templateDetailsReportsMar26th20";
const itemsSheetName = "Item Create dates";

const updateTemplates = async () => {
  const key = "templateDetailsReportsMar26th2023 with name and emp numbers.xlsx";
  const params = {
    Bucket: S3Bucket,
    Key: key,
  };

  try {
    const { Body } = await s3.getObject(params).promise();
    const workbook = XLSX.read(Body, { cellDates: true });
    const worksheet = workbook.Sheets[templatesSheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let LastEvaluatedKey = null;
    let result = null;

    do {
      let updatedTemplates = [];
      result = await getTemplates(LastEvaluatedKey);
      LastEvaluatedKey = result.LastEvaluatedKey;
      let items = result.Items;

      items.forEach((template) => {
        const code = template.code;

        console.log(`FOUND CODE FROM TEMPLATE: ${code}`);

        const excelRow = excelData.filter((row) => {
          return code === row[4];
        });

        if (excelRow[0] != undefined && excelRow[0].length > 0) {
          const updatedTemplate = updateTemplateFields(template, excelRow[0]);
          updatedTemplates.push(updatedTemplate);
        }
      });

      console.log(
        `Sucessfully mapped TEMPLATES. New TEMPLATES: "${JSON.stringify(
          updatedTemplates,
          null,
          "  "
        )}"`
      );
      await batchWriteTemplates(updatedTemplates);
    } while (result.Items.length && result.LastEvaluatedKey);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const updateTemplateFields = (template, excelRow) => {
  console.log(`EXCEL ROW: "${JSON.stringify(excelRow, null, "  ")}"`);

  let updatedTemplate = template;
  const createdBy = excelRow[2];
  const createdByID = excelRow[3];
  const createdAt = excelRow[25];
  const createdAtTimestamp = new Date(createdAt).getTime();

  console.log(`CreatedBy from Excel: ${createdBy}`);
  console.log(`createdAtTimestamp from Excel: ${createdAtTimestamp}`);
  console.log(`createdByID from Excel: ${createdByID}`);

  updatedTemplate.createdAt = createdAtTimestamp;
  updatedTemplate.updatedAt = createdAtTimestamp;
  delete updatedTemplate.updatedBy;  
  delete updatedTemplate.updatedById;  
  delete updatedTemplate.customProductIDs;  
  delete updatedTemplate.productIDs;  
  return {
    ...updatedTemplate,
    createdBy: createdBy,
    createdById: createdByID,
    publishedAt: createdAtTimestamp,
    publishedBy: createdBy,
    publishedById: createdByID,
    lastEditedBy: createdBy,
    lastEditedById: createdByID,
    latest: "V1",
  };
};

const updateLearningItems = async () => {
  const key =
    "Copy of learningItemReports Mar27th23 with names and emp numbers and creation date.xlsx";
  const params = {
    Bucket: S3Bucket,
    Key: key,
  };

  try {
    const { Body } = await s3.getObject(params).promise();
    const workbook = XLSX.read(Body, { cellDates: true });
    const worksheet = workbook.Sheets[itemsSheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let LastEvaluatedKey = null;
    let result = null;

    do {
      let updatedItems = [];
      result = await getLearningItems(LastEvaluatedKey);
      LastEvaluatedKey = result.LastEvaluatedKey;
      let items = result.Items;

      items.forEach((learningItem) => {
        const code = learningItem.code;

        console.log(`FOUND CODE FROM LEARNING ITEM: ${code}`);

        const excelRow = excelData.filter((row) => {
          return code === row[5];
        });

        if (excelRow[0] != undefined && excelRow[0].length > 0) {
          const updatedLearningItem = updateLearningItemFields(
            learningItem,
            excelRow[0]
          );
          updatedItems.push(updatedLearningItem);
        }
      });

      console.log(
        `Sucessfully mapped LEARNING ITEMS. New ITEMS: "${JSON.stringify(
          updatedItems,
          null,
          "  "
        )}"`
      );
      await batchWriteLearningItems(updatedItems);
    } while (result.Items.length && result.LastEvaluatedKey);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const updateLearningItemFields = (learningItem, excelRow) => {
  console.log(`EXCEL ROW: "${JSON.stringify(excelRow, null, "  ")}"`);

  let updatedLearningItem = learningItem;
  const createdBy = excelRow[2];
  const createdByID = excelRow[3];

  console.log(`CreatedBy from Excel: ${createdBy}`);
  console.log(`createdByID from Excel: ${createdByID}`);

  return {
    ...updatedLearningItem,
    createdBy: createdByID,
    createdByUser: createdBy,
    updatedByUser: createdBy,
    updatedBy: createdByID,
  };
};

module.exports = {
  updateTemplates,
  updateLearningItems,
};
