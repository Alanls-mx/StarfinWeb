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
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  if (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://')) {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username || 'starfin_app'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace(/^\//, '') || 'starfin_site'
    };
  }

  return {
    host: (process.env.DB_HOST || '127.0.0.1').trim(),
    port: Number(process.env.DB_PORT || 5432),
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
import psycopg2
from psycopg2.extras import RealDictCursor

payload = json.loads(sys.stdin.read())
cfg = payload["config"]

conn = psycopg2.connect(
    host=cfg["host"],
    port=int(cfg["port"]),
    user=cfg["user"],
    password=cfg["password"],
    database=cfg["database"],
    cursor_factory=RealDictCursor,
)
conn.autocommit = True

try:
    with conn.cursor() as cursor:
        params = payload.get("params", [])
        sql = payload["sql"]
        if params:
            sql = sql.replace("?", "%s")
        cursor.execute(sql, params)
        mode = payload["mode"]
        if mode == "run":
            print(json.dumps({
                "affectedRows": int(cursor.rowcount or 0),
                "insertId": 0
            }))
        else:
            rows = cursor.fetchall()
            print(json.dumps({"rows": rows}, default=str))
finally:
    conn.close()
`;

class PostgresStatement {
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
    return new PostgresStatement(this, rawSql);
  }

  rewriteSql(rawSql: string) {
    let sql = rawSql
      .replace(/\)\s*ENGINE=InnoDB\s+DEFAULT\s+CHARSET=utf8mb4\s+COLLATE=utf8mb4_unicode_ci/gi, ')')
      .replace(/\bLONGTEXT\b/gi, 'TEXT')
      .replace(/\bTINYINT\b/gi, 'SMALLINT')
      .replace(/`([A-Za-z_][A-Za-z0-9_]*)`/g, '"$1"');

    // PostgreSQL folds unquoted names to lowercase. Preserve the names used by
    // the existing API without changing every query and response mapping.
    sql = sql.split(/('(?:''|[^'])*')/g).map((part, index) => {
      if (index % 2) return part;
      return part.split(/("(?:""|[^"])*")/g).map((quoted, quotedIndex) =>
        quotedIndex % 2 ? quoted : quoted.replace(/\b([a-z]+[A-Z][A-Za-z0-9_]*)\b/g, '"$1"')
      ).join('');
    }).join('');

    sql = sql.replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, 'INSERT INTO');
    if (/^\s*INSERT\s+INTO\b/i.test(sql) && /\bOR\s+IGNORE\b/i.test(rawSql)) {
      sql += ' ON CONFLICT DO NOTHING';
    }
    return sql;
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
          column_name AS name,
          data_type AS type,
          CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
          column_default AS dflt_value,
          0 AS pk
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
        ORDER BY ordinal_position
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
