import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3X3,
  Wallet,
  ListOrdered,
  Settings,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/strategies', label: '策略管理', icon: Grid3X3 },
  { path: '/positions', label: '持仓管理', icon: Wallet },
  { path: '/orders', label: '挂单管理', icon: ListOrdered },
  { path: '/settings', label: 'API配置', icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-yellow flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-bg-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">CryptoGrid</h1>
              <p className="text-xs text-text-tertiary">网格交易系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span>系统运行中</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
