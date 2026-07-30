import type { Vehicle, ServiceRecord, ServiceReminder, FirebaseConfig } from '../types';

const VEHICLES_KEY = 'autotrack_vehicles';
const RECORDS_KEY = 'autotrack_service_records';
const REMINDERS_KEY = 'autotrack_reminders';
const FIREBASE_CONFIG_KEY = 'autotrack_firebase_config';
const ACTIVE_VEHICLE_KEY = 'autotrack_active_vehicle';

// Sample initial demo dataset
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'demo-v1',
    make: 'Toyota',
    model: 'RAV4 Hybrid XSE',
    year: 2022,
    vin: '4T3B1RFV5NU123456',
    licensePlate: '7ABC123',
    startingMileage: 1000,
    currentMileage: 34500,
    fuelType: 'Hybrid',
    photoUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    notes: 'Primary commuter vehicle. Serviced regularly at Toyota Authorized Center.',
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-v2',
    make: 'Ford',
    model: 'Mustang GT Premium',
    year: 2020,
    vin: '1FA6P8CF8L5654321',
    licensePlate: '5V88PWR',
    startingMileage: 4500,
    currentMileage: 18200,
    fuelType: 'Gasoline',
    photoUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80',
    notes: 'Weekend weekend car. 5.0L V8 Engine.',
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_RECORDS: ServiceRecord[] = [
  {
    id: 'rec-1',
    vehicleId: 'demo-v1',
    date: '2026-06-15',
    mileage: 34200,
    cost: 89.99,
    category: 'Oil Change',
    type: 'Maintenance',
    provider: 'Toyota Dealership',
    notes: '0W-20 Full Synthetic Oil + OEM Filter Replacement and multi-point safety inspection.',
    nextServiceMileage: 39200,
    nextServiceDate: '2026-12-15',
    createdAt: new Date(Date.now() - 44 * 86400000).toISOString(),
  },
  {
    id: 'rec-2',
    vehicleId: 'demo-v1',
    date: '2026-04-10',
    mileage: 31000,
    cost: 210.50,
    category: 'Brakes',
    type: 'Maintenance',
    provider: 'Brake Masters',
    notes: 'Front brake pads replaced with ceramic pads. Rotors resurfaced.',
    nextServiceMileage: 61000,
    createdAt: new Date(Date.now() - 110 * 86400000).toISOString(),
  },
  {
    id: 'rec-3',
    vehicleId: 'demo-v1',
    date: '2026-01-20',
    mileage: 28500,
    cost: 650.00,
    category: 'Tires & Alignment',
    type: 'Upgrade',
    provider: 'Discount Tire',
    notes: 'Set of 4 Michelin Defender 2 Tires, computerized 4-wheel alignment & balancing.',
    nextServiceMileage: 34500,
    createdAt: new Date(Date.now() - 190 * 86400000).toISOString(),
  },
  {
    id: 'rec-4',
    vehicleId: 'demo-v1',
    date: '2025-11-05',
    mileage: 25000,
    cost: 45.00,
    category: 'Inspection & Registration',
    type: 'Inspection',
    provider: 'State Emissions Center',
    notes: 'Annual state emissions and safety inspection passed cleanly.',
    createdAt: new Date(Date.now() - 266 * 86400000).toISOString(),
  },
  {
    id: 'rec-5',
    vehicleId: 'demo-v2',
    date: '2026-05-01',
    mileage: 17500,
    cost: 125.00,
    category: 'Oil Change',
    type: 'Maintenance',
    provider: 'DIY / Self',
    notes: 'Motorcraft 5W-50 Full Synthetic Oil & FL-500S Filter change in home garage.',
    nextServiceMileage: 22500,
    createdAt: new Date(Date.now() - 89 * 86400000).toISOString(),
  },
  {
    id: 'rec-6',
    vehicleId: 'demo-v2',
    date: '2025-12-12',
    mileage: 15000,
    cost: 290.00,
    category: 'Battery & Electrical',
    type: 'Repair',
    provider: 'AutoZone Service',
    notes: 'Replaced OEM battery with AGM Duralast Platinum 800 CCA Battery.',
    createdAt: new Date(Date.now() - 229 * 86400000).toISOString(),
  }
];

