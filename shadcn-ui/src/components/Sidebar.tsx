import { NavLink } from 'react-router-dom';
import { Home, Layers, List, PieChart, Wallet, Settings, BarChart2, Users } from 'lucide-react';

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/my-projects', label: 'My Projects', icon: Layers },
  { to: '/marketplace', label: 'Marketplace', icon: List },
  { to: '/wallet', label: 'Digital Wallet', icon: Wallet },
  { to: '/organization', label: 'Organization', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/subscription', label: 'Subscription', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
  <aside className="app-sidebar w-64 min-h-screen bg-sidebar/95 border-r sidebar-border p-4 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00796b] to-[#004d40] flex items-center justify-center text-white font-bold">EC</div>
        <div>
          <div className="text-lg font-semibold text-sidebar-foreground">Eco Chain</div>
          <div className="text-sm text-sidebar-accent-foreground">NGO Dashboard</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon as any;
          return (
            <NavLink
              key={it.to + it.label}
              to={it.to}
              end
              className={({ isActive }) =>
                `relative group sidebar-item-hover flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 transform ${
                  isActive
                    ? 'sidebar-active bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground hover:translate-x-1'
                }`}
            >
              {/* indicator (styled via CSS .sidebar-indicator::before) */}
              <span className="sidebar-indicator" aria-hidden="true" />
              <span className="w-8 h-8 flex items-center justify-center text-sidebar-foreground">
                <Icon className="icon w-6 h-6" />
              </span>
              <span className="text-lg ml-2 label transition-colors duration-200">{it.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="text-sm text-sidebar-accent-foreground mb-2">Account</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">G</div>
          <div>
            <div className="text-base font-semibold text-sidebar-foreground">testNGO</div>
            <div className="text-sm text-sidebar-accent-foreground">Verified</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
