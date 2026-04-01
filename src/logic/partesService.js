'use strict';

const { v4: uuidv4 } = require('uuid');
const { LIMITS, normalizeLabel, toPartRecord } = require('../models/part');
const partRepository = require('../repositories/partRepository');
const { getDocumentClient } = require('../lib/dynamoClient');

/**
 * @param {unknown} body
 * @returns {{ ok: true, part: import('../models/part').PartRecord } | { ok: false, errors: string[] }}
 */
function validateCreatePayload(body) {
  const errors = [];
  if (body === null || body === undefined || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  const { name, type, price, categories } = body;

  if (typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  } else if (name.trim().length > LIMITS.nameMax) {
    errors.push(`name must be at most ${LIMITS.nameMax} characters`);
  }

  /** @type {string | null} */
  let normalizedType = null;
  if (typeof type !== 'string') {
    errors.push('type is required and must be a string');
  } else {
    const nt = normalizeLabel(type, LIMITS.typeMax);
    if (!nt.ok) {
      errors.push(`type ${nt.error}`);
    } else {
      normalizedType = nt.value;
    }
  }

  if (typeof price !== 'number' || Number.isNaN(price)) {
    errors.push('price is required and must be a number');
  } else if (price <= 0) {
    errors.push('price must be greater than zero');
  }

  /** @type {string[] | null} */
  let normalizedCategories = null;
  if (!Array.isArray(categories) || categories.length === 0) {
    errors.push('categories is required and must be a non-empty array');
  } else if (categories.length > LIMITS.categoriesMaxCount) {
    errors.push(`categories must have at most ${LIMITS.categoriesMaxCount} items`);
  } else {
    const out = [];
    let catsOk = true;
    for (let i = 0; i < categories.length; i += 1) {
      const c = categories[i];
      if (typeof c !== 'string' && typeof c !== 'number') {
        errors.push('each category must be a string or number');
        catsOk = false;
        break;
      }
      const nc = normalizeLabel(String(c), LIMITS.categoryTokenMax);
      if (!nc.ok) {
        errors.push(`category at index ${i} ${nc.error}`);
        catsOk = false;
        break;
      }
      out.push(nc.value);
    }
    if (catsOk) {
      normalizedCategories = [...new Set(out)];
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  if (normalizedType === null || normalizedCategories === null) {
    return { ok: false, errors: ['Invalid payload'] };
  }

  const part = toPartRecord({
    id: uuidv4(),
    name: String(name).trim(),
    type: normalizedType,
    price,
    categories: normalizedCategories,
  });

  return { ok: true, part };
}

/**
 * @param {{ tipo?: string, categorias?: string[] }} query
 * @returns {{ ok: false, errors: string[] } | { ok: true }}
 */
function validateListQuery(query) {
  const errors = [];
  const tipo = query.tipo;
  if (tipo !== undefined && tipo !== null && String(tipo).trim() !== '') {
    const nt = normalizeLabel(String(tipo), LIMITS.typeMax);
    if (!nt.ok) {
      errors.push(`tipo ${nt.error}`);
    }
  }

  const cats = query.categorias || [];
  for (let i = 0; i < cats.length; i += 1) {
    const c = cats[i];
    const nc = normalizeLabel(String(c), LIMITS.categoryTokenMax);
    if (!nc.ok) {
      errors.push(`categoria at index ${i} ${nc.error}`);
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }
  return { ok: true };
}

/**
 * @param {unknown} body
 */
async function createPart(body) {
  const validated = validateCreatePayload(body);
  if (!validated.ok) {
    return { ok: false, statusCode: 400, errors: validated.errors };
  }

  const client = getDocumentClient();
  await partRepository.putPart(client, validated.part);
  return { ok: true, statusCode: 201, part: validated.part };
}

/**
 * @param {{ tipo?: string, categorias?: string[] }} query
 */
async function listParts(query) {
  const v = validateListQuery(query);
  if (!v.ok) {
    return { ok: false, statusCode: 400, errors: v.errors };
  }

  const tipo = query.tipo && String(query.tipo).trim() !== ''
    ? normalizeLabel(String(query.tipo), LIMITS.typeMax).value
    : undefined;
  const categorias = (query.categorias || []).map((c) =>
    normalizeLabel(String(c), LIMITS.categoryTokenMax).value,
  );

  const filters = {};
  if (tipo) {
    filters.tipo = tipo;
  }
  if (categorias.length) {
    filters.categorias = categorias;
  }

  const client = getDocumentClient();
  const parts = await partRepository.scanParts(client, filters);
  return { ok: true, statusCode: 200, parts };
}

module.exports = {
  validateCreatePayload,
  validateListQuery,
  createPart,
  listParts,
};
