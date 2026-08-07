import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Wrench, BellPlus, ReceiptText, Settings2, Link2Off } from 'lucide-react';
import type { Vehicle, EnrichedServiceRecord, ServiceCategory, ServiceType, PaymentType, PaymentTypeItem } from '../../types';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<EnrichedServiceRecord>, createReminder?: { nextMileage?: number; nextDate?: string }) => void;
  vehicles: Vehicle[];
  activeVehicleId: string;
  initialRecord?: EnrichedServiceRecord | null;
  paymentTypes?: PaymentTypeItem[];
  onManagePaymentTypes?: () => void;
  onMoveToExpense?: (record: EnrichedServiceRecord) => void;
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
  'Fuel Log',
  'Other'
];

const TYPES: ServiceType[] = ['Maintenance', 'Repair', 'Upgrade', 'Inspection', 'Fee / Tax', 'Other Expense'];

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicles,
  activeVehicleId,
  initialRecord,
  paymentTypes = [],
  onManagePaymentTypes,
  onMoveToExpense
}) => {
  const availablePaymentTypes = useMemo(() => {
    const rawNames = (paymentTypes && paymentTypes.length > 0)
      ? paymentTypes.map(p => p.name)
      : ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Other'];
    const withoutCash = rawNames.filter(n => n.toLowerCase() !== 'cash');
    return ['Cash', ...Array.from(new Set(withoutCash))];
  }, [paymentTypes]);
  const [vehicleId, setVehicleId] = useState(activeVehicleId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [mileage, setMileage] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [category, setCategory] = useState<ServiceCategory>('Oil Change');
  const [type, setType] = useState<ServiceType>('Maintenance');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [isTaxDeductible, setIsTaxDeductible] = useState<boolean>(false);

  // Optional Reminder
  const [addNextReminder, setAddNextReminder] = useState(false);
  const [nextServiceMileage, setNextServiceMileage] = useState<number | ''>('');
  const [nextServiceDate, setNextServiceDate] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setVehicleId(initialRecord.vehicleId);
      setDate(initialRecord.date);
      setTime(initialRecord.time || new Date().toTimeString().slice(0, 5));
      setMileage(initialRecord.mileage);
      setCost(initialRecord.cost);
      setCategory(initialRecord.category);
      setType(initialRecord.type);
      setProvider(initialRecord.provider || '');
      setNotes(initialRecord.notes || '');
      setPaymentType(initialRecord.paymentType || 'Cash');
      setIsTaxDeductible(Boolean(initialRecord.isTaxDeductible));
      setNextServiceMileage(initialRecord.nextServiceMileage || '');
      setNextServiceDate(initialRecord.nextServiceDate || '');
      setAddNextReminder(Boolean(initialRecord.nextServiceMileage || initialRecord.nextServiceDate));
    } else {
      const active = vehicles.find(v => v.id === activeVehicleId);
      setVehicleId(activeVehicleId || (vehicles[0]?.id || ''));
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setMileage(active?.currentMileage || '');
      setCost('');
      setCategory('Oil Change');
      setType('Maintenance');
      setProvider('');
      setNotes('');
      setPaymentType('Cash');
      setIsTaxDeductible(false);
      setNextServiceMileage('');
      setNextServiceDate('');
      setAddNextReminder(false);
    }
  }, [initialRecord, isOpen, activeVehicleId, vehicles]);

  if (!isOpen) return null;

  const isTaxDeductibleCategory = (cat: ServiceCategory) =>
    cat === 'Registration' || cat === 'Property Tax' || cat === 'Inspection & Registration';

  const handleCategoryChange = (newCat: ServiceCategory) => {
    setCategory(newCat);
    setIsTaxDeductible(isTaxDeductibleCategory(newCat));

    if (['Registration', 'Property Tax', 'Decal & License', 'Traffic Tickets', 'Tolls'].includes(newCat)) {
      setType('Fee / Tax');
    } else if (['Safety Inspection', 'Emission Inspection'].includes(newCat)) {
      setType('Inspection');
    } else if (['Insurance', 'Parking'].includes(newCat)) {
      setType('Other Expense');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || mileage === '' || cost === '') return;

    const recordData: Partial<EnrichedServiceRecord> = {
      id: initialRecord ? initialRecord.id : `rec-${Date.now()}`,
      vehicleId,
      date,
      time,
      mileage: Number(mileage),
      cost: Number(cost),
      category,
      type,
      provider: provider.trim() || 'Self / DIY',
      notes: notes.trim() || undefined,
      paymentType,
      isTaxDeductible,
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
              {initialRecord ? 'Edit Record / Expense' : 'Log Service or Vehicle Expense'}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Target Vehicle *</label>
              {initialRecord && onMoveToExpense && (
                <button
                  type="button"
                  onClick={() => onMoveToExpense(initialRecord)}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                  title="Remove this log from the vehicle and keep it only as a general expense"
                >
                  <Link2Off className="w-3 h-3" /> Not a car expense? Move to Expense
                </button>
              )}
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ServiceCategory)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expense / Log Type *</label>
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Payment Type *</label>
                {onManagePaymentTypes && (
                  <button
                    type="button"
                    onClick={onManagePaymentTypes}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                    title="Manage Payment Types"
                  >
                    <Settings2 className="w-3 h-3" /> Manage
                  </button>
                )}
              </div>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
              >
                {availablePaymentTypes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Deductible Selector */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-emerald-400" />
                  Tax-Deductible Expense
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsTaxDeductible(!isTaxDeductible)}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isTaxDeductible
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {isTaxDeductible ? 'TAX-DEDUCTIBLE ON' : 'TAX-DEDUCTIBLE OFF'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pl-6">
              Selectable for any expense. Defaulted ON for vehicle registration fees & property taxes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Provider / Payee / Agency Name</label>
            <input
              type="text"
              placeholder="e.g. DMV, County Treasury, Toyota Dealership, State Farm"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes, Receipts & Specifications</label>
            <textarea
              rows={3}
              placeholder="Registration tag #98765, annual property tax assessment, 0W-20 oil..."
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
                  Schedule Next Service / Renewal Reminder
                </span>
              </label>
            </div>

            {addNextReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Mileage Target</label>
                  <input
                    type="number"
                    placeholder="e.g. 40000"
                    value={nextServiceMileage}
                    onChange={(e) => setNextServiceMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full glass-input text-white text-xs rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Due Date</label>
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
              Save Log Entry
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
