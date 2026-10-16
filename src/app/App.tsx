import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';
import { Store } from './components/Store';
import { PluginDetail } from './components/PluginDetail';
import { Footer } from './components/Footer';
import { CategoriesPage } from './pages/CategoriesPage';
import { DocsPage } from './pages/DocsPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupportPage } from './pages/SupportPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { PremiumPage } from './pages/PremiumPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { StatusPage } from './pages/StatusPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountOrdersPage } from './pages/AccountOrdersPage';
import { AccountProfilePage } from './pages/AccountProfilePage';
import { AccountOverviewPage } from './pages/AccountOverviewPage';
import { AccountPluginsPage } from './pages/AccountPluginsPage';
import { AccountServersPage } from './pages/AccountServersPage';
import { AccountNotificationsPage } from './pages/AccountNotificationsPage';
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
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminStatusPage } from './pages/admin/AdminStatusPage';
import { AdminChangelogPage } from './pages/admin/AdminChangelogPage';
import { AdminDocsPage } from './pages/admin/AdminDocsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminInstallationsPage } from './pages/admin/AdminInstallationsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminNewsletterPage } from './pages/admin/AdminNewsletterPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminRafflesPage } from './pages/admin/AdminRafflesPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

import { CartProvider } from './lib/cart';
import { Toaster } from 'sonner';
import type { CareerJob, FaqItem, HomeContent, InstitutionalContent, TeamMemberProfile } from './lib/api';

export default function App({ homeContent, institutionalContent, faqItems, aboutTeam, careersJobs, branding }: { homeContent: HomeContent; institutionalContent: InstitutionalContent; faqItems: FaqItem[]; aboutTeam: TeamMemberProfile[]; careersJobs: CareerJob[]; branding: { siteName: string; logoUrl: string | null; footerText: string } }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground">
        {!isAdminRoute && <Navbar branding={branding} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage content={homeContent} />} />
              <Route path="/plugins" element={<Store />} />
              <Route path="/plugins/:id" element={<PluginDetail />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/premium/:planId" element={<PlanDetailPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/support/ticket/:id" element={<TicketDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
              <Route path="/reset-password" element={<PasswordRecoveryPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/cart" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<AccountOverviewPage />} />
              <Route path="/account/plugins" element={<AccountPluginsPage />} />
              <Route path="/account/servers" element={<AccountServersPage />} />
              <Route path="/account/licenses" element={<Navigate to="/account/servers" replace />} />
              <Route path="/account/notifications" element={<AccountNotificationsPage />} />
              <Route path="/account/orders" element={<AccountOrdersPage />} />
              <Route path="/account/profile" element={<AccountProfilePage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage content={institutionalContent} teamMembers={aboutTeam} />} />
              <Route path="/faq" element={<FaqPage content={institutionalContent} faqs={faqItems} />} />
              <Route path="/careers" element={<CareersPage initialJobs={careersJobs} />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage content={institutionalContent} />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="plugins" element={<AdminPluginsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="docs" element={<AdminDocsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="support" element={<AdminSupportPage />} />
                <Route path="purchases" element={<AdminPurchasesPage />} />
                <Route path="installations" element={<AdminInstallationsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="smtp" element={<AdminSmtpPage />} />
                <Route path="integrations" element={<AdminIntegrationsPage />} />
                <Route path="status" element={<AdminStatusPage />} />
                <Route path="changelog" element={<AdminChangelogPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="raffles" element={<AdminRafflesPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="newsletter" element={<AdminNewsletterPage />} />
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="content" element={<AdminContentPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
              </Route>

              <Route path="*" element={<HomePage content={homeContent} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        {!isAdminRoute && <Footer branding={branding} />}
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </div>
    </CartProvider>
  );
}
