import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PricingPage } from './pages/PricingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordRecoveryPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { LegalPage } from './pages/LegalPage';
import { LecturerDashboardPage } from './pages/LecturerDashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AcceptInvite from './pages/AcceptInvite';
import { NotFoundPage } from './pages/NotFoundPage';

// Wrapper components to extract URL :tab param
function ResourcesPageWrapper({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tab } = useParams<{ tab?: string }>();
  return <ResourcesPage onNavigate={onNavigate} initialTab={tab || 'docs'} key={tab} />;
}

function LegalPageWrapper({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tab } = useParams<{ tab?: string }>();
  return <LegalPage onNavigate={onNavigate} initialTab={tab || 'terms'} key={tab} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle HashRouter redirect for clean URL callback paths (like /login or /invite)
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    if (path !== '/' && path !== '/index.html') {
      let hashRoute = '/#/' + path.substring(1);
      
      if (search) {
        hashRoute += search;
      }
      if (hash && hash.startsWith('#')) {
        if (hash.includes('id_token=') || hash.includes('access_token=')) {
          const separator = hashRoute.includes('?') ? '&' : '?';
          hashRoute += separator + hash.substring(1);
        } else {
          hashRoute += hash;
        }
      }
      
      window.location.replace(window.location.origin + hashRoute);
      return;
    }

    // Catch case where code or token are appended directly to the root path
    if (search.includes('code=') || hash.includes('id_token=')) {
      let hashRoute = '/#/login';
      if (search) hashRoute += search;
      if (hash) {
        const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
        const separator = hashRoute.includes('?') ? '&' : '?';
        hashRoute += separator + cleanHash;
      }
      window.location.replace(window.location.origin + hashRoute);
    }
  }, []);

  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      login: '/login',
      'forgot-password': '/forgot-password',
      'reset-password': '/reset-password',
      dashboard: '/dashboard',
      lecturer: '/lecturer',
      features: '/features',
      pricing: '/pricing',
      landing: '/',
      changelog: '/changelog',
      resources: '/resources',
      docs: '/resources/docs',
      guide: '/resources/guide',
      blog: '/resources/blog',
      community: '/resources/community',
      legal: '/legal',
      terms: '/legal/terms',
      privacy: '/legal/privacy',
      admin: '/admin',
    };
    navigate(routeMap[page] || '/' + page);
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />
      <Route path="/pricing" element={<PricingPage onNavigate={handleNavigate} />} />
      <Route path="/features" element={<FeaturesPage onNavigate={handleNavigate} />} />
      <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />
      <Route path="/reset-password" element={<ResetPasswordPage onNavigate={handleNavigate} />} />
      <Route path="/changelog" element={<ChangelogPage onNavigate={handleNavigate} />} />
      <Route path="/resources/:tab?" element={<ResourcesPageWrapper onNavigate={handleNavigate} />} />
      <Route path="/legal/:tab?" element={<LegalPageWrapper onNavigate={handleNavigate} />} />
      <Route path="/invite/accept" element={<AcceptInvite />} />

      {/* Protected routes — require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={['lecturer']}>
            <LecturerDashboardPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage onNavigate={handleNavigate} />} />
    </Routes>
  );
}
