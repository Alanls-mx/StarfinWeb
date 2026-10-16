
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { defaultHomeContent, getPublicSettings, type PublicSettings } from "./app/lib/api.ts";
  import "./styles/index.css";
  import { BrowserRouter } from "react-router";
  import { AuthProvider } from "./app/lib/auth.tsx";

  async function mount() {
    let bootstrap: Partial<PublicSettings> | null = null;
    try {
      const raw = document.getElementById('starfin-bootstrap')?.textContent;
      if (raw && raw !== '__STARFIN_PUBLIC_CONFIG__') bootstrap = JSON.parse(raw) as Partial<PublicSettings>;
    } catch { bootstrap = null; }
    const settings = bootstrap || await Promise.race([
      getPublicSettings().catch(() => null),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 1500))
    ]);
    const homeContent = { ...defaultHomeContent, ...settings?.homeContent };
    const branding = { siteName: settings?.siteName || 'StarfinPlugins', logoUrl: settings?.logoUrl || null, footerText: settings?.footerText || '' };
    createRoot(document.getElementById("root")!).render(
      <BrowserRouter>
        <AuthProvider>
          <App homeContent={homeContent} branding={branding} />
        </AuthProvider>
      </BrowserRouter>,
    );
  }
  void mount();
  
