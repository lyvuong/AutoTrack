import React from 'react';
import { LayoutDashboard, Car, Fuel, History, Bell, BarChart3 } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  pendingRemindersCount?: number;
  unreadRemindersCount?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  pendingRemindersCount,
  unreadRemindersCount
}) => {
  const handleTabSelect = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const badgeCount = unreadRemindersCount ?? pendingRemindersCount ?? 0;
  const tabs = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'vehicles',  label: 'Garage', icon: Car },
    { id: 'refuels',   label: 'Fuel',   icon: Fuel },
    { id: 'history',   label: 'Service', icon: History },
    { id: 'reminders', label: 'Alerts',  icon: Bell, badge: badgeCount > 0 ? badgeCount : undefined },
    { id: 'analytics', label: 'Stats',   icon: BarChart3 },
  ];

  return (
    /* Mobile: fixed bottom nav. lg+: static horizontal top nav under header */
    <nav className="bottom-nav-bar lg:static lg:bottom-auto lg:bg-slate-900/85 lg:backdrop-blur-md lg:border-t-0 lg:border-b lg:border-slate-800 lg:shadow-none lg:pb-0">
      <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8">
        <div className="flex items-stretch justify-between gap-0.5 sm:gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as ActiveTab)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0
                  py-2 px-1 sm:py-2.5 sm:px-2 lg:flex-row lg:gap-1.5 lg:py-2.5 lg:px-3
                  rounded-xl mx-0.5 my-1.5 transition-all duration-200 active:scale-95
                  text-[10px] sm:text-[11px] lg:text-xs font-semibold
                  ${isActive
                    ? 'bg-cyan-500/15 text-cyan-300 shadow-inner'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                {/* Active pill indicator dot */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-cyan-400 rounded-full lg:hidden" />
                )}

                <span className="relative">
                  <Icon className={`w-[18px] h-[18px] sm:w-5 sm:h-5 lg:w-4 lg:h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 text-[8px] font-extrabold rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center leading-none badge-urgent">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>

                <span className={`leading-none tracking-tight truncate ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
