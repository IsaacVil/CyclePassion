'use strict';

const DynamoDBLocal = require('dynamodb-local');

const port = parseInt(process.env.DYNAMODB_LOCAL_PORT || '8000', 10);

DynamoDBLocal.launch(port, null, ['-sharedDb'], false)
  .then(() => {
    console.log(`DynamoDB Local listening on http://localhost:${port}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
