import type { Vehicle, ServiceRecord, ServiceReminder, FirebaseConfig } from '../types';

const VEHICLES_KEY = 'autotrack_vehicles_v1';
const RECORDS_KEY = 'autotrack_records_v1';
const REMINDERS_KEY = 'autotrack_reminders_v1';
const ACTIVE_VEHICLE_KEY = 'autotrack_active_vehicle_id';
const FIREBASE_CONFIG_KEY = 'autotrack_firebase_config_custom';
const FAMILY_CODE_KEY = 'autotrack_family_code';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'demo-v1',
    make: 'Toyota',
    model: 'Tacoma TRD Off-Road',
    year: 2021,
    startingMileage: 12000,
    currentMileage: 48500,
    vin: '5TFCZ5AN3MX123456',
    licensePlate: '7ABC123',
    fuelType: 'Gasoline',
    photoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    notes: 'Primary overland rig. Synthetics only.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-v2',
    make: 'Honda',
    model: 'Civic Si',
    year: 2019,
    startingMileage: 5000,
    currentMileage: 36200,
    vin: '1HGFC1E50KH654321',
    licensePlate: '8XYZ789',
    fuelType: 'Gasoline',
    photoUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
    notes: 'Daily commuter vehicle.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_RECORDS: ServiceRecord[] = [
  {
    id: 'rec-1',
    vehicleId: 'demo-v1',
    date: '2026-06-15',
    mileage: 48000,
    category: 'Oil Change',
    type: 'Maintenance',
    cost: 75.50,
    provider: 'Toyota Dealership Service',
    notes: 'Full synthetic 0W-20 oil change & OEM filter replacement. Tire rotation included.',
    nextServiceMileage: 53000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-2',
    vehicleId: 'demo-v1',
    date: '2026-03-10',
    mileage: 42500,
    category: 'Brakes',
    type: 'Repair',
    cost: 340.00,
    provider: 'Precision Auto Brake Shop',
    notes: 'Replaced front brake pads and resurfaced rotors.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-3',
    vehicleId: 'demo-v2',
    date: '2026-05-20',
    mileage: 35000,
    category: 'Tires & Alignment',
    type: 'Maintenance',
    cost: 680.00,
    provider: 'Discount Tire Co',
    notes: 'Set of 4 Michelin Pilot Sport 4 A/S tires mounted & balanced with alignment.',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_REMINDERS: ServiceReminder[] = [
  {
    id: 'rem-1',
    vehicleId: 'demo-v1',
    title: 'Engine Oil & Filter Change',
    category: 'Oil Change',
    dueMileage: 53000,
    intervalMiles: 5000,
    isCompleted: false,
    notes: 'Mobil 1 Advanced Fuel Economy 0W-20'
  },
  {
    id: 'rem-2',
    vehicleId: 'demo-v1',
    title: 'Cabin & Engine Air Filter Replacement',
    category: 'Scheduled Maintenance',
    dueDate: '2026-09-01',
    intervalMonths: 12,
    isCompleted: false,
    notes: 'OEM Toyota Air Filters'
  },
  {
    id: 'rem-3',
    vehicleId: 'demo-v2',
    title: 'Brake Fluid Flush',
    category: 'Brakes',
    dueDate: '2026-08-15',
    intervalMonths: 24,
    isCompleted: false,
    notes: 'DOT 4 Brake Fluid'
  }
];

export const loadLocalVehicles = (): Vehicle[] => {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local vehicles:', err);
    return INITIAL_VEHICLES;
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
    if (!raw) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local records:', err);
    return INITIAL_RECORDS;
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
    if (!raw) {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local reminders:', err);
    return INITIAL_REMINDERS;
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

export const clearLocalDemoData = clearDemoData;

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

export const getStoredFamilyCode = (): string => {
  return localStorage.getItem(FAMILY_CODE_KEY) || '';
};

export const setStoredFamilyCode = (code: string): void => {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    localStorage.removeItem(FAMILY_CODE_KEY);
  } else {
    localStorage.setItem(FAMILY_CODE_KEY, clean);
  }
};

export const exportRecordsAsCSV = (records: ServiceRecord[], vehicles: Vehicle[]): void => {
  const vehicleMap = new Map(vehicles.map(v => [v.id, `${v.year} ${v.make} ${v.model}`]));
  const headers = ['Vehicle', 'Date', 'Category', 'Type', 'Mileage (mi)', 'Cost ($)', 'Provider', 'Notes'];
  const rows = records.map(r => [
    `"${vehicleMap.get(r.vehicleId) || 'Unknown Vehicle'}"`,
    `"${r.date}"`,
    `"${r.category}"`,
    `"${r.type}"`,
    r.mileage,
    r.cost.toFixed(2),
    `"${(r.provider || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AutoTrack_Service_History_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDataAsJSON = (
  vehicles: Vehicle[], 
  records: ServiceRecord[], 
  reminders: ServiceReminder[]
): void => {
  const backupObj = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    vehicles,
    records,
    reminders
  };
  const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AutoTrack_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importJSONBackup = (jsonString: string): { vehicles: Vehicle[]; records: ServiceRecord[]; reminders: ServiceReminder[] } => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.vehicles || !Array.isArray(data.vehicles)) {
      throw new Error('Invalid JSON backup file structure.');
    }
    const vehicles: Vehicle[] = data.vehicles || [];
    const records: ServiceRecord[] = data.records || [];
    const reminders: ServiceReminder[] = data.reminders || [];

    saveLocalVehicles(vehicles);
    saveLocalRecords(records);
    saveLocalReminders(reminders);

    return { vehicles, records, reminders };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to parse JSON backup file.');
  }
};
