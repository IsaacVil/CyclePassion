'use strict';

/**
 * Creates the DynamoDB table on Local DynamoDB (if missing) and loads seed data.
 * Run while DynamoDB Local is listening (e.g. npm run db:start).
 */

process.env.PARTES_TABLE = process.env.PARTES_TABLE || 'moto-partes-dev';
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const tableName = process.env.PARTES_TABLE;

const lowLevel = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

const doc = DynamoDBDocumentClient.from(lowLevel, {
  marshallOptions: { removeUndefinedValues: true },
});

const SEED_PARTS = [
  {
    id: 'seed-001',
    name: 'Pastillas de freno delanteras',
    type: 'frenos',
    price: 45.99,
    categories: ['frenos', 'accesorios'],
  },
  {
    id: 'seed-002',
    name: 'Bujia NGK',
    type: 'motor',
    price: 12.5,
    categories: ['motor', 'electrico'],
  },
  {
    id: 'seed-003',
    name: 'Amortiguador trasero',
    type: 'suspension',
    price: 189.0,
    categories: ['suspension', 'chasis'],
  },
  {
    id: 'seed-004',
    name: 'Espejo retrovisor universal',
    type: 'accesorios',
    price: 24.0,
    categories: ['accesorios', 'otros'],
  },
];

async function ensureTable() {
  try {
    await lowLevel.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (e) {
    if (e && e.name !== 'ResourceNotFoundException') {
      throw e;
    }
  }

  await lowLevel.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    }),
  );

  let ready = false;
  for (let i = 0; i < 30 && !ready; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    const d = await lowLevel.send(new DescribeTableCommand({ TableName: tableName }));
    ready = d.Table?.TableStatus === 'ACTIVE';
  }
}

async function seed() {
  for (const part of SEED_PARTS) {
    await doc.send(
      new PutCommand({
        TableName: tableName,
        Item: part,
      }),
    );
  }
}

async function main() {
  console.log(`Table: ${tableName} @ ${process.env.DYNAMODB_ENDPOINT}`);
  await ensureTable();
  await seed();
  console.log(`Seeded ${SEED_PARTS.length} parts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
