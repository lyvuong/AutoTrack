import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Car as CarIcon, 
  Wrench, 
  Bell, 
  BarChart2, 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  Cloud,
  CheckCircle,
  AlertTriangle,
  User,
  Users
} from 'lucide-react';

import type { 
  Vehicle, 
  ServiceRecord, 
  ServiceReminder, 
  ActiveTab,
  UserProfile 
} from './types';

import { 
  loadLocalVehicles, 
  saveLocalVehicles, 
  loadLocalRecords, 
  saveLocalRecords, 
  loadLocalReminders, 
  saveLocalReminders, 
  clearLocalDemoData, 
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
  tryAutoSignInGoogle,
  loginWithGoogle,
  logoutFirebase,
  subscribeFirestoreVehicles,
  saveFirestoreVehicle,
  deleteFirestoreVehicle,
  subscribeFirestoreRecords,
  saveFirestoreRecord,
  deleteFirestoreRecord,
  subscribeFirestoreReminders,
  saveFirestoreReminder,
  deleteFirestoreReminder,
  subscribeRTDBVehicles,
  saveRTDBVehicle,
  deleteRTDBVehicle,
  subscribeRTDBRecords,
  saveRTDBRecord,
  deleteRTDBRecord,
  subscribeRTDBReminders,
  saveRTDBReminder,
  deleteRTDBReminder,
  verifyOrCreateHousehold
} from './services/firebase';