const INITIAL_REMINDERS: ServiceReminder[] = [
  {
    id: 'rem-1',
    vehicleId: 'demo-v1',
    title: 'Tire Rotation & Balance',
    category: 'Tires & Alignment',
    dueMileage: 34500,
    intervalMiles: 6000,
    isCompleted: false,
    notes: 'Rotate tires every 6,000 miles to preserve tread life.'
  },
  {
    id: 'rem-2',
    vehicleId: 'demo-v1',
    title: 'Cabin Air Filter Replacement',
    category: 'HVAC / AC',
    dueDate: '2026-09-01',
    intervalMonths: 12,
    isCompleted: false,
    notes: 'Replace HEPA cabin air filter for clean AC airflow.'
  },
  {
    id: 'rem-3',
    vehicleId: 'demo-v2',
    title: 'Brake Fluid Flush',
    category: 'Brakes',
    dueMileage: 20000,
    dueDate: '2026-10-15',
    intervalMiles: 15000,
    isCompleted: false,
    notes: 'DOT 4 Brake Fluid flush.'
  }
];

export const loadLocalVehicles = (): Vehicle[] => {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local vehicles:', err);
    return [];
  }
};

export const saveLocalVehicles = (vehicles: Vehicle[]): void => {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (err) {
    console.error('Failed to save local vehicles:', err);
  }
};

export const loadLocalRecords = (): ServiceRecord[] => {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local records:', err);
    return [];
  }
};

export const saveLocalRecords = (records: ServiceRecord[]): void => {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save local records:', err);
  }
};

export const loadLocalReminders = (): ServiceReminder[] => {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local reminders:', err);
    return [];
  }
};

export const saveLocalReminders = (reminders: ServiceReminder[]): void => {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.error('Failed to save local reminders:', err);
  }
};

export const clearDemoData = (): void => {
  try {
    const vehicles = loadLocalVehicles().filter(v => !v.id.startsWith('demo-'));
    const records = loadLocalRecords().filter(r => !r.id.startsWith('rec-') && !r.vehicleId.startsWith('demo-'));
    const reminders = loadLocalReminders().filter(rem => !rem.id.startsWith('rem-') && !rem.vehicleId.startsWith('demo-'));
    saveLocalVehicles(vehicles);
    saveLocalRecords(records);
    saveLocalReminders(reminders);
  } catch (err) {
    console.error('Failed to clear demo data:', err);
  }
};

export const restoreSampleData = (): void => {
  saveLocalVehicles(INITIAL_VEHICLES);
  saveLocalRecords(INITIAL_RECORDS);
  saveLocalReminders(INITIAL_REMINDERS);
};

export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export const setStoredFirebaseConfig = (config: FirebaseConfig | null): void => {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
};

export const getActiveVehicleId = (): string => {
  const active = localStorage.getItem(ACTIVE_VEHICLE_KEY);
  if (active) return active;
  const vehicles = loadLocalVehicles();
  return vehicles.length > 0 ? vehicles[0].id : '';
};

export const setActiveVehicleId = (id: string): void => {
  localStorage.setItem(ACTIVE_VEHICLE_KEY, id);
};

// Data Backup Export & Import Utilities
export const exportDataAsJSON = (): string => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    vehicles: loadLocalVehicles(),
    records: loadLocalRecords(),
    reminders: loadLocalReminders()
  };
  return JSON.stringify(data, null, 2);
};

export const exportRecordsAsCSV = (): string => {
  const records = loadLocalRecords();
  const vehicles = loadLocalVehicles();
  const vehicleMap = new Map(vehicles.map(v => [v.id, `${v.year} ${v.make} ${v.model}`]));

  const headers = ['Date', 'Vehicle', 'Mileage', 'Cost ($)', 'Category', 'Type', 'Provider', 'Notes'];
  const rows = records.map(r => [
    r.date,
    `"${vehicleMap.get(r.vehicleId) || 'Unknown'}"`,
    r.mileage,
    r.cost.toFixed(2),
    `"${r.category}"`,
    r.type,
    `"${r.provider || ''}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const importJSONBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.vehicles) && Array.isArray(data.records)) {
      saveLocalVehicles(data.vehicles);
      saveLocalRecords(data.records);
      if (Array.isArray(data.reminders)) saveLocalReminders(data.reminders);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to import JSON backup:', err);
    return false;
  }
};
