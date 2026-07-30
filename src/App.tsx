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

import type { Vehicle, ServiceRecord, ServiceReminder, UserProfile, ActiveTab } from './types';
import { 
  loadLocalVehicles, 
  saveLocalVehicles, 
  loadLocalRecords, 
  saveLocalRecords, 
  loadLocalReminders, 
  saveLocalReminders, 
  getActiveVehicleId, 
  setActiveVehicleId 
} from './services/storage';

import { 
  initializeFirebaseService, 
  isFirebaseConfigured, 
  subscribeAuth, 
  tryAutoSignInGoogle,
  subscribeFirestoreVehicles, 
  subscribeFirestoreRecords, 
  saveFirestoreVehicle, 
  deleteFirestoreVehicle, 
  saveFirestoreRecord, 
  deleteFirestoreRecord,
  saveFirestoreReminder,
  deleteFirestoreReminder
} from './services/firebase';

export const App: React.FC = () => {
  // State Initialization
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadLocalVehicles());
  const [records, setRecords] = useState<ServiceRecord[]>(() => loadLocalRecords());
  const [reminders, setReminders] = useState<ServiceReminder[]>(() => loadLocalReminders());
  const [activeVehicleId, setActiveVehicleIdState] = useState<string>(() => getActiveVehicleId());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

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
    setIsFirebaseActive(initialized && isFirebaseConfigured());

    if (initialized) {
      const unsubscribeAuth = subscribeAuth((userProfile) => {
        setUser(userProfile);
        if (userProfile) {
          // Subscribe to cloud Firestore changes
          const unSubVehicles = subscribeFirestoreVehicles(userProfile.uid, (cloudVehicles) => {
            if (cloudVehicles.length > 0) {
              setVehicles(cloudVehicles);
              saveLocalVehicles(cloudVehicles);
            } else {
              // Seed existing local vehicles to Firestore if user's cloud database is empty
              const local = loadLocalVehicles();
              local.forEach(v => saveFirestoreVehicle(userProfile.uid, v));
            }
          });

          const unSubRecords = subscribeFirestoreRecords(userProfile.uid, (cloudRecords) => {
            if (cloudRecords.length > 0) {
              setRecords(cloudRecords);
              saveLocalRecords(cloudRecords);
            } else {
              // Seed existing local records to Firestore
              const local = loadLocalRecords();
              local.forEach(r => saveFirestoreRecord(userProfile.uid, r));
            }
          });

          return () => {
            unSubVehicles();
            unSubRecords();
          };
        } else {
          // Attempt automatic Google sign-in if previous user session exists
          tryAutoSignInGoogle().catch(() => {});
        }
      });

      return () => unsubscribeAuth();
    }
  }, []);

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
        if (user) saveFirestoreVehicle(user.uid, updated);
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
      saveFirestoreVehicle(user.uid, fullVehicle);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    if (activeVehicleId === id) {
      const remaining = vehicles.filter(v => v.id !== id);
      if (remaining.length > 0) handleSelectVehicle(remaining[0].id);
    }
    if (user) {
      deleteFirestoreVehicle(user.uid, id);
    }
  };

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
      saveFirestoreRecord(user.uid, fullRecord);
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
      deleteFirestoreRecord(user.uid, id);
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
      saveFirestoreReminder(user.uid, reminder);
    }
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    if (user) {
      deleteFirestoreReminder(user.uid, id);
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

  const pendingRemindersCount = reminders.filter(r => !r.isCompleted).length;

  const handleRefreshData = () => {
    setVehicles(loadLocalVehicles());
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
  };

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
            onSelectVehicle={handleSelectVehicle}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
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
            onRefreshData={handleRefreshData}
            onRestoreSampleData={handleRefreshData}
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
