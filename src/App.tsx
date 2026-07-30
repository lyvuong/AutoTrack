import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { VehicleGarage } from './components/Vehicles/VehicleGarage';
import { ServiceHistory } from './components/Services/ServiceHistory';
import { CostAnalytics } from './components/Analytics/CostAnalytics';
import { ReminderManager } from './components/Reminders/ReminderManager';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ServiceFormModal } from './components/Services/ServiceFormModal';
import { VehicleModal } from './components/Vehicles/VehicleModal';
import { ReminderModal } from './components/Reminders/ReminderModal';
import { PWAInstallPrompt } from './components/PWA/PWAInstallPrompt';
import { LoginScreen } from './components/Auth/LoginScreen';

import type { Vehicle, ServiceRecord, ServiceReminder, UserProfile, ActiveTab } from './types';
import { 
  loadLocalVehicles, 
  saveLocalVehicles, 
  loadLocalRecords, 
  saveLocalRecords, 
  loadLocalReminders, 
  saveLocalReminders, 
  clearDemoData,
  restoreSampleData,
  getActiveVehicleId, 
  setActiveVehicleId,
  getStoredFamilyCode,
  setStoredFamilyCode
} from './services/storage';

import { 
  initializeFirebaseService, 
  isFirebaseConfigured, 
  subscribeAuth, 
  loginWithGoogle,
  tryAutoSignInGoogle,
  subscribeFirestoreVehicles, 
  subscribeFirestoreRecords, 
  subscribeFirestoreReminders,
  saveFirestoreVehicle, 
  deleteFirestoreVehicle, 
  saveFirestoreRecord, 
  deleteFirestoreRecord,
  saveFirestoreReminder,
  deleteFirestoreReminder,
  subscribeRTDBVehicles,
  subscribeRTDBRecords,
  subscribeRTDBReminders,
  saveRTDBVehicle,
  deleteRTDBVehicle,
  saveRTDBRecord,
  deleteRTDBRecord,
  saveRTDBReminder,
  deleteRTDBReminder
} from './services/firebase';

