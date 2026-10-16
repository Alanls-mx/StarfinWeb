import crypto from 'node:crypto';
import Database from './postgres-sync.js';
import { fitsIpGroups, isLaunch, planSeats } from './license-policy.js';
import { getPluginDetail, findUserById, pluginSummaries } from './data.js';

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
  ALTER TABLE servers ADD COLUMN IF NOT EXISTS authorizedPort INTEGER;
  CREATE UNIQUE INDEX IF NOT EXISTS servers_installation_identity ON servers (installationId) WHERE installationId IS NOT NULL AND revokedISO IS NULL;
  CREATE TABLE IF NOT EXISTS installation_challenges (
    codeHash TEXT PRIMARY KEY,
    installationId TEXT NOT NULL,
    credentialHash TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT,
    coreVersion TEXT,
    observedIp TEXT,
    serverPort INTEGER,
    createdISO TEXT NOT NULL,
    expiresISO TEXT NOT NULL,
    claimedServerId TEXT
  );
  CREATE INDEX IF NOT EXISTS installation_challenges_identity ON installation_challenges (installationId);
  ALTER TABLE installation_challenges ADD COLUMN IF NOT EXISTS serverPort INTEGER;
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
  DECLARE purchases INTEGER; subscription_seats INTEGER; required_groups INTEGER; odd_groups INTEGER; inserted INTEGER;
  DECLARE target_ip TEXT;
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_user), p_plugin);
    SELECT COALESCE((SELECT COUNT(*)::integer FROM purchases p WHERE p.userId = p_user AND p.pluginId = p_plugin AND p.status = 'approved'), 0),
      CASE WHEN pl.tags LIKE '%%"Free"%%' OR u.role = 'admin' THEN 1000000
        WHEN u.plan = 'Craft' AND u.planExpiresAt::timestamptz > clock_timestamp()
          AND (pl.launchOverride = 'standard' OR pl.launchOverride = 'auto'
            AND (pl.firstPublishedISO IS NULL OR pl.firstPublishedISO::timestamptz + INTERVAL '60 days' <= clock_timestamp())) THEN 1
        WHEN u.plan IN ('Nexus', 'Premium') AND u.planExpiresAt::timestamptz > clock_timestamp() THEN 2
        ELSE 0 END
      INTO purchases, subscription_seats FROM users u CROSS JOIN plugins pl WHERE u.id = p_user AND pl.id = p_plugin;
    IF purchases IS NULL OR NOT EXISTS (SELECT 1 FROM servers WHERE id = p_server AND userId = p_user AND revokedISO IS NULL) THEN RETURN FALSE; END IF;
    IF EXISTS (SELECT 1 FROM server_plugins WHERE serverId = p_server AND pluginId = p_plugin) THEN RETURN FALSE; END IF;
    IF EXISTS (SELECT 1 FROM plugins WHERE id = p_plugin AND tags LIKE '%%"Free"%%') THEN
      INSERT INTO server_plugins (serverId, pluginId) VALUES (p_server, p_plugin) ON CONFLICT DO NOTHING;
      GET DIAGNOSTICS inserted = ROW_COUNT;
      RETURN inserted > 0;
    END IF;
    SELECT COALESCE(NULLIF(observedIp, ''), NULLIF(ips::jsonb ->> 0, ''), 'unlinked:' || id)
      INTO target_ip FROM servers WHERE id = p_server;
    WITH assigned AS (
      SELECT COALESCE(NULLIF(s.observedIp, ''), NULLIF(s.ips::jsonb ->> 0, ''), 'unlinked:' || s.id) AS ip
      FROM server_plugins sp JOIN servers s ON s.id = sp.serverId
      WHERE s.userId = p_user AND sp.pluginId = p_plugin AND s.revokedISO IS NULL
      UNION ALL SELECT target_ip
    ), grouped AS (SELECT COUNT(*)::integer AS n FROM assigned GROUP BY ip)
    SELECT COALESCE(SUM((n + 1) / 2), 0)::integer, COALESCE(SUM(n %% 2), 0)::integer
      INTO required_groups, odd_groups FROM grouped;
    required_groups := required_groups - LEAST(subscription_seats, odd_groups)
      - GREATEST(subscription_seats - odd_groups, 0) / 2;
    IF required_groups > purchases THEN RETURN FALSE; END IF;
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
    IF starfin_assign_product_slot(p_user, p_to, p_plugin) THEN RETURN TRUE; END IF;
    INSERT INTO server_plugins (serverId, pluginId) VALUES (p_from, p_plugin);
    RETURN FALSE;
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

