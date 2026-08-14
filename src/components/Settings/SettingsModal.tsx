import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cloud, 
  Users, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  LogOut,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  ShieldAlert,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import type { FirebaseConfig, UserProfile } from '../../types';
import { 
  exportDataAsJSON, 
  importJSONBackup, 
  getStoredFirebaseConfig, 
  setStoredFirebaseConfig,
  loadLocalVehicles,
  loadLocalRecords,
  loadLocalReminders,
  loadLocalTransactions,
  loadLocalRefuels
} from '../../services/storage';
import { 
  initializeFirebaseService, 
  loginWithGoogle, 
  logoutFirebase 
} from '../../services/firebase';

import type { Theme } from '../../utils/theme';
import { Sun, Moon, Palette } from 'lucide-react';

interface SettingsModalProps {
  user: UserProfile | null;
  isFirebaseActive: boolean;
  familyCode: string;
  onSetFamilyCode: (code: string) => Promise<{ success: boolean; message: string }>;
  onRefreshData: () => void;
  onClearDemoData?: () => void;
  onRestoreSampleData: () => void;
  paymentTypesCount?: number;
  onManagePaymentTypes?: () => void;
  theme?: Theme;
  onSelectTheme?: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isFirebaseActive,
  familyCode,
  onSetFamilyCode,
  onRefreshData,
  onClearDemoData,
  onRestoreSampleData,
  paymentTypesCount = 0,
  onManagePaymentTypes,
  theme = 'dark',
  onSelectTheme
}) => {
  const [inputFamilyCode, setInputFamilyCode] = useState(familyCode || '');
  const [familyStatusMsg, setFamilyStatusMsg] = useState('');
  const [isFamilySubmitting, setIsFamilySubmitting] = useState(false);

  // Advanced Firebase Controls State
  const [isAdvancedUnlocked, setIsAdvancedUnlocked] = useState(false);
  const [customConfig, setCustomConfig] = useState<FirebaseConfig>(() => {
    const existing = getStoredFirebaseConfig();
    return existing || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
  });
  const [firebaseSavedMsg, setFirebaseSavedMsg] = useState('');

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFamilySubmitting(true);
    setFamilyStatusMsg('');

    try {
      const res = await onSetFamilyCode(inputFamilyCode);
      setFamilyStatusMsg(res.message);
      if (!res.success) {
        setInputFamilyCode('');
      }
    } catch (err: any) {
      setFamilyStatusMsg(err.message || 'Error updating household code.');
      setInputFamilyCode('');
    } finally {
      setIsFamilySubmitting(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredFirebaseConfig(customConfig);
    const success = initializeFirebaseService(customConfig);
    if (success) {
      setFirebaseSavedMsg('✅ Custom Firebase Config Saved & Initialized!');
      onRefreshData();
    } else {
      setFirebaseSavedMsg('⚠️ Config saved to LocalStorage, but initialization failed. Check your keys.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importJSONBackup(content);
        onRefreshData();
        alert('🎉 Backup data imported successfully!');
      } catch (err: any) {
        alert(`❌ Import Failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    exportDataAsJSON(loadLocalVehicles(), loadLocalRecords(), loadLocalReminders(), loadLocalTransactions(), loadLocalRefuels());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">App Settings & Account Profile</h1>
        </div>
        <p className="text-xs text-slate-400">
          Manage your login session, appearance theme, household garage code, data backups, and custom cloud setup.
        </p>
      </div>

      {/* Appearance & Theme Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Appearance & Theme</h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
            Current: {theme} Mode
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Select your visual interface preference. Your choice is automatically remembered on this device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectTheme && onSelectTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Dark Theme</span>
                <span className="text-xs text-slate-400">Sleek, deep slate & glassmorphic contrast</span>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTheme && onSelectTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-900 border-amber-400 shadow-md shadow-amber-400/10 ring-1 ring-amber-400'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Light Theme</span>
                <span className="text-xs text-slate-400">Clean, daytime crisp high-readability palette</span>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* 1. Google Authentication Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Google User Account</h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            user 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}>
            {user ? (isFirebaseActive ? 'Authenticated (Firebase Sync Active)' : 'Authenticated') : 'Offline / Signed Out'}
          </span>
        </div>

        {user ? (
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-12 h-12 rounded-full border border-cyan-500/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-lg border border-cyan-500/30">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-sm">{user.displayName}</h3>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => logoutFirebase()}
              className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-bold px-4 py-2 rounded-xl border border-red-800/80 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Sign in with your Google account to enable cloud backups, cross-device real-time sync, and multi-user household garages.
            </p>
            <button
              onClick={() => loginWithGoogle()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Cloud className="w-4 h-4" />
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      {/* 2. Shared Household Garage Sync Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Shared Family Garage Sync</h2>
          </div>
          {familyCode && (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              Active: {familyCode}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Sync vehicles and maintenance logs with your spouse or family members! Anyone entering the same <strong>Household Code</strong> will automatically view and edit the same shared garage in real time on their own Google account.
        </p>

        <form onSubmit={handleJoinHousehold} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Household Sync Code (e.g. VUONG-FAMILY, GARAGE-1234)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.G. VUONG-FAMILY"
                value={inputFamilyCode}
                onChange={(e) => setInputFamilyCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={isFamilySubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isFamilySubmitting ? 'Verifying...' : 'Save & Join Household'}
              </button>
            </div>
          </div>

          {familyStatusMsg && (
            <p className={`text-xs font-semibold p-3 rounded-xl border ${
              familyStatusMsg.includes('✅') || familyStatusMsg.includes('🎉')
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-red-950/80 text-red-300 border-red-800'
            }`}>
              {familyStatusMsg}
            </p>
          )}
        </form>
      </div>

      {/* Payment Methods Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Payment Methods</h2>
          </div>
          {onManagePaymentTypes && (
            <button
              onClick={onManagePaymentTypes}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-3 py-1.5 rounded-xl transition-all"
            >
              Manage Payment Types <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Manage your personal and household payment methods (credit cards, debit cards, cash, etc.) to tag service records.
        </p>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Active Payment Methods</span>
              <span className="text-xs text-slate-400">{paymentTypesCount} method{paymentTypesCount === 1 ? '' : 's'} configured</span>
            </div>
          </div>
          {onManagePaymentTypes && (
            <button
              onClick={onManagePaymentTypes}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* 3. Data Portability & Local Backups */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Data Portability & Offline Backups</h2>
        </div>

        <p className="text-xs text-slate-400">
          Export your complete vehicle garage, service logs, and maintenance reminders as a JSON backup file or restore previously exported data.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Full JSON Backup
          </button>

          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            Import JSON Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 4. Protected Collapsible Advanced Firebase & Demo Data Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80">
        
        {/* Collapsible Header Toggle */}
        <button
          onClick={() => setIsAdvancedUnlocked(!isAdvancedUnlocked)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-900/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              {isAdvancedUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Advanced Firebase & Demo Data Controls
              </h2>
              <p className="text-xs text-slate-400">
                Custom API keys, database credentials, and demo data reset.
              </p>
            </div>
          </div>

          <span className="text-xs text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl">
            {isAdvancedUnlocked ? 'Hide Advanced Controls' : '[ 🔓 Unlock to View & Edit ]'}
            {isAdvancedUnlocked ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {/* Collapsible Panel Content */}
        {isAdvancedUnlocked && (
          <div className="p-6 pt-0 space-y-6 border-t border-slate-800/80 bg-slate-950/60">
            
            {/* Warning Banner */}
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                These controls are for advanced setup. Modifying API keys or clearing demo data affects your active browser session.
              </span>
            </div>

            {/* Custom Firebase Form */}
            <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Custom Firebase Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">API Key</label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={customConfig.apiKey || ''}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Project ID</label>
                  <input
                    type="text"
                    placeholder="my-autotrack-app"
                    value={customConfig.projectId || ''}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Auth Domain (Optional)</label>
                  <input
                    type="text"
                    placeholder="my-app.firebaseapp.com"
                    value={customConfig.authDomain || ''}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">App ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="1:123456:web:abcd"
                    value={customConfig.appId || ''}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, appId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Save Custom Firebase Keys
                </button>

                {firebaseSavedMsg && (
                  <span className="text-xs text-cyan-300 font-semibold">{firebaseSavedMsg}</span>
                )}
              </div>
            </form>

            {/* Demo Data Management Controls */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Demo Dataset Management
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                {onClearDemoData && (
                  <button
                    onClick={() => {
                      if (confirm('Clear sample demo vehicles and records from local storage?')) {
                        onClearDemoData();
                      }
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-950 text-red-400 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 hover:border-red-800 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Purge Demo Vehicles & Records
                  </button>
                )}

                <button
                  onClick={() => {
                    onRestoreSampleData();
                    alert('Sample dataset restored!');
                  }}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Restore Sample Vehicles & Logs
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
