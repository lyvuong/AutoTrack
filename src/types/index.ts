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
  | 'Inspection & Registration'
  | 'Fuel Log'
  | 'Other';

export type ServiceType = 'Maintenance' | 'Repair' | 'Upgrade' | 'Inspection';

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  mileage: number;
  cost: number;
  category: ServiceCategory;
  type: ServiceType;
  provider: string; // e.g. "Toyota Dealership", "DIY", "Firestone"
  notes?: string;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  createdAt: string;
  loggedBy?: UserAuditInfo;
  lastEditedBy?: UserAuditInfo;
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

export type ActiveTab = 'dashboard' | 'vehicles' | 'history' | 'reminders' | 'analytics' | 'settings' | 'about';
