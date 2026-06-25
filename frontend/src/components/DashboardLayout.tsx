import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Sun, Moon, LogOut, Menu, User, ChevronLeft,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const navItems: NavItem[] = [
    { label: 'Sorteos', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Usuarios', path: '/dashboard/users', icon: <Users size={18} />, permission: 'user.manage' },
    { label: 'Roles', path: '/dashboard/roles', icon: <Shield size={18} />, permission: 'user.manage' },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors">
      {sidebarOpen && (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed md:relative z-40 min-h-screen">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Sorteo Admin</h2>
            <button onClick={() => setSidebarOpen(false)} title="Cerrar menú"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <ChevronLeft size={18} />
            </button>
          </div>
          <nav className="p-4 flex-1">
            {visibleItems.map((item) => {
              const active = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} title={item.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded mb-1 text-sm ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t dark:border-gray-700">
            <button onClick={() => setDark(!dark)} title={dark ? 'Modo claro' : 'Modo oscuro'}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 w-full">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} title="Abrir menú"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Menu size={20} />
                </button>
              )}
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User size={16} className="text-gray-400" />
                {user?.name} <span className="text-xs text-gray-400 dark:text-gray-500">({user?.role})</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDark(!dark)} title={dark ? 'Modo claro' : 'Modo oscuro'}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} title="Cerrar sesión"
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}