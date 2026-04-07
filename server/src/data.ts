import crypto from 'node:crypto';
import Database from './mysql-sync.js';

const sqlite = new Database();

// Initialize DB tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    plan VARCHAR(64) DEFAULT 'Free',
    planExpiresAt VARCHAR(64),
    bannedAt VARCHAR(64),
    bannedReason LONGTEXT,
    passwordHash LONGTEXT,
    verified TINYINT DEFAULT 0,
    createdISO VARCHAR(64),
    settings LONGTEXT,
    role VARCHAR(32) DEFAULT 'user',
    phone VARCHAR(64),
    permissions LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    role VARCHAR(32),
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    expiresISO VARCHAR(64),
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    pluginId INTEGER,
    status VARCHAR(32),
    licenseKey VARCHAR(191),
    hwid VARCHAR(255),
    allowedIp VARCHAR(255),
    lastIp VARCHAR(255),
    lastPort INTEGER,
    lastServerName VARCHAR(255),
    lastPlatform VARCHAR(255),
    lastPerformance LONGTEXT,
    createdISO VARCHAR(64),
    updatedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    pluginId INTEGER,
    name VARCHAR(255),
    "key" VARCHAR(255),
    createdISO VARCHAR(64),
    lastUsedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    email VARCHAR(255),
    subject VARCHAR(255),
    message LONGTEXT,
    status VARCHAR(32) DEFAULT 'open',
    priority VARCHAR(32) DEFAULT 'medium',
    category VARCHAR(64) DEFAULT 'general',
    createdISO VARCHAR(64),
    updatedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS career_applications (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(64),
    role VARCHAR(128),
    message LONGTEXT,
    resumeUrl LONGTEXT,
    portfolioUrl LONGTEXT,
    linkedinUrl LONGTEXT,
    githubUrl LONGTEXT,
    status VARCHAR(32) DEFAULT 'new',
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS ticket_messages (
    id VARCHAR(191) PRIMARY KEY,
    ticketId VARCHAR(191),
    userId VARCHAR(191),
    content LONGTEXT,
    isAdmin INTEGER DEFAULT 0,
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS doc_articles (
    id VARCHAR(191) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    title VARCHAR(255),
    content LONGTEXT,
    category VARCHAR(128) DEFAULT 'Geral',
    "order" INTEGER DEFAULT 0,
    createdISO VARCHAR(64),
    updatedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS settings (
    "key" VARCHAR(191) PRIMARY KEY,
    value LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email VARCHAR(255) PRIMARY KEY,
    createdISO VARCHAR(64),
    active INTEGER DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS plugins (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    description LONGTEXT,
    category VARCHAR(128),
    licenseName VARCHAR(255),
    tags LONGTEXT,
    mcVersion VARCHAR(64),
    rating REAL,
    downloads INTEGER,
    downloadsDisplay VARCHAR(64),
    imageUrl LONGTEXT,
    priceDisplay VARCHAR(64),
    priceCents INTEGER,
    tagline LONGTEXT,
    version VARCHAR(64),
    author VARCHAR(255),
    lastUpdateISO VARCHAR(64),
    reviewsCount INTEGER,
    screenshots LONGTEXT,
    features LONGTEXT,
    docsSections LONGTEXT,
    reviews LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS categories (
    name VARCHAR(191) PRIMARY KEY
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS docs (
    id VARCHAR(191) PRIMARY KEY,
    title VARCHAR(255),
    body LONGTEXT,
    updatedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS changelog (
    id VARCHAR(191) PRIMARY KEY,
    version VARCHAR(64),
    title VARCHAR(255),
    body LONGTEXT,
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(191) PRIMARY KEY,
    title VARCHAR(255),
    message LONGTEXT,
    type VARCHAR(64) DEFAULT 'manual',
    priority VARCHAR(32) DEFAULT 'normal',
    source VARCHAR(128),
    metadata LONGTEXT,
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(64) UNIQUE,
    discountType VARCHAR(32),
    discountValue INTEGER,
    minPurchase INTEGER,
    expiresAt VARCHAR(64),
    maxUses INTEGER,
    usedCount INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS outbox (
    id VARCHAR(191) PRIMARY KEY,
    "to" VARCHAR(255),
    subject VARCHAR(255),
    html LONGTEXT,
    createdISO VARCHAR(64),
    delivered INTEGER,
    error LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191),
    name VARCHAR(255),
    licenseKey VARCHAR(255) UNIQUE,
    ips LONGTEXT,
    createdISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS server_plugins (
    serverId VARCHAR(191),
    pluginId INTEGER,
    PRIMARY KEY (serverId, pluginId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price VARCHAR(64) NOT NULL,
    features LONGTEXT NOT NULL,
    active INTEGER DEFAULT 1,
    grantsAllPlugins INTEGER DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(191) PRIMARY KEY,
    pluginId INTEGER NOT NULL,
    userId VARCHAR(191) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    comment LONGTEXT NOT NULL,
    createdISO VARCHAR(64) NOT NULL,
    FOREIGN KEY(pluginId) REFERENCES plugins(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(191) PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    pluginIds LONGTEXT,
    planId VARCHAR(191),
    totalCents INTEGER,
    status VARCHAR(32) DEFAULT 'pending',
    paymentProvider VARCHAR(64),
    paymentId VARCHAR(191),
    createdISO VARCHAR(64),
    updatedISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS raffles (
    id VARCHAR(191) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    prize VARCHAR(255),
    eligibility VARCHAR(64) DEFAULT 'approved_buyers',
    status VARCHAR(32) DEFAULT 'open',
    winnerUserId VARCHAR(191),
    createdISO VARCHAR(64),
    updatedISO VARCHAR(64),
    drawnISO VARCHAR(64)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  CREATE TABLE IF NOT EXISTS raffle_entries (
    id VARCHAR(191) PRIMARY KEY,
    raffleId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    createdISO VARCHAR(64),
    UNIQUE KEY uniq_raffle_user (raffleId, userId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

// Migration: ensure new columns exist in purchases table
const purchaseTableInfo = sqlite.prepare("PRAGMA table_info(purchases)").all() as any[];
const newPurchaseCols = ['hwid', 'allowedIp', 'lastIp', 'lastPort', 'lastServerName', 'lastPlatform', 'lastPerformance'];
for (const col of newPurchaseCols) {
  if (!purchaseTableInfo.some(c => c.name === col)) {
    sqlite.exec(`ALTER TABLE purchases ADD COLUMN ${col} ${col === 'lastPort' ? 'INTEGER' : 'TEXT'}`);
  }
}

// Migration: ensure 'settings' column exists in users table
const tableInfo = sqlite.prepare("PRAGMA table_info(users)").all() as any[];
if (!tableInfo.some(col => col.name === 'settings')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN settings TEXT");
}
if (!tableInfo.some(col => col.name === 'verified')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0");
}
if (!tableInfo.some(col => col.name === 'plan')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'Free'");
}
if (!tableInfo.some(col => col.name === 'planExpiresAt')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN planExpiresAt TEXT");
}
if (!tableInfo.some(col => col.name === 'role')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
}
if (!tableInfo.some(col => col.name === 'phone')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
if (!tableInfo.some(col => col.name === 'permissions')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN permissions LONGTEXT");
}
if (!tableInfo.some(col => col.name === 'licenseKey')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN licenseKey TEXT");
}
if (!tableInfo.some(col => col.name === 'allowedIp')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN allowedIp TEXT");
}
if (!tableInfo.some(col => col.name === 'avatarUrl')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN avatarUrl TEXT");
}
if (!tableInfo.some(col => col.name === 'bio')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN bio TEXT");
}
if (!tableInfo.some(col => col.name === 'discordId')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN discordId TEXT");
}
if (!tableInfo.some(col => col.name === 'githubUrl')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN githubUrl TEXT");
}
if (!tableInfo.some(col => col.name === 'twitterUrl')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN twitterUrl TEXT");
}
if (!tableInfo.some(col => col.name === 'banned')) {
  sqlite.exec("ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0");
}

const pluginTableInfo = sqlite.prepare("PRAGMA table_info(plugins)").all() as any[];
if (!pluginTableInfo.some(col => col.name === 'licenseName')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN licenseName TEXT");
}
if (!pluginTableInfo.some(col => col.name === 'category')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN category TEXT");
}
if (!pluginTableInfo.some(col => col.name === 'jarUrl')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN jarUrl TEXT");
}
if (!pluginTableInfo.some(col => col.name === 'dependencies')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN dependencies LONGTEXT");
}
if (!pluginTableInfo.some(col => col.name === 'platform')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN platform TEXT");
}
if (!pluginTableInfo.some(col => col.name === 'featured')) {
  sqlite.exec("ALTER TABLE plugins ADD COLUMN featured INTEGER DEFAULT 0");
}

const supportTicketTableInfo = sqlite.prepare("PRAGMA table_info(support_tickets)").all() as any[];
if (!supportTicketTableInfo.some(col => col.name === 'userId')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN userId TEXT");
}
if (!supportTicketTableInfo.some(col => col.name === 'email')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN email TEXT");
}
if (!supportTicketTableInfo.some(col => col.name === 'subject')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN subject TEXT");
}
if (!supportTicketTableInfo.some(col => col.name === 'message')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN message TEXT");
}
if (!supportTicketTableInfo.some(col => col.name === 'status')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN status TEXT DEFAULT 'open'");
}
if (!supportTicketTableInfo.some(col => col.name === 'priority')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN priority TEXT DEFAULT 'medium'");
}
if (!supportTicketTableInfo.some(col => col.name === 'category')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN category TEXT DEFAULT 'general'");
}
if (!supportTicketTableInfo.some(col => col.name === 'createdISO')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN createdISO TEXT");
}
if (!supportTicketTableInfo.some(col => col.name === 'updatedISO')) {
  sqlite.exec("ALTER TABLE support_tickets ADD COLUMN updatedISO TEXT");
}

const ticketMessageTableInfo = sqlite.prepare("PRAGMA table_info(ticket_messages)").all() as any[];
if (!ticketMessageTableInfo.some(col => col.name === 'ticketId')) {
  sqlite.exec("ALTER TABLE ticket_messages ADD COLUMN ticketId TEXT");
}
if (!ticketMessageTableInfo.some(col => col.name === 'userId')) {
  sqlite.exec("ALTER TABLE ticket_messages ADD COLUMN userId TEXT");
}
if (!ticketMessageTableInfo.some(col => col.name === 'content')) {
  sqlite.exec("ALTER TABLE ticket_messages ADD COLUMN content TEXT");
}
if (!ticketMessageTableInfo.some(col => col.name === 'isAdmin')) {
  sqlite.exec("ALTER TABLE ticket_messages ADD COLUMN isAdmin INTEGER DEFAULT 0");
}
if (!ticketMessageTableInfo.some(col => col.name === 'createdISO')) {
  sqlite.exec("ALTER TABLE ticket_messages ADD COLUMN createdISO TEXT");
}

const docArticleTableInfo = sqlite.prepare("PRAGMA table_info(doc_articles)").all() as any[];
if (!docArticleTableInfo.some(col => col.name === 'slug')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN slug TEXT");
}
if (!docArticleTableInfo.some(col => col.name === 'title')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN title TEXT");
}
if (!docArticleTableInfo.some(col => col.name === 'content')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN content TEXT");
}
if (!docArticleTableInfo.some(col => col.name === 'category')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN category TEXT DEFAULT 'Geral'");
}
if (!docArticleTableInfo.some(col => col.name === 'order')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN \"order\" INTEGER DEFAULT 0");
}
if (!docArticleTableInfo.some(col => col.name === 'createdISO')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN createdISO TEXT");
}
if (!docArticleTableInfo.some(col => col.name === 'updatedISO')) {
  sqlite.exec("ALTER TABLE doc_articles ADD COLUMN updatedISO TEXT");
}

const newsletterTableInfo = sqlite.prepare("PRAGMA table_info(newsletter_subscribers)").all() as any[];
if (!newsletterTableInfo.some(col => col.name === 'email')) {
  sqlite.exec("ALTER TABLE newsletter_subscribers ADD COLUMN email TEXT");
}
if (!newsletterTableInfo.some(col => col.name === 'createdISO')) {
  sqlite.exec("ALTER TABLE newsletter_subscribers ADD COLUMN createdISO TEXT");
}
if (!newsletterTableInfo.some(col => col.name === 'active')) {
  sqlite.exec("ALTER TABLE newsletter_subscribers ADD COLUMN active INTEGER DEFAULT 1");
}

const notificationsTableInfo = sqlite.prepare("PRAGMA table_info(notifications)").all() as any[];
if (!notificationsTableInfo.some(col => col.name === 'type')) {
  sqlite.exec("ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'manual'");
}
if (!notificationsTableInfo.some(col => col.name === 'priority')) {
  sqlite.exec("ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal'");
}
if (!notificationsTableInfo.some(col => col.name === 'source')) {
  sqlite.exec("ALTER TABLE notifications ADD COLUMN source TEXT");
}
if (!notificationsTableInfo.some(col => col.name === 'metadata')) {
  sqlite.exec("ALTER TABLE notifications ADD COLUMN metadata LONGTEXT");
}

const hasPlans = sqlite.prepare('SELECT COUNT(*) as count FROM plans').get() as { count: number };
if (hasPlans.count === 0) {
  const defaults = [
    { id: 'free', name: 'Free', price: 'R$ 0,00', features: JSON.stringify(['Acesso a plugins gratuitos', 'Suporte via ticket (baixa prioridade)']), grantsAllPlugins: 0 },
    { id: 'premium', name: 'Premium', price: 'R$ 49,90/mês', features: JSON.stringify(['Acesso a todos os plugins', 'Suporte prioritário 24/7', 'Acesso antecipado a novidades']), grantsAllPlugins: 1 }
  ];
  for (const p of defaults) {
    sqlite.prepare('INSERT INTO plans (id, name, price, features, grantsAllPlugins) VALUES (?, ?, ?, ?, ?)').run(p.id, p.name, p.price, p.features, p.grantsAllPlugins);
  }
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(191) PRIMARY KEY,
    pluginId INTEGER NOT NULL,
    userId VARCHAR(191) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    comment LONGTEXT NOT NULL,
    createdISO VARCHAR(64) NOT NULL,
    FOREIGN KEY(pluginId) REFERENCES plugins(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

const plansTableInfo = sqlite.prepare("PRAGMA table_info(plans)").all() as any[];
if (!plansTableInfo.some(col => col.name === 'grantsAllPlugins')) {
  sqlite.exec("ALTER TABLE plans ADD COLUMN grantsAllPlugins INTEGER DEFAULT 0");
}

export type PluginTag = 'Popular' | 'Novo' | 'Premium';

export type PluginCategory =
  | 'Economia'
  | 'Administração'
  | 'Minigames'
  | 'Gameplay'
  | 'Social'
  | 'RPG'
  | 'Segurança';

export interface PluginSummary {
  id: number;
  name: string;
  description: string;
  category: PluginCategory;
  licenseName: string | null;
  tags: PluginTag[];
  mcVersion: string;
  rating: number;
  downloads: number;
  downloadsDisplay: string;
  imageUrl: string;
  priceDisplay: string;
  priceCents: number;
  currency: 'BRL';
  jarUrl: string | null;
  dependencies: string[];
  platform: string | null;
  featured: boolean;
}

export interface PluginDetail extends PluginSummary {
  tagline: string;
  version: string;
  author: string;
  lastUpdateISO: string;
  reviewsCount: number;
  screenshots: string[];
  features: Array<{
    title: string;
    description: string;
  }>;
  docsSections: Array<{
    title: string;
    description: string;
  }>;
  reviews: Array<{
    user: string;
    rating: number;
    dateISO: string;
    comment: string;
  }>;
}

export interface PurchasedPlugin {
  id: number;
  pluginId: number;
  name: string;
  version: string;
  purchaseDateISO: string;
  licenseKey: string;
  status: 'Ativo' | 'Expirado' | 'Suspenso';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium';
  planExpiresAt?: string | null;
  verified: boolean;
  role: 'user' | 'admin' | 'staff' | 'premium';
  licenseKey?: string | null;
  allowedIp?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  discordId?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  pluginId: number;
  name: string;
  key: string;
  createdISO: string;
  lastUsedISO: string | null;
}

function parseBRLToCents(price: string): number {
  const normalized = price
    .replaceAll('R$', '')
    .trim()
    .replaceAll('.', '')
    .replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function parseDownloadsToNumber(value: string): number {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.endsWith('K')) {
    const n = Number(trimmed.slice(0, -1));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 1000);
  }
  if (trimmed.endsWith('M')) {
    const n = Number(trimmed.slice(0, -1));
    if (!Number.isFinite(n)) return 0;
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
  },
  {
    id: 10,
    name: 'StarfinBans',
    description: 'Sistema de punições avançado com suporte a banco de dados e apelações',
    price: 'R$ 29,90',
    rating: 4.8,
    downloads: '1.2K',
    tags: ['Novo', 'Premium'],
    category: 'Administração',
    mcVersion: '1.20.x',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop'
  },
  {
    id: 11,
    name: 'StarfinEconomy',
    description: 'Sistema de economia otimizado para servidores modernos',
    price: 'R$ 19,90',
    rating: 4.9,
    downloads: '0.5K',
    tags: ['Novo'],
    category: 'Economia',
    mcVersion: '1.20.x',
    imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&h=300&fit=crop'
  }
] as const;

export function loadPlugins() {
  const existingIds = (sqlite.prepare('SELECT id FROM plugins').all() as { id: number }[]).map(r => r.id);
  
  for (const p of pluginSummariesRaw) {
    if (existingIds.includes(p.id)) continue;

    const summary = {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      tags: JSON.stringify(p.tags),
      mcVersion: p.mcVersion,
      rating: p.rating,
      downloads: parseDownloadsToNumber(p.downloads),
      downloadsDisplay: p.downloads,
      imageUrl: p.imageUrl,
      priceDisplay: p.price,
      priceCents: parseBRLToCents(p.price),
      tagline: '',
      version: '1.0.0',
      author: 'Desconhecido',
      lastUpdateISO: '2026-01-01',
      reviewsCount: 0,
      screenshots: '[]',
      features: '[]',
      docsSections: '[]',
      reviews: '[]'
    };
    
    // Merge with specialized details if exist
    if (p.id === 1) {
      summary.tagline = 'Sistema de economia completo para servidores profissionais';
      summary.version = '2.5.1';
      summary.author = 'DevStudio';
      summary.lastUpdateISO = '2026-03-15';
      summary.reviewsCount = 287;
      summary.screenshots = JSON.stringify(Array.from({ length: 6 }).map((_, i) => `https://images.unsplash.com/photo-${1614741118887 + (i + 1)}?w=800&h=500&fit=crop`));
      summary.features = JSON.stringify([
        { title: 'Seguro e Confiável', description: 'Código auditado e testado' },
        { title: 'Alto Desempenho', description: 'Otimizado para servidores grandes' },
        { title: 'Suporte Premium', description: 'Suporte dedicado 24/7' }
      ]);
      summary.docsSections = JSON.stringify([
        { title: 'Instalação', description: 'Como instalar o plugin em seu servidor' },
        { title: 'Configuração Básica', description: 'Primeiros passos e configurações essenciais' },
        { title: 'Comandos', description: 'Lista completa de comandos disponíveis' },
        { title: 'Permissões', description: 'Sistema de permissões e grupos' },
        { title: 'API para Desenvolvedores', description: 'Como integrar com seu próprio plugin' }
      ]);
      summary.reviews = JSON.stringify([
        { user: 'João Silva', rating: 5, dateISO: '2026-03-10', comment: 'Melhor plugin de economia que já usei!' },
        { user: 'Maria Santos', rating: 5, dateISO: '2026-03-08', comment: 'Excelente suporte e documentação.' },
        { user: 'Pedro Costa', rating: 4, dateISO: '2026-03-05', comment: 'Muito bom, mas poderia ter mais opções.' }
      ]);
    }

    sqlite.prepare(`
      INSERT INTO plugins (id, name, description, category, tags, mcVersion, rating, downloads, downloadsDisplay, imageUrl, priceDisplay, priceCents, tagline, version, author, lastUpdateISO, reviewsCount, screenshots, features, docsSections, reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      summary.id, summary.name, summary.description, summary.category, summary.tags, summary.mcVersion, summary.rating, summary.downloads, summary.downloadsDisplay, summary.imageUrl, summary.priceDisplay, summary.priceCents, summary.tagline, summary.version, summary.author, summary.lastUpdateISO, summary.reviewsCount, summary.screenshots, summary.features, summary.docsSections, summary.reviews
    );
  }
}

loadPlugins();

export const pluginSummaries: PluginSummary[] = [];
export const pluginDetailsById: Record<number, PluginDetail> = {};

export function syncPluginArrays() {
  const rows = sqlite.prepare('SELECT * FROM plugins').all() as any[];
  pluginSummaries.length = 0;
  for (const row of rows) {
    try {
      const p: PluginSummary = {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category as PluginCategory,
        licenseName: row.licenseName || null,
        tags: row.tags ? JSON.parse(row.tags) : [],
        mcVersion: row.mcVersion,
        rating: row.rating,
        downloads: row.downloads,
        downloadsDisplay: row.downloadsDisplay,
        imageUrl: row.imageUrl,
        priceDisplay: row.priceDisplay,
        priceCents: row.priceCents,
        currency: 'BRL',
        jarUrl: row.jarUrl || null,
        dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
        platform: row.platform || null,
        featured: Boolean(row.featured)
      };
      pluginSummaries.push(p);
      
      pluginDetailsById[row.id] = {
        ...p,
        tagline: row.tagline || '',
        version: row.version || '1.0.0',
        author: row.author || 'Desconhecido',
        lastUpdateISO: row.lastUpdateISO || '2026-01-01',
        reviewsCount: row.reviewsCount || 0,
        screenshots: row.screenshots ? JSON.parse(row.screenshots) : [],
        features: row.features ? JSON.parse(row.features) : [],
        docsSections: row.docsSections ? JSON.parse(row.docsSections) : [],
        reviews: row.reviews ? JSON.parse(row.reviews) : []
      };
    } catch (e) {
      console.error(`Failed to parse plugin ${row.id}:`, e);
    }
  }
}

syncPluginArrays();

function toPluginDetails(id: number, input: Partial<PluginDetail> & Pick<PluginDetail, 'tagline' | 'version' | 'author'>): PluginDetail {
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
  }),
  10: toPluginDetails(10, {
    tagline: 'Gerencie punições de forma profissional e automatizada',
    version: '1.0.0',
    author: 'Starfin'
  }),
  11: toPluginDetails(11, {
    tagline: 'Economia robusta e rápida para o seu servidor',
    version: '1.0.0',
    author: 'Starfin'
  })
});

export function getPluginDetail(id: number): PluginDetail | null {
  const detail = pluginDetailsById[id];
  const reviews = listReviewsForPlugin(id);
  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount : 4.5;

  if (detail) return { ...detail, reviews, reviewsCount, rating };
  const summary = pluginSummaries.find((p) => p.id === id);
  if (!summary) return null;
  return {
    ...summary,
    tagline: '',
    version: '1.0.0',
    author: 'Desconhecido',
    lastUpdateISO: '2026-01-01',
    reviewsCount,
    rating,
    screenshots: [],
    features: [],
    docsSections: [],
    reviews
  };
}

export function createReview(data: { pluginId: number, userId: string, userName: string, rating: number, comment: string }) {
  const id = `rev_${crypto.randomUUID()}`;
  const createdISO = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO reviews (id, pluginId, userId, userName, rating, comment, createdISO)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.pluginId, data.userId, data.userName, data.rating, data.comment, createdISO);
  
  // Update the rating in the plugins table too for faster queries
  updatePluginRating(data.pluginId);
  syncPluginArrays();

  return { id, ...data, createdISO };
}

function updatePluginRating(pluginId: number) {
  const allReviews = listReviewsForPlugin(pluginId);
  const reviewsCount = allReviews.length;
  const avgRating = reviewsCount > 0 ? allReviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount : 4.5;
  sqlite.prepare('UPDATE plugins SET rating = ?, reviewsCount = ? WHERE id = ?').run(avgRating, reviewsCount, pluginId);
}

export function listReviewsForPlugin(pluginId: number) {
  const rows = sqlite.prepare('SELECT * FROM reviews WHERE pluginId = ? ORDER BY createdISO DESC').all(pluginId) as any[];
  return rows.map(r => ({
    user: r.userName,
    rating: r.rating,
    dateISO: r.createdISO.slice(0, 10),
    comment: r.comment
  }));
}

// Initialize defaults if empty
const hasCategories = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (hasCategories.count === 0) {
  const defaults = ['Economia', 'Administração', 'Minigames', 'Gameplay', 'Social', 'RPG', 'Segurança'];
  for (const c of defaults) {
    sqlite.prepare('INSERT INTO categories (name) VALUES (?)').run(c);
  }
}

const hasDocs = sqlite.prepare('SELECT COUNT(*) as count FROM docs').get() as { count: number };
if (hasDocs.count === 0) {
  const defaults = [
    { id: 'getting-started', title: 'Começando', body: 'Instale o plugin, gere sua chave de API no painel e valide a licença via endpoint.', updatedISO: new Date().toISOString() },
    { id: 'api', title: 'API', body: 'Use /api/plugin-auth/verify para validar apiKey + licenseKey do usuário.', updatedISO: new Date().toISOString() }
  ];
  for (const d of defaults) {
    sqlite.prepare('INSERT INTO docs (id, title, body, updatedISO) VALUES (?, ?, ?, ?)').run(d.id, d.title, d.body, d.updatedISO);
  }
}

const hasChangelog = sqlite.prepare('SELECT COUNT(*) as count FROM changelog').get() as { count: number };
if (hasChangelog.count === 0) {
  sqlite.prepare('INSERT INTO changelog (id, version, title, body, createdISO) VALUES (?, ?, ?, ?, ?)').run(
    'cl_1', '0.1.0', 'Lançamento inicial', 'Marketplace, conta do usuário, integrações e painel admin.', new Date('2026-03-30').toISOString()
  );
}

const hasNotifications = sqlite.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };
if (hasNotifications.count === 0) {
  const defaults = [
    { id: 'n1', title: 'Bem-vindo!', message: 'Obrigado por se juntar à StarfinPlugins.', type: 'manual', priority: 'normal', source: 'system', metadata: '{}', createdISO: new Date().toISOString() },
    { id: 'n2', title: 'Nova atualização', message: 'EconomyPlus Pro v2.5.1 já disponível.', type: 'manual', priority: 'normal', source: 'system', metadata: '{}', createdISO: new Date().toISOString() }
  ];
  for (const n of defaults) {
    sqlite.prepare('INSERT INTO notifications (id, title, message, type, priority, source, metadata, createdISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      n.id,
      n.title,
      n.message,
      n.type,
      n.priority,
      n.source,
      n.metadata,
      n.createdISO
    );
  }
}

const hasPurchases = sqlite.prepare('SELECT COUNT(*) as count FROM purchases').get() as { count: number };
if (hasPurchases.count === 0) {
  const now = new Date().toISOString();
  const defaults = [
    { id: 'pur_1', userId: 'user_demo_1', pluginId: 1, status: 'approved', licenseKey: 'XXXX-XXXX-XXXX-1234', createdISO: now, updatedISO: now },
    { id: 'pur_2', userId: 'user_demo_1', pluginId: 5, status: 'approved', licenseKey: 'XXXX-XXXX-XXXX-5678', createdISO: now, updatedISO: now },
    { id: 'pur_3', userId: 'user_demo_1', pluginId: 6, status: 'approved', licenseKey: 'XXXX-XXXX-XXXX-9012', createdISO: now, updatedISO: now }
  ];
  for (const p of defaults) {
    sqlite.prepare('INSERT INTO purchases (id, userId, pluginId, status, licenseKey, createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      p.id, p.userId, p.pluginId, p.status, p.licenseKey, p.createdISO, p.updatedISO
    );
  }
}

export const categories: PluginCategory[] = [];
export function syncCategories() {
  const rows = sqlite.prepare('SELECT name FROM categories').all() as any[];
  categories.length = 0;
  for (const row of rows) {
    categories.push(row.name as PluginCategory);
  }
}
syncCategories();

export const demoUser: UserProfile = {
  id: 'user_demo_1',
  name: 'João Silva',
  email: 'joao@exemplo.com',
  plan: 'Premium',
  verified: true,
  role: 'admin'
};

export const purchasedPlugins: PurchasedPlugin[] = [
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
  demoToken: (process.env.DEMO_TOKEN || '').trim(),
  adminToken: (process.env.ADMIN_TOKEN || '').trim()
};

function randomKey(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function listApiKeysForUser(userId: string) {
  const rows = sqlite.prepare('SELECT * FROM api_keys WHERE userId = ? ORDER BY createdISO DESC').all(userId) as any[];
  return rows.map((k) => ({
    id: k.id,
    pluginId: k.pluginId,
    name: k.name,
    keyPrefix: `${k.key.slice(0, 8)}…`,
    createdISO: k.createdISO,
    lastUsedISO: k.lastUsedISO
  }));
}

export function createApiKeyForUser(userId: string, pluginId: number, name: string) {
  const id = `key_${crypto.randomUUID()}`;
  const key = `sk_${randomKey()}`;
  const createdISO = new Date().toISOString();
  sqlite.prepare('INSERT INTO api_keys (id, userId, pluginId, name, `key`, createdISO, lastUsedISO) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, userId, pluginId, name, key, createdISO, null);
  return {
    id,
    pluginId,
    name,
    key,
    createdISO
  };
}

export function revokeApiKeyForUser(userId: string, id: string) {
  const info = sqlite.prepare('DELETE FROM api_keys WHERE userId = ? AND id = ?').run(userId, id);
  return info.changes > 0;
}

export function findApiKey(key: string): ApiKeyRecord | null {
  const record = sqlite.prepare('SELECT * FROM api_keys WHERE `key` = ?').get(key) as ApiKeyRecord | undefined;
  if (!record) return null;
  const now = new Date().toISOString();
  sqlite.prepare('UPDATE api_keys SET lastUsedISO = ? WHERE id = ?').run(now, record.id);
  record.lastUsedISO = now;
  return record;
}

// Support tickets
export type SupportTicketStatus = 'open' | 'answered' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high';

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string | null;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string | null;
  email: string | null;
  subject: string;
  message: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string;
  createdISO: string;
  updatedISO: string;
  messages?: TicketMessage[];
  user?: { name: string; email: string } | null;
}

export interface CareerApplication {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  message: string;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  status: 'new' | 'reviewing' | 'rejected' | 'approved';
  createdISO: string;
}

function mapTicketRow(row: any): SupportTicket {
  const user = row.userId ? findUserById(row.userId) : null;
  return {
    id: row.id,
    userId: row.userId ?? null,
    email: row.email ?? (user?.email ?? null),
    subject: row.subject ?? '',
    message: row.message ?? null,
    status: (row.status ?? 'open') as SupportTicketStatus,
    priority: (row.priority ?? 'medium') as SupportTicketPriority,
    category: row.category ?? 'general',
    createdISO: row.createdISO ?? new Date().toISOString(),
    updatedISO: row.updatedISO ?? row.createdISO ?? new Date().toISOString(),
    user: user ? { name: user.name, email: user.email } : null
  };
}

function listTicketMessages(ticketId: string): TicketMessage[] {
  const rows = sqlite
    .prepare('SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY createdISO ASC')
    .all(ticketId) as any[];

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticketId,
    userId: r.userId ?? null,
    content: r.content ?? '',
    isAdmin: Boolean(r.isAdmin),
    createdAt: r.createdISO ?? new Date().toISOString()
  }));
}

export function createSupportTicket(input: { email: string; subject: string; message: string }) {
  const id = `ticket_${Date.now()}`;
  const now = new Date().toISOString();
  sqlite
    .prepare(
      'INSERT INTO support_tickets (id, userId, email, subject, message, status, priority, category, createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, null, input.email, input.subject, input.message, 'open', 'medium', 'general', now, now);

  const messageId = `msg_${crypto.randomUUID()}`;
  sqlite
    .prepare(
      'INSERT INTO ticket_messages (id, ticketId, userId, content, isAdmin, createdISO) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(messageId, id, null, input.message, 0, now);

  return getSupportTicketById(id);
}

export function createSupportTicketForUser(userId: string, input: { subject: string; category: string; priority: SupportTicketPriority; message: string }) {
  const id = `ticket_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const user = findUserById(userId);
  sqlite
    .prepare(
      'INSERT INTO support_tickets (id, userId, email, subject, message, status, priority, category, createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, userId, user?.email ?? null, input.subject, input.message, 'open', input.priority, input.category, now, now);

  const messageId = `msg_${crypto.randomUUID()}`;
  sqlite
    .prepare(
      'INSERT INTO ticket_messages (id, ticketId, userId, content, isAdmin, createdISO) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(messageId, id, userId, input.message, 0, now);

  return getSupportTicketById(id);
}

export function listSupportTickets() {
  const rows = sqlite.prepare('SELECT * FROM support_tickets ORDER BY updatedISO DESC').all() as any[];
  return rows.map(mapTicketRow);
}

export function listSupportTicketsForUser(userId: string) {
  const rows = sqlite
    .prepare('SELECT * FROM support_tickets WHERE userId = ? ORDER BY updatedISO DESC')
    .all(userId) as any[];
  return rows.map(mapTicketRow);
}

export function getSupportTicketById(id: string) {
  const row = sqlite.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id) as any;
  if (!row) return null;
  const ticket = mapTicketRow(row);
  ticket.messages = listTicketMessages(id);
  return ticket;
}

export function addSupportTicketMessage(ticketId: string, userId: string | null, content: string, isAdmin: boolean) {
  const ticket = sqlite.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;
  if (!ticket) return null;

  const now = new Date().toISOString();
  const id = `msg_${crypto.randomUUID()}`;
  sqlite
    .prepare('INSERT INTO ticket_messages (id, ticketId, userId, content, isAdmin, createdISO) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, ticketId, userId, content, isAdmin ? 1 : 0, now);

  const nextStatus: SupportTicketStatus = isAdmin ? 'answered' : 'open';
  sqlite.prepare('UPDATE support_tickets SET status = ?, updatedISO = ? WHERE id = ?').run(nextStatus, now, ticketId);

  return {
    id,
    ticketId,
    userId,
    content,
    isAdmin,
    createdAt: now
  } satisfies TicketMessage;
}

export function closeSupportTicket(ticketId: string) {
  const now = new Date().toISOString();
  const info = sqlite.prepare('UPDATE support_tickets SET status = ?, updatedISO = ? WHERE id = ?').run('closed', now, ticketId);
  return info.changes > 0;
}

export function updateSupportTicketStatus(id: string, status: SupportTicketStatus) {
  const now = new Date().toISOString();
  sqlite.prepare('UPDATE support_tickets SET status = ?, updatedISO = ? WHERE id = ?').run(status, now, id);
  return getSupportTicketById(id);
}

function mapCareerApplicationRow(row: any): CareerApplication {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? null,
    role: row.role ?? '',
    message: row.message ?? '',
    resumeUrl: row.resumeUrl ?? null,
    portfolioUrl: row.portfolioUrl ?? null,
    linkedinUrl: row.linkedinUrl ?? null,
    githubUrl: row.githubUrl ?? null,
    status: (row.status ?? 'new') as CareerApplication['status'],
    createdISO: row.createdISO ?? new Date().toISOString()
  };
}

export function createCareerApplication(input: {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  message: string;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}) {
  const id = `career_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `
      INSERT INTO career_applications
      (id, name, email, phone, role, message, resumeUrl, portfolioUrl, linkedinUrl, githubUrl, status, createdISO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      id,
      input.name,
      input.email,
      input.phone ?? null,
      input.role,
      input.message,
      input.resumeUrl ?? null,
      input.portfolioUrl ?? null,
      input.linkedinUrl ?? null,
      input.githubUrl ?? null,
      'new',
      now
    );

  const row = sqlite.prepare('SELECT * FROM career_applications WHERE id = ?').get(id) as any;
  return mapCareerApplicationRow(row);
}

export interface DocArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function mapDocRow(row: any): DocArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    category: row.category ?? 'Geral',
    order: Number(row.order ?? 0),
    createdAt: row.createdISO ?? new Date().toISOString(),
    updatedAt: row.updatedISO ?? row.createdISO ?? new Date().toISOString()
  };
}

export function listDocArticles(category?: string | null) {
  const rows = category
    ? (sqlite.prepare('SELECT * FROM doc_articles WHERE category = ? ORDER BY "order" ASC, updatedISO DESC').all(category) as any[])
    : (sqlite.prepare('SELECT * FROM doc_articles ORDER BY category ASC, "order" ASC').all() as any[]);
  return rows.map(mapDocRow);
}

export function getDocArticleBySlug(slug: string) {
  const row = sqlite.prepare('SELECT * FROM doc_articles WHERE slug = ?').get(slug) as any;
  if (!row) return null;
  return mapDocRow(row);
}

export function adminCreateDocArticle(input: { slug: string; title: string; content: string; category: string; order: number }) {
  const id = `doc_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  sqlite
    .prepare('INSERT INTO doc_articles (id, slug, title, content, category, "order", createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, input.slug, input.title, input.content, input.category, input.order, now, now);
  return getDocArticleById(id);
}

export function getDocArticleById(id: string) {
  const row = sqlite.prepare('SELECT * FROM doc_articles WHERE id = ?').get(id) as any;
  if (!row) return null;
  return mapDocRow(row);
}

export function adminUpdateDocArticle(id: string, input: Partial<DocArticle>) {
  const current = getDocArticleById(id);
  if (!current) return null;
  const now = new Date().toISOString();
  const slug = input.slug ?? current.slug;
  const title = input.title ?? current.title;
  const content = input.content ?? current.content;
  const category = input.category ?? current.category;
  const order = input.order ?? current.order;
  sqlite
    .prepare('UPDATE doc_articles SET slug = ?, title = ?, content = ?, category = ?, "order" = ?, updatedISO = ? WHERE id = ?')
    .run(slug, title, content, category, order, now, id);
  return getDocArticleById(id);
}

export function adminDeleteDocArticle(id: string) {
  const info = sqlite.prepare('DELETE FROM doc_articles WHERE id = ?').run(id);
  return info.changes > 0;
}

export interface CareerJobSetting {
  id: string;
  title: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  enabled: boolean;
}

export interface TeamMemberSetting {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  skills: string[];
}

export type AdminSettings = {
  siteName: string;
  logoUrl: string;
  siteDescription: string;
  maintenanceMode: boolean;
  discordUrl: string;
  supportEmail: string;
  footerText: string;
  newsletterAutoEnabled: boolean;
  newsletterFrequencyDays: number;
  newsletterLastSentISO: string | null;
  homeStatsPlugins: string;
  homeStatsServers: string;
  homeStatsRating: string;
  homeStatsSupport: string;
  mercadopagoEnabled: boolean;
  mercadopagoAccessToken: string;
  mercadopagoPublicKey: string;
  mercadopagoWebhookUrl: string;
  careersJobs: CareerJobSetting[];
  aboutTeam: TeamMemberSetting[];
};

const defaultAdminSettings: AdminSettings = {
  siteName: 'StarfinPlugins',
  logoUrl: '',
  siteDescription: 'Marketplace de plugins para Minecraft',
  maintenanceMode: false,
  discordUrl: '',
  supportEmail: '',
  footerText: '',
  newsletterAutoEnabled: false,
  newsletterFrequencyDays: 7,
  newsletterLastSentISO: null,
  homeStatsPlugins: '500+',
  homeStatsServers: '50K+',
  homeStatsRating: '4.9/5',
  homeStatsSupport: '24/7',
  mercadopagoEnabled: false,
  mercadopagoAccessToken: '',
  mercadopagoPublicKey: '',
  mercadopagoWebhookUrl: '',
  careersJobs: [
    {
      id: 'job_java_senior',
      title: 'Desenvolvedor Java Senior',
      location: 'Remoto',
      salary: 'A combinar',
      type: 'Tempo Integral',
      description: 'Responsavel pela arquitetura e desenvolvimento de plugins complexos de alta performance.',
      enabled: true
    },
    {
      id: 'job_ui_ux',
      title: 'Designer de UI/UX',
      location: 'Remoto',
      salary: 'A combinar',
      type: 'Tempo Integral',
      description: 'Criar interfaces modernas e intuitivas para nossos plugins e dashboard web.',
      enabled: true
    },
    {
      id: 'job_support',
      title: 'Suporte Tecnico',
      location: 'Remoto',
      salary: 'A combinar',
      type: 'Meio Periodo',
      description: 'Auxiliar clientes com instalacao e configuracao de plugins e licencas.',
      enabled: true
    }
  ],
  aboutTeam: [
    {
      id: 'team_ana',
      name: 'Ana Ribeiro',
      role: 'Head de Produto',
      bio: 'Define o roadmap dos plugins e garante que cada lancamento resolva dores reais dos donos de servidores.',
      imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
      skills: ['Produto', 'UX', 'Metricas']
    },
    {
      id: 'team_lucas',
      name: 'Lucas Fernandes',
      role: 'Tech Lead Backend',
      bio: 'Lidera a arquitetura dos sistemas criticos com foco em estabilidade, baixa latencia e escalabilidade.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
      skills: ['Java', 'APIs', 'Performance']
    },
    {
      id: 'team_marina',
      name: 'Marina Costa',
      role: 'Especialista em Sucesso do Cliente',
      bio: 'Acompanha servidores parceiros de ponta a ponta para acelerar adocao e retencao dos plugins.',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
      skills: ['Onboarding', 'Suporte', 'Retencao']
    },
    {
      id: 'team_rafael',
      name: 'Rafael Nogueira',
      role: 'Designer UI/UX',
      bio: 'Transforma fluxos complexos em interfaces claras, mantendo consistencia visual em toda a plataforma.',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      skills: ['Design System', 'Pesquisa', 'Prototipacao']
    }
  ]
};

export function getAdminSettings() {
  const row = sqlite.prepare("SELECT value FROM settings WHERE `key` = 'admin_settings'").get() as { value: string } | undefined;
  if (!row?.value) return { ...defaultAdminSettings };
  try {
    const parsed = JSON.parse(row.value);
    return { ...defaultAdminSettings, ...parsed } as AdminSettings;
  } catch {
    return { ...defaultAdminSettings };
  }
}

export function saveAdminSettings(next: Partial<AdminSettings>) {
  const current = getAdminSettings();
  const merged = { ...current, ...next } as AdminSettings;
  sqlite.prepare('INSERT OR REPLACE INTO settings (`key`, value) VALUES (?, ?)').run('admin_settings', JSON.stringify(merged));
  return merged;
}

export function subscribeNewsletter(email: string) {
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();
  sqlite
    .prepare('INSERT OR REPLACE INTO newsletter_subscribers (email, createdISO, active) VALUES (?, COALESCE((SELECT createdISO FROM newsletter_subscribers WHERE email = ?), ?), 1)')
    .run(normalized, normalized, now);
  return { ok: true as const };
}

export function unsubscribeNewsletter(email: string) {
  const normalized = email.trim().toLowerCase();
  sqlite.prepare('UPDATE newsletter_subscribers SET active = 0 WHERE email = ?').run(normalized);
  return { ok: true as const };
}

export function listNewsletterSubscribers() {
  const rows = sqlite.prepare('SELECT email FROM newsletter_subscribers WHERE active = 1 ORDER BY createdISO DESC').all() as any[];
  return rows.map((r) => String(r.email));
}

// Admin helpers for plugin CRUD
export function nextPluginId(): number {
  const maxId = pluginSummaries.reduce((max, p) => Math.max(max, p.id), 0);
  return maxId + 1;
}

export function createPlugin(input: {
  name: string;
  description: string;
  category: PluginCategory;
  licenseName?: string | null;
  tags: PluginTag[];
  mcVersion: string;
  imageUrl: string;
  priceDisplay: string;
  rating?: number;
  downloadsDisplay?: string;
  jarUrl?: string | null;
  dependencies?: string[];
  platform?: string | null;
  featured?: boolean;
}): PluginDetail {
  const id = nextPluginId();
  const rating = input.rating ?? 4.5;
  const downloadsDisplay = input.downloadsDisplay ?? '0';
  const downloads = parseDownloadsToNumber(downloadsDisplay);
  const priceCents = parseBRLToCents(input.priceDisplay);
  
  sqlite.prepare(`
    INSERT INTO plugins (id, name, description, category, licenseName, tags, mcVersion, rating, downloads, downloadsDisplay, imageUrl, priceDisplay, priceCents, tagline, version, author, lastUpdateISO, reviewsCount, screenshots, features, docsSections, reviews, jarUrl, dependencies, platform, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.name, input.description, input.category, input.licenseName || null, JSON.stringify(input.tags), input.mcVersion, rating, downloads, downloadsDisplay, input.imageUrl, input.priceDisplay, priceCents, '', '1.0.0', 'Desconhecido', new Date().toISOString().slice(0, 10), 0, '[]', '[]', '[]', '[]', input.jarUrl || null, JSON.stringify(input.dependencies || []), input.platform || null, input.featured ? 1 : 0
  );
  
  syncPluginArrays();
  return pluginDetailsById[id];
}

export function updatePlugin(id: number, input: Partial<PluginDetail>): PluginDetail | null {
  const detail = pluginDetailsById[id];
  if (!detail) return null;
  
  const name = input.name ?? detail.name;
  const description = input.description ?? detail.description;
  const category = input.category ?? detail.category;
  const licenseName = input.licenseName !== undefined ? input.licenseName : detail.licenseName;
  const tags = JSON.stringify(input.tags ?? detail.tags);
  const mcVersion = input.mcVersion ?? detail.mcVersion;
  const imageUrl = input.imageUrl ?? detail.imageUrl;
  const priceDisplay = input.priceDisplay ?? detail.priceDisplay;
  const priceCents = parseBRLToCents(priceDisplay);
  const rating = input.rating ?? detail.rating;
  const downloadsDisplay = input.downloadsDisplay ?? detail.downloadsDisplay;
  const downloads = parseDownloadsToNumber(downloadsDisplay);
  
  const tagline = input.tagline ?? detail.tagline;
  const version = input.version ?? detail.version;
  const author = input.author ?? detail.author;
  const lastUpdateISO = input.lastUpdateISO ?? detail.lastUpdateISO;
  const reviewsCount = input.reviewsCount ?? detail.reviewsCount;
  const screenshots = JSON.stringify(input.screenshots ?? detail.screenshots);
  const features = JSON.stringify(input.features ?? detail.features);
  const docsSections = JSON.stringify(input.docsSections ?? detail.docsSections);
  const reviews = JSON.stringify(input.reviews ?? detail.reviews);
  
  const jarUrl = input.jarUrl !== undefined ? input.jarUrl : detail.jarUrl;
  const dependencies = JSON.stringify(input.dependencies ?? detail.dependencies);
  const platform = input.platform !== undefined ? input.platform : detail.platform;
  const featured = input.featured !== undefined ? (input.featured ? 1 : 0) : (detail.featured ? 1 : 0);

  sqlite.prepare(`
    UPDATE plugins SET 
      name = ?, description = ?, category = ?, licenseName = ?, tags = ?, mcVersion = ?, rating = ?, downloads = ?, downloadsDisplay = ?, imageUrl = ?, priceDisplay = ?, priceCents = ?, tagline = ?, version = ?, author = ?, lastUpdateISO = ?, reviewsCount = ?, screenshots = ?, features = ?, docsSections = ?, reviews = ?, jarUrl = ?, dependencies = ?, platform = ?, featured = ?
    WHERE id = ?
  `).run(
    name, description, category, licenseName, tags, mcVersion, rating, downloads, downloadsDisplay, imageUrl, priceDisplay, priceCents, tagline, version, author, lastUpdateISO, reviewsCount, screenshots, features, docsSections, reviews, jarUrl, dependencies, platform, featured, id
  );

  syncPluginArrays();
  return pluginDetailsById[id];
}

export function deletePlugin(id: number): boolean {
  const info = sqlite.prepare('DELETE FROM plugins WHERE id = ?').run(id);
  if (info.changes > 0) {
    syncPluginArrays();
    return true;
  }
  return false;
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium';
  planExpiresAt?: string | null;
  planDurationDays?: number | null;
  passwordHash: string;
  verified: boolean;
  createdISO: string;
  role: 'user' | 'admin' | 'staff' | 'premium';
  phone?: string | null;
  permissions: string[];
  licenseKey: string | null;
  allowedIp: string | null;
  avatarUrl: string | null;
  bio: string | null;
  discordId: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  banned?: boolean;
}

export type SessionRole = 'user' | 'admin' | 'staff' | 'premium';

export interface Session {
  token: string;
  userId: string;
  role: SessionRole;
  createdISO: string;
}

export interface EmailVerificationToken {
  token: string;
  userId: string;
  expiresISO: string;
  createdISO: string;
}

export type PurchaseStatus = 'pending' | 'approved' | 'cancelled' | 'rejected';

export interface Purchase {
  id: string;
  userId: string;
  pluginId: number;
  status: PurchaseStatus;
  licenseKey: string | null;
  hwid: string | null;
  allowedIp: string | null;
  createdISO: string;
  updatedISO: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  pluginIds: number[];
  planId: string | null;
  totalCents: number;
  status: string;
  paymentProvider: string;
  paymentId: string | null;
  createdISO: string;
  updatedISO: string;
}

export type NotificationType = 'manual' | 'sale' | 'support' | 'raffle';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdISO: string;
}

export type RaffleEligibility = 'all_users' | 'approved_buyers' | 'premium_users';
export type RaffleStatus = 'open' | 'closed' | 'drawn';

export interface RaffleRecord {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  eligibility: RaffleEligibility;
  status: RaffleStatus;
  winnerUserId: string | null;
  winnerName: string | null;
  createdISO: string;
  updatedISO: string;
  drawnISO: string | null;
  entrantsCount: number;
}

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface IntegrationConfig {
  panelBaseUrl: string;
  pluginAuthEndpoint: string;
  docsBaseUrl: string;
}

export interface StatusComponent {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  message: string;
  updatedISO: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body: string;
  createdISO: string;
}

export interface DocsSection {
  id: string;
  title: string;
  body: string;
  updatedISO: string;
}

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  createdISO: string;
  delivered: boolean;
  error: string | null;
}

export const users: AccountUser[] = [];

// Seed admin users if not exists
const adminEmails = ['admin@starfinplugins.com.br', 'alan.luiz1620@gmail.com'];
const seededAdminPassword = (process.env.INITIAL_ADMIN_PASSWORD || 'Starfin@2026').trim();

for (const email of adminEmails) {
  const existing = findUserByEmail(email);
  if (!existing) {
    const userId = email === 'alan.luiz1620@gmail.com' ? 'alan_luiz' : 'admin_main';
    sqlite.prepare('INSERT INTO users (id, name, email, plan, passwordHash, verified, createdISO, settings, role, phone, permissions, licenseKey, allowedIp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      userId,
      email === 'alan.luiz1620@gmail.com' ? 'Alan Luiz' : 'Administrador',
      email,
      'Premium',
      createPasswordHash(seededAdminPassword),
      1,
      new Date().toISOString(),
      JSON.stringify({ twoFactorEnabled: false, marketingEmails: true, securityAlerts: true }),
      'admin',
      null,
      JSON.stringify(['*']),
      `LIC-ADMIN-${userId.toUpperCase()}`,
      null
    );
  }
}

if (!process.env.INITIAL_ADMIN_PASSWORD) {
  console.warn(`[security] INITIAL_ADMIN_PASSWORD nao definido. Usando senha padrao para novos admins: ${seededAdminPassword}`);
}

export const smtpConfig: SmtpConfig = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'StarfinPlugins',
  fromEmail: 'no-reply@starfinplugins.com'
};

export const integrationConfig: IntegrationConfig = {
  panelBaseUrl: 'http://localhost:5173',
  pluginAuthEndpoint: 'http://localhost:3001/api/plugin-auth/verify',
  docsBaseUrl: 'http://localhost:5173/docs'
};

export function loadSettings() {
  const smtpRow = sqlite.prepare("SELECT value FROM settings WHERE `key` = 'smtp'").get() as { value: string } | undefined;
  if (smtpRow && smtpRow.value) {
    try {
      Object.assign(smtpConfig, JSON.parse(smtpRow.value));
    } catch (e) {
      console.error('Failed to parse SMTP settings:', e);
    }
  }
  const intRow = sqlite.prepare("SELECT value FROM settings WHERE `key` = 'integration'").get() as { value: string } | undefined;
  if (intRow && intRow.value) {
    try {
      Object.assign(integrationConfig, JSON.parse(intRow.value));
    } catch (e) {
      console.error('Failed to parse Integration settings:', e);
    }
  }
}

export function saveSmtpConfig(config: SmtpConfig) {
  Object.assign(smtpConfig, config);
  sqlite.prepare('INSERT OR REPLACE INTO settings (`key`, value) VALUES (?, ?)').run('smtp', JSON.stringify(smtpConfig));
}

export function saveIntegrationConfig(config: IntegrationConfig) {
  Object.assign(integrationConfig, config);
  sqlite.prepare('INSERT OR REPLACE INTO settings (`key`, value) VALUES (?, ?)').run('integration', JSON.stringify(integrationConfig));
}

loadSettings();

export const statusComponents: StatusComponent[] = [
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

export const changelog: ChangelogEntry[] = [];
export function syncChangelog() {
  const rows = sqlite.prepare('SELECT * FROM changelog ORDER BY createdISO DESC').all() as any[];
  changelog.length = 0;
  for (const row of rows) {
    changelog.push({
      id: row.id,
      version: row.version,
      title: row.title,
      body: row.body,
      createdISO: row.createdISO
    });
  }
}
syncChangelog();

export function createCategory(name: string) {
  sqlite.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(name);
  syncCategories();
}

export function deleteCategory(name: string) {
  sqlite.prepare('DELETE FROM categories WHERE name = ?').run(name);
  syncCategories();
}

export function updateCategory(oldName: string, newName: string) {
  sqlite.prepare('UPDATE categories SET name = ? WHERE name = ?').run(newName, oldName);
  // Also update plugins that use this category
  sqlite.prepare('UPDATE plugins SET category = ? WHERE category = ?').run(newName, oldName);
  syncCategories();
  syncPluginArrays();
}

export function updateDocsSection(id: string, title: string, body: string) {
  const now = new Date().toISOString();
  sqlite.prepare('INSERT OR REPLACE INTO docs (id, title, body, updatedISO) VALUES (?, ?, ?, ?)').run(id, title, body, now);
  syncDocs();
}

export const docsSections: DocsSection[] = [];
export function syncDocs() {
  const rows = sqlite.prepare('SELECT * FROM docs').all() as any[];
  docsSections.length = 0;
  for (const row of rows) {
    docsSections.push({
      id: row.id,
      title: row.title,
      body: row.body,
      updatedISO: row.updatedISO
    });
  }
}
syncDocs();

export const outbox: OutboxEmail[] = [];
export function syncOutbox() {
  const rows = sqlite.prepare('SELECT * FROM outbox ORDER BY createdISO DESC LIMIT 100').all() as any[];
  outbox.length = 0;
  for (const row of rows) {
    outbox.push({
      id: row.id,
      to: row.to,
      subject: row.subject,
      html: row.html,
      createdISO: row.createdISO,
      delivered: Boolean(row.delivered),
      error: row.error
    });
  }
}
syncOutbox();

export function addToOutbox(email: OutboxEmail) {
  sqlite.prepare('INSERT INTO outbox (id, "to", subject, html, createdISO, delivered, error) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    email.id, email.to, email.subject, email.html, email.createdISO, email.delivered ? 1 : 0, email.error
  );
  syncOutbox();
}

export function updateOutboxStatus(id: string, delivered: boolean, error: string | null) {
  sqlite.prepare('UPDATE outbox SET delivered = ?, error = ? WHERE id = ?').run(delivered ? 1 : 0, error, id);
  syncOutbox();
}

export const notifications: NotificationRecord[] = [];
export function syncNotifications() {
  const rows = sqlite.prepare('SELECT * FROM notifications ORDER BY createdISO DESC').all() as any[];
  notifications.length = 0;
  for (const row of rows) {
    let metadata: Record<string, unknown> | null = null;
    try {
      metadata = row.metadata ? JSON.parse(row.metadata) : null;
    } catch {
      metadata = null;
    }
    notifications.push({
      id: row.id,
      title: row.title,
      message: row.message,
      type: (row.type || 'manual') as NotificationType,
      priority: (row.priority || 'normal') as NotificationPriority,
      source: row.source || null,
      metadata,
      createdISO: row.createdISO
    });
  }
}
syncNotifications();

export function addNotification(
  title: string,
  message: string,
  options: {
    type?: NotificationType;
    priority?: NotificationPriority;
    source?: string | null;
    metadata?: Record<string, unknown> | null;
  } = {}
) {
  const id = `n_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const type = options.type || 'manual';
  const priority = options.priority || 'normal';
  const source = options.source ?? null;
  const metadata = options.metadata ? JSON.stringify(options.metadata) : null;
  sqlite.prepare(
    'INSERT INTO notifications (id, title, message, type, priority, source, metadata, createdISO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, message, type, priority, source, metadata, now);
  syncNotifications();
  return notifications.find((n) => n.id === id) ?? {
    id,
    title,
    message,
    type,
    priority,
    source,
    metadata: options.metadata ?? null,
    createdISO: now
  };
}

export function clearNotifications() {
  sqlite.prepare('DELETE FROM notifications').run();
  syncNotifications();
}

export function deleteNotification(id: string) {
  sqlite.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  syncNotifications();
}

export function randomToken(prefix: string) {
  return `${prefix}_${crypto.randomBytes(18).toString('base64url')}`;
}

function passwordHash(password: string, salt: string) {
  const dk = crypto.scryptSync(password, salt, 32);
  return dk.toString('hex');
}

export function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${passwordHash(password, salt)}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const parts = stored.split('$');
  const salt = parts[1] ?? '';
  const expected = parts[2] ?? '';
  if (!salt || !expected) return false;
  return passwordHash(password, salt) === expected;
}

export function findUserByEmail(email: string) {
  const row = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!row) return null;
  let permissions = [];
  try {
    permissions = row.permissions ? JSON.parse(row.permissions) : [];
  } catch (e) {
    console.error('Failed to parse permissions for user', row.id, e);
  }
  return {
    ...row,
    verified: Boolean(row.verified),
    banned: Boolean(row.banned),
    permissions,
    licenseKey: row.licenseKey || null,
    allowedIp: row.allowedIp || null,
    avatarUrl: row.avatarUrl || null,
    bio: row.bio || null,
    discordId: row.discordId || null,
    githubUrl: row.githubUrl || null,
    twitterUrl: row.twitterUrl || null
  } as AccountUser;
}

export function findUserById(id: string) {
  const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return null;
  let permissions = [];
  try {
    permissions = row.permissions ? JSON.parse(row.permissions) : [];
  } catch (e) {
    console.error('Failed to parse permissions for user', row.id, e);
  }
  return {
    ...row,
    verified: Boolean(row.verified),
    banned: Boolean(row.banned),
    permissions,
    licenseKey: row.licenseKey || null,
    allowedIp: row.allowedIp || null,
    avatarUrl: row.avatarUrl || null,
    bio: row.bio || null,
    discordId: row.discordId || null,
    githubUrl: row.githubUrl || null,
    twitterUrl: row.twitterUrl || null
  } as AccountUser;
}

export function listAllUsers() {
  const rows = sqlite.prepare('SELECT * FROM users ORDER BY createdISO DESC').all() as any[];
  return rows.map(row => {
    let permissions = [];
    try {
      permissions = row.permissions ? JSON.parse(row.permissions) : [];
    } catch (e) {
      console.error('Failed to parse permissions for user', row.id, e);
    }
    return {
      ...row,
      verified: Boolean(row.verified),
      permissions
    };
  }) as AccountUser[];
}

function normalizePlanDurationDays(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const days = Math.floor(parsed);
  return days < 0 ? 0 : days;
}

function buildPlanExpiryFromDays(days: number): string | null {
  if (!Number.isFinite(days) || days <= 0) return null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export function updateUserAdmin(id: string, data: Partial<AccountUser> & { planDurationDays?: number | string | null }) {
  const current = findUserById(id);
  if (!current) return null;

  const name = data.name ?? current.name;
  const email = data.email?.toLowerCase() ?? current.email;
  let plan = data.plan ?? current.plan;
  const planDurationDays = normalizePlanDurationDays(data.planDurationDays);
  let planExpiresAt = data.planExpiresAt !== undefined ? data.planExpiresAt : current.planExpiresAt;
  let role = data.role ?? current.role;

  if (planDurationDays !== null) {
    planExpiresAt = buildPlanExpiryFromDays(planDurationDays);
  } else if (data.plan === 'Free' && data.planExpiresAt === undefined) {
    planExpiresAt = null;
  }

  // Normalização: se o plano for qualquer coisa diferente de Free/Gratuito, 
  // e o cargo for 'user', atualiza para 'premium' para garantir acesso.
  if (plan !== 'Free' && role === 'user') {
    role = 'premium';
  }
  // Se o cargo for premium mas o plano for Free, sincroniza (opcional, mas ajuda)
  if (role === 'premium' && plan === 'Free') {
    plan = 'Premium';
  }

  const phone = data.phone !== undefined ? data.phone : current.phone;
  const banned = data.banned !== undefined ? (data.banned ? 1 : 0) : (current.banned ? 1 : 0);
  const permissions = data.permissions ? JSON.stringify(data.permissions) : JSON.stringify(current.permissions);
  const licenseKey = data.licenseKey ?? current.licenseKey;
  const allowedIp = data.allowedIp !== undefined ? data.allowedIp : current.allowedIp;
  const avatarUrl = data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl;
  const bio = data.bio !== undefined ? data.bio : current.bio;
  const discordId = data.discordId !== undefined ? data.discordId : current.discordId;
  const githubUrl = data.githubUrl !== undefined ? data.githubUrl : current.githubUrl;
  const twitterUrl = data.twitterUrl !== undefined ? data.twitterUrl : current.twitterUrl;

  sqlite.prepare(`
    UPDATE users SET 
      name = ?, email = ?, plan = ?, planExpiresAt = ?, role = ?, phone = ?, banned = ?, permissions = ?, licenseKey = ?, allowedIp = ?,
      avatarUrl = ?, bio = ?, discordId = ?, githubUrl = ?, twitterUrl = ?
    WHERE id = ?
  `).run(name, email, plan, planExpiresAt, role, phone, banned, permissions, licenseKey, allowedIp, avatarUrl, bio, discordId, githubUrl, twitterUrl, id);

  return findUserById(id);
}

export function deleteUserAdmin(id: string) {
  const info = sqlite.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

export function createUserAdmin(data: Partial<AccountUser> & { password?: string; planDurationDays?: number | string | null }) {
  const id = `user_${crypto.randomUUID()}`;
  const name = data.name || 'Novo Usuário';
  const email = (data.email || `user_${Date.now()}@starfin.com`).toLowerCase();
  const password =
    (data.password && data.password.trim().length >= 8)
      ? data.password
      : crypto.randomBytes(18).toString('base64url');
  const plan = data.plan || 'Free';
  const planDurationDays = normalizePlanDurationDays(data.planDurationDays);
  let planExpiresAt = data.planExpiresAt || null;
  if (planDurationDays !== null) {
    planExpiresAt = buildPlanExpiryFromDays(planDurationDays);
  } else if (plan === 'Free' && !data.planExpiresAt) {
    planExpiresAt = null;
  }
  const role = data.role || 'user';
  const phone = data.phone || null;
  const permissions = JSON.stringify(data.permissions || []);
  const createdISO = new Date().toISOString();
  const passwordHash = createPasswordHash(password);
  const settings = JSON.stringify({
    twoFactorEnabled: false,
    marketingEmails: true,
    securityAlerts: true
  });

  const licenseKey = `LIC-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
  const banned = data.banned ? 1 : 0;

  sqlite.prepare(`
    INSERT INTO users (id, name, email, plan, planExpiresAt, passwordHash, verified, banned, createdISO, settings, role, phone, permissions, licenseKey, allowedIp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email, plan, planExpiresAt, passwordHash, 1, banned, createdISO, settings, role, phone, permissions, licenseKey, null);

  return findUserById(id);
}

export function createUser(input: { name: string; email: string; password: string }) {
  return createUserAdmin(input);
}

export function getUserSettings(userId: string) {
  const row = sqlite.prepare('SELECT settings FROM users WHERE id = ?').get(userId) as { settings: string } | undefined;
  if (!row || !row.settings) return {};
  try {
    return JSON.parse(row.settings);
  } catch (e) {
    console.error('Failed to parse settings for user', userId, e);
    return {};
  }
}

export function updateUserSettings(userId: string, settings: any) {
  const current = getUserSettings(userId);
  const next = { ...current, ...settings };
  sqlite.prepare('UPDATE users SET settings = ? WHERE id = ?').run(JSON.stringify(next), userId);
  return next;
}

export function regenerateUserLicense(userId: string) {
  const newKey = `LIC-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
  sqlite.prepare('UPDATE users SET licenseKey = ? WHERE id = ?').run(newKey, userId);
  return newKey;
}

export function updateUserAllowedIp(userId: string, ip: string | null) {
  sqlite.prepare('UPDATE users SET allowedIp = ? WHERE id = ?').run(ip, userId);
  return true;
}

export function findUserByLicenseKey(licenseKey: string) {
  const row = sqlite.prepare('SELECT * FROM users WHERE licenseKey = ?').get(licenseKey) as any;
  if (!row) return null;
  return findUserById(row.id);
}

export function updateUserPassword(userId: string, newPassword: string) {
  const hash = createPasswordHash(newPassword);
  sqlite.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, userId);
  return true;
}

export function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  const current = findUserById(userId);
  if (!current) return null;

  const avatarUrl = data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl;
  const bio = data.bio !== undefined ? data.bio : current.bio;
  const discordId = data.discordId !== undefined ? data.discordId : current.discordId;
  const githubUrl = data.githubUrl !== undefined ? data.githubUrl : current.githubUrl;
  const twitterUrl = data.twitterUrl !== undefined ? data.twitterUrl : current.twitterUrl;

  sqlite.prepare(`
    UPDATE users SET 
      avatarUrl = ?, bio = ?, discordId = ?, githubUrl = ?, twitterUrl = ?
    WHERE id = ?
  `).run(avatarUrl, bio, discordId, githubUrl, twitterUrl, userId);

  return findUserById(userId);
}

export function createSession(userId: string, role: SessionRole) {
  const token = randomToken(role === 'admin' ? 'admin' : 'sess');
  const session: Session = {
    token,
    userId,
    role,
    createdISO: new Date().toISOString()
  };
  sqlite.prepare('INSERT INTO sessions (token, userId, role, createdISO) VALUES (?, ?, ?, ?)').run(
    session.token,
    session.userId,
    session.role,
    session.createdISO
  );
  return session;
}

export function findSession(token: string) {
  return sqlite.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as Session | undefined ?? null;
}

export function createEmailVerificationToken(userId: string) {
  const token = randomToken('verify');
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  const record: EmailVerificationToken = {
    token,
    userId,
    createdISO: now.toISOString(),
    expiresISO: expires.toISOString()
  };
  sqlite.prepare('INSERT INTO email_verification_tokens (token, userId, expiresISO, createdISO) VALUES (?, ?, ?, ?)').run(
    record.token,
    record.userId,
    record.expiresISO,
    record.createdISO
  );
  return record;
}

export function verifyEmailToken(token: string) {
  const record = sqlite.prepare('SELECT * FROM email_verification_tokens WHERE token = ?').get(token) as EmailVerificationToken | undefined;
  if (!record) return null;
  
  sqlite.prepare('DELETE FROM email_verification_tokens WHERE token = ?').run(token);

  if (new Date(record.expiresISO).getTime() < Date.now()) {
    return null;
  }
  
  const user = findUserById(record.userId);
  if (!user) return null;
  
  sqlite.prepare('UPDATE users SET verified = 1 WHERE id = ?').run(record.userId);
  
  return {
    ...user,
    verified: true
  };
}

export function createPurchase(userId: string, pluginId: number) {
  const now = new Date().toISOString();
  const purchase: Purchase = {
    id: `pur_${crypto.randomUUID()}`,
    userId,
    pluginId,
    status: 'pending',
    licenseKey: null,
    hwid: null,
    allowedIp: null,
    createdISO: now,
    updatedISO: now
  };
  sqlite.prepare('INSERT INTO purchases (id, userId, pluginId, status, licenseKey, createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    purchase.id,
    purchase.userId,
    purchase.pluginId,
    purchase.status,
    purchase.licenseKey,
    purchase.createdISO,
    purchase.updatedISO
  );
  return purchase;
}

export function updatePurchaseStatus(id: string, status: PurchaseStatus) {
  const p = sqlite.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as Purchase | undefined;
  if (!p) return null;
  
  let licenseKey = p.licenseKey;
  if (status === 'approved' && !licenseKey) {
    licenseKey = `LIC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
  
  const updatedISO = new Date().toISOString();
  sqlite.prepare('UPDATE purchases SET status = ?, licenseKey = ?, updatedISO = ? WHERE id = ?').run(
    status,
    licenseKey,
    updatedISO,
    id
  );
  
  return {
    ...p,
    status,
    licenseKey,
    updatedISO
  };
}

export function findPurchaseById(id: string) {
  return sqlite.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as (Purchase & { hwid: string | null, allowedIp: string | null }) | undefined;
}

export function listAllPurchases() {
  return sqlite.prepare('SELECT * FROM purchases ORDER BY createdISO DESC').all() as (Purchase & { hwid: string | null, allowedIp: string | null })[];
}

export function updatePurchaseAdmin(id: string, data: Partial<Purchase & { allowedIp: string | null }>) {
  const current = findPurchaseById(id);
  if (!current) return null;

  const status = data.status ?? current.status;
  const licenseKey = data.licenseKey ?? current.licenseKey;
  const hwid = data.hwid !== undefined ? data.hwid : current.hwid;
  const allowedIp = data.allowedIp !== undefined ? data.allowedIp : current.allowedIp;
  const updatedISO = new Date().toISOString();

  sqlite.prepare(`
    UPDATE purchases SET 
      status = ?, licenseKey = ?, hwid = ?, allowedIp = ?, updatedISO = ?
    WHERE id = ?
  `).run(status, licenseKey, hwid, allowedIp, updatedISO, id);

  return findPurchaseById(id);
}

export function findPurchaseByLicenseKey(key: string) {
  return sqlite.prepare('SELECT * FROM purchases WHERE licenseKey = ?').get(key) as (Purchase & { hwid: string | null, allowedIp: string | null }) | undefined;
}

export function updatePurchaseTelemetry(id: string, data: { hwid?: string, allowedIp?: string, ip: string, port: number, serverName: string, platform: string, performance: string }) {
  sqlite.prepare(`
    UPDATE purchases SET 
      hwid = COALESCE(hwid, ?),
      allowedIp = COALESCE(allowedIp, ?),
      lastIp = ?,
      lastPort = ?,
      lastServerName = ?,
      lastPlatform = ?,
      lastPerformance = ?,
      updatedISO = ?
    WHERE id = ?
  `).run(data.hwid || null, data.allowedIp || null, data.ip, data.port, data.serverName, data.platform, data.performance, new Date().toISOString(), id);
}

export interface ServerRecord {
  id: string;
  userId: string;
  name: string;
  licenseKey: string;
  ips: string[];
  createdISO: string;
}

export function createServer(userId: string, name: string, ips: string[] = []) {
  const id = `srv_${crypto.randomUUID()}`;
  const licenseKey = `SRV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const createdISO = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO servers (id, userId, name, licenseKey, ips, createdISO)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, name, licenseKey, JSON.stringify(ips.slice(0, 3)), createdISO);
  return findServerById(id);
}

export function findServerById(id: string): ServerRecord | null {
  const row = sqlite.prepare('SELECT * FROM servers WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    ips: JSON.parse(row.ips || '[]')
  };
}

export function findServerByLicenseKey(licenseKey: string): ServerRecord | null {
  const row = sqlite.prepare('SELECT * FROM servers WHERE licenseKey = ?').get(licenseKey) as any;
  if (!row) return null;
  return findServerById(row.id);
}

export function listServersForUser(userId: string): ServerRecord[] {
  const rows = sqlite.prepare('SELECT * FROM servers WHERE userId = ? ORDER BY createdISO DESC').all(userId) as any[];
  return rows.map(row => ({
    ...row,
    ips: JSON.parse(row.ips || '[]')
  }));
}

export function updateServer(id: string, data: { name?: string, ips?: string[] }) {
  const current = findServerById(id);
  if (!current) return null;
  const name = data.name ?? current.name;
  const ips = data.ips ? JSON.stringify(data.ips.slice(0, 3)) : JSON.stringify(current.ips);
  sqlite.prepare('UPDATE servers SET name = ?, ips = ? WHERE id = ?').run(name, ips, id);
  return findServerById(id);
}

export function deleteServer(id: string) {
  sqlite.prepare('DELETE FROM server_plugins WHERE serverId = ?').run(id);
  const info = sqlite.prepare('DELETE FROM servers WHERE id = ?').run(id);
  return info.changes > 0;
}

export function assignPluginToServer(serverId: string, pluginId: number) {
  sqlite.prepare('INSERT OR IGNORE INTO server_plugins (serverId, pluginId) VALUES (?, ?)').run(serverId, pluginId);
  return true;
}

export function unassignPluginFromServer(serverId: string, pluginId: number) {
  sqlite.prepare('DELETE FROM server_plugins WHERE serverId = ? AND pluginId = ?').run(serverId, pluginId);
  return true;
}

export function listPluginsForServer(serverId: string): number[] {
  const rows = sqlite.prepare('SELECT pluginId FROM server_plugins WHERE serverId = ?').all(serverId) as { pluginId: number }[];
  return rows.map(r => r.pluginId);
}

export function getLicensesForUser(userId: string): PurchasedPlugin[] {
  const user = findUserById(userId);
  const globalKey = user?.licenseKey || '';
  
  const base = userId === demoUser.id ? purchasedPlugins.slice().map(p => ({ ...p, licenseKey: globalKey })) : [];
  
  const rows = sqlite.prepare("SELECT * FROM purchases WHERE userId = ? AND status = 'approved'").all(userId) as any[];
  
  const derived = rows.map((p, i) => {
    const plugin = getPluginDetail(p.pluginId);
    return {
      id: 10_000 + i,
      pluginId: p.pluginId,
      name: plugin?.name ?? `Plugin ${p.pluginId}`,
      version: plugin?.version ?? '1.0.0',
      purchaseDateISO: p.updatedISO,
      licenseKey: globalKey,
      status: 'Ativo' as const
    };
  });
  return [...base, ...derived];
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  active: boolean;
  grantsAllPlugins: boolean;
}

export function listCoupons() {
  const rows = sqlite.prepare('SELECT * FROM coupons ORDER BY createdISO DESC').all() as any[];
  return rows.map(r => ({
    ...r,
    active: Boolean(r.active)
  }));
}

export function findCouponByCode(code: string) {
  const row = sqlite.prepare('SELECT * FROM coupons WHERE code = ?').get(code.toUpperCase()) as any;
  if (!row) return null;
  return {
    ...row,
    active: Boolean(row.active)
  };
}

export function createCoupon(data: { code: string, discountType: 'percentage' | 'fixed', discountValue: number, minPurchase: number | null, expiresAt: string | null, maxUses: number | null, active: boolean }) {
  const id = `cp_${Date.now()}`;
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO coupons (id, code, discountType, discountValue, minPurchase, expiresAt, maxUses, usedCount, active, createdISO)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.code.toUpperCase(), data.discountType, data.discountValue, data.minPurchase, data.expiresAt, data.maxUses, 0, data.active ? 1 : 0, now);
  
  const row = sqlite.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any;
  return { ...row, active: Boolean(row.active) };
}

export function updateCoupon(id: string, data: Partial<{ active: boolean, usedCount: number }>) {
  const current = sqlite.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any;
  if (!current) return null;
  
  const active = data.active !== undefined ? (data.active ? 1 : 0) : current.active;
  const usedCount = data.usedCount !== undefined ? data.usedCount : current.usedCount;
  
  sqlite.prepare('UPDATE coupons SET active = ?, usedCount = ? WHERE id = ?').run(active, usedCount, id);
  const row = sqlite.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any;
  return { ...row, active: Boolean(row.active) };
}

export function deleteCoupon(id: string) {
  const info = sqlite.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  return info.changes > 0;
}

export function listPlans(): Plan[] {
  const rows = sqlite.prepare('SELECT * FROM plans').all() as any[];
  return rows.map(r => ({
    ...r,
    features: JSON.parse(r.features || '[]'),
    active: Boolean(r.active),
    grantsAllPlugins: Boolean(r.grantsAllPlugins)
  }));
}

export function findPlanById(id: string): Plan | null {
  const row = sqlite.prepare('SELECT * FROM plans WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    features: JSON.parse(row.features || '[]'),
    active: Boolean(row.active),
    grantsAllPlugins: Boolean(row.grantsAllPlugins)
  };
}

export function createPlan(data: { name: string, price: string, features: string[], grantsAllPlugins?: boolean }) {
  const id = data.name.toLowerCase().replace(/\s+/g, '-');
  sqlite.prepare('INSERT INTO plans (id, name, price, features, active, grantsAllPlugins) VALUES (?, ?, ?, ?, 1, ?)')
    .run(id, data.name, data.price, JSON.stringify(data.features || []), data.grantsAllPlugins ? 1 : 0);
  return { id, ...data, active: true, grantsAllPlugins: Boolean(data.grantsAllPlugins) };
}

export function updatePlan(id: string, data: { name: string, price: string, features: string[], active: boolean, grantsAllPlugins: boolean }) {
  sqlite.prepare('UPDATE plans SET name = ?, price = ?, features = ?, active = ?, grantsAllPlugins = ? WHERE id = ?')
    .run(data.name, data.price, JSON.stringify(data.features || []), data.active ? 1 : 0, data.grantsAllPlugins ? 1 : 0, id);
  return true;
}

export function deletePlan(id: string) {
  const info = sqlite.prepare('DELETE FROM plans WHERE id = ?').run(id);
  return info.changes > 0;
}

export function listAllReviews() {
  const rows = sqlite.prepare(`
    SELECT r.*, p.name as pluginName 
    FROM reviews r 
    JOIN plugins p ON r.pluginId = p.id 
    ORDER BY r.createdISO DESC
  `).all() as any[];
  return rows.map(r => ({
    id: r.id,
    pluginId: r.pluginId,
    pluginName: r.pluginName,
    userId: r.userId,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    createdISO: r.createdISO
  }));
}

export function deleteReview(id: string) {
  const review = sqlite.prepare('SELECT pluginId FROM reviews WHERE id = ?').get(id) as { pluginId: number } | undefined;
  if (!review) return false;

  const info = sqlite.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  
  if (info.changes > 0) {
    // Update plugin rating
    updatePluginRating(review.pluginId);
    syncPluginArrays();
    return true;
  }
  return false;
}

export function createOrder(data: { userId: string, pluginIds: number[], planId: string | null, totalCents: number, paymentProvider: string }) {
  const id = `ord_${Date.now()}`;
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO orders (id, userId, pluginIds, planId, totalCents, status, paymentProvider, createdISO, updatedISO)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(id, data.userId, JSON.stringify(data.pluginIds), data.planId, data.totalCents, data.paymentProvider, now, now);
  return id;
}

export function updateOrderStatus(id: string, status: string, paymentId?: string) {
  const now = new Date().toISOString();
  if (paymentId) {
    sqlite.prepare('UPDATE orders SET status = ?, paymentId = ?, updatedISO = ? WHERE id = ?').run(status, paymentId, now, id);
  } else {
    sqlite.prepare('UPDATE orders SET status = ?, updatedISO = ? WHERE id = ?').run(status, now, id);
  }
}

function mapOrderRow(row: any): OrderRecord {
  return {
    id: row.id,
    userId: row.userId,
    pluginIds: JSON.parse(row.pluginIds || '[]'),
    planId: row.planId ?? null,
    totalCents: Number(row.totalCents || 0),
    status: String(row.status || 'pending'),
    paymentProvider: String(row.paymentProvider || ''),
    paymentId: row.paymentId ?? null,
    createdISO: row.createdISO,
    updatedISO: row.updatedISO
  };
}

export function findOrderById(id: string): OrderRecord | null {
  const row = sqlite.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!row) return null;
  return mapOrderRow(row);
}

export function listAllOrders(): OrderRecord[] {
  const rows = sqlite.prepare('SELECT * FROM orders ORDER BY createdISO DESC').all() as any[];
  return rows.map(mapOrderRow);
}

function mapRaffleRow(row: any): RaffleRecord {
  const winner = row.winnerUserId ? findUserById(row.winnerUserId) : null;
  const entrantRow = sqlite
    .prepare('SELECT COUNT(*) as count FROM raffle_entries WHERE raffleId = ?')
    .get(row.id) as { count: number };

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    prize: row.prize ?? null,
    eligibility: (row.eligibility || 'approved_buyers') as RaffleEligibility,
    status: (row.status || 'open') as RaffleStatus,
    winnerUserId: row.winnerUserId ?? null,
    winnerName: winner?.name ?? null,
    createdISO: row.createdISO,
    updatedISO: row.updatedISO,
    drawnISO: row.drawnISO ?? null,
    entrantsCount: Number(entrantRow?.count || 0)
  };
}

export function listRaffles(): RaffleRecord[] {
  const rows = sqlite.prepare('SELECT * FROM raffles ORDER BY createdISO DESC').all() as any[];
  return rows.map(mapRaffleRow);
}

export function findRaffleById(id: string): RaffleRecord | null {
  const row = sqlite.prepare('SELECT * FROM raffles WHERE id = ?').get(id) as any;
  if (!row) return null;
  return mapRaffleRow(row);
}

export function createRaffle(data: {
  title: string;
  description?: string | null;
  prize?: string | null;
  eligibility?: RaffleEligibility;
}): RaffleRecord {
  const id = `raffle_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO raffles (id, title, description, prize, eligibility, status, winnerUserId, createdISO, updatedISO, drawnISO)
    VALUES (?, ?, ?, ?, ?, 'open', NULL, ?, ?, NULL)
  `).run(
    id,
    data.title,
    data.description ?? null,
    data.prize ?? null,
    data.eligibility ?? 'approved_buyers',
    now,
    now
  );
  return findRaffleById(id)!;
}

export function updateRaffle(id: string, data: Partial<{
  title: string;
  description: string | null;
  prize: string | null;
  eligibility: RaffleEligibility;
  status: RaffleStatus;
}>): RaffleRecord | null {
  const current = sqlite.prepare('SELECT * FROM raffles WHERE id = ?').get(id) as any;
  if (!current) return null;
  const now = new Date().toISOString();
  sqlite.prepare(`
    UPDATE raffles
    SET title = ?, description = ?, prize = ?, eligibility = ?, status = ?, updatedISO = ?
    WHERE id = ?
  `).run(
    data.title ?? current.title,
    data.description !== undefined ? data.description : current.description,
    data.prize !== undefined ? data.prize : current.prize,
    data.eligibility ?? current.eligibility,
    data.status ?? current.status,
    now,
    id
  );
  return findRaffleById(id);
}

export function deleteRaffle(id: string): boolean {
  sqlite.prepare('DELETE FROM raffle_entries WHERE raffleId = ?').run(id);
  const info = sqlite.prepare('DELETE FROM raffles WHERE id = ?').run(id);
  return info.changes > 0;
}

export function addRaffleEntry(raffleId: string, userId: string): boolean {
  const raffle = sqlite.prepare('SELECT * FROM raffles WHERE id = ?').get(raffleId) as any;
  if (!raffle || raffle.status !== 'open') return false;
  const id = `re_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO raffle_entries (id, raffleId, userId, createdISO)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE createdISO = createdISO
  `).run(id, raffleId, userId, now);
  return true;
}

export function listRaffleEntries(raffleId: string): Array<{ userId: string; name: string; email: string }> {
  const rows = sqlite
    .prepare('SELECT userId FROM raffle_entries WHERE raffleId = ? ORDER BY createdISO ASC')
    .all(raffleId) as Array<{ userId: string }>;
  return rows
    .map((r) => findUserById(r.userId))
    .filter((u): u is AccountUser => Boolean(u))
    .map((u) => ({ userId: u.id, name: u.name, email: u.email }));
}

export function autoPopulateRaffleEntries(raffleId: string, eligibility: RaffleEligibility): number {
  const users = listAllUsers();
  const purchases = listAllPurchases();
  const hasApprovedPurchase = new Set(
    purchases.filter((p) => p.status === 'approved').map((p) => p.userId)
  );

  let eligibleUserIds: string[] = [];
  if (eligibility === 'all_users') {
    eligibleUserIds = users.map((u) => u.id);
  } else if (eligibility === 'premium_users') {
    eligibleUserIds = users
      .filter((u) => u.plan === 'Premium' || u.role === 'premium' || u.role === 'admin')
      .map((u) => u.id);
  } else {
    eligibleUserIds = users
      .filter((u) => hasApprovedPurchase.has(u.id))
      .map((u) => u.id);
  }

  for (const userId of eligibleUserIds) {
    addRaffleEntry(raffleId, userId);
  }

  return eligibleUserIds.length;
}

export function drawRaffleWinner(raffleId: string): { raffle: RaffleRecord; winner: { id: string; name: string; email: string } | null } | null {
  const current = sqlite.prepare('SELECT * FROM raffles WHERE id = ?').get(raffleId) as any;
  if (!current) return null;
  if (current.status !== 'open') return null;

  autoPopulateRaffleEntries(raffleId, (current.eligibility || 'approved_buyers') as RaffleEligibility);
  const entries = listRaffleEntries(raffleId);
  if (entries.length === 0) return null;

  const winner = entries[Math.floor(Math.random() * entries.length)] ?? null;
  if (!winner) return null;

  const now = new Date().toISOString();
  sqlite.prepare(`
    UPDATE raffles
    SET status = 'drawn', winnerUserId = ?, drawnISO = ?, updatedISO = ?
    WHERE id = ?
  `).run(winner.userId, now, now, raffleId);

  const raffle = findRaffleById(raffleId);
  if (!raffle) return null;

  return {
    raffle,
    winner: { id: winner.userId, name: winner.name, email: winner.email }
  };
}
