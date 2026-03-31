import cors from 'cors';
import express from 'express';
import { auth, categories, createApiKeyForUser, createEmailVerificationToken, createPurchase, createSession, createUser, demoUser, docsSections, findApiKey, findSession, findUserByEmail, getPluginDetail, getLicensesForUser, integrationConfig, outbox, purchases, smtpConfig, statusComponents, changelog, supportTickets, users, verifyEmailToken, verifyPassword, updatePurchaseStatus, createPlugin, updatePlugin, deletePlugin, listApiKeysForUser, pluginSummaries, revokeApiKeyForUser } from './data.js';
import { sendEmail, testSmtp } from './email.js';
function parseIntParam(value, fallback) {
    if (typeof value !== 'string')
        return fallback;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}
function parseFloatParam(value, fallback) {
    if (typeof value !== 'string')
        return fallback;
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
}
function parseStringParam(value) {
    if (typeof value !== 'string')
        return null;
    const s = value.trim();
    return s.length > 0 ? s : null;
}
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function getAuthToken(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer')
        return null;
    return token || null;
}
function getAuthContext(req) {
    const token = getAuthToken(req);
    if (!token)
        return null;
    if (token === auth.demoToken)
        return { token, userId: demoUser.id, role: 'user' };
    if (token === auth.adminToken)
        return { token, userId: demoUser.id, role: 'admin' };
    const session = findSession(token);
    if (session)
        return { token, userId: session.userId, role: session.role };
    return null;
}
function hasValidAuthHeader(req) {
    return getAuthContext(req) !== null;
}
function isAdmin(req) {
    return getAuthContext(req)?.role === 'admin';
}
const app = express();
app.disable('x-powered-by');
app.use(cors({
    origin: true
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        name: 'StarfinPlugins API',
        timeISO: new Date().toISOString()
    });
});
app.get('/api/categories', (_req, res) => {
    res.json({
        items: categories
    });
});
app.get('/api/plugins/featured', (_req, res) => {
    const featured = pluginSummaries
        .filter((p) => p.tags.includes('Popular') || p.tags.includes('Premium'))
        .slice(0, 6);
    res.json({ items: featured });
});
app.get('/api/plugins/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
    }
    const detail = getPluginDetail(id);
    if (!detail) {
        res.status(404).json({ error: 'plugin não encontrado' });
        return;
    }
    res.json(detail);
});
app.get('/api/plugins', (req, res) => {
    const search = parseStringParam(req.query.search);
    const category = parseStringParam(req.query.category);
    const tag = parseStringParam(req.query.tag);
    const ratingMin = parseFloatParam(req.query.ratingMin, 0);
    const sort = parseStringParam(req.query.sort) ?? 'popular';
    const page = clamp(parseIntParam(req.query.page, 1), 1, 10_000);
    const limit = clamp(parseIntParam(req.query.limit, 24), 1, 100);
    let items = pluginSummaries.slice();
    if (search) {
        const q = search.toLowerCase();
        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (category && category !== 'Todas') {
        items = items.filter((p) => p.category === category);
    }
    if (tag) {
        items = items.filter((p) => p.tags.includes(tag));
    }
    if (ratingMin > 0) {
        items = items.filter((p) => p.rating >= ratingMin);
    }
    switch (sort) {
        case 'rating':
            items.sort((a, b) => b.rating - a.rating);
            break;
        case 'price_asc':
            items.sort((a, b) => a.priceCents - b.priceCents);
            break;
        case 'price_desc':
            items.sort((a, b) => b.priceCents - a.priceCents);
            break;
        case 'recent':
            items.sort((a, b) => b.id - a.id);
            break;
        case 'popular':
        default:
            items.sort((a, b) => b.downloads - a.downloads);
            break;
    }
    const total = items.length;
    const offset = (page - 1) * limit;
    const paged = items.slice(offset, offset + limit);
    res.json({
        items: paged,
        page,
        limit,
        total
    });
});
app.post('/api/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
        res.status(400).json({ error: 'email e password são obrigatórios' });
        return;
    }
    const isAdminLogin = /admin/i.test(email);
    if (isAdminLogin) {
        res.json({
            token: auth.adminToken,
            user: { id: 'admin', name: 'Admin', email: 'admin@starfinplugins.com', plan: 'Premium' }
        });
        return;
    }
    if (email.toLowerCase() === demoUser.email.toLowerCase()) {
        res.json({
            token: auth.demoToken,
            user: demoUser
        });
        return;
    }
    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: 'credenciais inválidas' });
        return;
    }
    const session = createSession(user.id, 'user');
    res.json({
        token: session.token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified }
    });
});
app.post('/api/auth/register', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!name || !email || !email.includes('@') || !password || password.length < 6) {
        res.status(400).json({ error: 'name, email válido e password (mín 6) são obrigatórios' });
        return;
    }
    if (findUserByEmail(email)) {
        res.status(409).json({ error: 'email já cadastrado' });
        return;
    }
    const user = createUser({ name, email, password });
    const session = createSession(user.id, 'user');
    const token = createEmailVerificationToken(user.id);
    const verifyUrl = `${integrationConfig.panelBaseUrl}/verify-email?token=${encodeURIComponent(token.token)}`;
    await sendEmail({
        to: user.email,
        subject: 'Confirme seu email - StarfinPlugins',
        html: `<p>Olá, ${user.name}.</p><p>Confirme seu email clicando no link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
    res.status(201).json({
        token: session.token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified },
        devVerificationUrl: verifyUrl
    });
});
app.get('/api/auth/verify-email', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (!token) {
        res.status(400).json({ error: 'token obrigatório' });
        return;
    }
    const user = verifyEmailToken(token);
    if (!user) {
        res.status(400).json({ error: 'token inválido ou expirado' });
        return;
    }
    await sendEmail({
        to: user.email,
        subject: 'Email confirmado - StarfinPlugins',
        html: `<p>Olá, ${user.name}.</p><p>Seu email foi confirmado com sucesso.</p>`
    });
    res.json({ ok: true });
});
app.post('/api/auth/resend-verification', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
        res.status(400).json({ error: 'email obrigatório' });
        return;
    }
    const user = findUserByEmail(email);
    if (!user) {
        res.status(404).json({ error: 'usuário não encontrado' });
        return;
    }
    if (user.verified) {
        res.json({ ok: true });
        return;
    }
    const token = createEmailVerificationToken(user.id);
    const verifyUrl = `${integrationConfig.panelBaseUrl}/verify-email?token=${encodeURIComponent(token.token)}`;
    await sendEmail({
        to: user.email,
        subject: 'Confirme seu email - StarfinPlugins',
        html: `<p>Olá, ${user.name}.</p><p>Confirme seu email clicando no link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
    res.json({ ok: true, devVerificationUrl: verifyUrl });
});
app.get('/api/users/me', (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    if (ctx.role === 'admin') {
        res.json({ id: 'admin', name: 'Admin', email: 'admin@starfinplugins.com', plan: 'Premium' });
        return;
    }
    if (ctx.token === auth.demoToken) {
        res.json(demoUser);
        return;
    }
    const user = users.find((u) => u.id === ctx.userId);
    if (!user) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified });
});
app.get('/api/users/me/licenses', (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    res.json({
        items: getLicensesForUser(ctx.userId)
    });
});
app.get('/api/users/me/api-keys', (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    res.json({
        items: listApiKeysForUser(ctx.userId)
    });
});
app.post('/api/users/me/api-keys', (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!Number.isFinite(pluginId) || pluginId <= 0 || !name) {
        res.status(400).json({ error: 'pluginId e name são obrigatórios' });
        return;
    }
    const hasLicense = getLicensesForUser(ctx.userId).some((p) => p.pluginId === pluginId && p.status === 'Ativo');
    if (!hasLicense) {
        res.status(403).json({ error: 'licença não encontrada para este plugin' });
        return;
    }
    const created = createApiKeyForUser(ctx.userId, pluginId, name);
    res.status(201).json(created);
});
app.delete('/api/users/me/api-keys/:id', (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    const id = req.params.id;
    const ok = revokeApiKeyForUser(ctx.userId, id);
    if (!ok) {
        res.status(404).json({ error: 'chave não encontrada' });
        return;
    }
    res.json({ ok: true });
});
app.post('/api/purchases', async (req, res) => {
    if (!hasValidAuthHeader(req)) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    const ctx = getAuthContext(req);
    const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
    if (!Number.isFinite(pluginId) || pluginId <= 0) {
        res.status(400).json({ error: 'pluginId obrigatório' });
        return;
    }
    const user = ctx.token === auth.demoToken ? users.find((u) => u.id === demoUser.id) : users.find((u) => u.id === ctx.userId);
    if (!user) {
        res.status(401).json({ error: 'não autorizado' });
        return;
    }
    if (!user.verified && ctx.token !== auth.demoToken) {
        res.status(403).json({ error: 'confirme seu email antes de comprar' });
        return;
    }
    const purchase = createPurchase(user.id, pluginId);
    const plugin = getPluginDetail(pluginId);
    await sendEmail({
        to: user.email,
        subject: 'Compra recebida - StarfinPlugins',
        html: `<p>Recebemos sua compra.</p><p>Plugin: <strong>${plugin?.name ?? pluginId}</strong></p><p>Status: pendente</p><p>ID: ${purchase.id}</p>`
    });
    res.status(201).json(purchase);
});
app.post('/api/plugin-auth/verify', (req, res) => {
    const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
    const licenseKey = typeof req.body?.licenseKey === 'string' ? req.body.licenseKey.trim() : '';
    const serverId = typeof req.body?.serverId === 'string' ? req.body.serverId.trim() : null;
    if (!Number.isFinite(pluginId) || pluginId <= 0 || !apiKey || !licenseKey) {
        res.status(400).json({ error: 'pluginId, apiKey e licenseKey são obrigatórios' });
        return;
    }
    const keyRecord = findApiKey(apiKey);
    if (!keyRecord) {
        res.status(401).json({ error: 'apiKey inválida' });
        return;
    }
    if (keyRecord.pluginId !== pluginId) {
        res.status(403).json({ error: 'apiKey não pertence a este plugin' });
        return;
    }
    const license = getLicensesForUser(keyRecord.userId).find((p) => p.pluginId === pluginId && p.licenseKey === licenseKey);
    if (!license) {
        res.status(403).json({ error: 'licenseKey inválida' });
        return;
    }
    if (license.status !== 'Ativo') {
        res.status(403).json({ error: 'licença inativa' });
        return;
    }
    res.json({
        ok: true,
        userId: keyRecord.userId,
        plan: users.find((u) => u.id === keyRecord.userId)?.plan ?? demoUser.plan,
        licenseStatus: license.status,
        serverId
    });
});
app.post('/api/newsletter/subscribe', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'email inválido' });
        return;
    }
    res.json({
        ok: true
    });
});
app.post('/api/support/tickets', async (req, res) => {
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!subject || !message || !email) {
        res.status(400).json({ error: 'subject, message e email são obrigatórios' });
        return;
    }
    const id = `ticket_${Date.now()}`;
    const now = new Date().toISOString();
    supportTickets.push({
        id,
        email,
        subject,
        message,
        status: 'aberto',
        createdISO: now,
        updatedISO: now
    });
    await sendEmail({
        to: email,
        subject: `Ticket recebido (${id}) - StarfinPlugins`,
        html: `<p>Recebemos seu ticket.</p><p><strong>${subject}</strong></p><p>${message}</p><p>ID: ${id}</p>`
    });
    res.status(201).json({
        id,
        status: 'aberto'
    });
});
app.post('/api/plugins/:id/reviews', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
    }
    const plugin = getPluginDetail(id);
    if (!plugin) {
        res.status(404).json({ error: 'plugin não encontrado' });
        return;
    }
    const user = typeof req.body?.user === 'string' ? req.body.user.trim() : '';
    const rating = typeof req.body?.rating === 'number' ? req.body.rating : Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!user || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'user, rating (1-5) e comment são obrigatórios' });
        return;
    }
    res.status(201).json({
        ok: true,
        review: {
            user,
            rating,
            dateISO: new Date().toISOString().slice(0, 10),
            comment
        }
    });
});
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
    app.listen(port, () => {
        process.stdout.write(`StarfinPlugins API rodando em http://localhost:${port}\n`);
    });
}
// Admin routes
app.get('/api/admin/plugins', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({ items: pluginSummaries });
});
app.post('/api/admin/plugins', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const body = req.body ?? {};
    const required = ['name', 'description', 'category', 'tags', 'mcVersion', 'imageUrl', 'priceDisplay'];
    for (const k of required) {
        if (body[k] === undefined || body[k] === null || (typeof body[k] === 'string' && !body[k].trim())) {
            res.status(400).json({ error: `campo obrigatório: ${k}` });
            return;
        }
    }
    const detail = createPlugin({
        name: String(body.name),
        description: String(body.description),
        category: String(body.category),
        tags: Array.isArray(body.tags) ? body.tags : [],
        mcVersion: String(body.mcVersion),
        imageUrl: String(body.imageUrl),
        priceDisplay: String(body.priceDisplay),
        rating: typeof body.rating === 'number' ? body.rating : undefined,
        downloadsDisplay: typeof body.downloadsDisplay === 'string' ? body.downloadsDisplay : undefined
    });
    res.status(201).json(detail);
});
app.put('/api/admin/plugins/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
    }
    const next = updatePlugin(id, req.body ?? {});
    if (!next) {
        res.status(404).json({ error: 'plugin não encontrado' });
        return;
    }
    res.json(next);
});
app.delete('/api/admin/plugins/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
    }
    const ok = deletePlugin(id);
    if (!ok) {
        res.status(404).json({ error: 'plugin não encontrado' });
        return;
    }
    res.json({ ok: true });
});
app.get('/api/admin/categories', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({ items: categories });
});
app.post('/api/admin/categories', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
        res.status(400).json({ error: 'name obrigatório' });
        return;
    }
    if (!categories.includes(name)) {
        categories.push(name);
    }
    res.status(201).json({ ok: true });
});
app.delete('/api/admin/categories', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const idx = categories.findIndex((c) => c === name);
    if (idx === -1) {
        res.status(404).json({ error: 'categoria não encontrada' });
        return;
    }
    categories.splice(idx, 1);
    res.json({ ok: true });
});
app.get('/api/admin/support/tickets', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({ items: supportTickets });
});
app.put('/api/admin/support/tickets/:id', async (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const status = String(req.body?.status ?? '').trim();
    const idx = supportTickets.findIndex((t) => t.id === id);
    if (idx === -1) {
        res.status(404).json({ error: 'ticket não encontrado' });
        return;
    }
    supportTickets[idx].status = status;
    supportTickets[idx].updatedISO = new Date().toISOString();
    await sendEmail({
        to: supportTickets[idx].email,
        subject: `Atualização do ticket (${supportTickets[idx].id}) - StarfinPlugins`,
        html: `<p>Seu ticket foi atualizado.</p><p><strong>${supportTickets[idx].subject}</strong></p><p>Status: ${supportTickets[idx].status}</p><p>ID: ${supportTickets[idx].id}</p>`
    });
    res.json({ ok: true, ticket: supportTickets[idx] });
});
app.get('/api/status', (_req, res) => {
    res.json({ items: statusComponents });
});
app.get('/api/changelog', (_req, res) => {
    res.json({ items: changelog });
});
app.get('/api/docs', (_req, res) => {
    res.json({ items: docsSections, integration: integrationConfig });
});
app.get('/api/admin/smtp', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({
        ...smtpConfig,
        pass: smtpConfig.pass ? '********' : ''
    });
});
app.put('/api/admin/smtp', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const body = req.body ?? {};
    if (typeof body.enabled === 'boolean')
        smtpConfig.enabled = body.enabled;
    if (typeof body.host === 'string')
        smtpConfig.host = body.host.trim();
    if (typeof body.port === 'number')
        smtpConfig.port = body.port;
    if (typeof body.secure === 'boolean')
        smtpConfig.secure = body.secure;
    if (typeof body.user === 'string')
        smtpConfig.user = body.user.trim();
    if (typeof body.pass === 'string' && body.pass && body.pass !== '********')
        smtpConfig.pass = body.pass;
    if (typeof body.fromName === 'string')
        smtpConfig.fromName = body.fromName.trim();
    if (typeof body.fromEmail === 'string')
        smtpConfig.fromEmail = body.fromEmail.trim();
    res.json({ ok: true });
});
app.post('/api/admin/smtp/test', async (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
    if (!to || !to.includes('@')) {
        res.status(400).json({ error: 'to (email) obrigatório' });
        return;
    }
    const result = await testSmtp(to);
    res.json(result);
});
app.get('/api/admin/emails/outbox', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({ items: outbox.slice(0, 50) });
});
app.get('/api/admin/integrations', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json(integrationConfig);
});
app.put('/api/admin/integrations', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const body = req.body ?? {};
    if (typeof body.panelBaseUrl === 'string')
        integrationConfig.panelBaseUrl = body.panelBaseUrl.trim();
    if (typeof body.pluginAuthEndpoint === 'string')
        integrationConfig.pluginAuthEndpoint = body.pluginAuthEndpoint.trim();
    if (typeof body.docsBaseUrl === 'string')
        integrationConfig.docsBaseUrl = body.docsBaseUrl.trim();
    res.json({ ok: true });
});
app.get('/api/admin/purchases', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    res.json({ items: purchases });
});
app.put('/api/admin/purchases/:id', async (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const status = String(req.body?.status ?? '').trim();
    if (status !== 'approved' && status !== 'cancelled' && status !== 'pending') {
        res.status(400).json({ error: 'status inválido' });
        return;
    }
    const purchase = updatePurchaseStatus(id, status);
    if (!purchase) {
        res.status(404).json({ error: 'compra não encontrada' });
        return;
    }
    const user = users.find((u) => u.id === purchase.userId);
    const plugin = getPluginDetail(purchase.pluginId);
    if (user) {
        const base = `<p>Plugin: <strong>${plugin?.name ?? purchase.pluginId}</strong></p><p>ID: ${purchase.id}</p>`;
        const statusHtml = purchase.status === 'approved'
            ? `<p>Status: <strong>Aprovada</strong></p><p>Sua licença: <code>${purchase.licenseKey}</code></p>`
            : purchase.status === 'cancelled'
                ? `<p>Status: <strong>Cancelada</strong></p>`
                : `<p>Status: <strong>Pendente</strong></p>`;
        await sendEmail({
            to: user.email,
            subject: `Atualização da compra (${purchase.id}) - StarfinPlugins`,
            html: `<p>Atualização da sua compra.</p>${base}${statusHtml}`
        });
    }
    res.json({ ok: true, purchase });
});
app.put('/api/admin/status/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const idx = statusComponents.findIndex((s) => s.id === id);
    if (idx === -1) {
        res.status(404).json({ error: 'componente não encontrado' });
        return;
    }
    const status = typeof req.body?.status === 'string' ? req.body.status : '';
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (status)
        statusComponents[idx].status = status;
    if (message)
        statusComponents[idx].message = message;
    statusComponents[idx].updatedISO = new Date().toISOString();
    res.json({ ok: true, item: statusComponents[idx] });
});
app.post('/api/admin/changelog', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const version = typeof req.body?.version === 'string' ? req.body.version.trim() : '';
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!version || !title || !body) {
        res.status(400).json({ error: 'version, title e body são obrigatórios' });
        return;
    }
    const item = { id: `cl_${Date.now()}`, version, title, body, createdISO: new Date().toISOString() };
    changelog.unshift(item);
    res.status(201).json(item);
});
app.put('/api/admin/changelog/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const idx = changelog.findIndex((c) => c.id === id);
    if (idx === -1) {
        res.status(404).json({ error: 'changelog não encontrado' });
        return;
    }
    if (typeof req.body?.version === 'string')
        changelog[idx].version = req.body.version.trim();
    if (typeof req.body?.title === 'string')
        changelog[idx].title = req.body.title.trim();
    if (typeof req.body?.body === 'string')
        changelog[idx].body = req.body.body.trim();
    res.json({ ok: true, item: changelog[idx] });
});
app.delete('/api/admin/changelog/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const idx = changelog.findIndex((c) => c.id === id);
    if (idx === -1) {
        res.status(404).json({ error: 'changelog não encontrado' });
        return;
    }
    changelog.splice(idx, 1);
    res.json({ ok: true });
});
app.put('/api/admin/docs/:id', (req, res) => {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'admin token requerido' });
        return;
    }
    const id = req.params.id;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body : '';
    if (!title || !body) {
        res.status(400).json({ error: 'title e body são obrigatórios' });
        return;
    }
    const idx = docsSections.findIndex((d) => d.id === id);
    const now = new Date().toISOString();
    if (idx === -1) {
        docsSections.push({ id, title, body, updatedISO: now });
        res.status(201).json({ ok: true });
        return;
    }
    docsSections[idx].title = title;
    docsSections[idx].body = body;
    docsSections[idx].updatedISO = now;
    res.json({ ok: true, item: docsSections[idx] });
});
export { app };
