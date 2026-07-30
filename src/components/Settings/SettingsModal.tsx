import React, { useState } from 'react';
import { 
  Settings, 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  LogOut, 
  User
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
  onRefreshData: () => void;
  onRestoreSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isFirebaseActive,
  onRefreshData,
  onRestoreSampleData
}) => {
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
      onRefreshData();
    } else {
      setConfigMessage('❌ Connection failed. Please check credentials.');
    }
  };

  const handleClearFirebaseConfig = () => {
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
            App Settings & Cloud Firebase Config
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Firebase Auth/Firestore cloud sync, manage account, export & import data backups.
          </p>
        </div>
      </div>

      {/* Cloud Firebase Setup Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Firebase Project Configuration</h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isFirebaseActive 
              ? 'bg-cyan-950 text-cyan-300 border-cyan-800' 
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}>
            {isFirebaseActive 
              ? (storedConfig ? 'Connected (Browser Local Storage)' : 'Connected (.env Environment)') 
              : 'Running in Local Demo Mode'}
          </span>
        </div>

        <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
          <p className="text-xs text-slate-400">
            Enter your Google Firebase Console project configuration keys below to enable Firestore Cloud sync across devices.
          </p>

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
              Save Firebase Keys
            </button>
            {storedConfig && (
              <button
                type="button"
                onClick={handleClearFirebaseConfig}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700"
              >
                Reset to Demo Mode
              </button>
            )}
          </div>
        </form>

        {/* User Authentication Sub-Section */}
        {isFirebaseActive && (
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Firebase Authentication
            </h3>

            {user ? (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-cyan-500" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-sm text-white block">{user.displayName}</span>
                    <span className="text-xs text-slate-400">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => logoutFirebase()}
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-red-950/60 text-red-400 px-3 py-1.5 rounded-xl border border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-700 transition-all"
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
        )}
      </div>

      {/* Backup Export / Import Data Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Data Backup & Export Options</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all text-center group"
          >
            <Download className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white">Export Full JSON Backup</span>
            <span className="text-[11px] text-slate-400 mt-1">Vehicles, logs & reminders</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all text-center cursor-pointer group">
            <Upload className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white">Import JSON Backup</span>
            <span className="text-[11px] text-slate-400 mt-1">Restore from saved file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Restore default sample demo vehicles and records? This will append to your local storage.')) {
                onRestoreSampleData();
              }
            }}
            className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all text-center group"
          >
            <RefreshCw className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white">Restore Demo Dataset</span>
            <span className="text-[11px] text-slate-400 mt-1">Load sample vehicles & logs</span>
          </button>

        </div>
      </div>

    </div>
  );
};
