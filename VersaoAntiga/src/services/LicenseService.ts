export type License = {
  id: number;
  key: string;
  clientName: string;
  plan: string;
  expiresAt: string;
  isActive: boolean;
  allowedPlugins: string[];
};

const API_URL: string = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_LICENSE_API_URL) || "/php/api/manager.php";

export async function getAllLicenses(baseUrl?: string): Promise<License[]> {
  const res = await fetch(baseUrl || API_URL, { method: "GET" });
  const data = await res.json();
  return (data.licenses ?? []) as License[];
}

export type CreateLicenseInput = Omit<License, "id">;

export async function createLicense(license: CreateLicenseInput, baseUrl?: string): Promise<{ success: boolean; license?: { key: string }; message?: string }> {
  const res = await fetch(baseUrl || API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(license),
  });
  return res.json();
}

export async function deleteLicense(key: string, baseUrl?: string): Promise<{ success: boolean; message?: string }> {
  const url = (baseUrl || API_URL) + ((baseUrl || API_URL).includes("?") ? "&" : "?") + "key=" + encodeURIComponent(key);
  const res = await fetch(url, { method: "DELETE" });
  return res.json();
}
