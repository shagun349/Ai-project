import { 
  LayoutDashboard, Search, Gamepad2, BarChart3, Settings, 
  ChevronLeft, ChevronRight, Brain 
} from 'lucide-react';
import type { PageId } from '../types';

const navItems: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'search-lab', label: 'Search Lab', icon: Search, badge: '5' },
  { id: 'game-theory-lab', label: 'Game Theory', icon: Gamepad2, badge: 'Phase 4' },
  { id: 'comparison', label: 'Comparison', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col h-full bg-dark-900 border-r border-dark-700/80
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700/80 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center shrink-0 shadow-md shadow-accent-600/30">
          <Brain size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-base font-bold text-white tracking-tight whitespace-nowrap">Cognitia</h1>
            <p className="text-[11px] text-dark-300 whitespace-nowrap">AI Search & Game Theory</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 cursor-pointer
                ${isActive 
                  ? 'bg-accent-600/15 text-accent-300 border border-accent-500/25 shadow-sm' 
                  : 'text-dark-300 hover:bg-dark-800/80 hover:text-dark-100 border border-transparent'
                }
              `}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-accent-400' : 'text-dark-400'}`} />
              {!collapsed && (
                <span className="whitespace-nowrap animate-fade-in text-sm">{label}</span>
              )}
              {badge && !collapsed && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive 
                    ? 'bg-accent-600/30 text-accent-200' 
                    : 'bg-dark-800 text-dark-400'
                }`}>
                  {badge}
                </span>
              )}
              {isActive && collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-dark-700/80 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                     text-dark-400 hover:text-dark-200 hover:bg-dark-800/80
                     transition-colors duration-150 text-xs font-medium cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
