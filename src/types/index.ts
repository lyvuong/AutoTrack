export type FuelType = 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric' | 'Flex-Fuel';

export interface UserAuditInfo {
  uid: string;
  displayName: string;
  email?: string;
}

export interface HouseholdMetadata {
  code: string;
  passcode: string;
  createdBy: UserAuditInfo;
  createdAt: string;
  members: UserAuditInfo[];
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  startingMileage: number;
  currentMileage: number;
  fuelType: FuelType;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAuditInfo;
  lastEditedBy?: UserAuditInfo;
  isArchived?: boolean;
  archivedAt?: string;
  archiveReason?: string;
}

export type ServiceCategory = 
  | 'Oil Change'
  | 'Brakes'
  | 'Tires & Alignment'
  | 'Engine & Transmission'
  | 'Battery & Electrical'
  | 'Suspension & Steering'
  | 'HVAC / AC'
  | 'Scheduled Maintenance'
  | 'General Repair'
  | 'Detailing & Body'
  | 'Registration'
  | 'Safety Inspection'
  | 'Emission Inspection'
  | 'Property Tax'
  | 'Insurance'
  | 'Parking'
  | 'Traffic Tickets'
  | 'Tolls'
  | 'Decal & License'
  | 'Inspection & Registration'
  | 'Fuel Log'
  | 'Other';

export type ServiceType = 'Maintenance' | 'Repair' | 'Upgrade' | 'Inspection' | 'Fee / Tax' | 'Other Expense';

export interface PaymentTypeItem {
  id: string;
  name: string;
  ownerUid?: string;
  ownerName?: string;
  isSystemDefault?: boolean;
  isDefault?: boolean;
  createdAt?: string;
}

export type PaymentType = string;

// Generic, app-agnostic ledger entry. Shared across any app on this Firebase
// project (users/{uid}/transactions or households/{code}/transactions) — not
// AutoTrack-specific. Shares its document ID 1:1 with the ServiceRecord that
// created it.
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  vendor: string;
  notes?: string;
  category: string;
  paymentType: PaymentType;
  user: string;
  isTaxDeductible?: boolean;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  mileage: number;
  category: ServiceCategory;
  type: ServiceType;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  createdAt: string;
  loggedBy?: UserAuditInfo;
  lastEditedBy?: UserAuditInfo;
  isTaxDeductible?: boolean;
}

// Read-side join of a ServiceRecord with its linked Transaction. Never
// persisted directly — built in-memory so existing UI can keep reading
// date/cost/provider/notes as flat fields.
export interface EnrichedServiceRecord extends ServiceRecord {
  date: string;
  time: string;
  cost: number;
  provider: string;
  notes?: string;
  paymentType: PaymentType;
  isTaxDeductible?: boolean;
}

export interface RefuelRecord {
  id: string;
  vehicleId: string;
  odometer: number;
  isFullTank: boolean; // true = Full, false = Partial
  gallons: number;
  createdAt: string;
  loggedBy?: UserAuditInfo;
  lastEditedBy?: UserAuditInfo;
}

// Read-side join of a RefuelRecord with its linked Transaction, plus the
// client-computed price-per-gallon and (for full-tank entries that close an
// interval) calculatedMpg. Never persisted directly.
export interface EnrichedRefuelRecord extends RefuelRecord {
  date: string;
  time: string;
  amountPaid: number;
  vendor: string;
  notes?: string;
  paymentType: PaymentType;
  category: string;
  pricePerGallon: number;
  calculatedMpg?: number;
}

export interface ServiceReminder {
  id: string;
  vehicleId: string;
  title: string;
  category: ServiceCategory;
  dueDate?: string;
  dueMileage?: number;
  intervalMonths?: number;
  intervalMiles?: number;
  isCompleted: boolean;
  notes?: string;
  createdBy?: UserAuditInfo;
  lastEditedBy?: UserAuditInfo;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type ActiveTab = 'dashboard' | 'vehicles' | 'refuels' | 'history' | 'reminders' | 'analytics' | 'settings' | 'about';
