import React from 'react';
import { PlusCircle, Fuel, Wifi, WifiOff, Cloud, Database, Settings, Info, Sun, Moon } from 'lucide-react';
import type { Vehicle, UserProfile } from '../../types';
import type { Theme } from '../../utils/theme';

interface NavbarProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onOpenAddService?: () => void;
  onOpenAddRefuel?: () => void;
  onOpenAddVehicle: () => void;
  onOpenSettings: () => void;
  onOpenAbout?: () => void;
  user: UserProfile | null;
  isOnline: boolean;
  isFirebaseActive: boolean;
  familyCode?: string;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vehicles,
  activeVehicleId: _activeVehicleId,
  onSelectVehicle: _onSelectVehicle,
  onOpenAddService,
  onOpenAddRefuel,
  onOpenAddVehicle: _onOpenAddVehicle,
  onOpenSettings,
  onOpenAbout,
  user,
  isOnline,
  isFirebaseActive,
  theme = 'dark',
  onToggleTheme
}) => {

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-3">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/favicon.svg" 
              alt="AutoTrack Icon" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 object-cover shrink-0" 
            />
            <div className="hidden sm:block">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                Auto<span className="text-cyan-400">Track</span>
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[9px] uppercase font-bold px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md tracking-wider">
                PWA
              </span>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Network Offline / Online Badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Firebase Status Badge */}
            <button
              onClick={onOpenSettings}
              title={isFirebaseActive ? `Synced with Firebase Cloud (${user?.email || 'Cloud Firestore'})` : 'Local / Demo Storage (Click to setup Firebase)'}
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                isFirebaseActive
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 hover:border-cyan-500'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isFirebaseActive ? <Cloud className="w-3.5 h-3.5 text-cyan-400" /> : <Database className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isFirebaseActive ? 'Sync' : 'Demo'}</span>
            </button>

            {/* Quick Log Service Button */}
            <button
              onClick={onOpenAddService}
              disabled={vehicles.length === 0}
              className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs px-2.5 py-1.5 sm:px-3 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Log Service</span>
            </button>

            {/* Quick Log Fuel Button */}
            {onOpenAddRefuel && (
              <button
                onClick={onOpenAddRefuel}
                disabled={vehicles.length === 0}
                className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs px-2.5 py-1.5 sm:px-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Log Fuel</span>
              </button>
            )}

            {/* Dark / Light Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all active:scale-95"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Dark/Light Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-500 hover:-rotate-12 transition-transform" />
                )}
              </button>
            )}

            {/* About Page Button */}
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all"
                title="About AutoTrack & App Info"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            {/* Settings & Config Button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all"
              title="Settings & Firebase Config"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
