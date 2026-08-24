import React, { useState } from 'react';
import { Bell, Plus, CheckCircle2, Clock, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import type { Vehicle, ServiceReminder } from '../../types';
import { ReminderModal } from './ReminderModal';

interface ReminderManagerProps {
  reminders: ServiceReminder[];
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSaveReminder: (reminder: ServiceReminder) => void;
  onDeleteReminder: (id: string) => void;
  onToggleComplete: (reminder: ServiceReminder) => void;
  onCompleteAndLogService: (reminder: ServiceReminder) => void;
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({
  reminders,
  vehicles,
  activeVehicleId,
  onSaveReminder,
  onDeleteReminder,
  onToggleComplete: _onToggleComplete,
  onCompleteAndLogService
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  const filteredReminders = reminders.filter(r => r.vehicleId === activeVehicleId || activeVehicleId === 'all');

  const pendingReminders = filteredReminders.filter(r => !r.isCompleted);
  const completedReminders = filteredReminders.filter(r => r.isCompleted);

  const isReminderOverdue = (reminder: ServiceReminder): boolean => {
    if (reminder.isCompleted) return false;
    const vehicle = vehicleMap.get(reminder.vehicleId);
    if (vehicle && reminder.dueMileage && vehicle.currentMileage >= reminder.dueMileage) return true;
    if (reminder.dueDate && new Date(reminder.dueDate) <= new Date()) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            Maintenance Reminders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts based on mileage intervals or calendar dates.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReminder(null);
            setIsModalOpen(true);
          }}
          disabled={vehicles.length === 0 || vehicles.every(v => v.isArchived)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed"
          title={vehicles.every(v => v.isArchived) ? 'All vehicles are archived' : 'Set Reminder'}
        >
          <Plus className="w-4 h-4" />
          Set Reminder
        </button>
      </div>

      {/* Pending Reminders Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Active Reminders ({pendingReminders.length})
        </h2>

        {pendingReminders.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
            🎉 No pending service reminders! All scheduled maintenance is up to date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReminders.map((r) => {
              const vehicle = vehicleMap.get(r.vehicleId);
              const overdue = isReminderOverdue(r);
              const isVehicleArchived = Boolean(vehicle?.isArchived);

              return (
                <div
                  key={r.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    overdue
                      ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        overdue ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {overdue ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-base">{r.title}</span>
                          {overdue && (
                            <span className="bg-red-500 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">
                              OVERDUE
                            </span>
                          )}
                          {isVehicleArchived && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'} • {r.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingReminder(r);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteReminder(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Target Details */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    {r.dueMileage && (
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Target Mileage</span>
                        <span className={`font-mono font-bold ${
                          vehicle && vehicle.currentMileage >= r.dueMileage ? 'text-red-400' : 'text-slate-200'
                        }`}>
                          {r.dueMileage.toLocaleString()} mi
                          {vehicle && (
                            <span className="text-[10px] block text-slate-400 font-normal">
                              Current: {vehicle.currentMileage.toLocaleString()} mi
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {r.dueDate && (
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Target Date</span>
                        <span className="font-mono font-bold text-slate-200">{r.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {r.notes && (
                    <p className="text-xs text-slate-400 italic">"{r.notes}"</p>
                  )}

                  {/* Multi-User Audit Tracking Info */}
                  {(r.createdBy || r.lastEditedBy) && (
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                      {r.createdBy && (
                        <span>👤 Created by <strong className="text-slate-200">{r.createdBy.displayName}</strong></span>
                      )}
                      {r.lastEditedBy && r.lastEditedBy.uid !== r.createdBy?.uid && (
                        <span>✏️ Edited by <strong className="text-slate-300">{r.lastEditedBy.displayName}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onCompleteAndLogService(r)}
                      disabled={isVehicleArchived}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isVehicleArchived ? 'Vehicle is archived (cannot log service)' : 'Complete & Log Service'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isVehicleArchived ? 'Vehicle Archived (Read-Only)' : 'Complete & Log Service'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Reminders History */}
      {completedReminders.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Completed Reminders History ({completedReminders.length})
          </h2>

          <div className="divide-y divide-slate-800/80 glass-panel rounded-2xl overflow-hidden">
            {completedReminders.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-4 text-xs opacity-75">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">{r.title}</span>
                    <span className="text-slate-400">{r.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteReminder(r.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveReminder}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        initialReminder={editingReminder}
      />

    </div>
  );
};
