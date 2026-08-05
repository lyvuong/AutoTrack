import React, { useState, useEffect } from 'react';
import { X, Save, Bell } from 'lucide-react';
import type { Vehicle, ServiceReminder, ServiceCategory } from '../../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: ServiceReminder) => void;
  vehicles: Vehicle[];
  activeVehicleId: string;
  initialReminder?: ServiceReminder | null;
}

const CATEGORIES: ServiceCategory[] = [
  'Oil Change',
  'Brakes',
  'Tires & Alignment',
  'Engine & Transmission',
  'Battery & Electrical',
  'Suspension & Steering',
  'HVAC / AC',
  'Scheduled Maintenance',
  'General Repair',
  'Detailing & Body',
  'Registration',
  'Safety Inspection',
  'Emission Inspection',
  'Property Tax',
  'Insurance',
  'Parking',
  'Traffic Tickets',
  'Tolls',
  'Decal & License',
  'Inspection & Registration',
  'Other'
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicles,
  activeVehicleId,
  initialReminder
}) => {
  const [vehicleId, setVehicleId] = useState(activeVehicleId);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Oil Change');
  const [dueMileage, setDueMileage] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialReminder) {
      setVehicleId(initialReminder.vehicleId);
      setTitle(initialReminder.title);
      setCategory(initialReminder.category);
      setDueMileage(initialReminder.dueMileage || '');
      setDueDate(initialReminder.dueDate || '');
      setNotes(initialReminder.notes || '');
    } else {
      setVehicleId(activeVehicleId || (vehicles[0]?.id || ''));
      setTitle('Oil Change & Filter');
      setCategory('Oil Change');
      setDueMileage('');
      setDueDate('');
      setNotes('');
    }
  }, [initialReminder, isOpen, activeVehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !vehicleId) return;

    onSave({
      id: initialReminder ? initialReminder.id : `rem-${Date.now()}`,
      vehicleId,
      title: title.trim(),
      category,
      dueMileage: dueMileage !== '' ? Number(dueMileage) : undefined,
      dueDate: dueDate || undefined,
      isCompleted: initialReminder ? initialReminder.isCompleted : false,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {initialReminder ? 'Edit Maintenance Reminder' : 'Set Service Alert Reminder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vehicle *</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900 font-semibold"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reminder Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rotate Tires, Replace Spark Plugs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Odometer Mileage</label>
              <input
                type="number"
                placeholder="e.g. 40000"
                value={dueMileage}
                onChange={(e) => setDueMileage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Details</label>
            <textarea
              rows={3}
              placeholder="Specification details or manufacturer recommendation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              Save Reminder
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
