'use strict';

/**
 * @param {number} statusCode
 * @param {unknown} body
 * @param {Record<string, string>} [extraHeaders]
 */
function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 */
function parseJsonBody(event) {
  if (!event.body) {
    return { ok: true, value: null };
  }
  let raw = event.body;
  if (event.isBase64Encoded) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }
}

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @returns {{ tipo?: string, categorias: string[] }}
 */
function extractListQuery(event) {
  const qs = event.queryStringParameters || {};
  const multi = event.multiValueQueryStringParameters || {};

  const tipoRaw = qs.tipo;
  const tipo =
    tipoRaw !== undefined && tipoRaw !== null && String(tipoRaw).trim() !== ''
      ? String(tipoRaw).trim()
      : undefined;

  /** @type {string[]} */
  let categorias = [];
  const mv = multi.categoria;
  if (Array.isArray(mv)) {
    categorias = mv.map(String).filter((s) => s.trim() !== '');
  } else if (typeof qs.categoria === 'string' && qs.categoria.trim() !== '') {
    categorias = [qs.categoria.trim()];
  }

  if (typeof qs.categorias === 'string' && qs.categorias.trim() !== '') {
    const extra = qs.categorias
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    categorias = categorias.concat(extra);
  }

  categorias = [...new Set(categorias)];
  return { tipo, categorias };
}

module.exports = { jsonResponse, parseJsonBody, extractListQuery };
