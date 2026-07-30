import React, { useState } from 'react';
import { 
  Settings, 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  LogOut, 
  User,
  Users,
  Share2,
  Check,
  Key,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import type { FirebaseConfig, UserProfile } from '../../types';
import { 
  exportDataAsJSON, 
  importJSONBackup, 
  getStoredFirebaseConfig, 
  setStoredFirebaseConfig
} from '../../services/storage';
import { 
  initializeFirebaseService, 
  loginWithGoogle, 
  logoutFirebase 
} from '../../services/firebase';

interface SettingsModalProps {
  user: UserProfile | null;
  isFirebaseActive: boolean;
  familyCode: string;
  onSetFamilyCode: (code: string) => void;
  onRefreshData: () => void;
  onClearDemoData?: () => void;
  onRestoreSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isFirebaseActive,
  familyCode,
  onSetFamilyCode,
  onRefreshData,
  onClearDemoData,
  onRestoreSampleData
}) => {
  const [inputFamilyCode, setInputFamilyCode] = useState(familyCode || '');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Advanced Firebase Config state
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [isConfigUnlocked, setIsConfigUnlocked] = useState(false);

  const storedConfig = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(storedConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '');
  const [authDomain, setAuthDomain] = useState(storedConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '');
  const [projectId, setProjectId] = useState(storedConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '');
  const [storageBucket, setStorageBucket] = useState(storedConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '');
  const [messagingSenderId, setMessagingSenderId] = useState(storedConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
  const [appId, setAppId] = useState(storedConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '');

  const [configMessage, setConfigMessage] = useState('');

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      setConfigMessage('Please enter at least API Key and Project ID.');
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    const success = initializeFirebaseService(config);
    if (success) {
      setConfigMessage('✅ Firebase connected successfully!');
      setIsConfigUnlocked(false);
      onRefreshData();
    } else {
      setConfigMessage('❌ Connection failed. Please check credentials.');
    }
  };

  const handleClearFirebaseConfig = () => {
    if (!confirm('Reset Firebase configuration to default environment settings?')) return;
    setStoredFirebaseConfig(null);
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setConfigMessage('Reset to Local Demo Mode.');
    window.location.reload();
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Google Auth failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (importJSONBackup(content)) {
        alert('Data backup restored successfully!');
        onRefreshData();
      } else {
        alert('Invalid JSON backup file structure.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AutoTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            App Settings & Account Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your login session, household garage code, data backups, and custom cloud setup.
          </p>
        </div>
      </div>

      {/* User Authentication Account Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Google User Account</h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            user 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}>
            {user ? 'Authenticated' : 'Signed Out'}
          </span>
        </div>

        {user ? (
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-cyan-500 shadow-md" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-extrabold text-base border border-cyan-500">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <span className="font-bold text-sm text-white block">{user.displayName}</span>
                <span className="text-xs text-slate-400 font-mono">{user.email}</span>
              </div>
            </div>
            <button
              onClick={() => logoutFirebase()}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 px-3.5 py-2 rounded-xl border border-slate-700 hover:border-red-800 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-4 rounded-xl border border-slate-700 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Shared Family Garage / Household Sync Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Shared Family Garage Sync</h2>
          </div>
          {familyCode ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Shared Code: {familyCode}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Personal Garage</span>
          )}
        </div>

        <p className="text-xs text-slate-300">
          Share your vehicle list and maintenance logs with your spouse or family members! Anyone using the same <strong>Household Code</strong> will automatically view and edit the same shared garage in real time on their own Google account.
        </p>

        <div className="space-y-3 pt-1">
          <label className="block text-xs font-semibold text-slate-300">
            Household Sync Code (e.g. VUONG-FAMILY, GARAGE-1234)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="e.g. VUONG-FAMILY"
              value={inputFamilyCode}
              onChange={(e) => setInputFamilyCode(e.target.value.toUpperCase())}
              className="flex-1 glass-input text-white text-xs rounded-xl p-2.5 font-mono uppercase tracking-wider"
            />
            <button
              onClick={() => {
                const clean = inputFamilyCode.trim().toUpperCase();
                if (!clean) {
                  alert('Please enter a Household Code (e.g. VUONG-FAMILY).');
                  return;
                }
                onSetFamilyCode(clean);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Save & Join Household
            </button>
            {familyCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(familyCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4 text-slate-400" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            )}
          </div>

          {familyCode && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-indigo-300 font-medium">
                ✅ Currently syncing all vehicles under Household: <strong>{familyCode}</strong>
              </span>
              <button
                onClick={() => {
                  if (confirm('Leave shared household garage and return to your personal garage?')) {
                    setInputFamilyCode('');
                    onSetFamilyCode('');
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline"
              >
                Leave Household
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backup Export / Import Data Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Data Backup & Export Options</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all text-left group"
          >
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Export Full JSON Backup</span>
              <span className="text-xs text-slate-400">Download all vehicles, logs & reminders as JSON</span>
            </div>
          </button>

          <label className="flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all text-left cursor-pointer group">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Import JSON Backup</span>
              <span className="text-xs text-slate-400">Restore dataset from a saved JSON file</span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

        </div>
      </div>

      {/* Advanced Developer Settings (Collapsible & Protected) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <button
          type="button"
          onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
          className="w-full p-5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
              <Cloud className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Advanced Firebase & Demo Data Controls</span>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                  isFirebaseActive ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isFirebaseActive ? 'Cloud Active' : 'Developer Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Custom Google Cloud API keys, Project ID override & Demo dataset management (Protected).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            {showAdvancedConfig ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showAdvancedConfig && (
          <div className="p-6 border-t border-slate-800 space-y-5 bg-slate-950/40">
            
            {/* Protection Notice */}
            <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Protected System Settings</span>
                <p className="text-amber-300/80">
                  These system credentials link AutoTrack to your Google Cloud Firestore database. Managing demo data or changing credentials by mistake will alter your saved database.
                </p>
              </div>
            </div>

            {/* Lock / Unlock Toggle */}
            <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                {isConfigUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                {isConfigUnlocked ? 'Editing Unlocked' : 'Advanced Controls Hidden & Locked'}
              </span>
              <button
                type="button"
                onClick={() => setIsConfigUnlocked(!isConfigUnlocked)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isConfigUnlocked 
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                    : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
                }`}
              >
                {isConfigUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isConfigUnlocked ? 'Lock & Hide Settings' : 'Unlock to View & Edit'}
              </button>
            </div>

            {isConfigUnlocked && (
              <div className="space-y-6 pt-2">
                
                {/* Firebase Keys Form */}
                <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Custom Firebase Credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">API Key *</label>
                      <input
                        type="text"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full glass-input text-white text-xs rounded-xl p-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Project ID *</label>
                      <input
                        type="text"
                        placeholder="my-autotrack-app"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full glass-input text-white text-xs rounded-xl p-2.5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Auth Domain</label>
                      <input
                        type="text"
                        placeholder="my-autotrack-app.firebaseapp.com"
                        value={authDomain}
                        onChange={(e) => setAuthDomain(e.target.value)}
                        className="w-full glass-input text-white text-xs rounded-xl p-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">App ID</label>
                      <input
                        type="text"
                        placeholder="1:123456789:web:abcdef..."
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        className="w-full glass-input text-white text-xs rounded-xl p-2.5 font-mono"
                      />
                    </div>
                  </div>

                  {configMessage && (
                    <p className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 p-2.5 rounded-xl border border-cyan-800">
                      {configMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
                    >
                      Save Custom Firebase Keys
                    </button>
                    {storedConfig && (
                      <button
                        type="button"
                        onClick={handleClearFirebaseConfig}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700"
                      >
                        Reset to Default Env
                      </button>
                    )}
                  </div>
                </form>

                {/* Demo Data Management Sub-Section */}
                <div className="pt-5 border-t border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Demo & Sample Dataset Controls</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove all initial sample/demo vehicles and service logs?')) {
                          if (onClearDemoData) onClearDemoData();
                          else onRefreshData();
                        }
                      }}
                      className="flex items-center gap-3 p-3.5 bg-red-950/20 hover:bg-red-950/40 rounded-xl border border-red-800/40 hover:border-red-600 transition-all text-left group"
                    >
                      <RefreshCw className="w-5 h-5 text-red-400 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                      <div>
                        <span className="font-bold text-xs text-red-300 block">Purge Demo Data</span>
                        <span className="text-[11px] text-slate-400">Remove sample cars & records</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Restore default sample demo vehicles and records?')) {
                          onRestoreSampleData();
                        }
                      }}
                      className="flex items-center gap-3 p-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all text-left group"
                    >
                      <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <span className="font-bold text-xs text-white block">Restore Demo Dataset</span>
                        <span className="text-[11px] text-slate-400">Load initial sample vehicles & logs</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};