export const App: React.FC = () => {
  // State Initialization
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadLocalVehicles());
  const [records, setRecords] = useState<ServiceRecord[]>(() => loadLocalRecords());
  const [reminders, setReminders] = useState<ServiceReminder[]>(() => loadLocalReminders());
  const [activeVehicleId, setActiveVehicleIdState] = useState<string>(() => getActiveVehicleId());
  const [familyCode, setFamilyCodeState] = useState<string>(() => getStoredFamilyCode());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleSetFamilyCode = (code: string) => {
    setStoredFamilyCode(code);
    setFamilyCodeState(code.toUpperCase().trim());
  };

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Firebase service if configured
  useEffect(() => {
    const initialized = initializeFirebaseService();
    const active = initialized && isFirebaseConfigured();
    setIsFirebaseActive(active);

    if (!active) {
      setIsAuthLoading(false);
    }

    if (initialized) {
      const unsubscribeAuth = subscribeAuth((userProfile) => {
        setUser(userProfile);
        setIsAuthLoading(false);
        if (userProfile) {
          let hasSeededVehicles = false;
          let hasSeededRecords = false;
          let hasSeededReminders = false;

          // Subscribe to cloud Firestore & Realtime Database changes
          const unSubVehiclesFS = subscribeFirestoreVehicles(userProfile.uid, familyCode, (cloudVehicles) => {
            if (cloudVehicles.length > 0) {
              hasSeededVehicles = true;
              setVehicles(cloudVehicles);
              saveLocalVehicles(cloudVehicles);
            } else if (!hasSeededVehicles) {
              const local = loadLocalVehicles().filter(v => !v.id.startsWith('demo-'));
              if (local.length > 0) {
                local.forEach(v => {
                  saveFirestoreVehicle(userProfile.uid, v, familyCode);
                  saveRTDBVehicle(userProfile.uid, v, familyCode);
                });
              }
            }
          });

          const unSubVehiclesRTDB = subscribeRTDBVehicles(userProfile.uid, familyCode, (rtdbVehicles) => {
            if (rtdbVehicles.length > 0) {
              hasSeededVehicles = true;
              setVehicles(rtdbVehicles);
              saveLocalVehicles(rtdbVehicles);
            }
          });

          const unSubRecordsFS = subscribeFirestoreRecords(userProfile.uid, familyCode, (cloudRecords) => {
            if (cloudRecords.length > 0) {
              hasSeededRecords = true;
              setRecords(cloudRecords);
              saveLocalRecords(cloudRecords);
            } else if (!hasSeededRecords) {
              const local = loadLocalRecords().filter(r => !r.id.startsWith('rec-') && !r.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                local.forEach(r => {
                  saveFirestoreRecord(userProfile.uid, r, familyCode);
                  saveRTDBRecord(userProfile.uid, r, familyCode);
                });
              }
            }
          });

          const unSubRecordsRTDB = subscribeRTDBRecords(userProfile.uid, familyCode, (rtdbRecords) => {
            if (rtdbRecords.length > 0) {
              hasSeededRecords = true;
              setRecords(rtdbRecords);
              saveLocalRecords(rtdbRecords);
            }
          });

          const unSubRemindersFS = subscribeFirestoreReminders(userProfile.uid, familyCode, (cloudReminders) => {
            if (cloudReminders.length > 0) {
              hasSeededReminders = true;
              setReminders(cloudReminders);
              saveLocalReminders(cloudReminders);
            } else if (!hasSeededReminders) {
              const local = loadLocalReminders().filter(rem => !rem.id.startsWith('rem-') && !rem.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                local.forEach(rem => {
                  saveFirestoreReminder(userProfile.uid, rem, familyCode);
                  saveRTDBReminder(userProfile.uid, rem, familyCode);
                });
              }
            }
          });

          const unSubRemindersRTDB = subscribeRTDBReminders(userProfile.uid, familyCode, (rtdbReminders) => {
            if (rtdbReminders.length > 0) {
              hasSeededReminders = true;
              setReminders(rtdbReminders);
              saveLocalReminders(rtdbReminders);
            }
          });

          return () => {
            unSubVehiclesFS();
            unSubVehiclesRTDB();
            unSubRecordsFS();
            unSubRecordsRTDB();
            unSubRemindersFS();
            unSubRemindersRTDB();
          };
        } else {
          // Attempt automatic Google sign-in if previous user session exists
          tryAutoSignInGoogle().catch(() => {});
        }
      });

      return () => unsubscribeAuth();
    }
  }, [familyCode]);

  // Always persist Local Storage changes for instant offline availability & fallback
  useEffect(() => {
    saveLocalVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveLocalRecords(records);
  }, [records]);

  useEffect(() => {
    saveLocalReminders(reminders);
  }, [reminders]);

  // Set Active Vehicle
  const handleSelectVehicle = (id: string) => {
    setActiveVehicleIdState(id);
    setActiveVehicleId(id);
  };

  // Ensure active vehicle fallback
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0] || null;

  // Handler for updating current vehicle mileage directly
  const handleUpdateMileage = (vehicleId: string, newMileage: number) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const updated = { ...v, currentMileage: newMileage, updatedAt: new Date().toISOString() };
        if (user) {
          saveFirestoreVehicle(user.uid, updated, familyCode);
          saveRTDBVehicle(user.uid, updated, familyCode);
        }
        return updated;
      }
      return v;
    }));
  };

  // Handlers for Vehicle CRUD
  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    const existing = vehicles.find(v => v.id === vehicleData.id);
    const now = new Date().toISOString();
    const fullVehicle: Vehicle = {
      ...vehicleData,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    setVehicles(prev => {
      const index = prev.findIndex(v => v.id === fullVehicle.id);
      if (index >= 0) {
        const updatedList = [...prev];
        updatedList[index] = fullVehicle;
        return updatedList;
      }
      return [fullVehicle, ...prev];
    });

    handleSelectVehicle(fullVehicle.id);

    if (user) {
      saveFirestoreVehicle(user.uid, fullVehicle, familyCode);
      saveRTDBVehicle(user.uid, fullVehicle, familyCode);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    setRecords(prev => prev.filter(r => r.vehicleId !== id));
    setReminders(prev => prev.filter(r => r.vehicleId !== id));
    if (activeVehicleId === id) {
      const remaining = vehicles.filter(v => v.id !== id);
      if (remaining.length > 0) handleSelectVehicle(remaining[0].id);
    }
    if (user) {
      deleteFirestoreVehicle(user.uid, id, familyCode);
      deleteRTDBVehicle(user.uid, id, familyCode);
    }
  };

  const validVehicleIds = new Set(vehicles.map(v => v.id));
  const activeVehicleReminders = reminders.filter(r => 
    !r.isCompleted && validVehicleIds.has(r.vehicleId) && (activeVehicleId ? r.vehicleId === activeVehicleId : true)
  );
  const pendingRemindersCount = activeVehicleReminders.length;

  // Handlers for Service Records CRUD
  const handleSaveRecord = (
    recordData: Omit<ServiceRecord, 'createdAt'>, 
    reminderTarget?: { nextMileage?: number; nextDate?: string }
  ) => {
    const existing = records.find(r => r.id === recordData.id);
    const fullRecord: ServiceRecord = {
      ...recordData,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    setRecords(prev => {
      const index = prev.findIndex(r => r.id === fullRecord.id);
      if (index >= 0) {
        const updatedList = [...prev];
        updatedList[index] = fullRecord;
        return updatedList;
      }
      return [fullRecord, ...prev];
    });

    // Auto update vehicle current mileage if record mileage is higher
    const targetVehicle = vehicles.find(v => v.id === fullRecord.vehicleId);
    if (targetVehicle && fullRecord.mileage > targetVehicle.currentMileage) {
      handleUpdateMileage(fullRecord.vehicleId, fullRecord.mileage);
    }

    if (user) {
      saveFirestoreRecord(user.uid, fullRecord, familyCode);
      saveRTDBRecord(user.uid, fullRecord, familyCode);
    }

    // Create next service reminder if requested
    if (reminderTarget && (reminderTarget.nextMileage || reminderTarget.nextDate)) {
      const newReminder: ServiceReminder = {
        id: `rem-${Date.now()}`,
        vehicleId: fullRecord.vehicleId,
        title: `Next ${fullRecord.category}`,
        category: fullRecord.category,
        dueMileage: reminderTarget.nextMileage,
        dueDate: reminderTarget.nextDate,
        isCompleted: false,
        notes: `Auto-scheduled after ${fullRecord.category} on ${fullRecord.date}`
      };
      handleSaveReminder(newReminder);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (user) {
      deleteFirestoreRecord(user.uid, id, familyCode);
      deleteRTDBRecord(user.uid, id, familyCode);
    }
  };

  // Handlers for Reminders CRUD
  const handleSaveReminder = (reminder: ServiceReminder) => {
    setReminders(prev => {
      const index = prev.findIndex(r => r.id === reminder.id);
      if (index >= 0) {
        const updatedList = [...prev];
        updatedList[index] = reminder;
        return updatedList;
      }
      return [reminder, ...prev];
    });

    if (user) {
      saveFirestoreReminder(user.uid, reminder, familyCode);
      saveRTDBReminder(user.uid, reminder, familyCode);
    }
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    if (user) {
      deleteFirestoreReminder(user.uid, id, familyCode);
      deleteRTDBReminder(user.uid, id, familyCode);
    }
  };

  const handleToggleCompleteReminder = (reminder: ServiceReminder) => {
    const updated = { ...reminder, isCompleted: !reminder.isCompleted };
    handleSaveReminder(updated);
  };

  const handleCompleteAndLogService = (reminder: ServiceReminder) => {
    handleToggleCompleteReminder(reminder);
    setEditingRecord(null);
    setIsServiceModalOpen(true);
  };

  const handleClearDemoData = () => {
    if (user) {
      deleteFirestoreVehicle(user.uid, 'demo-v1');
      deleteFirestoreVehicle(user.uid, 'demo-v2');
      deleteFirestoreRecord(user.uid, 'rec-1');
      deleteFirestoreRecord(user.uid, 'rec-2');
      deleteFirestoreRecord(user.uid, 'rec-3');
      deleteFirestoreRecord(user.uid, 'rec-4');
      deleteFirestoreRecord(user.uid, 'rec-5');
      deleteFirestoreRecord(user.uid, 'rec-6');
      deleteFirestoreReminder(user.uid, 'rem-1');
      deleteFirestoreReminder(user.uid, 'rem-2');
      deleteFirestoreReminder(user.uid, 'rem-3');
    }
    clearDemoData();
    setVehicles(loadLocalVehicles());
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
  };

  const handleRestoreSampleData = () => {
    restoreSampleData();
    setVehicles(loadLocalVehicles());
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
  };

  const handleRefreshData = () => {
    setVehicles(loadLocalVehicles());
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
  };

  if (isFirebaseActive && isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading AutoTrack...</span>
        </div>
      </div>
    );
  }

  if (isFirebaseActive && !user) {
    return <LoginScreen onGoogleSignIn={loginWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={handleSelectVehicle}
        onOpenAddService={() => {
          setEditingRecord(null);
          setIsServiceModalOpen(true);
        }}
        onOpenAddVehicle={() => setIsVehicleModalOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        user={user}
        isOnline={isOnline}
        isFirebaseActive={isFirebaseActive}
      />

      {/* Main Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardOverview
            activeVehicle={activeVehicle}
            records={records}
            reminders={reminders}
            onOpenAddService={() => {
              setEditingRecord(null);
              setIsServiceModalOpen(true);
            }}
            onOpenAddVehicle={() => setIsVehicleModalOpen(true)}
            onOpenAddReminder={() => {
              setEditingReminder(null);
              setIsReminderModalOpen(true);
            }}
            onSelectTab={setActiveTab as any}
            onUpdateMileage={handleUpdateMileage}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehicleGarage
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            familyCode={familyCode}
            onSelectVehicle={handleSelectVehicle}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'history' && (
          <ServiceHistory
            records={records}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onOpenAddService={() => {
              setEditingRecord(null);
              setIsServiceModalOpen(true);
            }}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsServiceModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'reminders' && (
          <ReminderManager
            reminders={reminders}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleComplete={handleToggleCompleteReminder}
            onCompleteAndLogService={handleCompleteAndLogService}
          />
        )}

        {activeTab === 'analytics' && (
          <CostAnalytics
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            records={records}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            user={user}
            isFirebaseActive={isFirebaseActive}
            familyCode={familyCode}
            onSetFamilyCode={handleSetFamilyCode}
            onRefreshData={handleRefreshData}
            onClearDemoData={handleClearDemoData}
            onRestoreSampleData={handleRestoreSampleData}
          />
        )}

      </main>

      {/* Shared Modals */}
      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveRecord}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        initialRecord={editingRecord}
      />

      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
      />

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSave={handleSaveReminder}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        initialReminder={editingReminder}
      />

      {/* PWA Home Screen Install Banner */}
      <PWAInstallPrompt />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
        <p>AutoTrack Progressive Web App • Cloudflare Pages Ready • Offline Capable</p>
      </footer>

    </div>
  );
};
