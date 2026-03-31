import crypto from 'node:crypto';
function parseBRLToCents(price) {
    const normalized = price
        .replaceAll('R$', '')
        .trim()
        .replaceAll('.', '')
        .replace(',', '.');
    const value = Number(normalized);
    if (!Number.isFinite(value))
        return 0;
    return Math.round(value * 100);
}
function parseDownloadsToNumber(value) {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.endsWith('K')) {
        const n = Number(trimmed.slice(0, -1));
        if (!Number.isFinite(n))
            return 0;
        return Math.round(n * 1000);
    }
    if (trimmed.endsWith('M')) {
        const n = Number(trimmed.slice(0, -1));
        if (!Number.isFinite(n))
            return 0;
        return Math.round(n * 1_000_000);
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 0;
}
const pluginSummariesRaw = [
    {
        id: 1,
        name: 'EconomyPlus Pro',
        description: 'Sistema de economia completo com loja, banco e moedas customizáveis',
        price: 'R$ 49,90',
        rating: 4.9,
        downloads: '12.5K',
        tags: ['Popular', 'Premium'],
        category: 'Economia',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&h=300&fit=crop'
    },
    {
        id: 2,
        name: 'UltraRanks',
        description: 'Sistema de ranks e permissões avançado com GUI intuitiva',
        price: 'R$ 39,90',
        rating: 4.8,
        downloads: '9.8K',
        tags: ['Novo'],
        category: 'Administração',
        mcVersion: '1.19.x',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
    },
    {
        id: 3,
        name: 'MiniGames Suite',
        description: 'Coleção completa de minigames otimizados para performance',
        price: 'R$ 79,90',
        rating: 5.0,
        downloads: '15.2K',
        tags: ['Popular', 'Premium'],
        category: 'Minigames',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'
    },
    {
        id: 4,
        name: 'CustomMobs AI',
        description: 'Mobs customizados com inteligência artificial avançada',
        price: 'R$ 59,90',
        rating: 4.7,
        downloads: '8.3K',
        tags: ['Premium'],
        category: 'Gameplay',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
    },
    {
        id: 5,
        name: 'WorldGuard Elite',
        description: 'Proteção de mundo avançada com regiões e flags customizáveis',
        price: 'R$ 44,90',
        rating: 4.9,
        downloads: '11.1K',
        tags: ['Popular'],
        category: 'Administração',
        mcVersion: '1.19.x',
        imageUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop'
    },
    {
        id: 6,
        name: 'ChatManager Pro',
        description: 'Gerenciamento completo de chat com filtros e canais',
        price: 'R$ 34,90',
        rating: 4.6,
        downloads: '7.9K',
        tags: ['Novo'],
        category: 'Social',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop'
    },
    {
        id: 7,
        name: 'RPG Quests Pro',
        description: 'Sistema completo de missões e quests para servidores RPG',
        price: 'R$ 54,90',
        rating: 4.8,
        downloads: '10.2K',
        tags: ['Premium'],
        category: 'RPG',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop'
    },
    {
        id: 8,
        name: 'AntiCheat Ultimate',
        description: 'Proteção avançada contra hackers e cheaters',
        price: 'R$ 69,90',
        rating: 4.9,
        downloads: '13.8K',
        tags: ['Popular', 'Premium'],
        category: 'Segurança',
        mcVersion: '1.20.x',
        imageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&h=300&fit=crop'
    },
    {
        id: 9,
        name: 'CustomEnchants',
        description: 'Encantamentos customizados com efeitos únicos',
        price: 'R$ 29,90',
        rating: 4.5,
        downloads: '6.7K',
        tags: ['Novo'],
        category: 'Gameplay',
        mcVersion: '1.19.x',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop'
    }
];
export const pluginSummaries = pluginSummariesRaw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    tags: [...p.tags],
    mcVersion: p.mcVersion,
    rating: p.rating,
    downloads: parseDownloadsToNumber(p.downloads),
    downloadsDisplay: p.downloads,
    imageUrl: p.imageUrl,
    priceDisplay: p.price,
    priceCents: parseBRLToCents(p.price),
    currency: 'BRL'
}));
export const pluginDetailsById = {
    1: {
        ...pluginSummaries.find((p) => p.id === 1),
        tagline: 'Sistema de economia completo para servidores profissionais',
        version: '2.5.1',
        author: 'DevStudio',
        lastUpdateISO: '2026-03-15',
        reviewsCount: 287,
        screenshots: Array.from({ length: 6 }).map((_, i) => `https://images.unsplash.com/photo-${1614741118887 + (i + 1)}?w=800&h=500&fit=crop`),
        features: [
            { title: 'Seguro e Confiável', description: 'Código auditado e testado' },
            { title: 'Alto Desempenho', description: 'Otimizado para servidores grandes' },
            { title: 'Suporte Premium', description: 'Suporte dedicado 24/7' }
        ],
        docsSections: [
            { title: 'Instalação', description: 'Como instalar o plugin em seu servidor' },
            { title: 'Configuração Básica', description: 'Primeiros passos e configurações essenciais' },
            { title: 'Comandos', description: 'Lista completa de comandos disponíveis' },
            { title: 'Permissões', description: 'Sistema de permissões e grupos' },
            { title: 'API para Desenvolvedores', description: 'Como integrar com seu próprio plugin' }
        ],
        reviews: [
            {
                user: 'João Silva',
                rating: 5,
                dateISO: '2026-03-10',
                comment: 'Melhor plugin de economia que já usei! Muito completo e fácil de configurar.'
            },
            {
                user: 'Maria Santos',
                rating: 5,
                dateISO: '2026-03-08',
                comment: 'Excelente suporte e documentação. Vale cada centavo!'
            },
            {
                user: 'Pedro Costa',
                rating: 4,
                dateISO: '2026-03-05',
                comment: 'Muito bom, mas poderia ter mais opções de customização.'
            }
        ]
    }
};
function toPluginDetails(id, input) {
    const summary = pluginSummaries.find((p) => p.id === id);
    if (!summary) {
        throw new Error('plugin not found');
    }
    return {
        ...summary,
        tagline: input.tagline,
        version: input.version,
        author: input.author,
        lastUpdateISO: input.lastUpdateISO ?? '2026-03-01',
        reviewsCount: input.reviewsCount ?? Math.floor(40 + Math.random() * 240),
        screenshots: input.screenshots ?? [summary.imageUrl.replace('w=400&h=300', 'w=800&h=500')],
        features: input.features ?? [
            { title: 'Instalação simples', description: 'Configuração rápida e objetiva.' },
            { title: 'Compatível com servidores grandes', description: 'Pensado para performance e estabilidade.' },
            { title: 'Atualizações frequentes', description: 'Melhorias contínuas e correções.' }
        ],
        docsSections: input.docsSections ?? [
            { title: 'Instalação', description: 'Como instalar o plugin em seu servidor' },
            { title: 'Configuração', description: 'Configurações essenciais e exemplos' },
            { title: 'Comandos', description: 'Lista de comandos e permissões' },
            { title: 'API', description: 'Integração com sistemas externos' }
        ],
        reviews: input.reviews ?? [
            {
                user: 'PlayerBR',
                rating: 5,
                dateISO: '2026-03-12',
                comment: 'Excelente plugin, fácil de configurar.'
            },
            {
                user: 'AdminCraft',
                rating: 4,
                dateISO: '2026-03-07',
                comment: 'Muito bom, suporte respondeu rápido.'
            }
        ]
    };
}
Object.assign(pluginDetailsById, {
    2: toPluginDetails(2, {
        tagline: 'Ranks, permissões e GUI com experiência premium',
        version: '1.9.3',
        author: 'RankForge'
    }),
    3: toPluginDetails(3, {
        tagline: 'Minigames prontos para rodar com performance e recompensas',
        version: '4.2.0',
        author: 'MiniLabs'
    }),
    4: toPluginDetails(4, {
        tagline: 'IA avançada para mobs customizados e desafios únicos',
        version: '3.0.7',
        author: 'MobWorks'
    }),
    5: toPluginDetails(5, {
        tagline: 'Proteção avançada com regiões e flags para servidores profissionais',
        version: '3.1.0',
        author: 'GuardTeam'
    }),
    6: toPluginDetails(6, {
        tagline: 'Chat limpo, bonito e moderado com filtros e canais',
        version: '1.8.2',
        author: 'ChatStudio'
    }),
    7: toPluginDetails(7, {
        tagline: 'Sistema completo de quests com progresso, recompensas e NPCs',
        version: '2.2.5',
        author: 'RPGCore'
    }),
    8: toPluginDetails(8, {
        tagline: 'Detecção inteligente e proteção contra trapaças',
        version: '5.0.1',
        author: 'SecureNet'
    }),
    9: toPluginDetails(9, {
        tagline: 'Encantamentos customizados com efeitos únicos e balanceados',
        version: '1.3.4',
        author: 'EnchantLab'
    })
});
export function getPluginDetail(id) {
    const detail = pluginDetailsById[id];
    if (detail)
        return detail;
    const summary = pluginSummaries.find((p) => p.id === id);
    if (!summary)
        return null;
    return {
        ...summary,
        tagline: '',
        version: '1.0.0',
        author: 'Desconhecido',
        lastUpdateISO: '2026-01-01',
        reviewsCount: 0,
        screenshots: [],
        features: [],
        docsSections: [],
        reviews: []
    };
}
export const categories = [
    'Economia',
    'Administração',
    'Minigames',
    'Gameplay',
    'Social',
    'RPG',
    'Segurança'
];
export const demoUser = {
    id: 'user_demo_1',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    plan: 'Premium'
};
export const purchasedPlugins = [
    {
        id: 1,
        pluginId: 1,
        name: 'EconomyPlus Pro',
        version: '2.5.1',
        purchaseDateISO: '2026-03-15',
        licenseKey: 'XXXX-XXXX-XXXX-1234',
        status: 'Ativo'
    },
    {
        id: 2,
        pluginId: 5,
        name: 'WorldGuard Elite',
        version: '3.1.0',
        purchaseDateISO: '2026-03-10',
        licenseKey: 'XXXX-XXXX-XXXX-5678',
        status: 'Ativo'
    },
    {
        id: 3,
        pluginId: 6,
        name: 'ChatManager Pro',
        version: '1.8.2',
        purchaseDateISO: '2026-03-05',
        licenseKey: 'XXXX-XXXX-XXXX-9012',
        status: 'Ativo'
    }
];
export const auth = {
    demoToken: 'dev-token',
    adminToken: 'admin-token'
};
export const apiKeys = [];
function randomKey() {
    return crypto.randomBytes(24).toString('base64url');
}
export function listApiKeysForUser(userId) {
    return apiKeys
        .filter((k) => k.userId === userId)
        .sort((a, b) => b.createdISO.localeCompare(a.createdISO))
        .map((k) => ({
        id: k.id,
        pluginId: k.pluginId,
        name: k.name,
        keyPrefix: `${k.key.slice(0, 8)}…`,
        createdISO: k.createdISO,
        lastUsedISO: k.lastUsedISO
    }));
}
export function createApiKeyForUser(userId, pluginId, name) {
    const id = `key_${crypto.randomUUID()}`;
    const key = `sk_${randomKey()}`;
    const createdISO = new Date().toISOString();
    const record = {
        id,
        userId,
        pluginId,
        name,
        key,
        createdISO,
        lastUsedISO: null
    };
    apiKeys.push(record);
    return {
        id,
        pluginId,
        name,
        key,
        createdISO
    };
}
export function revokeApiKeyForUser(userId, id) {
    const idx = apiKeys.findIndex((k) => k.userId === userId && k.id === id);
    if (idx === -1)
        return false;
    apiKeys.splice(idx, 1);
    return true;
}
export function findApiKey(key) {
    const record = apiKeys.find((k) => k.key === key);
    if (!record)
        return null;
    record.lastUsedISO = new Date().toISOString();
    return record;
}
export const supportTickets = [];
// Admin helpers for plugin CRUD
export function nextPluginId() {
    const maxId = pluginSummaries.reduce((max, p) => Math.max(max, p.id), 0);
    return maxId + 1;
}
export function createPlugin(input) {
    const id = nextPluginId();
    const rating = input.rating ?? 4.5;
    const downloadsDisplay = input.downloadsDisplay ?? '0';
    const summary = {
        id,
        name: input.name,
        description: input.description,
        category: input.category,
        tags: [...input.tags],
        mcVersion: input.mcVersion,
        rating,
        downloads: parseDownloadsToNumber(downloadsDisplay),
        downloadsDisplay,
        imageUrl: input.imageUrl,
        priceDisplay: input.priceDisplay,
        priceCents: parseBRLToCents(input.priceDisplay),
        currency: 'BRL'
    };
    pluginSummaries.push(summary);
    const detail = {
        ...summary,
        tagline: '',
        version: '1.0.0',
        author: 'Desconhecido',
        lastUpdateISO: new Date().toISOString().slice(0, 10),
        reviewsCount: 0,
        screenshots: [summary.imageUrl.replace('w=400&h=300', 'w=800&h=500')],
        features: [],
        docsSections: [],
        reviews: []
    };
    pluginDetailsById[id] = detail;
    return detail;
}
export function updatePlugin(id, input) {
    const summary = pluginSummaries.find((p) => p.id === id);
    if (!summary)
        return null;
    if (input.name !== undefined)
        summary.name = input.name;
    if (input.description !== undefined)
        summary.description = input.description;
    if (input.category !== undefined)
        summary.category = input.category;
    if (input.tags !== undefined)
        summary.tags = input.tags;
    if (input.mcVersion !== undefined)
        summary.mcVersion = input.mcVersion;
    if (input.imageUrl !== undefined)
        summary.imageUrl = input.imageUrl;
    if (input.priceDisplay !== undefined) {
        summary.priceDisplay = input.priceDisplay;
        summary.priceCents = parseBRLToCents(input.priceDisplay);
    }
    if (input.rating !== undefined)
        summary.rating = input.rating;
    if (input.downloadsDisplay !== undefined) {
        summary.downloadsDisplay = input.downloadsDisplay;
        summary.downloads = parseDownloadsToNumber(input.downloadsDisplay);
    }
    const detail = pluginDetailsById[id] ?? getPluginDetail(id);
    const nextDetail = {
        ...detail,
        ...summary,
        tagline: input.tagline ?? detail.tagline,
        version: input.version ?? detail.version,
        author: input.author ?? detail.author,
        lastUpdateISO: input.lastUpdateISO ?? detail.lastUpdateISO,
        reviewsCount: input.reviewsCount ?? detail.reviewsCount,
        screenshots: input.screenshots ?? detail.screenshots,
        features: input.features ?? detail.features,
        docsSections: input.docsSections ?? detail.docsSections,
        reviews: input.reviews ?? detail.reviews
    };
    pluginDetailsById[id] = nextDetail;
    return nextDetail;
}
export function deletePlugin(id) {
    const idx = pluginSummaries.findIndex((p) => p.id === id);
    if (idx === -1)
        return false;
    pluginSummaries.splice(idx, 1);
    delete pluginDetailsById[id];
    return true;
}
export const users = [
    {
        id: 'user_demo_1',
        name: demoUser.name,
        email: demoUser.email,
        plan: demoUser.plan,
        passwordHash: '',
        verified: true,
        createdISO: new Date('2026-01-01').toISOString()
    }
];
export const sessions = [];
export const emailVerificationTokens = [];
export const purchases = [];
export const smtpConfig = {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'StarfinPlugins',
    fromEmail: 'no-reply@starfinplugins.com'
};
export const integrationConfig = {
    panelBaseUrl: 'http://localhost:5173',
    pluginAuthEndpoint: 'http://localhost:3001/api/plugin-auth/verify',
    docsBaseUrl: 'http://localhost:5173/docs'
};
export const statusComponents = [
    {
        id: 'api',
        name: 'API',
        status: 'operational',
        message: 'Operando normalmente',
        updatedISO: new Date().toISOString()
    },
    {
        id: 'site',
        name: 'Site',
        status: 'operational',
        message: 'Operando normalmente',
        updatedISO: new Date().toISOString()
    },
    {
        id: 'auth',
        name: 'Autenticação',
        status: 'operational',
        message: 'Operando normalmente',
        updatedISO: new Date().toISOString()
    }
];
export const changelog = [
    {
        id: 'cl_1',
        version: '0.1.0',
        title: 'Lançamento inicial',
        body: 'Marketplace, conta do usuário, integrações e painel admin.',
        createdISO: new Date('2026-03-30').toISOString()
    }
];
export const docsSections = [
    {
        id: 'getting-started',
        title: 'Começando',
        body: 'Instale o plugin, gere sua chave de API no painel e valide a licença via endpoint.',
        updatedISO: new Date().toISOString()
    },
    {
        id: 'api',
        title: 'API',
        body: 'Use /api/plugin-auth/verify para validar apiKey + licenseKey do usuário.',
        updatedISO: new Date().toISOString()
    }
];
export const outbox = [];
function randomToken(prefix) {
    return `${prefix}_${crypto.randomBytes(18).toString('base64url')}`;
}
function passwordHash(password, salt) {
    const dk = crypto.scryptSync(password, salt, 32);
    return dk.toString('hex');
}
export function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    return `scrypt$${salt}$${passwordHash(password, salt)}`;
}
export function verifyPassword(password, stored) {
    if (!stored.startsWith('scrypt$'))
        return false;
    const parts = stored.split('$');
    const salt = parts[2] ?? '';
    const expected = parts[3] ?? '';
    if (!salt || !expected)
        return false;
    return passwordHash(password, salt) === expected;
}
export function findUserByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
export function createUser(input) {
    const user = {
        id: `user_${crypto.randomUUID()}`,
        name: input.name,
        email: input.email,
        plan: 'Free',
        passwordHash: createPasswordHash(input.password),
        verified: false,
        createdISO: new Date().toISOString()
    };
    users.push(user);
    return user;
}
export function createSession(userId, role) {
    const token = randomToken(role === 'admin' ? 'admin' : 'sess');
    const session = {
        token,
        userId,
        role,
        createdISO: new Date().toISOString()
    };
    sessions.push(session);
    return session;
}
export function findSession(token) {
    return sessions.find((s) => s.token === token) ?? null;
}
export function createEmailVerificationToken(userId) {
    const token = randomToken('verify');
    const now = new Date();
    const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const record = {
        token,
        userId,
        createdISO: now.toISOString(),
        expiresISO: expires.toISOString()
    };
    emailVerificationTokens.push(record);
    return record;
}
export function verifyEmailToken(token) {
    const idx = emailVerificationTokens.findIndex((t) => t.token === token);
    if (idx === -1)
        return null;
    const record = emailVerificationTokens[idx];
    if (new Date(record.expiresISO).getTime() < Date.now()) {
        emailVerificationTokens.splice(idx, 1);
        return null;
    }
    const user = users.find((u) => u.id === record.userId);
    if (!user)
        return null;
    user.verified = true;
    emailVerificationTokens.splice(idx, 1);
    return user;
}
export function createPurchase(userId, pluginId) {
    const now = new Date().toISOString();
    const purchase = {
        id: `pur_${crypto.randomUUID()}`,
        userId,
        pluginId,
        status: 'pending',
        licenseKey: null,
        createdISO: now,
        updatedISO: now
    };
    purchases.push(purchase);
    return purchase;
}
export function updatePurchaseStatus(id, status) {
    const p = purchases.find((x) => x.id === id);
    if (!p)
        return null;
    p.status = status;
    if (status === 'approved' && !p.licenseKey) {
        p.licenseKey = `LIC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    }
    p.updatedISO = new Date().toISOString();
    return p;
}
export function getLicensesForUser(userId) {
    const base = userId === demoUser.id ? purchasedPlugins.slice() : [];
    const derived = purchases
        .filter((p) => p.userId === userId && p.status === 'approved' && p.licenseKey)
        .map((p, i) => {
        const plugin = getPluginDetail(p.pluginId);
        return {
            id: 10_000 + i,
            pluginId: p.pluginId,
            name: plugin?.name ?? `Plugin ${p.pluginId}`,
            version: plugin?.version ?? '1.0.0',
            purchaseDateISO: p.updatedISO,
            licenseKey: p.licenseKey ?? '',
            status: 'Ativo'
        };
    });
    return [...base, ...derived];
}
