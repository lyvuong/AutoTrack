import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';
import type { Vehicle, EnrichedServiceRecord, ServiceReminder } from '../../types';

interface DashboardOverviewProps {
  activeVehicle: Vehicle | null;
  records: EnrichedServiceRecord[];
  reminders: ServiceReminder[];
  onOpenAddService: () => void;
  onOpenAddVehicle: () => void;
  onOpenAddReminder: () => void;
  onSelectTab: (tab: 'history' | 'reminders' | 'analytics' | 'vehicles') => void;
  onUpdateMileage?: (vehicleId: string, newMileage: number) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activeVehicle,
  records,
  reminders,
  onOpenAddService,
  onOpenAddVehicle,
  onOpenAddReminder,
  onSelectTab,
  onUpdateMileage
}) => {
  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [mileageInput, setMileageInput] = useState(activeVehicle?.currentMileage?.toString() || '');

  if (!activeVehicle) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-slate-800 my-8">
        <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Vehicle Selected</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Add your first vehicle profile to start tracking service logs, repair costs, and maintenance reminders.
        </p>
        <button
          onClick={onOpenAddVehicle}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
        >
          + Add First Vehicle
        </button>
      </div>
    );
  }

  // Calculate metrics for active vehicle
  const vehicleRecords = records.filter(r => r.vehicleId === activeVehicle.id);
  const totalSpent = vehicleRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalMilesDriven = Math.max(1, activeVehicle.currentMileage - activeVehicle.startingMileage);
  const costPerMile = totalSpent > 0 ? (totalSpent / totalMilesDriven).toFixed(3) : '0.000';

  const vehicleReminders = reminders.filter(r => r.vehicleId === activeVehicle.id && !r.isCompleted);
  const overdueReminders = vehicleReminders.filter(r => {
    if (r.dueMileage && activeVehicle.currentMileage >= r.dueMileage) return true;
    if (r.dueDate && new Date(r.dueDate) <= new Date()) return true;
    return false;
  });

  const recentRecords = [...vehicleRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(mileageInput, 10);
    if (!isNaN(val) && val >= 0 && activeVehicle) {
      if (onUpdateMileage) onUpdateMileage(activeVehicle.id, val);
      setIsEditingMileage(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Active Vehicle Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            {activeVehicle.photoUrl ? (
              <img
                src={activeVehicle.photoUrl}
                alt={`${activeVehicle.make} ${activeVehicle.model}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10">
                <Car className="w-10 h-10 text-white" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {activeVehicle.fuelType}
                </span>
                {activeVehicle.licensePlate && (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono px-2 py-0.5 rounded-md uppercase font-semibold">
                    {activeVehicle.licensePlate}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
              </h1>
              {activeVehicle.vin && (
                <p className="text-xs text-slate-400 font-mono mt-1">
                  VIN: {activeVehicle.vin}
                </p>
              )}
            </div>
          </div>

          {/* Odometer Mileage Display & Quick Editor */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-2xl flex flex-col justify-center min-w-[220px] shadow-inner">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400 font-medium mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Current Odometer
              </span>
              <button
                onClick={() => {
                  setMileageInput(activeVehicle.currentMileage.toString());
                  setIsEditingMileage(!isEditingMileage);
                }}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold"
              >
                <Edit3 className="w-3 h-3" />
                {isEditingMileage ? 'Cancel' : 'Update'}
              </button>
            </div>

            {isEditingMileage ? (
              <form onSubmit={handleMileageSubmit} className="flex gap-2 mt-1">
                <input
                  type="number"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500 text-white text-sm rounded-lg px-2.5 py-1 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-extrabold text-white tracking-wider">
                  {activeVehicle.currentMileage.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-semibold">mi</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Overdue Maintenance Banner Alert */}
      {overdueReminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-red-950/60 to-amber-950/80 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                {overdueReminders.length} Maintenance Service{overdueReminders.length > 1 ? 's' : ''} Due or Overdue!
              </h3>
              <p className="text-xs text-amber-300/80">
                {overdueReminders.map(r => r.title).join(', ')} require attention.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('reminders')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap shadow transition-all"
          >
            View Reminders
          </button>
        </div>
      )}

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cost Spent Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Service Cost</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Across {vehicleRecords.length} logged services
          </p>
        </div>

        {/* Cost Per Mile Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cost / Mile</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ${costPerMile}
            <span className="text-xs text-slate-400 font-normal ml-1">/mi</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculated over {totalMilesDriven.toLocaleString()} miles driven
          </p>
        </div>

        {/* Service Logs Count Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Service History</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {vehicleRecords.length}
            <span className="text-xs text-slate-400 font-normal ml-1">records</span>
          </div>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium mt-1 flex items-center gap-0.5"
          >
            View history timeline <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Reminders Count Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {vehicleReminders.length}
            <span className="text-xs text-slate-400 font-normal ml-1">reminders</span>
          </div>
          <button
            onClick={() => onSelectTab('reminders')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium mt-1 flex items-center gap-0.5"
          >
            Manage maintenance schedule <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Quick Actions Panel */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenAddService}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Log New Service
          </button>

          <button
            onClick={onOpenAddReminder}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-amber-300 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border border-slate-700 hover:border-amber-500/40 transition-all"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            Set Service Alert
          </button>

          <button
            onClick={onOpenAddVehicle}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border border-slate-700 hover:border-cyan-500/40 transition-all"
          >
            <Car className="w-4 h-4 text-cyan-400" />
            Add New Vehicle
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-indigo-300 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border border-slate-700 hover:border-indigo-500/40 transition-all"
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Cost Analytics
          </button>
        </div>
      </div>

      {/* Recent Records Timeline Preview */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Service & Repair Logs</h2>
            <p className="text-xs text-slate-400">Latest maintenance activities for {activeVehicle.make} {activeVehicle.model}</p>
          </div>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl transition-all"
          >
            View All ({vehicleRecords.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No service records logged yet for this vehicle.
            <div className="mt-3">
              <button
                onClick={onOpenAddService}
                className="text-cyan-400 underline font-semibold text-xs"
              >
                Log your first service now
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentRecords.map((record) => (
              <div key={record.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-800/30 px-2 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 group-hover:border-cyan-500/40 transition-all">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{record.category}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        record.type === 'Repair' ? 'bg-red-950 text-red-400 border border-red-800/60' :
                        record.type === 'Maintenance' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' :
                        record.type === 'Upgrade' ? 'bg-purple-950 text-purple-400 border border-purple-800/60' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {record.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {record.provider || 'Self / DIY'} • {record.mileage.toLocaleString()} mi
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-xs text-slate-400 font-mono">{record.date}</span>
                  <span className="text-base font-extrabold text-white font-mono bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-700">
                    ${record.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