export function createInstallationChallenge(input: { installationId: string; credential: string; name: string; platform: string; coreVersion: string; observedIp: string; serverPort: number }) {
  if (!validId(input.installationId) || !validCredential(input.credential) || !input.name.trim() || input.name.length > 100 || !validPort(input.serverPort)) return { error: 'INVALID_REQUEST' } as const;
  const existing = db.prepare('SELECT id FROM servers WHERE installationId = ? AND revokedISO IS NULL').get(input.installationId);
  if (existing) return { error: 'ALREADY_LINKED' } as const;
  const existingChallenge = db.prepare('SELECT codeHash, expiresISO FROM installation_challenges WHERE installationId = ? AND credentialHash = ? AND claimedServerId IS NULL ORDER BY createdISO DESC LIMIT 1')
    .get(input.installationId, sha(input.credential)) as { codeHash: string; expiresISO: string } | undefined;
  if (existingChallenge && existingChallenge.expiresISO > now()) return { error: 'CHALLENGE_PENDING' } as const;
  const code = crypto.randomBytes(5).toString('hex').toUpperCase();
  const expiresISO = new Date(Date.now() + 10 * 60_000).toISOString();
  db.prepare('INSERT INTO installation_challenges (codeHash, installationId, credentialHash, name, platform, coreVersion, observedIp, serverPort, createdISO, expiresISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sha(code), input.installationId, sha(input.credential), input.name.trim(), input.platform.slice(0, 64), input.coreVersion.slice(0, 64), input.observedIp, input.serverPort, now(), expiresISO);
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
        coreVersion = c.coreVersion, authorizedPort = c.serverPort,
        ips = CASE WHEN s.ips IS NULL OR s.ips = '[]' THEN json_build_array(c.observedIp)::text ELSE s.ips END,
        lastSyncISO = NULL
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

export const validPort = (port: unknown): port is number => typeof port === 'number' && Number.isInteger(port) && port >= 1 && port <= 65535;

export function pinLegacyInstallationIp(serverId: string, observedIp: string): string[] {
  db.prepare("UPDATE servers SET ips = ? WHERE id = ? AND (ips IS NULL OR ips = '[]') AND credentialHash IS NOT NULL AND revokedISO IS NULL")
    .run(JSON.stringify([observedIp]), serverId);
  const row = db.prepare('SELECT ips FROM servers WHERE id = ? AND credentialHash IS NOT NULL AND revokedISO IS NULL')
    .get(serverId) as { ips: string } | undefined;
  return row ? JSON.parse(row.ips || '[]') as string[] : [];
}

export function authorizedInstallationPort(serverId: string, reportedPort: number, allowLegacyBind: boolean): number | null {
  if (!validPort(reportedPort)) return null;
  // Older links predate port capture. Their authenticated first check pins the port once.
  if (allowLegacyBind) db.prepare('UPDATE servers SET authorizedPort = ? WHERE id = ? AND authorizedPort IS NULL AND credentialHash IS NOT NULL AND revokedISO IS NULL')
    .run(reportedPort, serverId);
  const row = db.prepare('SELECT authorizedPort FROM servers WHERE id = ? AND credentialHash IS NOT NULL AND revokedISO IS NULL')
    .get(serverId) as { authorizedPort: number | null } | undefined;
  return row?.authorizedPort ?? null;
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
  const used = db.prepare('SELECT COUNT(*)::integer AS used FROM server_plugins sp JOIN servers s ON s.id = sp.serverId WHERE s.userId = ? AND sp.pluginId = ? AND s.revokedISO IS NULL').get(userId, pluginId) as { used: number };
  const owner = findUserById(userId);
  const plugin = getPluginDetail(pluginId);
  const subscription = plugin?.tags.includes('Free') ? -1 : owner?.role === 'admin' ? 1000000 : planSeats(owner?.plan || 'Spawn', owner?.planExpiresAt, plugin?.tags || [], isLaunch(plugin?.firstPublishedISO, plugin?.launchOverride));
  const purchased = Number(row.purchased);
  const unlimited = subscription === -1;
  const limit = unlimited ? -1 : purchased * 2 + subscription;
  return { purchased, subscription, limit, used: Number(used.used), available: unlimited ? -1 : Math.max(0, limit - Number(used.used)) };
}

export function installationHasSeat(userId: string, serverId: string, pluginId: number, limit: number) {
  if (limit === -1) return Boolean(db.prepare(`SELECT 1 FROM server_plugins sp JOIN servers s ON s.id = sp.serverId
    WHERE s.id = ? AND s.userId = ? AND s.revokedISO IS NULL AND sp.pluginId = ?`).get(serverId, userId, pluginId));
  if (limit < 1) return false;
  const quantity = productEntitlements(userId, pluginId);
  const assignments = db.prepare(`
    SELECT s.id, COALESCE(NULLIF(s.observedIp, ''), NULLIF(s.ips::jsonb ->> 0, ''), 'unlinked:' || s.id) AS networkKey
    FROM server_plugins sp JOIN servers s ON s.id = sp.serverId
    WHERE s.userId = ? AND sp.pluginId = ? AND s.revokedISO IS NULL
    ORDER BY s.createdISO, s.id
  `).all(userId, pluginId) as Array<{ id: string; networkKey: string }>;
  const groups = new Map<string, number>();
  for (const assignment of assignments) {
    groups.set(assignment.networkKey, (groups.get(assignment.networkKey) || 0) + 1);
    if (!fitsIpGroups(groups.values(), quantity.purchased, quantity.subscription)) {
      groups.set(assignment.networkKey, groups.get(assignment.networkKey)! - 1);
      if (assignment.id === serverId) return false;
    } else if (assignment.id === serverId) return true;
  }
  return false;
}

export function assignProductWithLimit(userId: string, serverId: string, pluginId: number) {
  // One PostgreSQL transaction acquires a per-account/product advisory lock,
  // then counts purchased and occupied slots against a fresh snapshot.
  const row = db.prepare('SELECT starfin_assign_product_slot(?, ?, ?) AS assigned').get(userId, serverId, pluginId) as { assigned: boolean };
  return Boolean(row.assigned);
}

export function assignEligibleProductsOnLink(userId: string, serverId: string) {
  const owner = findUserById(userId);
  if (!owner || owner.banned) return [];
  const purchased = db.prepare("SELECT DISTINCT pluginId FROM purchases WHERE userId = ? AND status = 'approved'")
    .all(userId) as Array<{ pluginId: number }>;
  const candidates = new Set<number>(purchased.map(row => Number(row.pluginId)));
  for (const plugin of pluginSummaries) {
    if (owner.role === 'admin' || planSeats(owner.plan, owner.planExpiresAt, plugin.tags,
      isLaunch(plugin.firstPublishedISO, plugin.launchOverride)) !== 0) candidates.add(plugin.id);
  }
  const assigned: number[] = [];
  for (const pluginId of candidates) {
    if (assignProductWithLimit(userId, serverId, pluginId)) {
      logInstallationEvent(serverId, 'product.assign', userId, 'Atribuição automática após vínculo confirmado', { pluginId });
      assigned.push(pluginId);
    }
  }
  return assigned;
}

export function transferProductAssignment(userId: string, fromServerId: string, toServerId: string, pluginId: number, actorUserId: string, reason: string) {
  const row = db.prepare('SELECT starfin_transfer_product_slot(?, ?, ?, ?) AS moved').get(userId, fromServerId, toServerId, pluginId) as { moved: boolean };
  if (row.moved) {
    logInstallationEvent(fromServerId, 'product.transfer_out', actorUserId, reason, { pluginId, toServerId });
    logInstallationEvent(toServerId, 'product.transfer_in', actorUserId, reason, { pluginId, fromServerId });
  }
  return Boolean(row.moved);
}
