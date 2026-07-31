import React from 'react';
import { LayoutDashboard, Car, History, Bell, BarChart3, Settings } from 'lucide-react';
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Garage', icon: Car },
    { id: 'history', label: 'Service History', icon: History },
    { 
      id: 'reminders', 
      label: 'Reminders', 
      icon: Bell, 
      badge: badgeCount > 0 ? badgeCount : undefined 
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500 text-slate-950">
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
