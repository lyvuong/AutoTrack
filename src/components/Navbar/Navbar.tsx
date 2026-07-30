import React from 'react';
import { PlusCircle, Wifi, WifiOff, Cloud, Database, Settings } from 'lucide-react';
import type { Vehicle, UserProfile } from '../../types';

interface NavbarProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onOpenAddService: () => void;
  onOpenAddVehicle: () => void;
  onOpenSettings: () => void;
  user: UserProfile | null;
  isOnline: boolean;
  isFirebaseActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onOpenAddService,
  onOpenAddVehicle,
  onOpenSettings,
  user,
  isOnline,
  isFirebaseActive,
}) => {

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.svg" 
              alt="AutoTrack Icon" 
              className="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 object-cover" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-display">
                  AutoTrack
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Vehicle Maintenance & Repair Records
              </p>
            </div>
          </div>

          {/* Vehicle Switcher Selector */}
          <div className="flex-1 max-w-xs mx-2">
            {vehicles.length > 0 ? (
              <div className="relative">
                <select
                  value={activeVehicleId}
                  onChange={(e) => onSelectVehicle(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 text-slate-100 text-xs sm:text-sm rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold cursor-pointer transition-all shadow-inner truncate"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100">
                      🚗 {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAddVehicle}
                className="w-full text-xs bg-slate-800 border border-dashed border-slate-700 hover:border-cyan-500 text-cyan-400 py-1.5 px-3 rounded-lg font-medium"
              >
                + Add Vehicle
              </button>
            )}
          </div>

          {/* Status Indicators & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Network / Offline Pill */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>

            {/* Firebase Status Badge */}
            <button
              onClick={onOpenSettings}
              title={isFirebaseActive ? `Synced with Firebase Cloud (${user?.email || 'Cloud Firestore'})` : 'Local / Demo Storage (Click to setup Firebase)'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isFirebaseActive
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 hover:border-cyan-500'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isFirebaseActive ? <Cloud className="w-3.5 h-3.5 text-cyan-400" /> : <Database className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isFirebaseActive ? 'Firebase Sync' : 'Demo Storage'}</span>
            </button>

            {/* Quick Log Service Button */}
            <button
              onClick={onOpenAddService}
              disabled={vehicles.length === 0}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Log Service</span>
            </button>

            {/* Settings & Config Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all"
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
