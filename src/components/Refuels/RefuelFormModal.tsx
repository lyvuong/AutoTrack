import React, { useState, useEffect, useMemo } from 'react';
import { X, Fuel, Gauge, DollarSign, Calendar, Clock, MapPin, CreditCard, FileText, CheckCircle2, Settings2 } from 'lucide-react';
import type { Vehicle, EnrichedRefuelRecord, PaymentType, PaymentTypeItem } from '../../types';
import { buildFuelTransactionCategory } from '../../utils/transactions';

interface RefuelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<EnrichedRefuelRecord>) => void;
  vehicles: Vehicle[];
  activeVehicleId: string;
  initialRecord?: EnrichedRefuelRecord | null;
  paymentTypes?: PaymentTypeItem[];
  onManagePaymentTypes?: () => void;
}

const COMMON_STATIONS = ['Costco Fuel', 'Shell', 'Chevron', 'ExxonMobil', 'BP', 'Mobil', 'Speedway', 'Sunoco', 'Texaco', "Buc-ee's"];

export const RefuelFormModal: React.FC<RefuelFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicles,
  activeVehicleId,
  initialRecord,
  paymentTypes = [],
  onManagePaymentTypes
}) => {
  const availablePaymentTypes = useMemo(() => {
    const rawNames = (paymentTypes && paymentTypes.length > 0)
      ? paymentTypes.map(p => p.name)
      : ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Other'];
    const withoutCash = rawNames.filter(n => n.toLowerCase() !== 'cash');
    return ['Cash', ...Array.from(new Set(withoutCash))];
  }, [paymentTypes]);

  const [vehicleId, setVehicleId] = useState<string>(activeVehicleId || (vehicles[0]?.id || ''));
  const [odometer, setOdometer] = useState<string>('');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [gallons, setGallons] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [pricePerGallon, setPricePerGallon] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [paymentType, setPaymentType] = useState<PaymentType>('Credit Card');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedVehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];

  useEffect(() => {
    if (initialRecord) {
      setVehicleId(initialRecord.vehicleId);
      setOdometer(initialRecord.odometer.toString());
      setIsFullTank(initialRecord.isFullTank);
      setGallons(initialRecord.gallons.toString());
      setAmountPaid(initialRecord.amountPaid.toString());
      setPricePerGallon(initialRecord.pricePerGallon.toString());
      setVendor(initialRecord.vendor);
      setDate(initialRecord.date);
      setTime(initialRecord.time);
      setPaymentType(initialRecord.paymentType);
      setNotes(initialRecord.notes || '');
    } else {
      const v = vehicles.find(veh => veh.id === activeVehicleId) || vehicles[0];
      setVehicleId(v ? v.id : '');
      setOdometer(v ? v.currentMileage.toString() : '');
      setIsFullTank(true);
      setGallons('');
      setAmountPaid('');
      setPricePerGallon('');
      setVendor('Costco Fuel');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setPaymentType('Credit Card');
      setNotes('');
    }
    setError('');
  }, [initialRecord, isOpen, activeVehicleId, vehicles]);

  const handleGallonsChange = (val: string) => {
    setGallons(val);
    const g = parseFloat(val);
    const a = parseFloat(amountPaid);
    if (g > 0 && a > 0) {
      setPricePerGallon((a / g).toFixed(3));
    }
  };

  const handleAmountChange = (val: string) => {
    setAmountPaid(val);
    const a = parseFloat(val);
    const g = parseFloat(gallons);
    if (g > 0 && a > 0) {
      setPricePerGallon((a / g).toFixed(3));
    }
  };

  const handlePricePerGallonChange = (val: string) => {
    setPricePerGallon(val);
    const p = parseFloat(val);
    const g = parseFloat(gallons);
    if (g > 0 && p > 0) {
      setAmountPaid((g * p).toFixed(2));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const odoNum = parseFloat(odometer);
    const galNum = parseFloat(gallons);
    const amtNum = parseFloat(amountPaid);

    if (!vehicleId) {
      setError('Please select a vehicle.');
      return;
    }
    if (isNaN(odoNum) || odoNum < 0) {
      setError('Please enter a valid current odometer reading.');
      return;
    }
    if (isNaN(galNum) || galNum <= 0) {
      setError('Please enter total fuel in gallons (> 0).');
      return;
    }
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Please enter total amount paid ($).');
      return;
    }
    if (!vendor.trim()) {
      setError('Please enter the gas station vendor name.');
      return;
    }

    const recordData: Partial<EnrichedRefuelRecord> = {
      id: initialRecord ? initialRecord.id : undefined,
      vehicleId,
      odometer: odoNum,
      isFullTank,
      gallons: galNum,
      date,
      time,
      amountPaid: amtNum,
      vendor: vendor.trim(),
      notes: notes.trim() || undefined,
      paymentType
    };

    onSave(recordData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {initialRecord ? 'Edit Refuel Log' : 'Add Refuel Log'}
              </h2>
              <p className="text-xs text-slate-400">Record vehicle fuel & financial transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Vehicle Select */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.currentMileage.toLocaleString()} mi)
                </option>
              ))}
            </select>
          </div>

          {/* Full or Partial Refuel Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Fueling Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsFullTank(true)}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  isFullTank
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isFullTank ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>Full Tank</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullTank(false)}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  !isFullTank
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${!isFullTank ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Partial Tank</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              * MPG logic uses full refuelings to calculate miles per gallon.
            </p>
          </div>

          {/* Odometer & Fuel Volume */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>Current Odometer (mi)</span>
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 48500"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Fuel (gal)</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="e.g. 15.4"
                value={gallons}
                onChange={(e) => handleGallonsChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Total Cost & Price / Gallon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Paid ($)</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 54.50"
                value={amountPaid}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Price / Gal ($)
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="Auto-calc"
                value={pricePerGallon}
                onChange={(e) => handlePricePerGallonChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Vendor / Gas Station */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gas Station Vendor</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Costco Fuel, Shell, Chevron"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors mb-2"
            />
            {/* Quick Vendor Chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_STATIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setVendor(st)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    vendor === st
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-400 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payment Type</span>
              </label>
              {onManagePaymentTypes && (
                <button
                  type="button"
                  onClick={onManagePaymentTypes}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  title="Payment Methods Info"
                >
                  <Settings2 className="w-3 h-3" /> Info
                </button>
              )}
            </div>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {availablePaymentTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Category Display */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Transaction Category (Auto-generated):</span>
            <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded text-[11px] block font-mono overflow-x-auto">
              {selectedVehicle ? buildFuelTransactionCategory(selectedVehicle) : 'Car - Fuel'}
            </code>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Octane 93, full synthetic additive..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
            >
              <Fuel className="w-4 h-4" />
              <span>{initialRecord ? 'Save Changes' : 'Save Refuel Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
