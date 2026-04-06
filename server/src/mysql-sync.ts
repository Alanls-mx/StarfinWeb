import { spawnSync } from 'node:child_process';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface RunResult {
  affectedRows: number;
  insertId: number;
}

interface RowsResult {
  rows: any[];
}

function parseDbConfig(): DbConfig {
  const rawUrl = (process.env.MYSQL_URL || process.env.DATABASE_URL || '').trim();
  if (rawUrl.startsWith('mysql://')) {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username || 'starfin_app'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace(/^\//, '') || 'starfin_site'
    };
  }

  return {
    host: (process.env.DB_HOST || '127.0.0.1').trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: (process.env.DB_USER || 'starfin_app').trim(),
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'starfin_site').trim()
  };
}

function splitSqlStatements(sqlBlock: string) {
  return sqlBlock
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const PYTHON_BRIDGE = `
import json
import sys
import pymysql

payload = json.loads(sys.stdin.read())
cfg = payload["config"]

conn = pymysql.connect(
    host=cfg["host"],
    port=int(cfg["port"]),
    user=cfg["user"],
    password=cfg["password"],
    database=cfg["database"],
    charset="utf8mb4",
    autocommit=True,
    cursorclass=pymysql.cursors.DictCursor,
)

try:
    with conn.cursor() as cursor:
        cursor.execute(payload["sql"], payload.get("params", []))
        mode = payload["mode"]
        if mode == "run":
            print(json.dumps({
                "affectedRows": int(cursor.rowcount or 0),
                "insertId": int(cursor.lastrowid or 0)
            }))
        else:
            rows = cursor.fetchall()
            print(json.dumps({"rows": rows}, default=str))
finally:
    conn.close()
`;

class MySqlStatement {
  constructor(
    private readonly db: Database,
    private readonly rawSql: string
  ) {}

  run(...params: unknown[]) {
    if (this.db.isPragmaTableInfo(this.rawSql)) {
      return { changes: 0, lastInsertRowid: 0 };
    }
    const sql = this.db.rewriteSql(this.rawSql);
    const result = this.db.runQuery('run', sql, params) as RunResult;
    return {
      changes: Number(result.affectedRows || 0),
      lastInsertRowid: Number(result.insertId || 0)
    };
  }

  all(...params: unknown[]) {
    const pragmaTable = this.db.extractPragmaTableName(this.rawSql);
    if (pragmaTable) {
      return this.db.getTableInfo(pragmaTable);
    }
    const sql = this.db.rewriteSql(this.rawSql);
    const result = this.db.runQuery('all', sql, params) as RowsResult;
    return (result.rows || []) as any[];
  }

  get(...params: unknown[]) {
    const rows = this.all(...params);
    return rows.length > 0 ? rows[0] : undefined;
  }
}

export default class Database {
  private readonly config: DbConfig;

  constructor() {
    this.config = parseDbConfig();
  }

  exec(rawSql: string) {
    const statements = splitSqlStatements(this.rewriteSql(rawSql));
    for (const stmt of statements) {
      this.runQuery('run', stmt, []);
    }
  }

  prepare(rawSql: string) {
    return new MySqlStatement(this, rawSql);
  }

  rewriteSql(rawSql: string) {
    return rawSql
      .replace(/\bINSERT\s+OR\s+IGNORE\b/gi, 'INSERT IGNORE')
      .replace(/\bINSERT\s+OR\s+REPLACE\b/gi, 'REPLACE INTO')
      .replace(/"([A-Za-z_][A-Za-z0-9_]*)"/g, '`$1`');
  }

  isPragmaTableInfo(rawSql: string) {
    return this.extractPragmaTableName(rawSql) !== null;
  }

  extractPragmaTableName(rawSql: string) {
    const match = rawSql.trim().match(/^PRAGMA\s+table_info\((['"`]?)([A-Za-z0-9_]+)\1\)\s*;?$/i);
    return match ? match[2] : null;
  }

  getTableInfo(tableName: string) {
    const result = this.runQuery(
      'all',
      `
        SELECT
          COLUMN_NAME AS name,
          COLUMN_TYPE AS type,
          CASE WHEN IS_NULLABLE = 'NO' THEN 1 ELSE 0 END AS notnull,
          COLUMN_DEFAULT AS dflt_value,
          CASE WHEN COLUMN_KEY = 'PRI' THEN 1 ELSE 0 END AS pk
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `,
      [tableName]
    ) as RowsResult;
    return result.rows || [];
  }

  runQuery(mode: 'run' | 'all', sql: string, params: unknown[]) {
    const payload = JSON.stringify({
      mode,
      sql,
      params,
      config: this.config
    });

    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const cmd = spawnSync(pythonCommand, ['-c', PYTHON_BRIDGE], {
      input: payload,
      encoding: 'utf8',
      env: process.env
    });

    if (cmd.error) {
      throw cmd.error;
    }
    if (cmd.status !== 0) {
      throw new Error((cmd.stderr || cmd.stdout || 'Database bridge failed').trim());
    }

    const out = (cmd.stdout || '').trim();
    if (!out) {
      return mode === 'run'
        ? { affectedRows: 0, insertId: 0 }
        : { rows: [] };
    }

    return JSON.parse(out) as RunResult | RowsResult;
  }
}
