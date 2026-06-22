import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Sorteos', path: '/dashboard' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Sorteo Admin</h2>
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded mb-1 text-sm ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {user?.name} <span className="text-xs text-gray-400">({user?.role})</span>
            </span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
