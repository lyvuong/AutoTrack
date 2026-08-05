import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { VehicleGarage } from './components/Vehicles/VehicleGarage';
import { ServiceHistory } from './components/Services/ServiceHistory';
import { CostAnalytics } from './components/Analytics/CostAnalytics';
import { ReminderManager } from './components/Reminders/ReminderManager';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AboutPage } from './components/About/AboutPage';
import { ServiceFormModal } from './components/Services/ServiceFormModal';
import { VehicleModal } from './components/Vehicles/VehicleModal';
import { ReminderModal } from './components/Reminders/ReminderModal';
import { PWAInstallPrompt } from './components/PWA/PWAInstallPrompt';
import { LoginScreen } from './components/Auth/LoginScreen';

import type { Vehicle, ServiceRecord, ServiceReminder, Transaction, EnrichedServiceRecord, UserProfile, ActiveTab } from './types';
import { buildTransactionCategory } from './utils/transactions';
import {
  loadLocalVehicles,
  saveLocalVehicles,
  loadLocalRecords,
  saveLocalRecords,
  loadLocalTransactions,
  saveLocalTransactions,
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
  getPersonalVehiclesOnce,
  subscribeFirestoreRecords,
  subscribeFirestoreTransactions,
  subscribeFirestoreReminders,
  saveFirestoreVehicle,
  deleteFirestoreVehicle,
  saveFirestoreRecord,
  deleteFirestoreRecord,
  overwriteFirestoreRecord,
  saveFirestoreTransaction,
  deleteFirestoreTransaction,
  saveFirestoreReminder,
  deleteFirestoreReminder,
  verifyOrCreateHousehold,
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
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocalTransactions());
  const [reminders, setReminders] = useState<ServiceReminder[]>(() => loadLocalReminders());
  const [activeVehicleId, setActiveVehicleIdState] = useState<string>(() => getActiveVehicleId());
  const [familyCode, setFamilyCodeState] = useState<string>(() => getStoredFamilyCode());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
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
  const [editingRecord, setEditingRecord] = useState<EnrichedServiceRecord | null>(null);
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);

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

  // Sync activeVehicleId to storage
  const handleSelectVehicle = (id: string) => {
    setActiveVehicleIdState(id);
    setActiveVehicleId(id);
  };

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
              const local = loadLocalVehicles().filter((v: Vehicle) => !v.id.startsWith('demo-'));
              if (local.length > 0) {
                setVehicles(local);
                local.forEach((v: Vehicle) => {
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
              const local = loadLocalRecords().filter((r: ServiceRecord) => !r.id.startsWith('rec-') && !r.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                setRecords(local);
                local.forEach((r: ServiceRecord) => {
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

          let hasSeededTransactions = false;
          const unSubTransactionsFS = subscribeFirestoreTransactions(userProfile.uid, familyCode, (cloudTransactions) => {
            if (cloudTransactions.length > 0) {
              hasSeededTransactions = true;
              setTransactions(cloudTransactions);
              saveLocalTransactions(cloudTransactions);
            } else if (hasSeededTransactions) {
              setTransactions([]);
              saveLocalTransactions([]);
            } else {
              hasSeededTransactions = true;
              const local = loadLocalTransactions().filter((t: Transaction) => !t.id.startsWith('rec-'));
              if (local.length > 0) {
                setTransactions(local);
                local.forEach((t: Transaction) => saveFirestoreTransaction(userProfile.uid, t, familyCode));
              } else {
                setTransactions([]);
                saveLocalTransactions([]);
              }
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
              const local = loadLocalReminders().filter((rem: ServiceReminder) => !rem.id.startsWith('rem-') && !rem.vehicleId.startsWith('demo-'));
              if (local.length > 0) {
                setReminders(local);
                local.forEach((rem: ServiceReminder) => {
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
            unSubTransactionsFS();
            unSubRemindersFS();
            unSubRemindersRTDB();
          };
        } else {
          tryAutoSignInGoogle().catch(() => {});
          setStoredFamilyCode('');
          setFamilyCodeState('');
        }
      });

      return () => unsubscribeAuth();
    }
  }, [familyCode]);

  // Persist to local storage
  useEffect(() => {
    saveLocalVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveLocalRecords(records);
  }, [records]);

  useEffect(() => {
    saveLocalTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveLocalReminders(reminders);
  }, [reminders]);

  // Handle vehicle selection safely
  useEffect(() => {
    if (vehicles.length > 0) {
      const exists = vehicles.some(v => v.id === activeVehicleId);
      if (!exists || !activeVehicleId) {
        handleSelectVehicle(vehicles[0].id);
      }
    }
  }, [vehicles, activeVehicleId]);

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || null;

  // Self-heal: when a household is active but has no vehicles yet, a member
  // may still have records referencing a vehicle that only ever lived under
  // their personal users/{uid}/vehicles (created before the household had
  // any vehicles of its own). Promote any such referenced vehicle into the
  // active household scope, reusing the same vehicle ID so the reference
  // keeps resolving.
  useEffect(() => {
    if (!isFirebaseActive || !user || !familyCode || vehicles.length > 0 || records.length === 0) return;

    getPersonalVehiclesOnce(user.uid).then(personalVehicles => {
      const neededIds = new Set(records.map(r => r.vehicleId));
      const toPromote = personalVehicles.filter(v => neededIds.has(v.id));
      if (toPromote.length === 0) return;

      toPromote.forEach(v => {
        saveFirestoreVehicle(user.uid, v, familyCode);
        saveRTDBVehicle(user.uid, v, familyCode);
      });

      setVehicles(prev => {
        const merged = [...prev];
        toPromote.forEach(v => {
          if (!merged.some(m => m.id === v.id)) merged.push(v);
        });
        return merged;
      });
    });
  }, [isFirebaseActive, user, familyCode, vehicles.length, records]);

  // One-time migration: split any pre-refactor record that still carries the
  // old inline date/cost/provider/notes fields into a matching Transaction
  // doc, then overwrite the record to its slim shape. Idempotent — once a
  // record is slimmed it no longer matches the legacy-detection filter.
  useEffect(() => {
    if (!isFirebaseActive || !user || vehicles.length === 0) return;

    const legacyRecords = records.filter((r: any) => r.date !== undefined || r.cost !== undefined);
    if (legacyRecords.length === 0) return;

    legacyRecords.forEach((legacy: any) => {
      const vehicle = vehicles.find(v => v.id === legacy.vehicleId);
      if (!vehicle) {
        console.warn('[Migration] Skipping legacy record — no matching vehicle currently loaded:', legacy.id, 'vehicleId:', legacy.vehicleId);
        return;
      }

      const migratedTransaction: Transaction = {
        id: legacy.id,
        date: legacy.date || new Date().toISOString().split('T')[0],
        time: legacy.time || '00:00',
        amount: Number(legacy.cost) || 0,
        vendor: legacy.provider || 'Unknown',
        notes: legacy.notes || '',
        category: buildTransactionCategory(legacy.category, vehicle),
        paymentType: legacy.paymentType || 'Cash',
        user: legacy.loggedBy?.displayName || user.displayName || 'Car Owner'
      };

      const slimRecord: ServiceRecord = {
        id: legacy.id,
        vehicleId: legacy.vehicleId,
        mileage: legacy.mileage,
        category: legacy.category,
        type: legacy.type,
        nextServiceMileage: legacy.nextServiceMileage,
        nextServiceDate: legacy.nextServiceDate,
        createdAt: legacy.createdAt,
        loggedBy: legacy.loggedBy,
        lastEditedBy: legacy.lastEditedBy
      };

      saveFirestoreTransaction(user.uid, migratedTransaction, familyCode);
      overwriteFirestoreRecord(user.uid, slimRecord, familyCode);
      // RTDB's set() always fully replaces the node at that path, so reusing
      // the normal save function here strips the legacy fields too. Without
      // this, subscribeRTDBRecords keeps re-delivering the unmigrated shape
      // and stomps the Firestore-driven slim state back to legacy.
      saveRTDBRecord(user.uid, slimRecord, familyCode);

      setTransactions(prev => [...prev.filter(t => t.id !== legacy.id), migratedTransaction]);
      setRecords(prev => prev.map(r => r.id === legacy.id ? slimRecord : r));
    });
  }, [records, vehicles, isFirebaseActive, user, familyCode]);

  // Join records with their linked transaction for display. Existing UI
  // components keep reading flat date/cost/provider/notes fields.
  const enrichedRecords: EnrichedServiceRecord[] = useMemo(() => {
    const transactionsById = new Map(transactions.map(t => [t.id, t]));
    return records
      .map((r): EnrichedServiceRecord | null => {
        const t = transactionsById.get(r.id);
        if (!t) return null;
        return {
          ...r,
          date: t.date,
          time: t.time,
          cost: t.amount,
          provider: t.vendor,
          notes: t.notes,
          paymentType: t.paymentType
        };
      })
      .filter((r): r is EnrichedServiceRecord => r !== null)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [records, transactions]);

  // Handlers for Vehicles
  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    const isEdit = vehicles.some(v => v.id === vehicleData.id);
    const timestamp = new Date().toISOString();

    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const existing = vehicles.find(v => v.id === vehicleData.id);

    const newVehicle: Vehicle = {
      ...vehicleData,
      createdAt: isEdit && existing ? existing.createdAt : timestamp,
      updatedAt: timestamp,
      createdBy: isEdit && existing ? (existing.createdBy || auditInfo) : auditInfo,
      lastEditedBy: auditInfo
    };

    setVehicles(prev => {
      const exists = prev.some(v => v.id === newVehicle.id);
      if (exists) {
        return prev.map(v => v.id === newVehicle.id ? newVehicle : v);
      }
      return [newVehicle, ...prev];
    });

    handleSelectVehicle(newVehicle.id);
    setIsVehicleModalOpen(false);

    // Sync to Cloud
    if (user && isFirebaseActive) {
      saveFirestoreVehicle(user.uid, newVehicle, familyCode);
      saveRTDBVehicle(user.uid, newVehicle, familyCode);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle and all associated service records?')) return;
    const removedRecordIds = records.filter(r => r.vehicleId === id).map(r => r.id);

    setVehicles(prev => prev.filter(v => v.id !== id));
    setRecords(prev => prev.filter(r => r.vehicleId !== id));
    setTransactions(prev => prev.filter(t => !removedRecordIds.includes(t.id)));
    setReminders(prev => prev.filter(rem => rem.vehicleId !== id));

    if (activeVehicleId === id) {
      const remaining = vehicles.filter(v => v.id !== id);
      if (remaining.length > 0) {
        handleSelectVehicle(remaining[0].id);
      }
    }

    if (user && isFirebaseActive) {
      deleteFirestoreVehicle(user.uid, id, familyCode);
      deleteRTDBVehicle(user.uid, id, familyCode);
      removedRecordIds.forEach(recordId => {
        deleteFirestoreRecord(user.uid, recordId, familyCode);
        deleteRTDBRecord(user.uid, recordId, familyCode);
        deleteFirestoreTransaction(user.uid, recordId, familyCode);
      });
    }
  };

  // Handlers for Service Records
  const handleSaveRecord = (recordData: Partial<EnrichedServiceRecord>) => {
    if (!activeVehicleId) return;
    const vehicle = vehicles.find(v => v.id === activeVehicleId);
    if (!vehicle) return;

    const isEdit = !!editingRecord;
    const recordId = editingRecord ? editingRecord.id : `rec-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const category = recordData.category || 'General Repair';

    const newRecord: ServiceRecord = {
      id: recordId,
      vehicleId: activeVehicleId,
      mileage: Number(recordData.mileage) || 0,
      category,
      type: recordData.type || 'Maintenance',
      nextServiceMileage: recordData.nextServiceMileage ? Number(recordData.nextServiceMileage) : undefined,
      nextServiceDate: recordData.nextServiceDate || undefined,
      createdAt: isEdit ? editingRecord.createdAt : timestamp,
      loggedBy: isEdit ? (editingRecord.loggedBy || auditInfo) : auditInfo,
      lastEditedBy: auditInfo
    };

    const newTransaction: Transaction = {
      id: recordId,
      date: recordData.date || new Date().toISOString().split('T')[0],
      time: recordData.time || new Date().toTimeString().slice(0, 5),
      amount: Number(recordData.cost) || 0,
      vendor: recordData.provider || 'DIY',
      notes: recordData.notes || '',
      category: buildTransactionCategory(category, vehicle),
      paymentType: recordData.paymentType || 'Cash',
      user: auditInfo?.displayName || 'Car Owner'
    };

    setRecords(prev => {
      const exists = prev.some(r => r.id === recordId);
      if (exists) {
        return prev.map(r => r.id === recordId ? newRecord : r);
      }
      return [newRecord, ...prev];
    });

    setTransactions(prev => {
      const exists = prev.some(t => t.id === recordId);
      if (exists) {
        return prev.map(t => t.id === recordId ? newTransaction : t);
      }
      return [newTransaction, ...prev];
    });

    if (activeVehicle && newRecord.mileage > activeVehicle.currentMileage) {
      const updatedVeh = {
        ...activeVehicle,
        currentMileage: newRecord.mileage,
        updatedAt: timestamp,
        lastEditedBy: auditInfo
      };
      setVehicles(prev => prev.map(v => v.id === activeVehicle.id ? updatedVeh : v));
      if (user && isFirebaseActive) {
        saveFirestoreVehicle(user.uid, updatedVeh, familyCode);
        saveRTDBVehicle(user.uid, updatedVeh, familyCode);
      }
    }

    setIsServiceModalOpen(false);
    setEditingRecord(null);

    if (user && isFirebaseActive) {
      saveFirestoreRecord(user.uid, newRecord, familyCode);
      saveRTDBRecord(user.uid, newRecord, familyCode);
      saveFirestoreTransaction(user.uid, newTransaction, familyCode);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm('Delete this service record log?')) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user && isFirebaseActive) {
      deleteFirestoreRecord(user.uid, id, familyCode);
      deleteRTDBRecord(user.uid, id, familyCode);
      deleteFirestoreTransaction(user.uid, id, familyCode);
    }
  };

  // Handlers for Service Reminders
  const handleSaveReminder = (reminderData: ServiceReminder) => {
    const isEdit = reminders.some(rem => rem.id === reminderData.id);
    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const newReminder: ServiceReminder = {
      ...reminderData,
      createdBy: isEdit ? reminderData.createdBy : auditInfo,
      lastEditedBy: auditInfo
    };

    setReminders(prev => {
      const exists = prev.some(rem => rem.id === newReminder.id);
      if (exists) {
        return prev.map(rem => rem.id === newReminder.id ? newReminder : rem);
      }
      return [newReminder, ...prev];
    });

    setIsReminderModalOpen(false);
    setEditingReminder(null);

    if (user && isFirebaseActive) {
      saveFirestoreReminder(user.uid, newReminder, familyCode);
      saveRTDBReminder(user.uid, newReminder, familyCode);
    }
  };

  const handleToggleCompleteReminder = (reminder: ServiceReminder) => {
    const auditInfo = user ? {
      uid: user.uid,
      displayName: user.displayName || 'Car Owner',
      email: user.email || undefined
    } : undefined;

    const updated = { 
      ...reminder, 
      isCompleted: !reminder.isCompleted,
      lastEditedBy: auditInfo 
    };

    setReminders(prev => prev.map(rem => rem.id === reminder.id ? updated : rem));

    if (user && isFirebaseActive) {
      saveFirestoreReminder(user.uid, updated, familyCode);
      saveRTDBReminder(user.uid, updated, familyCode);
    }
  };

  const handleCompleteAndLogService = (reminder: ServiceReminder) => {
    handleToggleCompleteReminder(reminder);
    setEditingRecord(null);
    setIsServiceModalOpen(true);
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
    setTransactions(loadLocalTransactions());
    setReminders(loadLocalReminders());
  };

  const handleClearDemoData = () => {
    clearDemoData();
    setVehicles([]);
    setRecords([]);
    setTransactions([]);
    setReminders([]);
  };

  const handleRestoreSampleData = () => {
    restoreSampleData();
    const freshVehicles = loadLocalVehicles();
    setVehicles(freshVehicles);
    setRecords(loadLocalRecords());
    setTransactions(loadLocalTransactions());
    setReminders(loadLocalReminders());
    if (freshVehicles.length > 0) {
      handleSelectVehicle(freshVehicles[0].id);
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

  const unreadRemindersCount = reminders.filter(rem => !rem.isCompleted).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 lg:pb-0">
      
      {/* Top Banner Navigation Header */}
      <Navbar
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={handleSelectVehicle}
        onOpenAddVehicle={() => {
          setIsVehicleModalOpen(true);
        }}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenAbout={() => setActiveTab('about')}
        isOnline={isOnline}
        isFirebaseActive={isFirebaseActive}
        user={user}
        familyCode={familyCode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            activeVehicle={activeVehicle}
            records={enrichedRecords}
            reminders={reminders}
            onOpenAddService={() => {
              setEditingRecord(null);
              setIsServiceModalOpen(true);
            }}
            onOpenAddVehicle={() => {
              setIsVehicleModalOpen(true);
            }}
            onOpenAddReminder={() => {
              setEditingReminder(null);
              setIsReminderModalOpen(true);
            }}
            onSelectTab={(tab: 'history' | 'reminders' | 'analytics' | 'vehicles') => setActiveTab(tab)}
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
            records={enrichedRecords}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onOpenAddService={() => {
              setEditingRecord(null);
              setIsServiceModalOpen(true);
            }}
            onEditRecord={(rec: EnrichedServiceRecord) => {
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
            records={enrichedRecords}
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

        {activeTab === 'about' && (
          <AboutPage 
            onOpenSettings={() => setActiveTab('settings')}
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

      {/* Navigation Bar */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadRemindersCount={unreadRemindersCount}
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

export default App;
