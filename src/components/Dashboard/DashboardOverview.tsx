import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Gauge,
  Wrench,
  AlertTriangle,
  PlusCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Edit3,
  Car,
  Tag,
  ReceiptText,
  Fuel,
  Zap,
  Clock,
  Droplet,
  Archive,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Vehicle, EnrichedServiceRecord, EnrichedRefuelRecord, ServiceReminder } from '../../types';
import { calculateVehicleMpgStats } from '../../utils/mpg';
import { getAccountColorStyle } from '../../utils/accountColors';

interface DashboardOverviewProps {
  activeVehicle: Vehicle | null;
  vehicles?: Vehicle[];
  onSelectVehicle?: (id: string) => void;
  records: EnrichedServiceRecord[];
  refuelRecords: EnrichedRefuelRecord[];
  reminders: ServiceReminder[];
  onOpenAddService: () => void;
  onOpenAddRefuel?: () => void;
  onOpenAddVehicle: () => void;
  onOpenAddReminder: () => void;
  onSelectTab: (tab: 'history' | 'reminders' | 'analytics' | 'vehicles' | 'refuels') => void;
  onUpdateMileage?: (vehicleId: string, newMileage: number) => void;
  onUnarchiveVehicle?: (vehicleId: string) => void;
  onEditService?: (record: EnrichedServiceRecord) => void;
  onEditRefuel?: (record: EnrichedRefuelRecord) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activeVehicle,
  vehicles = [],
  onSelectVehicle,
  records,
  refuelRecords,
  reminders,
  onOpenAddService,
  onOpenAddRefuel,
  onOpenAddVehicle,
  onOpenAddReminder,
  onSelectTab,
  onUpdateMileage,
  onUnarchiveVehicle,
  onEditService,
  onEditRefuel
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [activityTab, setActivityTab] = useState<'all' | 'services' | 'refuels'>('all');

  const vehicleMap = useMemo(() => {
    return new Map(vehicles.map(v => [v.id, v]));
  }, [vehicles]);

  const isAllVehicles = selectedVehicleId === 'all';
  const currentVehicle = isAllVehicles
    ? null
    : (vehicles.find(v => v.id === selectedVehicleId) || activeVehicle || vehicles[0] || null);

  const [mileageInput, setMileageInput] = useState(currentVehicle?.currentMileage?.toString() || '');

  // Keep mileageInput in sync when currentVehicle changes
  React.useEffect(() => {
    if (currentVehicle) {
      setMileageInput(currentVehicle.currentMileage?.toString() || '');
      setIsEditingMileage(false);
    }
  }, [currentVehicle?.id, currentVehicle?.currentMileage]);

  const vehicleRecords = useMemo(
    () => isAllVehicles
      ? records
      : (currentVehicle ? records.filter(r => r.vehicleId === currentVehicle.id) : []),
    [records, currentVehicle, isAllVehicles]
  );

  const vehicleRefuelRecords = useMemo(
    () => isAllVehicles
      ? refuelRecords
      : (currentVehicle ? refuelRecords.filter(r => r.vehicleId === currentVehicle.id) : []),
    [refuelRecords, currentVehicle, isAllVehicles]
  );
  
  const mpgStats = useMemo(() => calculateVehicleMpgStats(vehicleRefuelRecords), [vehicleRefuelRecords]);
  
  const mpgChartData = useMemo(() => mpgStats.recordsWithMpg
    .filter(r => r.calculatedMpg !== undefined && r.calculatedMpg !== null)
    .map(r => ({ date: r.date.slice(5), mpg: Number((r.calculatedMpg || 0).toFixed(1)), station: r.vendor, odometer: r.odometer }))
    .reverse(), [mpgStats]);

