import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';
import { Store } from './components/Store';
import { PluginDetail } from './components/PluginDetail';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { CategoriesPage } from './pages/CategoriesPage';
import { DocsPage } from './pages/DocsPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupportPage } from './pages/SupportPage';
import { StatusPage } from './pages/StatusPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPluginsPage } from './pages/admin/AdminPluginsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminSmtpPage } from './pages/admin/AdminSmtpPage';
import { AdminIntegrationsPage } from './pages/admin/AdminIntegrationsPage';
import { AdminPurchasesPage } from './pages/admin/AdminPurchasesPage';
import { AdminStatusPage } from './pages/admin/AdminStatusPage';
import { AdminChangelogPage } from './pages/admin/AdminChangelogPage';
import { AdminDocsPage } from './pages/admin/AdminDocsPage';

import { CartProvider } from './lib/cart';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0B0B0F] text-white">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/plugins" element={<Store />} />
              <Route path="/plugins/:id" element={<PluginDetail />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/cart" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<Dashboard />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/plugins" element={<AdminPluginsPage />} />
              <Route path="/admin/docs" element={<AdminDocsPage />} />
              <Route path="/admin/support" element={<AdminSupportPage />} />
              <Route path="/admin/purchases" element={<AdminPurchasesPage />} />
              <Route path="/admin/smtp" element={<AdminSmtpPage />} />
              <Route path="/admin/integrations" element={<AdminIntegrationsPage />} />
              <Route path="/admin/status" element={<AdminStatusPage />} />
              <Route path="/admin/changelog" element={<AdminChangelogPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        <Footer />
      </div>
    </CartProvider>
  );
}
