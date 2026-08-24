import React, { useState, useEffect } from 'react';
import { X, Archive, AlertCircle, Check } from 'lucide-react';
import type { Vehicle } from '../../types';

interface ArchiveVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmArchive: (vehicleId: string, reason?: string) => void;
  vehicle: Vehicle | null;
}

const COMMON_REASONS = [
  'Sold',
  'Traded In',
  'Totaled',
  'Scrapped',
  'Lease Ended',
  'Gifted / Transferred',
  'Stored / Inactive',
  'Other'
];

export const ArchiveVehicleModal: React.FC<ArchiveVehicleModalProps> = ({
  isOpen,
  onClose,
  onConfirmArchive,
  vehicle
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSelectChip = (reason: string) => {
    if (selectedReason === reason) {
      setSelectedReason('');
    } else {
      setSelectedReason(reason);
      if (reason !== 'Other' && !customReason) {
        setCustomReason('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = '';
    if (selectedReason && selectedReason !== 'Other') {
      finalReason = customReason.trim() ? `${selectedReason}: ${customReason.trim()}` : selectedReason;
    } else {
      finalReason = customReason.trim();
    }

    onConfirmArchive(vehicle.id, finalReason || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8 animate-fadeInUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Archive Vehicle</h2>
              <p className="text-xs text-slate-400">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Explanation Alert */}
          <div className="bg-slate-950/70 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">What happens when you archive?</p>
              <p className="text-slate-400 leading-relaxed">
                • <strong className="text-slate-200">No new logs:</strong> You will no longer be able to log service records, refuels, or reminders against this vehicle.
              </p>
              <p className="text-slate-400 leading-relaxed">
                • <strong className="text-slate-200">History preserved:</strong> All past service history, refuels, and expense analytics remain safely stored and viewable.
              </p>
              <p className="text-slate-400 leading-relaxed">
                • <strong className="text-slate-200">Reversible:</strong> You can unarchive and restore this vehicle at any time.
              </p>
            </div>
          </div>

          {/* Optional Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Reason for Archiving <span className="text-slate-500 font-normal">(Optional)</span>
            </label>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleSelectChip(reason)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                    {reason}
                  </button>
                );
              })}
            </div>

            {/* Detailed Reason Notes */}
            <input
              type="text"
              placeholder={selectedReason ? `Additional details for "${selectedReason}"...` : 'Enter reason (e.g., Sold to private buyer for $15,000)...'}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full glass-input text-white text-xs sm:text-sm rounded-xl p-2.5 placeholder:text-slate-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Archive className="w-4 h-4 text-slate-950" />
              Confirm Archive
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
