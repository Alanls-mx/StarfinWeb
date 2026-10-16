export type PluginTag = 'Popular' | 'Novo' | 'Premium';

export type PluginCategory = string;

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
  priceDisplay: string;
  priceCents: number;
  currency: 'BRL';
  jarUrl?: string | null;
  dependencies: string[];
  platform: string | null;
  imageUrl: string;
  featured: boolean;
}

export interface PluginDetail extends PluginSummary {
  tagline: string;
  version: string;
  author: string;
  lastUpdateISO: string;
  reviewsCount: number;
  screenshots: string[];
  features: Array<{ title: string; description: string }>;
  docsSections: Array<{ title: string; description: string }>;
  reviews: Array<{ user: string; rating: number; dateISO: string; comment: string }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium';
  planExpiresAt?: string | null;
  planDurationDays?: number | null;
  verified: boolean;
  banned: boolean;
  role: 'user' | 'admin' | 'staff' | 'premium';
  licenseKey?: string | null;
  allowedIp?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  discordId?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  phone?: string | null;
  permissions?: string[];
}

export interface Purchase {
  id: string;
  userId: string;
  pluginId: number;
  status: 'pending' | 'approved' | 'cancelled' | 'rejected';
  licenseKey: string | null;
  createdISO: string;
  updatedISO: string;
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
  status: 'unknown' | 'operational' | 'degraded' | 'down';
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

export interface PurchasedPlugin {
  id: number;
  pluginId: number;
  name: string;
  version: string;
  purchaseDateISO: string;
  licenseKey: string;
  status: 'Ativo' | 'Expirado' | 'Suspenso';
}

export interface ApiKey {
  id: string;
  pluginId: number;
  name: string;
  keyPrefix: string;
  createdISO: string;
  lastUsedISO: string | null;
}

export interface ApiKeyCreated {
  id: string;
  pluginId: number;
  name: string;
  key: string;
  createdISO: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function toQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null }
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (init?.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  const res = await fetch(path, {
    ...init,
    headers
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const errorValue = (json as any)?.error;
    const message =
      typeof errorValue === 'string'
        ? errorValue
        : typeof errorValue?.message === 'string'
          ? errorValue.message
          : `Erro ${res.status}`;
    throw new ApiError(message, res.status, json);
  }

  return json as T;
}

export function getCategories() {
  return apiFetch<{ items: PluginCategory[] }>('/api/categories');
}

export function verifyEmail(token: string) {
  return apiFetch<{ success: boolean }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ success: boolean }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function resetPassword(params: { token: string; password: string }) {
  return apiFetch<{ success: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  featured: boolean;
  user: { name: string };
  plugin: { name: string; slug: string };
  createdAt: string;
}

export function getReviews(params?: { pluginId?: string; featured?: boolean }) {
  const qs = toQueryString(params || {});
  return apiFetch<{ reviews: Review[] }>(`/api/reviews${qs}`);
}

export function postReview(token: string | null, data: { pluginId: number; rating: number; comment: string }) {
  return apiFetch<{ ok: true; review: any }>(`/api/plugins/${data.pluginId}/reviews`, {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminListReviews(token: string) {
  return apiFetch<{ items: any[] }>('/api/admin/reviews', { token });
}

export function adminDeleteReview(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/reviews/${id}`, {
    method: 'DELETE',
    token
  });
}

export interface AdminStats {
  topPlugins: Array<{ id: string; name: string; slug: string; sales: number; revenueCents: number }>;
  topCustomers: Array<{ id: string; name: string; email: string; pluginCount: number }>;
  stats: {
    totalSales: number;
    totalRevenueCents: number;
    totalUsers: number;
    totalOrders: number;
    totalPlugins: number;
    pluginsWithSales: number;
  };
  paymentStatus: { pending: number; approved: number; rejected: number; cancelled: number };
  pluginStatus: { pending: number; approved: number; rejected: number; cancelled: number };
  tickets: { open: number; answered: number; closed: number };
}

export function getAdminStats(token?: string | null) {
  return apiFetch<AdminStats>('/api/admin/stats', { token });
}

export function validateCoupon(code: string, totalCents: number) {
  return apiFetch<{ code: string; discountCents: number; finalCents: number }>(
    '/api/commerce/coupon/validate',
    {
      method: 'POST',
      body: JSON.stringify({ code, totalCents })
    }
  );
}

export function getPlans() {
  return apiFetch<{ items: any[] }>('/api/plans');
}

export function checkout(pluginIds: string[], planId?: string | null, couponCode?: string) {
  return apiFetch<{ orderId: string; finalTotal: number; licenses: any[] }>(
    '/api/commerce/checkout',
    {
      method: 'POST',
      body: JSON.stringify({ pluginIds, planId, couponCode })
    }
  );
}

export function getFeaturedPlugins() {
  return apiFetch<{ items: PluginSummary[] }>('/api/plugins/featured');
}

export function getPlugins(params: {
  search?: string;
  category?: string;
  tag?: string;
  ratingMin?: number;
  sort?: 'popular' | 'rating' | 'recent' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}) {
  const qs = toQueryString(params as any);
  return apiFetch<{ items: PluginSummary[]; page: number; limit: number; total: number }>(
    `/api/plugins${qs}`
  );
}

export function getPlugin(id: number) {
  return apiFetch<PluginDetail>(`/api/plugins/${id}`);
}

export function login(email: string, password: string) {
  return apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function getMe(token: string) {
  return apiFetch<UserProfile>('/api/users/me', { token });
}

export function getMyLicenses(token: string) {
  return apiFetch<{ items: PurchasedPlugin[] }>('/api/users/me/licenses', { token });
}

export function listMyApiKeys(token: string) {
  return apiFetch<{ items: ApiKey[] }>('/api/users/me/api-keys', { token });
}

export function createMyApiKey(token: string, input: { pluginId: number; name: string }) {
  return apiFetch<ApiKeyCreated>('/api/users/me/api-keys', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function revokeMyApiKey(token: string, id: string) {
  return apiFetch<{ ok: true }>('/api/users/me/api-keys/' + encodeURIComponent(id), {
    method: 'DELETE',
    token
  });
}

export function createSupportTicket(input: { email: string; subject: string; message: string }) {
  return apiFetch<{ id: string; status: string }>('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export interface CareerApplicationInput {
  name: string;
  email: string;
  role: string;
  message: string;
  phone?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export function applyCareer(input: CareerApplicationInput) {
  return apiFetch<{ ok: true; application: { id: string; createdISO: string; status: string } }>('/api/careers/apply', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export interface CareerJob {
  id: string;
  title: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  enabled: boolean;
}

export interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  skills: string[];
}

export interface PublicSettings {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  siteDescription: string;
  footerText: string;
  discordUrl: string;
  supportEmail: string;
  homeStatsPlugins: string;
  homeStatsServers: string;
  homeStatsRating: string;
  homeStatsSupport: string;
  careersJobs: CareerJob[];
  aboutTeam: TeamMemberProfile[];
  homeContent: HomeContent;
  institutionalContent: InstitutionalContent;
  faqItems: FaqItem[];
}

export interface InstitutionalContent {
  aboutTitle: string;
  aboutDescription: string;
  aboutMissionTitle: string;
  aboutMissionDescription: string;
  aboutMissionSecondary: string;
  contactTitle: string;
  contactDescription: string;
  faqTitle: string;
  faqDescription: string;
}

export interface FaqItem { id: string; category: string; question: string; answer: string }

export const defaultInstitutionalContent: InstitutionalContent = {
  aboutTitle: 'Nossa História',
  aboutDescription: 'Desenvolvemos ferramentas para servidores Minecraft e mantemos a documentação, o licenciamento e o suporte em um só lugar.',
  aboutMissionTitle: 'Nossa Missão',
  aboutMissionDescription: 'Nossa missão é fornecer ferramentas poderosas e intuitivas que permitam aos donos de servidores focarem no que realmente importa: criar diversão para seus jogadores.',
  aboutMissionSecondary: 'Acreditamos que a tecnologia não deve ser um obstáculo, mas sim uma ponte para a criatividade. Por isso, cada linha de código é pensada na facilidade de uso e na performance.',
  contactTitle: 'Vamos resolver sua dúvida',
  contactDescription: 'Abra um chamado para questões de compra, licença, instalação ou uso dos plugins. A conversa fica registrada na sua conta para acompanhamento.',
  faqTitle: 'Perguntas Frequentes',
  faqDescription: 'Tire suas dúvidas rápidas sobre nossos serviços.'
};

export const defaultFaqItems: FaqItem[] = [
  { id: 'purchase', category: 'Geral', question: 'Quando a licença aparece após a compra?', answer: 'A licença aparece na sua conta depois que o provedor confirma o pagamento. Um pedido pendente não libera o produto. O download do arquivo ainda não está disponível nesta plataforma.' },
  { id: 'payment', category: 'Pagamentos', question: 'Quais as formas de pagamento aceitas?', answer: 'As opções disponíveis são apresentadas pelo Mercado Pago durante o checkout. Consulte o status do pedido na sua conta após retornar do provedor.' },
  { id: 'license', category: 'Licença', question: 'Posso usar um plugin em mais de um servidor?', answer: 'A autorização depende das licenças da conta e das atribuições configuradas para cada servidor. Cadastre os servidores e confira as regras de IP na sua conta.' },
  { id: 'support', category: 'Suporte', question: 'Como entro em contato com o suporte?', answer: 'Abra um chamado na área de suporte do site e acompanhe as respostas pela sua conta.' },
  { id: 'premium', category: 'Premium', question: 'Posso assinar o plano Premium agora?', answer: 'A contratação de planos está indisponível até a homologação financeira. Os produtos disponíveis podem ser consultados individualmente no catálogo.' }
];

export interface HomeContent {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  accountTitle: string;
  accountDescription: string;
  heroImageUrl?: string;
  accountImageUrl?: string;
  projectImageUrl?: string;
  heroPrimaryLabel?: string;
  heroPrimaryHref?: string;
  heroSecondaryLabel?: string;
  heroSecondaryHref?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectNote?: string;
  projectCtaLabel?: string;
  projectCtaHref?: string;
}

export const defaultHomeContent: HomeContent = {
  heroEyebrow: 'Software para servidores Minecraft',
  heroTitle: 'Seu mundo.',
  heroAccent: 'Seu controle.',
  heroDescription: 'Plugins próprios, licenças organizadas e ferramentas para quem leva a experiência do servidor a sério.',
  accountTitle: 'Tudo o que é seu, em um só lugar.',
  accountDescription: 'A área da conta reúne suas licenças, plugins, servidores e pedidos. Encontre o que precisa sem procurar em mensagens antigas.'
};

export interface AdminSiteSettings extends PublicSettings {
  siteDescription: string;
  maintenanceMode: boolean;
  newsletterAutoEnabled: boolean;
  newsletterFrequencyDays: number;
  newsletterLastSentISO: string | null;
  mercadopagoEnabled: boolean;
  mercadopagoAccessToken: string;
  mercadopagoTokenConfigured?: boolean;
  mercadopagoPublicKey: string;
  mercadopagoWebhookUrl: string;
}

export function subscribeNewsletter(email: string) {
  return apiFetch<{ ok: true }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function getPublicSettings() {
  return apiFetch<PublicSettings>('/api/public/settings');
}

// Admin API
export function adminListPlugins(token: string) {
  return apiFetch<{ items: PluginSummary[] }>('/api/admin/plugins', { token });
}

export function adminCreatePlugin(
  token: string,
  input: {
    name: string;
    description: string;
    category: PluginCategory;
    licenseName?: string | null;
    tags: PluginTag[];
    mcVersion: string;
    priceDisplay: string;
    imageUrl: string;
    platform?: string | null;
    featured?: boolean;
  }
) {
  return apiFetch<PluginDetail>('/api/admin/plugins', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function adminUpdatePlugin(token: string, id: number, input: Partial<PluginDetail>) {
  return apiFetch<PluginSummary>(`/api/admin/plugins/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminDeletePlugin(token: string, id: number) {
  return apiFetch<{ ok: true }>(`/api/admin/plugins/${id}`, { method: 'DELETE', token });
}

export interface PluginRelease {
  id: string;
  pluginId: number;
  version: string;
  mcVersion: string;
  notes: string | null;
  originalName: string;
  sha256: string;
  sizeBytes: number;
  published: boolean;
  createdISO: string;
}

export function adminListPluginReleases(token: string, pluginId: number) {
  return apiFetch<{ items: PluginRelease[] }>(`/api/admin/plugins/${pluginId}/releases`, { token });
}

export function adminUploadPluginRelease(token: string, pluginId: number, input: { version: string; mcVersion: string; notes: string; file: File }) {
  const body = new FormData();
  body.set('version', input.version);
  body.set('mcVersion', input.mcVersion);
  body.set('notes', input.notes);
  body.set('file', input.file);
  return apiFetch<{ item: PluginRelease }>(`/api/admin/plugins/${pluginId}/releases`, { method: 'POST', token, body });
}

export function adminPublishPluginRelease(token: string, id: string, published: boolean) {
  return apiFetch<{ item: PluginRelease }>(`/api/admin/releases/${encodeURIComponent(id)}`, { method: 'PATCH', token, body: JSON.stringify({ published }) });
}

export function adminDeletePluginRelease(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/releases/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}

export function getMyPluginReleases(token: string, pluginId: number) {
  return apiFetch<{ items: PluginRelease[] }>(`/api/users/me/plugins/${pluginId}/releases`, { token });
}

export async function downloadMyPluginRelease(token: string, release: PluginRelease) {
  const response = await fetch(`/api/users/me/releases/${encodeURIComponent(release.id)}/download`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(response.status === 403 ? 'Licença ativa necessária.' : 'Arquivo indisponível.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = release.originalName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function adminListCategories(token: string) {
  return apiFetch<{ items: PluginCategory[] }>('/api/admin/categories', { token });
}

export function adminAddCategory(token: string, name: PluginCategory) {
  return apiFetch<{ ok: true }>('/api/admin/categories', {
    method: 'POST',
    token,
    body: JSON.stringify({ name })
  });
}

export function adminDeleteCategory(token: string, name: PluginCategory) {
  return apiFetch<{ ok: true }>('/api/admin/categories', {
    method: 'DELETE',
    token,
    body: JSON.stringify({ name })
  });
}

export function adminUpdateCategory(token: string, oldName: string, newName: string) {
  return apiFetch<{ ok: true }>(`/api/admin/categories/${encodeURIComponent(oldName)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ newName })
  });
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdISO: string;
  updatedISO: string;
  messages?: TicketMessage[];
  user?: { name: string; email: string };
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

export function listMyTickets(token: string) {
  return apiFetch<{ items: SupportTicket[] }>('/api/users/me/tickets', { token });
}

export function getTicket(token: string, id: string) {
  return apiFetch<SupportTicket>(`/api/support/tickets/${id}`, { token });
}

export function createTicket(token: string, input: { subject: string; category: string; priority: string; message: string }) {
  return apiFetch<SupportTicket>('/api/support/tickets', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function replyToTicket(token: string, id: string, content: string) {
  return apiFetch<TicketMessage>(`/api/support/tickets/${id}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content })
  });
}

export function closeTicket(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/support/tickets/${id}/close`, {
    method: 'POST',
    token
  });
}

export function getDocArticles(category?: string) {
  const qs = toQueryString({ category });
  return apiFetch<{ items: DocArticle[] }>(`/api/docs/articles${qs}`);
}

export function getDocArticle(slug: string) {
  return apiFetch<DocArticle>(`/api/docs/articles/${slug}`);
}

// Admin Support API
export function adminListTickets(token: string) {
  return apiFetch<{ items: SupportTicket[] }>('/api/admin/support/tickets', { token });
}

export function adminReplyToTicket(token: string, id: string, content: string) {
  return apiFetch<TicketMessage>(`/api/admin/support/tickets/${id}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content })
  });
}

export function adminUpdateTicket(token: string, id: string, status: string) {
  return apiFetch<{ ok: true }>(`/api/admin/support/tickets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ status })
  });
}

// Admin Docs API
export function adminListDocArticles(token: string) {
  return apiFetch<{ items: DocArticle[] }>('/api/admin/docs/articles', { token });
}

export function adminCreateDocArticle(token: string, input: Partial<DocArticle>) {
  return apiFetch<DocArticle>('/api/admin/docs/articles', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function adminUpdateDocArticle(token: string, id: string, input: Partial<DocArticle>) {
  return apiFetch<DocArticle>(`/api/admin/docs/articles/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminDeleteDocArticle(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/docs/articles/${id}`, {
    method: 'DELETE',
    token
  });
}

export function registerAccount(input: { name: string; email: string; password: string }) {
  return apiFetch<{ token: string; user: UserProfile; devVerificationUrl?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function resendVerification(email: string) {
  return apiFetch<{ ok: true; devVerificationUrl?: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function createPurchase(token: string, pluginId: number) {
  return apiFetch<Purchase>('/api/purchases', {
    method: 'POST',
    token,
    body: JSON.stringify({ pluginId })
  });
}

export function getSystemStatus() {
  return apiFetch<{ items: StatusComponent[] }>('/api/status');
}

export function getChangelog() {
  return apiFetch<{ items: ChangelogEntry[] }>('/api/changelog');
}

export function getDocs() {
  return apiFetch<{ items: DocsSection[]; integration: IntegrationConfig }>('/api/docs');
}

export function getAdminUsers(token: string) {
  return apiFetch<{ items: UserProfile[] }>('/api/admin/users', { token });
}

export function updateAdminUser(token: string, id: string, data: Partial<UserProfile>) {
  return apiFetch<UserProfile>(`/api/admin/users/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data)
  });
}

export function deleteAdminUser(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
    token
  });
}

