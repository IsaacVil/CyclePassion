'use strict';

const partesService = require('../logic/partesService');
const { jsonResponse, extractListQuery } = require('./httpUtil');

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 */
async function handler(event) {
  const query = extractListQuery(event);

  try {
    const result = await partesService.listParts({
      tipo: query.tipo,
      categorias: query.categorias,
    });
    if (!result.ok) {
      return jsonResponse(result.statusCode, {
        error: 'Validation failed',
        details: result.errors,
      });
    }
    return jsonResponse(result.statusCode, { parts: result.parts });
  } catch (err) {
    console.error(err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
}

module.exports = { handler };
