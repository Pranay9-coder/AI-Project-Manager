import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Layout
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ui/ProtectedRoute';

// Manager pages
import { ManagerOverview } from './pages/manager/Overview';
import { TeamsPage } from './pages/manager/Teams';
import { ProjectsPage } from './pages/manager/Projects';
import { DevelopersPage } from './pages/manager/Developers';
import { ManagerTasksPage } from './pages/manager/Tasks';

// Developer pages
import { DeveloperDashboard } from './pages/developer/Dashboard';
import { MyTasksPage } from './pages/developer/MyTasks';
import { MyProjectsPage } from './pages/developer/MyProjects';
import { ProfilePage } from './pages/developer/Profile';

// Shared pages
import { InvitationsPage } from './pages/Invitations';

function AppRoutes() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-surface-400 text-sm tracking-wide">Loading ProjectAI...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          profile ? (
            <Navigate to={profile.role_type === 'manager' ? '/manager' : '/developer'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Manager routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <ManagerOverview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/teams"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <TeamsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <ProjectsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/developers"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <DevelopersPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/invitations"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <InvitationsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tasks"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <ManagerTasksPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Developer routes */}
      <Route
        path="/developer"
        element={
          <ProtectedRoute requiredRole="developer">
            <DashboardLayout>
              <DeveloperDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/tasks"
        element={
          <ProtectedRoute requiredRole="developer">
            <DashboardLayout>
              <MyTasksPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/projects"
        element={
          <ProtectedRoute requiredRole="developer">
            <DashboardLayout>
              <MyProjectsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/invitations"
        element={
          <ProtectedRoute requiredRole="developer">
            <DashboardLayout>
              <InvitationsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/profile"
        element={
          <ProtectedRoute requiredRole="developer">
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
