'use strict';

const partesService = require('../logic/partesService');
const { jsonResponse, parseJsonBody } = require('./httpUtil');

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 */
async function handler(event) {
  const parsed = parseJsonBody(event);
  if (!parsed.ok) {
    return jsonResponse(400, { error: parsed.error });
  }

  try {
    const result = await partesService.createPart(parsed.value);
    if (!result.ok) {
      return jsonResponse(result.statusCode, {
        error: 'Validation failed',
        details: result.errors,
      });
    }
    return jsonResponse(result.statusCode, { part: result.part });
  } catch (err) {
    console.error(err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
}

module.exports = { handler };
