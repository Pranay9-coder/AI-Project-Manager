import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useWebSocket';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Code2,
  Mail,
  ListTodo,
  LogOut,
  Bell,
  User,
  Zap,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const managerNavItems = [
  { to: '/manager', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/manager/teams', icon: Users, label: 'Teams' },
  { to: '/manager/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/manager/developers', icon: Code2, label: 'Developers' },
  { to: '/manager/invitations', icon: Mail, label: 'Invitations' },
  { to: '/manager/tasks', icon: ListTodo, label: 'Tasks' },
];

const developerNavItems = [
  { to: '/developer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/developer/tasks', icon: ListTodo, label: 'My Tasks' },
  { to: '/developer/projects', icon: FolderKanban, label: 'My Projects' },
  { to: '/developer/invitations', icon: Mail, label: 'Invitations' },
  { to: '/developer/profile', icon: User, label: 'Profile' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const [showNotif, setShowNotif] = React.useState(false);

  const navItems = profile?.role_type === 'manager' ? managerNavItems : developerNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside className="w-[260px] glass fixed top-0 left-0 h-screen flex flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-surface-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-surface-50 tracking-tight">ProjectAI</h1>
              <p className="text-[11px] text-surface-500 capitalize">{profile?.role_type} Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 shadow-sm'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-800/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-700/30 flex items-center justify-center text-primary-400 text-xs font-bold">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">{profile?.name}</p>
              <p className="text-[11px] text-surface-500 truncate">{profile?.specialization || profile?.role_type}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-danger hover:bg-danger/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass px-8 py-4 flex items-center justify-between">
          <div />
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-80 glass rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-surface-800/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-surface-200">Notifications</h3>
                  <button onClick={() => setShowNotif(false)}>
                    <X className="w-4 h-4 text-surface-500" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-surface-500">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-surface-800/30 hover:bg-surface-800/30">
                        <p className="text-sm text-surface-300">{n.message}</p>
                        <p className="text-[11px] text-surface-500 mt-1">Just now</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