// Components
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { VehicleGarage } from './components/Vehicles/VehicleGarage';
import { ServiceHistoryView } from './components/Service/ServiceHistoryView';
import { RemindersView } from './components/Reminders/RemindersView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AddVehicleModal } from './components/Vehicles/AddVehicleModal';
import { AddServiceModal } from './components/Service/AddServiceModal';
import { AddReminderModal } from './components/Reminders/AddReminderModal';
import { LoginScreen } from './components/Auth/LoginScreen';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [familyCode, setFamilyCodeState] = useState<string>(() => getStoredFamilyCode());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadLocalVehicles());
  const [records, setRecords] = useState<ServiceRecord[]>(() => loadLocalRecords());
  const [reminders, setReminders] = useState<ServiceReminder[]>(() => loadLocalReminders());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(() => getActiveVehicleId());
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleSetFamilyCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      setStoredFamilyCode('');
      setFamilyCodeState('');
      return { success: true, message: 'Returned to Personal Garage.' };
    }

    if (user && isFirebaseActive) {
      const res = await verifyOrCreateHousehold(cleanCode, user);
      if (!res.success) {
        setStoredFamilyCode('');
        setFamilyCodeState('');
        return { success: false, message: res.message };
      }
      setStoredFamilyCode(cleanCode);
      setFamilyCodeState(cleanCode);
      return { success: true, message: res.message };
    } else {
      setStoredFamilyCode(cleanCode);
      setFamilyCodeState(cleanCode);
      return { success: true, message: `Joined Household ${cleanCode}` };
    }
  };

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Online / Offline Detection
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
            } else if (hasSeededVehicles) {
              setVehicles([]);
              saveLocalVehicles([]);
            } else {
              hasSeededVehicles = true;
              const local = loadLocalVehicles().filter(v => !v.id.startsWith('demo-'));
              if (local.length > 0) {
                setVehicles(local);
                local.forEach(v => {
                  saveFirestoreVehicle(userProfile.uid, v, familyCode);
                  saveRTDBVehicle(userProfile.uid, v, familyCode);
                });
              } else {
                setVehicles([]);
                saveLocalVehicles([]);
              }
            }
          });

          const unSubVehiclesRTDB = subscribeRTDBVehicles(userProfile.uid, familyCode, (rtdbVehicles) => {
            if (rtdbVehicles.length > 0) {
              hasSeededVehicles = true;
              setVehicles(rtdbVehicles);
              saveLocalVehicles(rtdbVehicles);
            } else if (hasSeededVehicles) {
              setVehicles([]);
              saveLocalVehicles([]);
            }
          });

          const unSubRecordsFS = subscribeFirestoreRecords(userProfile.uid, familyCode, (cloudRecords) => {
            if (cloudRecords.length > 0) {
              hasSeededRecords = true;
              setRecords(cloudRecords);
              saveLocalRecords(cloudRecords);
            } else if (hasSeededRecords) {
              setRecords([]);
              saveLocalRecords([]);
            } else {
              hasSeededRecords = true;
              const local = loadLocalRecords().filter(r => !r.id.startsWith('rec-') && !r.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                setRecords(local);
                local.forEach(r => {
                  saveFirestoreRecord(userProfile.uid, r, familyCode);
                  saveRTDBRecord(userProfile.uid, r, familyCode);
                });
              } else {
                setRecords([]);
                saveLocalRecords([]);
              }
            }
          });

          const unSubRecordsRTDB = subscribeRTDBRecords(userProfile.uid, familyCode, (rtdbRecords) => {
            if (rtdbRecords.length > 0) {
              hasSeededRecords = true;
              setRecords(rtdbRecords);
              saveLocalRecords(rtdbRecords);
            } else if (hasSeededRecords) {
              setRecords([]);
              saveLocalRecords([]);
            }
          });

          const unSubRemindersFS = subscribeFirestoreReminders(userProfile.uid, familyCode, (cloudReminders) => {
            if (cloudReminders.length > 0) {
              hasSeededReminders = true;
              setReminders(cloudReminders);
              saveLocalReminders(cloudReminders);
            } else if (hasSeededReminders) {
              setReminders([]);
              saveLocalReminders([]);
            } else {
              hasSeededReminders = true;
              const local = loadLocalReminders().filter(rem => !rem.id.startsWith('rem-') && !rem.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                setReminders(local);
                local.forEach(rem => {
                  saveFirestoreReminder(userProfile.uid, rem, familyCode);
                  saveRTDBReminder(userProfile.uid, rem, familyCode);
                });
              } else {
                setReminders([]);
                saveLocalReminders([]);
              }
            }
          });

          const unSubRemindersRTDB = subscribeRTDBReminders(userProfile.uid, familyCode, (rtdbReminders) => {
            if (rtdbReminders.length > 0) {
              hasSeededReminders = true;
              setReminders(rtdbReminders);
              saveLocalReminders(rtdbReminders);
            } else if (hasSeededReminders) {
              setReminders([]);
              saveLocalReminders([]);
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
          setStoredFamilyCode('');
          setFamilyCodeState('');
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

  useEffect(() => {
    if (selectedVehicleId) {
      setActiveVehicleId(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  // Handle vehicle selection safely
  useEffect(() => {
    if (vehicles.length > 0) {
      const exists = vehicles.some(v => v.id === selectedVehicleId);
      if (!exists || !selectedVehicleId) {
        setSelectedVehicleId(vehicles[0].id);
      }
    } else {
      setSelectedVehicleId(null);
    }
  }, [vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  // Handlers for Vehicles
  const handleSaveVehicle = (vehicleData: Partial<Vehicle>) => {
    const isEdit = !!editingVehicle;
    const vehicleId = editingVehicle ? editingVehicle.id : `v-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const newVehicle: Vehicle = {
      id: vehicleId,
      make: vehicleData.make || 'Toyota',
      model: vehicleData.model || 'Camry',
      year: vehicleData.year || new Date().getFullYear(),
      vin: vehicleData.vin || '',
      licensePlate: vehicleData.licensePlate || '',
      startingMileage: vehicleData.startingMileage || 0,
      currentMileage: vehicleData.currentMileage || 0,
      fuelType: vehicleData.fuelType || 'Gasoline',
      photoUrl: vehicleData.photoUrl || '',
      notes: vehicleData.notes || '',
      createdAt: isEdit ? editingVehicle.createdAt : timestamp,
      updatedAt: timestamp,
      createdBy: isEdit ? (editingVehicle.createdBy || auditInfo) : auditInfo,
      lastEditedBy: auditInfo
    };

    setVehicles(prev => {
      const exists = prev.some(v => v.id === vehicleId);
      if (exists) {
        return prev.map(v => v.id === vehicleId ? newVehicle : v);
      }
      return [newVehicle, ...prev];
    });

    setSelectedVehicleId(vehicleId);
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);

    // Sync to Cloud
    if (user && isFirebaseActive) {
      saveFirestoreVehicle(user.uid, newVehicle, familyCode);
      saveRTDBVehicle(user.uid, newVehicle, familyCode);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle and all associated service records?')) return;
    setVehicles(prev => prev.filter(v => v.id !== id));
    setRecords(prev => prev.filter(r => r.vehicleId !== id));
    setReminders(prev => prev.filter(rem => rem.vehicleId !== id));

    if (selectedVehicleId === id) {
      const remaining = vehicles.filter(v => v.id !== id);
      setSelectedVehicleId(remaining.length > 0 ? remaining[0].id : null);
    }

    if (user && isFirebaseActive) {
      deleteFirestoreVehicle(user.uid, id, familyCode);
      deleteRTDBVehicle(user.uid, id, familyCode);
    }
  };

  // Handlers for Service Records
  const handleSaveRecord = (recordData: Partial<ServiceRecord>) => {
    if (!selectedVehicleId) return;

    const isEdit = !!editingRecord;
    const recordId = editingRecord ? editingRecord.id : `rec-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const newRecord: ServiceRecord = {
      id: recordId,
      vehicleId: selectedVehicleId,
      date: recordData.date || new Date().toISOString().split('T')[0],
      mileage: Number(recordData.mileage) || 0,
      cost: Number(recordData.cost) || 0,
      category: recordData.category || 'General Repair',
      type: recordData.type || 'Maintenance',
      provider: recordData.provider || 'DIY',
      notes: recordData.notes || '',
      nextServiceMileage: recordData.nextServiceMileage ? Number(recordData.nextServiceMileage) : undefined,
      nextServiceDate: recordData.nextServiceDate || undefined,
      createdAt: isEdit ? editingRecord.createdAt : timestamp,
      loggedBy: isEdit ? (editingRecord.loggedBy || auditInfo) : auditInfo,
      lastEditedBy: auditInfo
    };

    setRecords(prev => {
      const exists = prev.some(r => r.id === recordId);
      if (exists) {
        return prev.map(r => r.id === recordId ? newRecord : r);
      }
      return [newRecord, ...prev];
    });

    // Automatically update vehicle's current mileage if record mileage is higher
    if (selectedVehicle && newRecord.mileage > selectedVehicle.currentMileage) {
      const updatedVeh = { 
        ...selectedVehicle, 
        currentMileage: newRecord.mileage, 
        updatedAt: timestamp,
        lastEditedBy: auditInfo
      };
      setVehicles(prev => prev.map(v => v.id === v.id ? updatedVeh : v));
      if (user && isFirebaseActive) {
        saveFirestoreVehicle(user.uid, updatedVeh, familyCode);
        saveRTDBVehicle(user.uid, updatedVeh, familyCode);
      }
    }

    setIsServiceModalOpen(false);
    setEditingRecord(null);

    // Sync to Cloud
    if (user && isFirebaseActive) {
      saveFirestoreRecord(user.uid, newRecord, familyCode);
      saveRTDBRecord(user.uid, newRecord, familyCode);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm('Delete this service record log?')) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    if (user && isFirebaseActive) {
      deleteFirestoreRecord(user.uid, id, familyCode);
      deleteRTDBRecord(user.uid, id, familyCode);
    }
  };

  // Handlers for Service Reminders
  const handleSaveReminder = (reminderData: Partial<ServiceReminder>) => {
    if (!selectedVehicleId) return;

    const reminderId = `rem-${Date.now()}`;
    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const newReminder: ServiceReminder = {
      id: reminderId,
      vehicleId: selectedVehicleId,
      title: reminderData.title || 'Service Reminder',
      category: reminderData.category || 'Scheduled Maintenance',
      dueMileage: reminderData.dueMileage ? Number(reminderData.dueMileage) : undefined,
      dueDate: reminderData.dueDate || undefined,
      intervalMiles: reminderData.intervalMiles ? Number(reminderData.intervalMiles) : undefined,
      intervalMonths: reminderData.intervalMonths ? Number(reminderData.intervalMonths) : undefined,
      isCompleted: false,
      notes: reminderData.notes || '',
      createdBy: auditInfo,
      lastEditedBy: auditInfo
    };

    setReminders(prev => [newReminder, ...prev]);
    setIsReminderModalOpen(false);

    if (user && isFirebaseActive) {
      saveFirestoreReminder(user.uid, newReminder, familyCode);
      saveRTDBReminder(user.uid, newReminder, familyCode);
    }
  };

  const handleToggleReminderComplete = (id: string) => {
    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        const updated = { 
          ...rem, 
          isCompleted: !rem.isCompleted,
          lastEditedBy: auditInfo 
        };
        if (user && isFirebaseActive) {
          saveFirestoreReminder(user.uid, updated, familyCode);
          saveRTDBReminder(user.uid, updated, familyCode);
        }
        return updated;
      }
      return rem;
    }));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(rem => rem.id !== id));
    if (user && isFirebaseActive) {
      deleteFirestoreReminder(user.uid, id, familyCode);
      deleteRTDBReminder(user.uid, id, familyCode);
    }
  };

  const handleRefreshData = () => {
    setVehicles(loadLocalVehicles());
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
  };

  const handleClearDemoData = () => {
    clearLocalDemoData();
    setVehicles([]);
    setRecords([]);
    setReminders([]);
    setSelectedVehicleId(null);
  };

  const handleRestoreSampleData = () => {
    restoreSampleData();
    const freshVehicles = loadLocalVehicles();
    setVehicles(freshVehicles);
    setRecords(loadLocalRecords());
    setReminders(loadLocalReminders());
    if (freshVehicles.length > 0) {
      setSelectedVehicleId(freshVehicles[0].id);
    }
  };

  // Render Login Screen if mandatory Auth is loading or user signed out
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span>Authenticating AutoTrack Session...</span>
        </div>
      </div>
    );
  }

  if (isFirebaseActive && !user) {
    return (
      <LoginScreen 
        onGoogleSignIn={loginWithGoogle}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 lg:pb-0">
      
      {/* Top Banner Navigation Header */}
      <Header
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        onAddVehicle={() => {
          setEditingVehicle(null);
          setIsVehicleModalOpen(true);
        }}
        onAddService={() => {
          setEditingRecord(null);
          setIsServiceModalOpen(true);
        }}
        isOnline={isOnline}
        isFirebaseActive={isFirebaseActive}
        user={user}
        familyCode={familyCode}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Connection & Household Garage Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline (Cached)'}
            </span>

            <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border ${
              isFirebaseActive 
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Cloud className="w-3.5 h-3.5" />
              {isFirebaseActive ? 'Cloud Sync Active' : 'Local Demo Mode'}
            </span>

            {familyCode && (
              <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                <Users className="w-3.5 h-3.5" />
                Shared Household Garage: {familyCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>{vehicles.length} Vehicles</span>
            <span>•</span>
            <span>{records.length} Service Logs</span>
            <span>•</span>
            <span>{reminders.length} Reminders</span>
          </div>
        </div>

        {/* Tab View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardView
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
            records={records}
            reminders={reminders}
            onNavigate={(tab) => setActiveTab(tab)}
            onAddService={() => setIsServiceModalOpen(true)}
            onAddReminder={() => setIsReminderModalOpen(true)}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehicleGarage
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
            onAddVehicle={() => {
              setEditingVehicle(null);
              setIsVehicleModalOpen(true);
            }}
            onEditVehicle={(vehicle) => {
              setEditingVehicle(vehicle);
              setIsVehicleModalOpen(true);
            }}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === 'history' && (
          <ServiceHistoryView
            records={records}
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
            onAddRecord={() => {
              setEditingRecord(null);
              setIsServiceModalOpen(true);
            }}
            onEditRecord={(record) => {
              setEditingRecord(record);
              setIsServiceModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
            onAddReminder={() => setIsReminderModalOpen(true)}
            onToggleComplete={handleToggleReminderComplete}
            onDeleteReminder={handleDeleteReminder}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            vehicles={vehicles}
            records={records}
            selectedVehicleId={selectedVehicleId}
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

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Modals */}
      {isVehicleModalOpen && (
        <AddVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
          onSave={handleSaveVehicle}
          initialVehicle={editingVehicle}
        />
      )}

      {isServiceModalOpen && selectedVehicle && (
        <AddServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => {
            setIsServiceModalOpen(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveRecord}
          selectedVehicle={selectedVehicle}
          initialRecord={editingRecord}
        />
      )}

      {isReminderModalOpen && selectedVehicle && (
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          onSave={handleSaveReminder}
          selectedVehicle={selectedVehicle}
        />
      )}

    </div>
  );
}

export default App;
