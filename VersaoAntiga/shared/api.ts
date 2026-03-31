/**
 * Shared code between client and server
 * Useful to share types between client and server
 */

// Auth Routes
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
  token?: string;
}

// Product/Plugin Routes
export type LicensePolicy =
  | { type: "infinite" }
  | { type: "duration"; months: number }
  | { type: "date"; expiresAt: string };

export interface Plugin {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  version: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  longDescriptionHtml?: string;
  releases?: PluginRelease[];
  licensePolicy?: LicensePolicy;
  dependencies?: string[];
}

export interface GetPluginsResponse {
  success: boolean;
  plugins: Plugin[];
  total: number;
}

export interface GetPluginResponse {
  success: boolean;
  plugin?: Plugin;
  message?: string;
}

export interface CreatePluginRequest {
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  price: number;
  version: string;
  imageUrl?: string;
  imageBase64?: string;
  imageFileName?: string;
  longDescriptionHtml?: string;
  licensePolicy?: LicensePolicy;
  dependencies?: string[];
}

export interface PluginRelease {
  version: string;
  jarPath: string;
  releaseNotes?: string;
  uploadedAt: string;
}

export interface UploadReleaseRequest {
  version: string;
  releaseNotes?: string;
  fileName: string;
  jarBase64: string;
}

// Order Routes
export interface Order {
  id: string;
  userId: string;
  pluginId: string;
  price: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  ownershipPolicy?: LicensePolicy;
}

export interface GetOrdersResponse {
  success: boolean;
  orders: Order[];
}

export interface CreateOrderRequest {
  pluginId: string;
  quantity: number;
}

export interface License {
  id: string;
  orderId: string;
  userId: string;
  pluginId: string;
  key: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  expiresAt?: string;
  ipAddress?: string;
  ipBoundAt?: string;
}

export interface GetLicensesResponse {
  success: boolean;
  licenses: License[];
}

export interface ValidateLicenseRequest {
  key?: string;
  licenseId?: string;
  pluginId?: string;
  userId?: string;
  ipAddress?: string;
}

export interface ValidateLicenseResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  license?: License;
}

// User Routes
export interface User {
  id: string;
  email: string;
  username: string;
  role: "customer" | "developer" | "admin";
  cpf?: string;
  createdAt: string;
}

export interface GetUserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// Demo response (legacy)
export interface DemoResponse {
  message: string;
}
