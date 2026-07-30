import React, { useState, useEffect } from 'react';
import { X, Car, Save } from 'lucide-react';
import type { Vehicle, FuelType } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => void;
  initialVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVehicle
}) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [startingMileage, setStartingMileage] = useState(0);
  const [currentMileage, setCurrentMileage] = useState(0);
  const [fuelType, setFuelType] = useState<FuelType>('Gasoline');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialVehicle) {
      setMake(initialVehicle.make);
      setModel(initialVehicle.model);
      setYear(initialVehicle.year);
      setVin(initialVehicle.vin || '');
      setLicensePlate(initialVehicle.licensePlate || '');
      setStartingMileage(initialVehicle.startingMileage);
      setCurrentMileage(initialVehicle.currentMileage);
      setFuelType(initialVehicle.fuelType);
      setPhotoUrl(initialVehicle.photoUrl || '');
      setNotes(initialVehicle.notes || '');
    } else {
      setMake('');
      setModel('');
      setYear(new Date().getFullYear());
      setVin('');
      setLicensePlate('');
      setStartingMileage(0);
      setCurrentMileage(0);
      setFuelType('Gasoline');
      setPhotoUrl('');
      setNotes('');
    }
  }, [initialVehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;

    onSave({
      id: initialVehicle ? initialVehicle.id : `v-${Date.now()}`,
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      vin: vin.trim(),
      licensePlate: licensePlate.trim(),
      startingMileage: Number(startingMileage),
      currentMileage: Number(currentMileage),
      fuelType,
      photoUrl: photoUrl.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {initialVehicle ? 'Edit Vehicle Profile' : 'Add New Vehicle'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year *</label>
              <input
                type="number"
                required
                min={1900}
                max={2030}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. RAV4"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">License Plate</label>
              <input
                type="text"
                placeholder="e.g. 7ABC123"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel / Power Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5 bg-slate-900"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="Flex-Fuel">Flex-Fuel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Odometer (Miles) *</label>
              <input
                type="number"
                required
                min={0}
                value={currentMileage}
                onChange={(e) => setCurrentMileage(Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Odometer (When Acquired)</label>
              <input
                type="number"
                min={0}
                value={startingMileage}
                onChange={(e) => setStartingMileage(Number(e.target.value))}
                className="w-full glass-input text-white text-sm rounded-xl p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">VIN (Vehicle Identification Number)</label>
            <input
              type="text"
              placeholder="17-character VIN"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Specifications</label>
            <textarea
              rows={3}
              placeholder="Engine size, oil type specification, tire sizes, notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input text-white text-sm rounded-xl p-2.5 resize-none"
            />
          </div>

          {/* Form Actions */}
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
              Save Vehicle Profile
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
