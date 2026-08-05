import type { ServiceCategory, Vehicle } from '../types';

export const buildTransactionCategory = (category: ServiceCategory, vehicle: Vehicle): string =>
  `Car - ${category} - ${vehicle.year} - ${vehicle.make} ${vehicle.model}`;
