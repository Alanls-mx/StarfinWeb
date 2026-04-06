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
import { TicketDetailPage } from './pages/TicketDetailPage';
import { PremiumPage } from './pages/PremiumPage';
import { StatusPage } from './pages/StatusPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { CareersPage } from './pages/CareersPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLayout } from './pages/admin/AdminLayout';
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
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminNewsletterPage } from './pages/admin/AdminNewsletterPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';

import { getPublicSettings } from './lib/api';
import { CartProvider } from './lib/cart';
import { Toaster } from 'sonner';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    getPublicSettings()
      .then((s) => {
        if (s.logoUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = s.logoUrl;
        }
        if (s.siteName) {
          document.title = s.siteName;
        }
      })
      .catch(() => null);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0B0B0F] text-white">
        {!isAdminRoute && <Navbar />}
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
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/support/ticket/:id" element={<TicketDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/cart" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<Dashboard />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="plugins" element={<AdminPluginsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="docs" element={<AdminDocsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="support" element={<AdminSupportPage />} />
                <Route path="purchases" element={<AdminPurchasesPage />} />
                <Route path="smtp" element={<AdminSmtpPage />} />
                <Route path="integrations" element={<AdminIntegrationsPage />} />
                <Route path="status" element={<AdminStatusPage />} />
                <Route path="changelog" element={<AdminChangelogPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="newsletter" element={<AdminNewsletterPage />} />
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="content" element={<AdminContentPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<HomePage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        {!isAdminRoute && <Footer />}
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </div>
    </CartProvider>
  );
}
