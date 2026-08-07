import type { EnrichedRefuelRecord } from '../types';

export interface VehicleMpgStats {
  recentMpg: number | null;
  averageMpg: number | null;
  recordsWithMpg: EnrichedRefuelRecord[];
  totalMilesTracked: number;
  totalGallonsFilled: number;
  totalSpent: number;
}

/**
 * Calculates MPG metrics for a given list of enriched refuel records.
 * Records are sorted chronologically by odometer (and date/time) before computing intervals.
 */
export const calculateVehicleMpgStats = (records: EnrichedRefuelRecord[]): VehicleMpgStats => {
  if (!records || records.length === 0) {
    return {
      recentMpg: null,
      averageMpg: null,
      recordsWithMpg: [],
      totalMilesTracked: 0,
      totalGallonsFilled: 0,
      totalSpent: 0
    };
  }

  // Sort records chronologically ascending: lowest odometer first
  const sorted = [...records].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    const dateA = `${a.date}T${a.time || '00:00'}`;
    const dateB = `${b.date}T${b.time || '00:00'}`;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  let totalGallonsFilled = 0;
  let totalSpent = 0;

  sorted.forEach(r => {
    totalGallonsFilled += r.gallons || 0;
    totalSpent += r.amountPaid || 0;
  });

  // Calculate MPG intervals
  const calculatedIntervals: number[] = [];
  let prevFullIndex = -1;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (current.isFullTank) {
      if (prevFullIndex !== -1) {
        const prevFull = sorted[prevFullIndex];
        const milesTraveled = current.odometer - prevFull.odometer;

        // Sum gallons from prevFullIndex + 1 to i (inclusive)
        let intervalGallons = 0;
        for (let j = prevFullIndex + 1; j <= i; j++) {
          intervalGallons += sorted[j].gallons || 0;
        }

        if (milesTraveled > 0 && intervalGallons > 0) {
          const mpg = milesTraveled / intervalGallons;
          current.calculatedMpg = Math.round(mpg * 100) / 100;
          calculatedIntervals.push(current.calculatedMpg);
        }
      }
      prevFullIndex = i;
    }
  }

  const recentMpg = calculatedIntervals.length > 0
    ? calculatedIntervals[calculatedIntervals.length - 1]
    : null;

  const averageMpg = calculatedIntervals.length > 0
    ? Math.round((calculatedIntervals.reduce((acc, val) => acc + val, 0) / calculatedIntervals.length) * 100) / 100
    : null;

  const minOdo = sorted[0].odometer;
  const maxOdo = sorted[sorted.length - 1].odometer;
  const totalMilesTracked = Math.max(0, maxOdo - minOdo);

  // Return records in descending order (most recent first) with calculatedMpg attached
  const recordsWithMpg = [...sorted].sort((a, b) => {
    if (a.odometer !== b.odometer) return b.odometer - a.odometer;
    const dateA = `${a.date}T${a.time || '00:00'}`;
    const dateB = `${b.date}T${b.time || '00:00'}`;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return {
    recentMpg,
    averageMpg,
    recordsWithMpg,
    totalMilesTracked,
    totalGallonsFilled: Math.round(totalGallonsFilled * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100
  };
};
