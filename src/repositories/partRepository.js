'use strict';

const {
  PutCommand,
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
 * Scan table and apply optional filters in memory for small local datasets.
 * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} client
 * @param {{ tipo?: string, categorias?: string[] }} filters
 * @returns {Promise<import('../models/part').PartRecord[]>}
 */
async function scanParts(client, filters) {
  const cmd = new ScanCommand({ TableName: getTableName() });
  const out = await client.send(cmd);
  const items = (out.Items || []).map((item) => fromDynamoItem(item));

  const tipo = filters.tipo ? String(filters.tipo).toLowerCase() : '';
  const categorias = (filters.categorias || [])
    .map((c) => String(c).toLowerCase())
    .filter(Boolean);

  return items.filter((p) => {
    if (tipo && p.type !== tipo) {
      return false;
    }
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
