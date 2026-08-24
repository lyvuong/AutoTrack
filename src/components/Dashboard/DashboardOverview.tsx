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
  RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Vehicle, EnrichedServiceRecord, EnrichedRefuelRecord, ServiceReminder } from '../../types';
import { calculateVehicleMpgStats } from '../../utils/mpg';

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
  onUnarchiveVehicle
}) => {
  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [mileageInput, setMileageInput] = useState(activeVehicle?.currentMileage?.toString() || '');
  const [activityTab, setActivityTab] = useState<'all' | 'services' | 'refuels'>('all');

  const vehicleRecords = useMemo(
    () => activeVehicle ? records.filter(r => r.vehicleId === activeVehicle.id) : [],
    [records, activeVehicle]
  );

  const vehicleRefuelRecords = useMemo(
    () => activeVehicle ? refuelRecords.filter(r => r.vehicleId === activeVehicle.id) : [],
    [refuelRecords, activeVehicle]
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
        list.push({
          id: `service-${r.id}`,
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
        list.push({
          id: `refuel-${r.id}`,
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

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [vehicleRecords, vehicleRefuelRecords, activityTab]);

  // If no vehicle exists
  if (!activeVehicle) {
    return (
      <div className="text-center py-12 px-4 bg-slate-900/60 rounded-2xl border border-slate-800 my-4">
        <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">No Vehicle Selected</h2>
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

  // Calculate metrics for active vehicle
  const totalServiceSpent = vehicleRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalFuelSpent = vehicleRefuelRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalSpent = totalServiceSpent + totalFuelSpent;

  const totalMilesDriven = Math.max(1, activeVehicle.currentMileage - activeVehicle.startingMileage);
  const costPerMile = totalSpent > 0 ? (totalSpent / totalMilesDriven).toFixed(3) : '0.000';

  const vehicleReminders = reminders.filter(r => r.vehicleId === activeVehicle.id && !r.isCompleted);
  const overdueReminders = vehicleReminders.filter(r => {
    if (r.dueMileage && activeVehicle.currentMileage >= r.dueMileage) return true;
    if (r.dueDate && new Date(r.dueDate) <= new Date()) return true;
    return false;
  });

  const upcomingReminders = vehicleReminders.filter(r => !overdueReminders.includes(r)).slice(0, 3);

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(mileageInput, 10);
    if (!isNaN(val) && val >= 0 && activeVehicle) {
      if (onUpdateMileage) onUpdateMileage(activeVehicle.id, val);
      setIsEditingMileage(false);
    }
  };

  const isArchived = Boolean(activeVehicle?.isArchived);

  return (
    <div className="space-y-3">
      
      {/* Archived Vehicle Banner (when active vehicle is archived) */}
      {isArchived && activeVehicle && (
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
                {activeVehicle.archivedAt && (
                  <span className="text-[11px] text-amber-400/80">
                    • Archived {new Date(activeVehicle.archivedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {activeVehicle.archiveReason ? (
                  <span><strong>Reason:</strong> {activeVehicle.archiveReason}</span>
                ) : (
                  'This vehicle is archived. All historical records & analytics are preserved, but no new logs can be created.'
                )}
              </p>
            </div>
          </div>
          {onUnarchiveVehicle && (
            <button
              onClick={() => onUnarchiveVehicle(activeVehicle.id)}
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
        
        {/* Full-Width Active Vehicle Selector Row */}
        {vehicles.length > 0 && onSelectVehicle && (
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">
              Active Vehicle:
            </span>
            <select
              value={activeVehicle.id}
              onChange={(e) => onSelectVehicle(e.target.value)}
              className="w-full flex-1 bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-extrabold text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-inner tracking-tight truncate transition-all"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100 font-medium text-xs sm:text-sm">
                  🚘 {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi){v.isArchived ? ' [Archived]' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          
          {/* Left: Vehicle Identity & Specs */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {activeVehicle.photoUrl ? (
              <img
                src={activeVehicle.photoUrl}
                alt={`${activeVehicle.make} ${activeVehicle.model}`}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                </h1>

                {isArchived ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
                    <Archive className="w-3 h-3" /> Archived
                  </span>
                ) : (
                  <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                    {activeVehicle.fuelType}
                  </span>
                )}
                {activeVehicle.licensePlate && (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                    {activeVehicle.licensePlate}
                  </span>
                )}
              </div>

              {activeVehicle.vin && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  VIN: {activeVehicle.vin}
                </p>
              )}
            </div>
          </div>

          {/* Middle: Inline Odometer Counter */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 shrink-0 justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] font-medium hidden sm:inline">Odometer:</span>
            </div>

            {isEditingMileage && !isArchived ? (
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
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">
                  {activeVehicle.currentMileage.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">mi</span>
                </span>
                {!isArchived && (
                  <button
                    onClick={() => {
                      setMileageInput(activeVehicle.currentMileage.toString());
                      setIsEditingMileage(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded hover:bg-slate-800"
                    title="Update Odometer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
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
                {overdueReminders.map(r => r.title).join(', ')}
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

        {/* Recent MPG */}
        <div
          onClick={() => onSelectTab('refuels')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent MPG</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {mpgStats.recentMpg !== null ? mpgStats.recentMpg.toFixed(1) : 'N/A'}{' '}
            <span className="text-[10px] font-normal text-emerald-400">MPG</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>Last fill-up</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </div>
        </div>

        {/* Avg MPG */}
        <div
          onClick={() => onSelectTab('refuels')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group card-hover"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg MPG</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight">
            {mpgStats.averageMpg !== null ? mpgStats.averageMpg.toFixed(1) : 'N/A'}{' '}
            <span className="text-[10px] font-normal text-cyan-400">MPG</span>
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
          
          {/* Fuel Efficiency Chart */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white">Fuel Economy Trend</h2>
                {mpgChartData.length >= 2 && mpgStats.averageMpg && (
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

            {mpgChartData.length >= 2 ? (
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
                <p>No recent activity found for this vehicle.</p>
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
                {combinedRecentActivities.map((item) => (
                  <div
                    key={item.id}
                    className="py-2 sm:py-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        item.isRefuel
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {item.isRefuel ? <Fuel className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-100 truncate">{item.title}</span>
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

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{item.date}</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        ${item.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
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
                <h2 className="text-xs sm:text-sm font-bold text-white">Upcoming Service</h2>
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
                {overdueReminders.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectTab('reminders')}
                    className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center justify-between gap-2 cursor-pointer hover:bg-red-950/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-red-300 truncate">
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="truncate">{r.title}</span>
                      </div>
                      <p className="text-[10px] text-red-400/80">
                        {r.dueMileage ? `Due at ${r.dueMileage.toLocaleString()} mi` : `Due on ${r.dueDate}`}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold uppercase bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded border border-red-700 shrink-0">
                      Overdue
                    </span>
                  </div>
                ))}

                {/* Upcoming */}
                {upcomingReminders.map((r) => {
                  const milesLeft = r.dueMileage ? r.dueMileage - activeVehicle.currentMileage : null;
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

          {/* Vehicle Spec / Lifetime Matrix */}
          <div className="bg-slate-900/85 border border-slate-800/90 rounded-xl p-3 sm:p-4 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-cyan-400" />
              Vehicle Specifications
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Starting Mileage</span>
                <span className="font-mono text-slate-200 font-bold text-[11px]">{activeVehicle.startingMileage.toLocaleString()} mi</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Tracked Miles</span>
                <span className="font-mono text-cyan-400 font-bold text-[11px]">{totalMilesDriven.toLocaleString()} mi</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Fuel System</span>
                <span className="text-slate-200 font-semibold text-[11px]">{activeVehicle.fuelType}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">License Plate</span>
                <span className="font-mono text-slate-200 font-bold text-[11px] uppercase">
                  {activeVehicle.licensePlate || 'N/A'}
                </span>
              </div>
            </div>
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
