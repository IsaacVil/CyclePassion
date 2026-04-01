'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

function buildClient() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const config = { region };

  const offline =
    process.env.IS_OFFLINE === 'true' ||
    process.env.DYNAMODB_ENDPOINT ||
    process.env.DYNAMODB_LOCAL === 'true';

  if (offline) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
    };
  }

  const lowLevel = new DynamoDBClient(config);
  return DynamoDBDocumentClient.from(lowLevel, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

let cached;
function getDocumentClient() {
  if (!cached) {
    cached = buildClient();
  }
  return cached;
}

module.exports = { getDocumentClient };
