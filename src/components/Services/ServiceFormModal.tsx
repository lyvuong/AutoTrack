import React, { useState, useEffect } from 'react';
import { X, Save, Wrench, BellPlus } from 'lucide-react';
import type { Vehicle, ServiceRecord, ServiceCategory, ServiceType } from '../../types';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<ServiceRecord, 'createdAt'>, createReminder?: { nextMileage?: number; nextDate?: string }) => void;
  vehicles: Vehicle[];
  activeVehicleId: string;
  initialRecord?: ServiceRecord | null;
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
  'Inspection & Registration',
  'Fuel Log',
  'Other'
];

const TYPES: ServiceType[] = ['Maintenance', 'Repair', 'Upgrade', 'Inspection'];

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicles,
  activeVehicleId,
  initialRecord
}) => {
  const [vehicleId, setVehicleId] = useState(activeVehicleId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [category, setCategory] = useState<ServiceCategory>('Oil Change');
  const [type, setType] = useState<ServiceType>('Maintenance');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');

  // Optional Reminder
  const [addNextReminder, setAddNextReminder] = useState(false);
  const [nextServiceMileage, setNextServiceMileage] = useState<number | ''>('');
  const [nextServiceDate, setNextServiceDate] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setVehicleId(initialRecord.vehicleId);
      setDate(initialRecord.date);
      setMileage(initialRecord.mileage);
      setCost(initialRecord.cost);
      setCategory(initialRecord.category);
      setType(initialRecord.type);
      setProvider(initialRecord.provider || '');
      setNotes(initialRecord.notes || '');
      setNextServiceMileage(initialRecord.nextServiceMileage || '');
      setNextServiceDate(initialRecord.nextServiceDate || '');
      setAddNextReminder(Boolean(initialRecord.nextServiceMileage || initialRecord.nextServiceDate));
    } else {
      const active = vehicles.find(v => v.id === activeVehicleId);
      setVehicleId(activeVehicleId || (vehicles[0]?.id || ''));
      setDate(new Date().toISOString().split('T')[0]);
      setMileage(active?.currentMileage || '');
      setCost('');
      setCategory('Oil Change');
      setType('Maintenance');
      setProvider('');
      setNotes('');
      setNextServiceMileage('');
      setNextServiceDate('');
      setAddNextReminder(false);
    }
  }, [initialRecord, isOpen, activeVehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || mileage === '' || cost === '') return;

    const recordData: Omit<ServiceRecord, 'createdAt'> = {
      id: initialRecord ? initialRecord.id : `rec-${Date.now()}`,
      vehicleId,
      date,
      mileage: Number(mileage),
      cost: Number(cost),
      category,
      type,
      provider: provider.trim() || 'Self / DIY',
      notes: notes.trim() || undefined,
      nextServiceMileage: addNextReminder && nextServiceMileage !== '' ? Number(nextServiceMileage) : undefined,
      nextServiceDate: addNextReminder && nextServiceDate ? nextServiceDate : undefined,
    };

    onSave(
      recordData, 
      addNextReminder ? {
        nextMileage: nextServiceMileage !== '' ? Number(nextServiceMileage) : undefined,
        nextDate: nextServiceDate || undefined
      } : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {initialRecord ? 'Edit Service Record' : 'Log New Service / Repair'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Vehicle Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vehicle *</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900 font-semibold"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mileage (Odometer) *</label>
              <input
                type="number"
                required
                min={0}
                placeholder="e.g. 35000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cost ($ USD) *</label>
              <input
                type="number"
                required
                step="0.01"
                min={0}
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Service Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Service Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ServiceType)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Service Provider / Shop Name</label>
            <input
              type="text"
              placeholder="e.g. Toyota Dealership, Jiffy Lube, DIY Garage"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes, Parts Used & Specifications</label>
            <textarea
              rows={3}
              placeholder="0W-20 Full synthetic oil, OEM Filter #12345, tire pressure set to 35 PSI..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 resize-none"
            />
          </div>

          {/* Toggle Next Service Reminder */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addNextReminder}
                  onChange={(e) => setAddNextReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BellPlus className="w-4 h-4 text-amber-400" />
                  Schedule Next Service Reminder
                </span>
              </label>
            </div>

            {addNextReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Service Mileage Target</label>
                  <input
                    type="number"
                    placeholder="e.g. 40000"
                    value={nextServiceMileage}
                    onChange={(e) => setNextServiceMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full glass-input text-white text-xs rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Service Target Date</label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className="w-full glass-input text-white text-xs rounded-xl p-2"
                  />
                </div>
              </div>
            )}
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
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              Save Service Log
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
