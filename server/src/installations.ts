import crypto from 'node:crypto';
import Database from './postgres-sync.js';

const db = new Database();
db.exec(`
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS installationId TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS credentialHash TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS activationISO TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS revokedISO TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS observedIp TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS platform TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS coreVersion TEXT;
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS lastSyncISO TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS servers_installation_identity ON servers (installationId) WHERE installationId IS NOT NULL AND revokedISO IS NULL;
  CREATE TABLE IF NOT EXISTS installation_challenges (
    codeHash TEXT PRIMARY KEY,
    installationId TEXT NOT NULL,
    credentialHash TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT,
    coreVersion TEXT,
    observedIp TEXT,
    createdISO TEXT NOT NULL,
    expiresISO TEXT NOT NULL,
    claimedServerId TEXT
  );
  CREATE INDEX IF NOT EXISTS installation_challenges_identity ON installation_challenges (installationId);
  CREATE TABLE IF NOT EXISTS installation_events (
    id TEXT PRIMARY KEY,
    serverId TEXT NOT NULL,
    actorUserId TEXT,
    action TEXT NOT NULL,
    reason TEXT,
    details TEXT,
    createdISO TEXT NOT NULL
  );
`);

db.prepare(`
  CREATE OR REPLACE FUNCTION starfin_assign_product_slot(p_user TEXT, p_server TEXT, p_plugin INTEGER)
  RETURNS BOOLEAN LANGUAGE plpgsql AS $fn$
  DECLARE capacity INTEGER; consumed INTEGER; inserted INTEGER;
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_user), p_plugin);
    SELECT GREATEST(
      (SELECT COUNT(*)::integer FROM purchases p WHERE p.userId = p_user AND p.pluginId = p_plugin AND p.status = 'approved'),
      CASE WHEN u.role = 'admin' THEN 1000000 WHEN EXISTS (
        SELECT 1 FROM plans pl WHERE pl.name = u.plan AND pl.active = 1 AND pl.grantsAllPlugins = 1
          AND (u.planExpiresAt IS NULL OR u.planExpiresAt::timestamptz > clock_timestamp())
      ) THEN 1 ELSE 0 END
    ) INTO capacity FROM users u WHERE u.id = p_user;
    IF capacity IS NULL THEN RETURN FALSE; END IF;
    SELECT COUNT(*)::integer INTO consumed FROM server_plugins sp JOIN servers s ON s.id = sp.serverId
      WHERE s.userId = p_user AND sp.pluginId = p_plugin;
    IF capacity <= consumed THEN RETURN FALSE; END IF;
    INSERT INTO server_plugins (serverId, pluginId)
      SELECT s.id, p_plugin FROM servers s WHERE s.id = p_server AND s.userId = p_user
      ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS inserted = ROW_COUNT;
    RETURN inserted > 0;
  END
  $fn$;
`).run();

db.prepare(`
  CREATE OR REPLACE FUNCTION starfin_transfer_product_slot(p_user TEXT, p_from TEXT, p_to TEXT, p_plugin INTEGER)
  RETURNS BOOLEAN LANGUAGE plpgsql AS $fn$
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_user), p_plugin);
    IF p_from = p_to OR NOT EXISTS (SELECT 1 FROM servers WHERE id = p_from AND userId = p_user)
      OR NOT EXISTS (SELECT 1 FROM servers WHERE id = p_to AND userId = p_user)
      OR NOT EXISTS (SELECT 1 FROM server_plugins WHERE serverId = p_from AND pluginId = p_plugin)
      OR EXISTS (SELECT 1 FROM server_plugins WHERE serverId = p_to AND pluginId = p_plugin)
    THEN RETURN FALSE; END IF;
    DELETE FROM server_plugins WHERE serverId = p_from AND pluginId = p_plugin;
    INSERT INTO server_plugins (serverId, pluginId) VALUES (p_to, p_plugin);
    RETURN TRUE;
  END
  $fn$;
`).run();

const sha = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const validId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validCredential = (value: string) => /^[A-Za-z0-9_-]{43,128}$/.test(value);