export function createAdminUser(token: string, data: Partial<UserProfile> & { password?: string }) {
  return apiFetch<UserProfile>('/api/admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export interface AdminUserPluginAssignment {
  purchaseId: string;
  pluginId: number;
  pluginName: string;
  status: 'pending' | 'approved' | 'cancelled' | 'rejected';
  licenseKey: string | null;
  grantSource: 'payment' | 'admin_grant';
  createdISO: string;
  updatedISO: string;
}

export function adminListUserPlugins(token: string, userId: string) {
  return apiFetch<{ items: AdminUserPluginAssignment[] }>(`/api/admin/users/${encodeURIComponent(userId)}/plugins`, { token });
}

export function adminAssignPluginToUser(token: string, userId: string, pluginId: number, reason: string) {
  return apiFetch<{ item: AdminUserPluginAssignment }>(`/api/admin/users/${encodeURIComponent(userId)}/plugins`, {
    method: 'POST',
    token,
    body: JSON.stringify({ pluginId, reason })
  });
}

export function adminRemovePluginFromUser(token: string, userId: string, pluginId: number, reason: string) {
  return apiFetch<{ ok: true; revokedCount: number }>(`/api/admin/users/${encodeURIComponent(userId)}/plugins/${encodeURIComponent(String(pluginId))}`, {
    method: 'DELETE',
    token,
    body: JSON.stringify({ reason })
  });
}

export function adminGetSmtp(token: string) {
  return apiFetch<SmtpConfig>('/api/admin/smtp', { token });
}

export function adminSaveSmtp(token: string, input: Partial<SmtpConfig>) {
  return apiFetch<{ ok: true }>('/api/admin/smtp', {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminTestSmtp(token: string, to: string) {
  return apiFetch<{ ok: boolean; delivered: boolean; id: string }>('/api/admin/smtp/test', {
    method: 'POST',
    token,
    body: JSON.stringify({ to })
  });
}

export function adminGetOutbox(token: string) {
  return apiFetch<{ items: OutboxEmail[] }>('/api/admin/emails/outbox', { token });
}

export function adminGetIntegrations(token: string) {
  return apiFetch<IntegrationConfig>('/api/admin/integrations', { token });
}

export function adminSaveIntegrations(token: string, input: Partial<IntegrationConfig>) {
  return apiFetch<{ ok: true }>('/api/admin/integrations', {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export interface AdminPurchase extends Purchase {
  hwid: string | null;
  allowedIp: string | null;
}

export function adminListPurchases(token: string) {
  return apiFetch<{ items: AdminPurchase[] }>('/api/admin/purchases', { token });
}

export interface AdminAuditEntry {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  details: Record<string, unknown> | null;
  createdISO: string;
}

export function adminListAudit(token: string) {
  return apiFetch<{ items: AdminAuditEntry[] }>('/api/admin/audit?limit=200', { token });
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string | null;
  pluginNames: string[];
  planId: string | null;
  totalCents: number;
  status: string;
  paymentProvider: string;
  paymentId: string | null;
  createdISO: string;
  updatedISO: string;
}

export function adminListOrders(token: string) {
  return apiFetch<{ items: AdminOrder[] }>('/api/admin/orders', { token });
}

export function adminUpdatePurchase(token: string, id: string, input: { allowedIp: string | null; resetHwid?: boolean }) {
  return apiFetch<{ ok: true; purchase: AdminPurchase }>(`/api/admin/purchases/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminUpdateStatus(token: string, id: string, input: { status?: StatusComponent['status']; message?: string }) {
  return apiFetch<{ ok: true; item: StatusComponent }>(`/api/admin/status/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminCreateChangelog(token: string, input: { version: string; title: string; body: string }) {
  return apiFetch<ChangelogEntry>('/api/admin/changelog', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function adminUpdateChangelog(token: string, id: string, input: Partial<ChangelogEntry>) {
  return apiFetch<{ ok: true; item: ChangelogEntry }>(`/api/admin/changelog/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminDeleteChangelog(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/changelog/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}

export function adminListNotifications(token: string) {
  return apiFetch<{ items: AdminNotification[] }>('/api/admin/notifications', { token });
}

export function adminListNewsletterSubscribers(token: string) {
  return apiFetch<{ items: string[] }>('/api/admin/newsletter/subscribers', { token });
}

export function adminSendNewsletter(token: string, data: { subject: string; body: string }) {
  return apiFetch<{ ok: boolean; delivered: number; failed: number }>('/api/admin/newsletter/send', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'manual' | 'sale' | 'support' | 'raffle';
  priority: 'low' | 'normal' | 'high';
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdISO: string;
}

export function adminCreateNotification(
  token: string,
  data: {
    title: string;
    message: string;
    type?: 'manual' | 'sale' | 'support' | 'raffle';
    priority?: 'low' | 'normal' | 'high';
    source?: string | null;
    userId?: string | null;
  }
) {
  return apiFetch<{ item: AdminNotification }>('/api/admin/notifications', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminDeleteNotification(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token
  });
}

export interface AdminRaffle {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  eligibility: 'all_users' | 'approved_buyers' | 'premium_users';
  rewardKind: 'none' | 'plugin' | 'plan';
  rewardPluginId: number | null;
  rewardPlanId: string | null;
  rewardPlanDays: number | null;
  status: 'open' | 'closed' | 'drawn';
  winnerUserId: string | null;
  winnerName: string | null;
  createdISO: string;
  updatedISO: string;
  drawnISO: string | null;
  entrantsCount: number;
}

export function adminListRaffles(token: string) {
  return apiFetch<{ items: AdminRaffle[] }>('/api/admin/raffles', { token });
}

export function adminCreateRaffle(
  token: string,
  data: {
    title: string;
    description?: string;
    prize?: string;
    eligibility: AdminRaffle['eligibility'];
    rewardKind?: AdminRaffle['rewardKind'];
    rewardPluginId?: number | null;
    rewardPlanId?: string | null;
    rewardPlanDays?: number | null;
  }
) {
  return apiFetch<{ item: AdminRaffle }>('/api/admin/raffles', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminUpdateRaffle(
  token: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    prize: string;
    eligibility: AdminRaffle['eligibility'];
    rewardKind: AdminRaffle['rewardKind'];
    rewardPluginId: number | null;
    rewardPlanId: string | null;
    rewardPlanDays: number | null;
    status: AdminRaffle['status'];
  }>
) {
  return apiFetch<{ item: AdminRaffle }>(`/api/admin/raffles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data)
  });
}

export function adminDeleteRaffle(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/raffles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token
  });
}

export function adminDrawRaffle(token: string, id: string) {
  return apiFetch<{ raffle: AdminRaffle; winner: { id: string; name: string; email: string } | null }>(
    `/api/admin/raffles/${encodeURIComponent(id)}/draw`,
    {
      method: 'POST',
      token
    }
  );
}

export function adminUploadFile(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro no upload');
    return json as { url: string };
  });
}

export function adminListMedia(token: string) {
  return apiFetch<{ items: Array<{ url: string; createdAt: string }> }>('/api/admin/media', { token });
}

export function uploadMyAvatar(token: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  return fetch('/api/users/me/avatar', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
    .then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha no envio da imagem');
      return result as { avatarUrl: string };
    });
}

export function removeMyAvatar(token: string) {
  return apiFetch<{ avatarUrl: null }>('/api/users/me/avatar', { method: 'DELETE', token });
}

export function adminListCoupons(token: string) {
  return apiFetch<{ items: any[] }>('/api/admin/coupons', { token });
}

export function adminCreateCoupon(token: string, data: any) {
  return apiFetch<{ item: any }>('/api/admin/coupons', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminDeleteCoupon(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token
  });
}

export function adminUpdateCoupon(token: string, id: string, data: any) {
  return apiFetch<{ item: any }>(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function adminListPlans(token: string) {
  return apiFetch<{ items: any[] }>('/api/admin/plans', { token });
}

export function adminCreatePlan(token: string, data: any) {
  return apiFetch<any>('/api/admin/plans', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminUpdatePlan(token: string, id: string, data: any) {
  return apiFetch<{ ok: true }>(`/api/admin/plans/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data)
  });
}

export function adminDeletePlan(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/plans/${id}`, {
    method: 'DELETE',
    token
  });
}

export function adminGetSettings(token: string) {
  return apiFetch<AdminSiteSettings>('/api/admin/settings', { token });
}

export function adminSaveSettings(token: string, data: Partial<AdminSiteSettings>) {
  return apiFetch<{ success: boolean; settings: AdminSiteSettings }>('/api/admin/settings', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function adminSaveDocsSection(token: string, id: string, input: { title: string; body: string }) {
  return apiFetch<{ ok: true }>(`/api/admin/docs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function getMySettings(token: string) {
  return apiFetch<{ 
    email: string; 
    name: string; 
    twoFactorEnabled: boolean; 
    marketingEmails: boolean; 
    securityAlerts: boolean;
    licenseKey: string;
    allowedIp: string | null;
    avatarUrl: string | null;
    bio: string | null;
    discordId: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
  }>('/api/users/me/settings', { token });
}

export function updateMyProfile(token: string, data: {
  avatarUrl?: string | null;
  bio?: string | null;
  discordId?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
}) {
  return apiFetch<any>('/api/users/me/profile', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function updateMySettings(token: string, data: any) {
  return apiFetch<{ success: boolean }>('/api/users/me/settings', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function updateMyPassword(token: string, data: { currentPassword?: string; newPassword: string }) {
  return apiFetch<{ success: boolean }>('/api/users/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function getMyNotifications(token: string) {
  return apiFetch<UserNotification[]>('/api/users/me/notifications', { token });
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  createdISO: string;
  readISO: string | null;
}

export function adminSendUserNotification(token: string, userId: string, title: string, message: string) {
  return apiFetch<{ item: UserNotification }>(`/api/admin/users/${encodeURIComponent(userId)}/notifications`, {
    method: 'POST', token, body: JSON.stringify({ title, message })
  });
}

export function readAllNotifications(token: string) {
  return apiFetch<{ success: boolean }>('/api/users/me/notifications/read-all', {
    method: 'POST',
    token
  });
}

export interface CustomerOrder {
  id: string;
  dateISO: string;
  amountCents: number;
  status: string;
  method: string | null;
  paymentId: string | null;
  pluginName: string;
}

export function getMyPayments(token: string) {
  return apiFetch<CustomerOrder[]>('/api/users/me/payments', { token });
}

export function getPluginConfig(token: string, id: number) {
  return apiFetch<{ jarUrl: string | null; version: string; pluginId: number; hwid: string; allowedIp: string }>(`/api/plugins/${id}/config`, { token });
}

export function updatePluginConfig(token: string, id: number, data: any) {
  return apiFetch<{ success: boolean }>(`/api/plugins/${id}/config`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function updateMyAllowedIp(token: string, allowedIp: string | null) {
  return apiFetch<{ success: boolean }>('/api/users/me/allowed-ip', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ allowedIp })
  });
}

export function regenerateMyLicense(token: string) {
  return apiFetch<{ licenseKey: string }>('/api/users/me/license/regenerate', {
    method: 'POST',
    token
  });
}

export interface ServerRecord {
  id: string;
  name: string;
  licenseKey: string;
  ips: string[];
  plugins: number[];
}

export function listMyServers(token: string) {
  return apiFetch<{ items: ServerRecord[] }>('/api/users/me/servers', { token });
}

export function createServer(token: string, data: { name: string, ips: string[] }) {
  return apiFetch<ServerRecord>('/api/users/me/servers', {
    method: 'POST',
    token,
    body: JSON.stringify(data)
  });
}

export function updateServer(token: string, id: string, data: { name?: string, ips?: string[] }) {
  return apiFetch<ServerRecord>(`/api/users/me/servers/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data)
  });
}

export function deleteServer(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/api/users/me/servers/${id}`, {
    method: 'DELETE',
    token
  });
}

export function assignPluginToServer(token: string, serverId: string, pluginId: number) {
  return apiFetch<{ ok: boolean }>(`/api/users/me/servers/${serverId}/plugins`, {
    method: 'POST',
    token,
    body: JSON.stringify({ pluginId })
  });
}

export function unassignPluginFromServer(token: string, serverId: string, pluginId: number) {
  return apiFetch<{ ok: boolean }>(`/api/users/me/servers/${serverId}/plugins/${pluginId}`, {
    method: 'DELETE',
    token
  });
}