  // Combined recent activities (services & refuels)
  const combinedRecentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      rawRecord: EnrichedServiceRecord | EnrichedRefuelRecord;
      vehicleId: string;
      vehicleName: string;
      paymentType: string;
      date: string;
      title: string;
      subtitle: string;
      cost: number;
      badgeText: string;
      badgeType: string;
      isRefuel: boolean;
      isTaxDeductible?: boolean;
    }> = [];

    if (activityTab === 'all' || activityTab === 'services') {
      vehicleRecords.forEach(r => {
        const v = vehicleMap.get(r.vehicleId);
        const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle';
        list.push({
          id: `service-${r.id}`,
          rawRecord: r,
          vehicleId: r.vehicleId,
          vehicleName,
          paymentType: r.paymentType || 'Cash',
          date: r.date,
          title: r.category,
          subtitle: `${r.provider || 'Self / DIY'} • ${r.mileage.toLocaleString()} mi`,
          cost: r.cost,
          badgeText: r.type,
          badgeType: r.type,
          isRefuel: false,
          isTaxDeductible: r.isTaxDeductible
        });
      });
    }

    if (activityTab === 'all' || activityTab === 'refuels') {
      vehicleRefuelRecords.forEach(r => {
        const v = vehicleMap.get(r.vehicleId);
        const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle';
        list.push({
          id: `refuel-${r.id}`,
          rawRecord: r,
          vehicleId: r.vehicleId,
          vehicleName,
          paymentType: r.paymentType || 'Cash',
          date: r.date,
          title: r.vendor ? `${r.vendor} Refuel` : 'Fuel Refuel',
          subtitle: `${r.gallons.toFixed(2)} gal @ $${r.pricePerGallon.toFixed(3)} • ${r.odometer.toLocaleString()} mi`,
          cost: r.amountPaid,
          badgeText: r.isFullTank ? 'Full Tank' : 'Partial',
          badgeType: 'Fuel',
          isRefuel: true
        });
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [vehicleRecords, vehicleRefuelRecords, activityTab, vehicleMap]);

  // If no vehicles exist in the app
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-900/60 rounded-2xl border border-slate-800 my-4">
        <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">No Vehicles in Garage</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-5">
          Add your first vehicle profile to start tracking service logs, refuelings, and maintenance reminders.
        </p>
        <button
          onClick={onOpenAddVehicle}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Add First Vehicle
        </button>
      </div>
    );
  }

  // Calculate metrics
  const totalServiceSpent = vehicleRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalFuelSpent = vehicleRefuelRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalSpent = totalServiceSpent + totalFuelSpent;

  const totalMilesDriven = isAllVehicles
    ? vehicles.reduce((sum, v) => sum + Math.max(0, v.currentMileage - v.startingMileage), 0)
    : (currentVehicle ? Math.max(1, currentVehicle.currentMileage - currentVehicle.startingMileage) : 1);

  const totalFleetMileage = vehicles.reduce((sum, v) => sum + v.currentMileage, 0);
  const costPerMile = totalMilesDriven > 0 && totalSpent > 0 ? (totalSpent / totalMilesDriven).toFixed(3) : '0.000';

  const vehicleReminders = isAllVehicles
    ? reminders.filter(r => !r.isCompleted)
    : reminders.filter(r => currentVehicle && r.vehicleId === currentVehicle.id && !r.isCompleted);

  const overdueReminders = vehicleReminders.filter(r => {
    const v = vehicleMap.get(r.vehicleId) || currentVehicle;
    if (r.dueMileage && v && v.currentMileage >= r.dueMileage) return true;
    if (r.dueDate && new Date(r.dueDate) <= new Date()) return true;
    return false;
  });

  const upcomingReminders = vehicleReminders.filter(r => !overdueReminders.includes(r)).slice(0, 3);

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(mileageInput, 10);
    if (!isNaN(val) && val >= 0 && currentVehicle) {
      if (onUpdateMileage) onUpdateMileage(currentVehicle.id, val);
      setIsEditingMileage(false);
    }
  };

  const isArchived = Boolean(!isAllVehicles && currentVehicle?.isArchived);

  return (
    <div className="space-y-3">
      
      {/* Archived Vehicle Banner (when active single vehicle is archived) */}
      {isArchived && currentVehicle && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Archived Vehicle (Read-Only Mode)
                </span>
                {currentVehicle.archivedAt && (
                  <span className="text-[11px] text-amber-400/80">
                    • Archived {new Date(currentVehicle.archivedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {currentVehicle.archiveReason ? (
                  <span><strong>Reason:</strong> {currentVehicle.archiveReason}</span>
                ) : (
                  'This vehicle is archived. All historical records & analytics are preserved, but no new logs can be created.'
                )}
              </p>
            </div>
          </div>
          {onUnarchiveVehicle && (
            <button
              onClick={() => onUnarchiveVehicle(currentVehicle.id)}
              className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 px-3.5 py-2 rounded-xl border border-emerald-800/80 transition-all self-end sm:self-auto flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Vehicle
            </button>
          )}
        </div>
      )}

      {/* Top Compact Command Bar: Vehicle Switcher, Meta & Fast Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-3 shadow-md space-y-2.5">
        
        {/* Full-Width Vehicle Selector Row (with All Vehicles Option) */}
        {vehicles.length > 0 && (
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">
              Dashboard View:
            </span>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVehicleId(val);
                if (val !== 'all' && onSelectVehicle) {
                  onSelectVehicle(val);
                }
              }}
              className="w-full flex-1 bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-extrabold text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-inner tracking-tight truncate transition-all"
            >
              <option value="all" className="bg-slate-900 text-cyan-300 font-bold text-xs sm:text-sm">
                🌐 All Vehicles ({vehicles.length} in Garage)
              </option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100 font-medium text-xs sm:text-sm">
                  🚘 {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi){v.isArchived ? ' [Archived]' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          
          {/* Left: Vehicle Identity / Fleet Overview Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isAllVehicles ? (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border border-cyan-500/30 bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 text-cyan-400 shadow">
                <Car className="w-6 h-6" />
              </div>
            ) : currentVehicle?.photoUrl ? (
              <img
                src={currentVehicle.photoUrl}
                alt={`${currentVehicle.make} ${currentVehicle.model}`}
                className={`w-11 h-11 rounded-lg object-cover border shrink-0 shadow ${
                  isArchived ? 'border-amber-500/40 grayscale-[40%]' : 'border-cyan-500/40'
                }`}
              />
            ) : (
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow ${
                isArchived
                  ? 'bg-gradient-to-tr from-amber-800/80 to-slate-800/80'
                  : 'bg-gradient-to-tr from-cyan-600/80 to-blue-600/80'
              }`}>
                <Car className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {isAllVehicles ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                      Garage & Fleet Overview
                    </h1>
                    <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.2 rounded">
                      All Vehicles
                    </span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                      {vehicles.filter(v => !v.isArchived).length} Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Showing aggregated records, stats, and reminders across {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
                  </p>
                </div>
              ) : currentVehicle ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                    </h1>

                    {isArchived ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Archive className="w-3 h-3" /> Archived
                      </span>
                    ) : (
                      <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                        {currentVehicle.fuelType}
                      </span>
                    )}
                    {currentVehicle.licensePlate && (
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                        {currentVehicle.licensePlate}
                      </span>
                    )}
                  </div>

                  {currentVehicle.vin && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      VIN: {currentVehicle.vin}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Middle: Inline Odometer Counter or Fleet Mileage */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 shrink-0 justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isAllVehicles ? 'Fleet Mileage:' : 'Odometer:'}
              </span>
            </div>

            {isAllVehicles ? (
              <span className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">
                {totalFleetMileage.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">mi total</span>
              </span>
            ) : isEditingMileage && !isArchived && currentVehicle ? (
              <form onSubmit={handleMileageSubmit} className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="w-24 bg-slate-900 border border-cyan-500 text-white text-xs rounded px-1.5 py-0.5 font-mono focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMileage(false)}
                  className="text-slate-400 hover:text-slate-200 text-[11px] px-1"
                >
                  ✕
                </button>
              </form>
            ) : currentVehicle ? (
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">
                  {currentVehicle.currentMileage.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">mi</span>
                </span>
                {!isArchived && (
                  <button
                    onClick={() => {
                      setMileageInput(currentVehicle.currentMileage.toString());
                      setIsEditingMileage(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded hover:bg-slate-800"
                    title="Update Odometer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              onClick={onOpenAddService}
              disabled={isArchived}
              className="flex-1 sm:flex-initial bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm shadow-cyan-500/20 transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title={isArchived ? 'Vehicle is archived (read-only)' : 'Log Service'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Service</span>
            </button>

            {onOpenAddRefuel && (
              <button
                onClick={onOpenAddRefuel}
                disabled={isArchived}
                className="flex-1 sm:flex-initial bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isArchived ? 'Vehicle is archived (read-only)' : 'Log Fuel'}
              >
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Refuel</span>
              </button>
            )}

            <button
              onClick={onOpenAddReminder}
              disabled={isArchived}
              className="flex-1 sm:flex-initial bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title={isArchived ? 'Vehicle is archived (read-only)' : 'Set Reminder'}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Reminder</span>
            </button>
          </div>

        </div>
      </div>

      {/* Overdue Alerts Strip (Only shows when overdue exists) */}
      {overdueReminders.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/80 via-amber-950/70 to-red-950/80 border border-amber-500/50 rounded-xl px-3 py-2 flex items-center justify-between gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-200 mr-2">
                {overdueReminders.length} Maintenance Due:
              </span>
              <span className="text-[11px] text-amber-300/80 truncate">
                {overdueReminders.map(r => {
                  const v = vehicleMap.get(r.vehicleId);
                  return isAllVehicles && v ? `${r.title} (${v.year} ${v.model})` : r.title;
                }).join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('reminders')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all shadow"
          >
            Review
          </button>
        </div>
      )}

      {/* High-Density KPI Grid — 3 cols on mobile, 6 on desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        
        {/* Total Cost Spent */}
        <div
          onClick={() => onSelectTab('analytics')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Spent</span>
            <DollarSign className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>Svc + Fuel</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
        </div>

        {/* Cost Per Mile */}
        <div
          onClick={() => onSelectTab('analytics')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cost / Mile</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            ${costPerMile}<span className="text-[10px] font-normal text-slate-400">/mi</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>{totalMilesDriven.toLocaleString()} mi</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </div>
        </div>

        {/* Total Service Logs */}
        <div
          onClick={() => onSelectTab('history')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Services</span>
            <Wrench className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {vehicleRecords.length} <span className="text-[10px] font-normal text-slate-400">logs</span>
          </div>
          <div className="text-[10px] text-cyan-400 flex items-center justify-between mt-0.5">
            <span>View Logs</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
          </div>
        </div>

        {/* Recent MPG / Total Refuels */}
        <div
          onClick={() => onSelectTab('refuels')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isAllVehicles ? 'Total Refuels' : 'Recent MPG'}
            </span>
            <Zap className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {isAllVehicles ? (
              <span>{vehicleRefuelRecords.length} <span className="text-[10px] font-normal text-emerald-400">fills</span></span>
            ) : (
              <span>{mpgStats.recentMpg !== null ? mpgStats.recentMpg.toFixed(1) : 'N/A'} <span className="text-[10px] font-normal text-emerald-400">MPG</span></span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>{isAllVehicles ? `${vehicles.length} vehicles` : 'Last fill-up'}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </div>
        </div>

        {/* Avg MPG / Fuel Spent */}
        <div
          onClick={() => onSelectTab('refuels')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isAllVehicles ? 'Fuel Spent' : 'Avg MPG'}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {isAllVehicles ? (
              <span>${totalFuelSpent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            ) : (
              <span>{mpgStats.averageMpg !== null ? mpgStats.averageMpg.toFixed(1) : 'N/A'} <span className="text-[10px] font-normal text-cyan-400">MPG</span></span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>{vehicleRefuelRecords.length} refuels</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
        </div>

        {/* Active Reminders */}
        <div
          onClick={() => onSelectTab('reminders')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Alerts</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {vehicleReminders.length} <span className="text-[10px] font-normal text-slate-400">active</span>
          </div>
          <div className="text-[10px] text-amber-400 flex items-center justify-between mt-0.5">
            <span>{overdueReminders.length > 0 ? `${overdueReminders.length} overdue` : 'Up to date'}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
          </div>
        </div>

      </div>

      {/* Main Multi-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column (8 of 12 columns on desktop - 66.6%) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Fuel Efficiency Chart / Fleet Fuel Overview */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  {isAllVehicles ? 'Fleet Fuel Overview' : 'Fuel Economy Trend'}
                </h2>
                {!isAllVehicles && mpgChartData.length >= 2 && mpgStats.averageMpg && (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                    Avg: {mpgStats.averageMpg.toFixed(1)} MPG
                  </span>
                )}
              </div>
              <button
                onClick={() => onSelectTab('refuels')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                Log Refuel <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {!isAllVehicles && mpgChartData.length >= 2 ? (
              <div className="h-40 w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mpgChartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                      formatter={(value: any) => [`${value} MPG`, 'Fuel Economy']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="mpg"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : isAllVehicles ? (
              <div className="py-4 px-3 bg-slate-950/50 rounded-lg border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-400">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      ${totalFuelSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Fuel Spent Across Fleet
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {vehicleRefuelRecords.length} refuelings logged across {vehicles.length} vehicles. Select a specific vehicle above to view its MPG graph.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTab('refuels')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 self-start sm:self-auto"
                >
                  View Refuel Logs
                </button>
              </div>
            ) : (
              <div className="py-6 flex items-center justify-between px-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Need at least 2 full tank refuels to plot MPG curve</p>
                    <p className="text-[10px] text-slate-500">Currently logged: {vehicleRefuelRecords.length} refuelings</p>
                  </div>
                </div>
                {onOpenAddRefuel && (
                  <button
                    onClick={onOpenAddRefuel}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-md transition-all shrink-0"
                  >
                    + Add Refuel
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Activity Feed (Unified Services & Refuels) */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white">Recent Activity Log</h2>
                
                {/* Filter Pills */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-semibold">
                  <button
                    onClick={() => setActivityTab('all')}
                    className={`px-2 py-0.5 rounded ${activityTab === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActivityTab('services')}
                    className={`px-2 py-0.5 rounded ${activityTab === 'services' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setActivityTab('refuels')}
                    className={`px-2 py-0.5 rounded ${activityTab === 'refuels' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Refuels
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab(activityTab === 'refuels' ? 'refuels' : 'history')}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                >
                  View Full History <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {combinedRecentActivities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/40 rounded-lg border border-slate-800/40">
                <p>No recent activity found {isAllVehicles ? 'in your garage.' : 'for this vehicle.'}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={onOpenAddService}
                    className="text-cyan-400 hover:underline font-semibold text-xs"
                  >
                    + Log Service
                  </button>
                  {onOpenAddRefuel && (
                    <>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={onOpenAddRefuel}
                        className="text-emerald-400 hover:underline font-semibold text-xs"
                      >
                        + Add Refuel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {combinedRecentActivities.map((item) => {
                  const handleEdit = () => {
                    if (item.isRefuel) {
                      onEditRefuel?.(item.rawRecord as EnrichedRefuelRecord);
                    } else {
                      onEditService?.(item.rawRecord as EnrichedServiceRecord);
                    }
                  };

                  const accountStyle = getAccountColorStyle(item.paymentType);

                  return (
                    <div
                      key={item.id}
                      onClick={handleEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEdit();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`Click to edit ${item.isRefuel ? 'refuel' : 'service'} record`}
                      aria-label={`Edit ${item.title}`}
                      className="group py-2.5 px-2.5 flex items-center justify-between gap-3 hover:bg-slate-800/50 active:bg-slate-800/80 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-700/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                      {/* Column 1: Date */}
                      <div className="w-16 sm:w-20 shrink-0 font-mono text-[11px] text-slate-400 font-medium">
                        {item.date}
                      </div>

                      {/* Column 2: Activity Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          item.isRefuel
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/40'
                        }`}>
                          {item.isRefuel ? <Fuel className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                              {item.title}
                            </span>
                            
                            {/* Vehicle Tag Pill in All Vehicles Mode */}
                            {isAllVehicles && (
                              <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/70 px-1.5 py-0.2 rounded inline-flex items-center gap-1 truncate max-w-[130px]">
                                <Car className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{item.vehicleName}</span>
                              </span>
                            )}

                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                              item.badgeType === 'Repair' ? 'bg-red-950 text-red-400 border-red-800/60' :
                              item.badgeType === 'Maintenance' ? 'bg-cyan-950 text-cyan-400 border-cyan-800/60' :
                              item.badgeType === 'Upgrade' ? 'bg-purple-950 text-purple-400 border-purple-800/60' :
                              item.badgeType === 'Fee / Tax' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60' :
                              item.badgeType === 'Inspection' ? 'bg-amber-950 text-amber-400 border-amber-800/60' :
                              item.badgeType === 'Fuel' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {item.badgeText}
                            </span>
                            {item.isTaxDeductible && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-0.5">
                                <ReceiptText className="w-2.5 h-2.5" /> Tax
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Amount & Payment Type (Account) Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1 text-right min-w-[85px] sm:min-w-[110px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 group-hover:border-slate-700 transition-colors">
                            ${item.cost.toFixed(2)}
                          </span>
                          <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all hidden sm:inline-block" />
                        </div>
                        {item.paymentType && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-tight truncate max-w-[105px] sm:max-w-[140px] ${accountStyle.bg} ${accountStyle.border} ${accountStyle.text}`}>
                            <CreditCard className={`w-2.5 h-2.5 shrink-0 ${accountStyle.icon}`} />
                            <span className="truncate">{item.paymentType}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 of 12 columns on desktop - 33.3%) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Upcoming Reminders Widget */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  {isAllVehicles ? 'Fleet Maintenance' : 'Upcoming Service'}
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('reminders')}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
              >
                All ({vehicleReminders.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingReminders.length === 0 && overdueReminders.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs bg-slate-950/40 rounded-lg border border-slate-800/40">
                <p className="text-[11px] text-slate-400">All maintenance is up to date!</p>
                <button
                  onClick={onOpenAddReminder}
                  className="text-[11px] text-amber-400 font-semibold mt-1 inline-flex items-center gap-1 hover:underline"
                >
                  <PlusCircle className="w-3 h-3" /> Set Next Reminder
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Highlight Overdue if present */}
                {overdueReminders.slice(0, 2).map((r) => {
                  const v = vehicleMap.get(r.vehicleId);
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectTab('reminders')}
                      className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center justify-between gap-2 cursor-pointer hover:bg-red-950/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-xs font-bold text-red-300 truncate">
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="truncate">{r.title}</span>
                          {isAllVehicles && v && (
                            <span className="text-[9px] font-normal text-red-400/80 truncate">({v.year} {v.model})</span>
                          )}
                        </div>
                        <p className="text-[10px] text-red-400/80">
                          {r.dueMileage ? `Due at ${r.dueMileage.toLocaleString()} mi` : `Due on ${r.dueDate}`}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded border border-red-700 shrink-0">
                        Overdue
                      </span>
                    </div>
                  );
                })}

                {/* Upcoming */}
                {upcomingReminders.map((r) => {
                  const v = vehicleMap.get(r.vehicleId) || currentVehicle;
                  const milesLeft = r.dueMileage && v ? r.dueMileage - v.currentMileage : null;
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectTab('reminders')}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-200 truncate">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{r.title}</span>
                          {isAllVehicles && v && (
                            <span className="text-[9px] text-slate-400 truncate font-normal">({v.year} {v.model})</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {milesLeft !== null && milesLeft > 0
                            ? `In ${milesLeft.toLocaleString()} mi`
                            : r.dueDate
                            ? `Due: ${r.dueDate}`
                            : 'Pending'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 font-medium shrink-0">
                        {r.dueMileage ? `${r.dueMileage.toLocaleString()} mi` : r.dueDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicle Spec / Fleet Matrix */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-cyan-400" />
              {isAllVehicles ? 'Garage & Fleet Matrix' : 'Vehicle Specifications'}
            </h2>
            {isAllVehicles ? (
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Fleet Mileage</span>
                  <span className="font-mono text-slate-200 font-bold text-[11px]">{totalFleetMileage.toLocaleString()} mi</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Tracked Miles</span>
                  <span className="font-mono text-cyan-400 font-bold text-[11px]">{totalMilesDriven.toLocaleString()} mi</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Total Vehicles</span>
                  <span className="text-slate-200 font-semibold text-[11px]">{vehicles.length} ({vehicles.filter(v => !v.isArchived).length} Active)</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Total Logs</span>
                  <span className="font-mono text-slate-200 font-bold text-[11px]">
                    {records.length + refuelRecords.length} records
                  </span>
                </div>
              </div>
            ) : currentVehicle ? (
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Starting Mileage</span>
                  <span className="font-mono text-slate-200 font-bold text-[11px]">{currentVehicle.startingMileage.toLocaleString()} mi</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Tracked Miles</span>
                  <span className="font-mono text-cyan-400 font-bold text-[11px]">{totalMilesDriven.toLocaleString()} mi</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Fuel System</span>
                  <span className="text-slate-200 font-semibold text-[11px]">{currentVehicle.fuelType}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">License Plate</span>
                  <span className="font-mono text-slate-200 font-bold text-[11px] uppercase">
                    {currentVehicle.licensePlate || 'N/A'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Hub Navigation */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-2.5 shadow-sm">
            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              <button
                onClick={() => onSelectTab('analytics')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Cost Analytics</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => onSelectTab('vehicles')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Vehicle Garage</span>
                <Car className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => onSelectTab('refuels')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Refuel Logs</span>
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                onClick={() => onSelectTab('reminders')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Reminders</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardOverview;
