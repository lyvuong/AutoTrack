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
    <header className="sticky top-0 z-40 bg-slate-900/92 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14 gap-2">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/favicon.svg" 
              alt="AutoTrack Icon" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-lg shadow-cyan-500/20 ring-1 ring-white/15 object-cover shrink-0" 
            />
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white font-display">
                Auto<span className="text-cyan-400">Track</span>
              </span>
              <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md tracking-wider">
                PWA
              </span>
            </div>
          </div>

          {/* Right: Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">

            {/* Network status — visible sm+ */}
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
              isOnline 
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70' 
                : 'bg-amber-950/70 text-amber-300 border-amber-800/70 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Offline dot — xs only */}
            {!isOnline && (
              <span className="sm:hidden w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Offline" />
            )}

            {/* Firebase status badge — sm+ */}
            <button
              onClick={onOpenSettings}
              title={isFirebaseActive ? `Synced (${user?.email || 'Firebase'})` : 'Local Storage'}
              className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                isFirebaseActive
                  ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800/70 hover:border-cyan-500'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isFirebaseActive ? <Cloud className="w-3 h-3 text-cyan-400" /> : <Database className="w-3 h-3 text-slate-400" />}
              <span>{isFirebaseActive ? 'Sync' : 'Local'}</span>
            </button>

            {/* Log Service */}
            <button
              onClick={onOpenAddService}
              disabled={vehicles.length === 0 || vehicles.every(v => v.isArchived)}
              className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-2 py-1.5 sm:px-3 rounded-xl shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title={vehicles.every(v => v.isArchived) ? 'All vehicles are archived' : 'Log Service'}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Log Service</span>
            </button>

            {/* Log Fuel */}
            {onOpenAddRefuel && (
              <button
                onClick={onOpenAddRefuel}
                disabled={vehicles.length === 0 || vehicles.every(v => v.isArchived)}
                className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-2 py-1.5 sm:px-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={vehicles.every(v => v.isArchived) ? 'All vehicles are archived' : 'Log Fuel'}
              >
                <Fuel className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Log Fuel</span>
              </button>
            )}

            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-all active:scale-95"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-500" />
                )}
              </button>
            )}

            {/* About — hidden on xs */}
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="hidden sm:flex p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-all items-center"
                title="About AutoTrack"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-all active:scale-95"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
