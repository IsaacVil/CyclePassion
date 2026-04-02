'use strict';

const {
  PutCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const { getDocumentClient } = require('../lib/dynamoClient');
const { fromDynamoItem } = require('../models/part');

function getTableName() {
  const name = process.env.PARTES_TABLE;
  if (!name) {
    throw new Error('PARTES_TABLE is not set');
  }
  return name;
}

/**
 * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} client
 * @param {import('../models/part').PartRecord} part
 */
async function putPart(client, part) {
  const cmd = new PutCommand({
    TableName: getTableName(),
    Item: {
      id: part.id,
      name: part.name,
      type: part.type,
      price: part.price,
      categories: part.categories,
    },
  });
  await client.send(cmd);
}

/**
 * Query using tipo-categoria GSI for efficient filtering.
 * Falls back to scan if no tipo is specified.
 * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} client
 * @param {{ tipo?: string, categorias?: string[] }} filters
 * @returns {Promise<import('../models/part').PartRecord[]>}
 */
async function scanParts(client, filters) {
  const tipo = filters.tipo ? String(filters.tipo).toLowerCase() : '';
  const categorias = (filters.categorias || [])
    .map((c) => String(c).toLowerCase())
    .filter(Boolean);

  let out;

  if (tipo) {
    // Use the GSI partition key that matches the stored field name.
    const cmd = new QueryCommand({
      TableName: getTableName(),
      IndexName: 'tipo-categoria-index',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': tipo,
      },
    });
    const result = await client.send(cmd);
    out = result.Items || [];
  } else {
    // Fall back to full table scan when no tipo filter
    const cmd = new ScanCommand({ TableName: getTableName() });
    const result = await client.send(cmd);
    out = result.Items || [];
  }

  const items = out.map((item) => fromDynamoItem(item));

  // Filter by categories in memory (since categories is an array)
  return items.filter((p) => {
    if (categorias.length === 0) {
      return true;
    }
    const set = new Set(p.categories);
    return categorias.some((c) => set.has(c));
  });
}

module.exports = {
  putPart,
  scanParts,
  getTableName,
};

