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
  tags: PluginTag[];
  mcVersion: string;
  rating: number;
  downloads: number;
  downloadsDisplay: string;
  imageUrl: string;
  priceDisplay: string;
  priceCents: number;
  currency: 'BRL';
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
  verified?: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  pluginId: number;
  status: 'pending' | 'approved' | 'cancelled';
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
  if (!headers.has('Content-Type') && init?.body) {
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
    const message =
      typeof (json as any)?.error === 'string' ? (json as any).error : `Erro ${res.status}`;
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

export function postReview(data: { pluginId: string; rating: number; comment: string }) {
  return apiFetch<{ review: Review }>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function adminUpdateReview(id: string, data: Partial<Review>) {
  return apiFetch<{ review: Review }>(`/api/admin/reviews?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function adminDeleteReview(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/reviews?id=${id}`, {
    method: 'DELETE'
  });
}

export interface AdminStats {
  topPlugins: Array<{ id: string; name: string; slug: string; sales: number }>;
  topCustomers: Array<{ id: string; name: string; email: string; pluginCount: number }>;
  stats: { totalSales: number; totalRevenueCents: number };
}

export function getAdminStats() {
  return apiFetch<AdminStats>('/api/admin/stats');
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

export function checkout(pluginIds: string[], couponCode?: string) {
  return apiFetch<{ orderId: string; finalTotal: number; licenses: any[] }>(
    '/api/commerce/checkout',
    {
      method: 'POST',
      body: JSON.stringify({ pluginIds, couponCode })
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

export function subscribeNewsletter(email: string) {
  return apiFetch<{ ok: true }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
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
    tags: PluginTag[];
    mcVersion: string;
    imageUrl: string;
    priceDisplay: string;
    rating?: number;
    downloadsDisplay?: string;
  }
) {
  return apiFetch<PluginDetail>('/api/admin/plugins', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export function adminUpdatePlugin(token: string, id: number, input: Partial<PluginDetail>) {
  return apiFetch<PluginDetail>(`/api/admin/plugins/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}

export function adminDeletePlugin(token: string, id: number) {
  return apiFetch<{ ok: true }>(`/api/admin/plugins/${id}`, { method: 'DELETE', token });
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

export function adminListTickets(token: string) {
  return apiFetch<{ items: Array<{ id: string; email: string; subject: string; message: string; status: string; createdISO: string; updatedISO: string }> }>(
    '/api/admin/support/tickets',
    { token }
  );
}

export function adminUpdateTicket(token: string, id: string, status: string) {
  return apiFetch<{ ok: true }>(`/api/admin/support/tickets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ status })
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

export function adminListPurchases(token: string) {
  return apiFetch<{ items: Purchase[] }>('/api/admin/purchases', { token });
}

export function adminUpdatePurchase(token: string, id: string, status: Purchase['status']) {
  return apiFetch<{ ok: true; purchase: Purchase }>(`/api/admin/purchases/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ status })
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

export function adminSaveDocsSection(token: string, id: string, input: { title: string; body: string }) {
  return apiFetch<{ ok: true }>(`/api/admin/docs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input)
  });
}
