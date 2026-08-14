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
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Garage', shortLabel: 'Garage', icon: Car },
    { id: 'refuels', label: 'Refuels', shortLabel: 'Fuel', icon: Fuel },
    { id: 'history', label: 'Service History', shortLabel: 'History', icon: History },
    { 
      id: 'reminders', 
      label: 'Reminders', 
      shortLabel: 'Alerts',
      icon: Bell, 
      badge: badgeCount > 0 ? badgeCount : undefined 
    },
    { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl pb-[env(safe-area-inset-bottom)] lg:static lg:bg-slate-900/80 lg:border-t-0 lg:border-b lg:shadow-none lg:pb-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1.5 sm:py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as ActiveTab)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shrink-0 sm:shrink lg:shrink-0 relative ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-inner font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="sm:ml-1 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-extrabold rounded-full bg-cyan-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
