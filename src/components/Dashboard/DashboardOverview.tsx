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
import type { Vehicle, ServiceRecord, ServiceReminder } from '../../types';

interface DashboardOverviewProps {
  activeVehicle: Vehicle | null;
  records: ServiceRecord[];
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
  const [mileageInput, setMileageInput] = useState(activeVehicle?.currentMileage.toString() || '');

  if (!activeVehicle) {
    return (
      <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center max-w-lg mx-auto space-y-6 my-12">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
          <Car className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-display">No Vehicle Selected</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Get started by adding your first car, truck, or motorcycle to your garage!
          </p>
        </div>
        <button
          onClick={onOpenAddVehicle}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-xl shadow-cyan-500/25 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add Your First Vehicle
        </button>
      </div>
    );
  }

  const vehicleRecords = records.filter(r => r.vehicleId === activeVehicle.id);
  const vehicleReminders = reminders.filter(r => r.vehicleId === activeVehicle.id);
  
  const pendingReminders = vehicleReminders.filter(r => !r.isCompleted);
  const overdueReminders = pendingReminders.filter(r => {
    if (r.dueMileage && activeVehicle.currentMileage >= r.dueMileage) return true;
    if (r.dueDate && new Date(r.dueDate) <= new Date()) return true;
    return false;
  });

  const totalSpent = vehicleRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 tracking-wider">
                {activeVehicle.year} • {activeVehicle.fuelType}
              </span>
              {activeVehicle.licensePlate && (
                <span className="text-xs font-mono text-slate-300 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
                  <Tag className="w-3 h-3 inline mr-1 text-slate-400" />
                  {activeVehicle.licensePlate}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
              {activeVehicle.make} <span className="text-cyan-400">{activeVehicle.model}</span>
            </h1>

            {activeVehicle.vin && (
              <p className="text-xs text-slate-400 font-mono">
                VIN: {activeVehicle.vin}
              </p>
            )}
          </div>

          {/* Odometer Mileage Display */}
          <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4 min-w-[240px]">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Gauge className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Odometer</span>
              {isEditingMileage ? (
                <form onSubmit={handleMileageSubmit} className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={mileageInput}
                    onChange={(e) => setMileageInput(e.target.value)}
                    className="w-28 bg-slate-900 border border-cyan-500 text-white font-mono text-sm px-2 py-1 rounded-lg focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">
                    {activeVehicle.currentMileage.toLocaleString()}
                    <span className="text-xs text-slate-400 ml-1 font-sans font-medium">mi</span>
                  </span>
                  <button
                    onClick={() => {
                      setMileageInput(activeVehicle.currentMileage.toString());
                      setIsEditingMileage(true);
                    }}
                    className="text-slate-400 hover:text-cyan-400 p-1"
                    title="Update current odometer reading"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cost Spent */}
        <div 
          onClick={() => onSelectTab('analytics')}
          className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Spent</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {vehicleRecords.length} maintenance logs
          </span>
        </div>

        {/* Total Maintenance Logs */}
        <div 
          onClick={() => onSelectTab('history')}
          className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Service Logs</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {vehicleRecords.length}
          </p>
          <span className="text-[11px] text-cyan-400 font-medium mt-1 inline-flex items-center gap-1">
            <ChevronRight className="w-3 h-3" /> View full history
          </span>
        </div>

        {/* Due Reminders */}
        <div 
          onClick={() => onSelectTab('reminders')}
          className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Reminders</span>
            <div className={`p-2 rounded-xl border transition-transform group-hover:scale-110 ${
              overdueReminders.length > 0
                ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {pendingReminders.length}
          </p>
          <span className={`text-[11px] font-medium mt-1 inline-flex items-center gap-1 ${
            overdueReminders.length > 0 ? 'text-red-400' : 'text-amber-400'
          }`}>
            {overdueReminders.length > 0 ? `${overdueReminders.length} Overdue!` : 'All services on schedule'}
          </span>
        </div>

        {/* Vehicle Health Status */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Vehicle Status</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-400 mt-2">
            Ready to Drive
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Last active {activeVehicle.updatedAt ? new Date(activeVehicle.updatedAt).toLocaleDateString() : 'Today'}
          </span>
        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenAddService}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Log Maintenance Record
        </button>

        <button
          onClick={onOpenAddReminder}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 px-4 rounded-2xl border border-slate-700 transition-all"
        >
          <Calendar className="w-5 h-5 text-amber-400" />
          Set Service Reminder
        </button>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Recent Service History for {activeVehicle.make} {activeVehicle.model}
          </h3>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            View All ({vehicleRecords.length}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentRecords.length > 0 ? (
          <div className="space-y-3">
            {recentRecords.map(r => (
              <div 
                key={r.id}
                className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 flex-shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">{r.category}</span>
                    <span className="text-xs text-slate-400">
                      {r.date} • {r.mileage.toLocaleString()} mi • {r.provider || 'DIY'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-white block">
                    ${r.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    {r.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No service records logged for this vehicle yet.
          </div>
        )}
      </div>

    </div>
  );
};
