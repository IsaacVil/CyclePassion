'use strict';

/** Length and shape limits (open vocabulary: any sensible label allowed). */
const LIMITS = Object.freeze({
  nameMax: 200,
  typeMax: 80,
  categoryTokenMax: 80,
  categoriesMaxCount: 50,
});

// Control / weird whitespace that we reject in labels
const INVALID_LABEL = /[\x00-\x08\x0b\x0c\x0e-\x1f\u200b\u200c\u200d\ufeff]/;

/**
 * @param {string} s
 * @param {number} maxLen
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
function normalizeLabel(s, maxLen) {
  const t = String(s).trim();
  if (t.length === 0) {
    return { ok: false, error: 'cannot be empty' };
  }
  if (t.length > maxLen) {
    return { ok: false, error: `must be at most ${maxLen} characters` };
  }
  if (INVALID_LABEL.test(t)) {
    return { ok: false, error: 'contains invalid characters' };
  }
  return { ok: true, value: t.toLowerCase() };
}

/**
 * @typedef {Object} PartRecord
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} price
 * @property {string[]} categories
 */

/**
 * @param {unknown} raw
 * @returns {PartRecord}
 */
function toPartRecord(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    type: String(o.type ?? '').toLowerCase(),
    price: typeof o.price === 'number' ? o.price : Number(o.price),
    categories: Array.isArray(o.categories)
      ? o.categories.map((c) => String(c).toLowerCase())
      : [],
  };
}

/**
 * Map persisted item (DynamoDB) to API shape.
 * @param {Record<string, unknown>} item
 * @returns {PartRecord}
 */
function fromDynamoItem(item) {
  return toPartRecord(item);
}

module.exports = {
  LIMITS,
  normalizeLabel,
  toPartRecord,
  fromDynamoItem,
};