export function logInstallationEvent(serverId: string, action: string, actorUserId: string | null, reason = '', details: Record<string, unknown> = {}) {
  db.prepare('INSERT INTO installation_events (id, serverId, actorUserId, action, reason, details, createdISO) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), serverId, actorUserId, action, reason, JSON.stringify(details), now());
}

export function createInstallationChallenge(input: { installationId: string; credential: string; name: string; platform: string; coreVersion: string; observedIp: string }) {
  if (!validId(input.installationId) || !validCredential(input.credential) || !input.name.trim() || input.name.length > 100) return { error: 'INVALID_REQUEST' } as const;
  const existing = db.prepare('SELECT id FROM servers WHERE installationId = ? AND revokedISO IS NULL').get(input.installationId);
  if (existing) return { error: 'ALREADY_LINKED' } as const;
  const existingChallenge = db.prepare('SELECT codeHash, expiresISO FROM installation_challenges WHERE installationId = ? AND credentialHash = ? AND claimedServerId IS NULL ORDER BY createdISO DESC LIMIT 1')
    .get(input.installationId, sha(input.credential)) as { codeHash: string; expiresISO: string } | undefined;
  if (existingChallenge && existingChallenge.expiresISO > now()) return { error: 'CHALLENGE_PENDING' } as const;
  const code = crypto.randomBytes(5).toString('hex').toUpperCase();
  const expiresISO = new Date(Date.now() + 10 * 60_000).toISOString();
  db.prepare('INSERT INTO installation_challenges (codeHash, installationId, credentialHash, name, platform, coreVersion, observedIp, createdISO, expiresISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sha(code), input.installationId, sha(input.credential), input.name.trim(), input.platform.slice(0, 64), input.coreVersion.slice(0, 64), input.observedIp, now(), expiresISO);
  return { code, expiresISO } as const;
}

export function claimInstallation(code: string, userId: string, serverId: string | null, reason: string) {
  const codeHash = sha(code.trim().toUpperCase());
  // One SQL transaction owns both the challenge and the target installation.
  const rows = db.prepare(`
    WITH challenge AS MATERIALIZED (
      SELECT * FROM installation_challenges WHERE codeHash = ? AND expiresISO > ? AND claimedServerId IS NULL FOR UPDATE
    ), target AS MATERIALIZED (
      SELECT s.id FROM servers s, challenge c
      WHERE s.id = ? AND s.userId = ? AND (s.installationId IS NULL OR s.installationId = c.installationId OR s.revokedISO IS NOT NULL)
      FOR UPDATE OF s
    ), linked AS (
      UPDATE servers s SET installationId = c.installationId, credentialHash = c.credentialHash,
        activationISO = ?, revokedISO = NULL, observedIp = c.observedIp, platform = c.platform,
        coreVersion = c.coreVersion, lastSyncISO = NULL
      FROM challenge c, target t
      WHERE s.id = t.id AND NOT EXISTS (SELECT 1 FROM servers other WHERE other.installationId = c.installationId AND other.id <> s.id AND other.revokedISO IS NULL)
      RETURNING s.id, s.name, s.installationId
    )
    UPDATE installation_challenges c SET claimedServerId = l.id FROM linked l
    WHERE c.codeHash = ? RETURNING l.id, l.name, l.installationId
  `).all(codeHash, now(), serverId, userId, now(), codeHash) as Array<{ id: string; name: string; installationId: string }>;
  const linked = rows[0];
  if (linked) logInstallationEvent(linked.id, 'installation.link', userId, reason, { installationId: linked.installationId });
  return linked || null;
}

export function findAuthenticatedInstallation(installationId: string, credential: string) {
  if (!validId(installationId) || !validCredential(credential)) return null;
  const row = db.prepare('SELECT * FROM servers WHERE installationId = ? AND credentialHash = ? AND revokedISO IS NULL')
    .get(installationId, sha(credential)) as Record<string, unknown> | undefined;
  return row || null;
}

export function updateInstallationSync(serverId: string, observedIp: string, platform: string, coreVersion: string) {
  const stamp = now();
  db.prepare('UPDATE servers SET observedIp = ?, platform = ?, coreVersion = ?, lastSyncISO = ? WHERE id = ?')
    .run(observedIp, platform.slice(0, 64), coreVersion.slice(0, 64), stamp, serverId);
  return stamp;
}

export function listInstallationEvents(serverId: string) {
  return db.prepare('SELECT id, actorUserId, action, reason, details, createdISO FROM installation_events WHERE serverId = ? ORDER BY createdISO DESC LIMIT 50').all(serverId);
}

export function revokeInstallation(serverId: string, actorUserId: string, reason: string) {
  const changed = db.prepare(`
    WITH revoked AS (
      UPDATE servers SET credentialHash = NULL, revokedISO = ?, lastSyncISO = NULL
      WHERE id = ? AND credentialHash IS NOT NULL AND revokedISO IS NULL RETURNING id
    ), released AS (
      DELETE FROM server_plugins WHERE serverId IN (SELECT id FROM revoked)
    ) SELECT COUNT(*)::integer AS count FROM revoked
  `).get(now(), serverId) as { count: number };
  if (changed.count) logInstallationEvent(serverId, 'installation.revoke', actorUserId, reason);
  return changed.count > 0;
}

export function transferInstallation(serverId: string, targetUserId: string, actorUserId: string, reason: string) {
  // The owner change and removal of the former owner's seats share one statement.
  const moved = db.prepare(`
    WITH previous AS MATERIALIZED (SELECT id, userId FROM servers WHERE id = ? FOR UPDATE),
    cleared AS (DELETE FROM server_plugins WHERE serverId IN (SELECT id FROM previous)),
    moved AS (UPDATE servers SET userId = ?, credentialHash = NULL, revokedISO = ?, lastSyncISO = NULL
      WHERE id IN (SELECT id FROM previous) RETURNING id)
    SELECT previous.userId AS formerUserId FROM previous JOIN moved ON moved.id = previous.id
  `).get(serverId, targetUserId, now()) as { formerUserId: string } | undefined;
  if (moved) logInstallationEvent(serverId, 'installation.transfer', actorUserId, reason, { fromUserId: moved.formerUserId, toUserId: targetUserId });
  return Boolean(moved);
}

export function migrateMatchingLegacyPurchases(userId: string, serverId: string, installationId: string) {
  const rows = db.prepare(`
    SELECT DISTINCT p.pluginId FROM purchases p JOIN users u ON u.id = p.userId
    WHERE p.userId = ? AND p.status = 'approved' AND (p.hwid = ? OR u.licenseHwid = ?)
  `).all(userId, installationId, installationId) as Array<{ pluginId: number }>;
  for (const row of rows) {
    if (assignProductWithLimit(userId, serverId, Number(row.pluginId)))
      logInstallationEvent(serverId, 'legacy.purchase_migrated', userId, 'Vínculo antigo reconhecido', { pluginId: Number(row.pluginId) });
  }
}

export function productEntitlements(userId: string, pluginId: number) {
  const row = db.prepare("SELECT COUNT(*)::integer AS purchased FROM purchases WHERE userId = ? AND pluginId = ? AND status = 'approved'").get(userId, pluginId) as { purchased: number };
  const used = db.prepare('SELECT COUNT(*)::integer AS used FROM server_plugins sp JOIN servers s ON s.id = sp.serverId WHERE s.userId = ? AND sp.pluginId = ?').get(userId, pluginId) as { used: number };
  const global = db.prepare(`SELECT CASE WHEN u.role = 'admin' THEN 1000000 WHEN EXISTS (
    SELECT 1 FROM plans pl WHERE pl.name = u.plan AND pl.active = 1 AND pl.grantsAllPlugins = 1
      AND (u.planExpiresAt IS NULL OR u.planExpiresAt > ?)
  ) THEN 1 ELSE 0 END AS capacity FROM users u WHERE u.id = ?`).get(now(), userId) as { capacity: number } | undefined;
  const limit = Math.max(Number(row.purchased), Number(global?.capacity || 0));
  return { purchased: Number(row.purchased), limit, used: Number(used.used), available: Math.max(0, limit - Number(used.used)) };
}

export function installationHasSeat(userId: string, serverId: string, pluginId: number, limit: number) {
  if (limit < 1) return false;
  const row = db.prepare(`
    SELECT ordinal FROM (
      SELECT sp.serverId, ROW_NUMBER() OVER (ORDER BY s.createdISO, s.id) AS ordinal
      FROM server_plugins sp JOIN servers s ON s.id = sp.serverId
      WHERE s.userId = ? AND sp.pluginId = ?
    ) ranked WHERE serverId = ?
  `).get(userId, pluginId, serverId) as { ordinal: number } | undefined;
  return Boolean(row && Number(row.ordinal) <= limit);
}

export function assignProductWithLimit(userId: string, serverId: string, pluginId: number) {
  // One PostgreSQL transaction acquires a per-account/product advisory lock,
  // then counts purchased and occupied slots against a fresh snapshot.
  const row = db.prepare('SELECT starfin_assign_product_slot(?, ?, ?) AS assigned').get(userId, serverId, pluginId) as { assigned: boolean };
  return Boolean(row.assigned);
}

export function transferProductAssignment(userId: string, fromServerId: string, toServerId: string, pluginId: number, actorUserId: string, reason: string) {
  const row = db.prepare('SELECT starfin_transfer_product_slot(?, ?, ?, ?) AS moved').get(userId, fromServerId, toServerId, pluginId) as { moved: boolean };
  if (row.moved) {
    logInstallationEvent(fromServerId, 'product.transfer_out', actorUserId, reason, { pluginId, toServerId });
    logInstallationEvent(toServerId, 'product.transfer_in', actorUserId, reason, { pluginId, fromServerId });
  }
  return Boolean(row.moved);
}
