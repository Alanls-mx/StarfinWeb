import assert from 'node:assert/strict';
import { test } from 'node:test';
import Database from './postgres-sync.js';

const db = new Database();

test('converts legacy schema syntax while preserving API column names', () => {
  const sql = db.rewriteSql(`CREATE TABLE IF NOT EXISTS plugins (
    id INTEGER PRIMARY KEY, priceCents INTEGER, description LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  assert.match(sql, /"priceCents" INTEGER/);
  assert.match(sql, /description TEXT/);
  assert.doesNotMatch(sql, /ENGINE=InnoDB/);
});

test('does not change string values while quoting camel case identifiers', () => {
  const sql = db.rewriteSql("SELECT userId FROM users WHERE name = 'userId' AND `key` = ?");
  assert.match(sql, /SELECT "userId"/);
  assert.match(sql, /name = 'userId'/);
  assert.match(sql, /"key" = \?/);
});
