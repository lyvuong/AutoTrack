import React, { useState } from 'react';
import { Car, Plus, Edit2, Trash2, CheckCircle2, Gauge } from 'lucide-react';
import type { Vehicle } from '../../types';
import { VehicleModal } from './VehicleModal';

interface VehicleGarageProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onSaveVehicle: (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => void;
  onDeleteVehicle: (id: string) => void;
}

export const VehicleGarage: React.FC<VehicleGarageProps> = ({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onSaveVehicle,
  onDeleteVehicle
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-cyan-400" />
            Vehicle Garage ({vehicles.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your registered cars, trucks, and SUVs. Select a vehicle to view its active log history.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Your garage is empty</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Get started by creating your first vehicle record.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
          >
            + Add First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => {
            const isActive = v.id === activeVehicleId;

            return (
              <div
                key={v.id}
                className={`glass-panel rounded-3xl overflow-hidden flex flex-col justify-between transition-all group hover:border-cyan-500/40 relative ${
                  isActive ? 'ring-2 ring-cyan-500 border-cyan-500/60 shadow-xl shadow-cyan-500/10' : ''
                }`}
              >
                {/* Photo Header */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  {v.photoUrl ? (
                    <img
                      src={v.photoUrl}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-cyan-950 flex items-center justify-center">
                      <Car className="w-16 h-16 text-slate-700" />
                    </div>
                  )}

                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-3 left-3 bg-cyan-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Vehicle
                    </div>
                  )}

                  {/* License Plate Badge */}
                  {v.licensePlate && (
                    <div className="absolute top-3 right-3 bg-slate-900/90 text-slate-200 border border-slate-700 text-xs font-mono font-bold px-2.5 py-1 rounded-lg uppercase shadow">
                      {v.licensePlate}
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-800 text-slate-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                        {v.fuelType}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{v.year}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {v.make} {v.model}
                    </h3>
                    {v.vin && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">VIN: {v.vin}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      Odometer:
                    </span>
                    <span className="text-white font-mono font-bold">{v.currentMileage.toLocaleString()} mi</span>
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic">"{v.notes}"</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {!isActive && (
                      <button
                        onClick={() => onSelectVehicle(v.id)}
                        className="flex-1 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-700 transition-all"
                      >
                        Select Active
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-all"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${v.year} ${v.make} ${v.model}?`)) {
                          onDeleteVehicle(v.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-950/40 rounded-xl border border-slate-700 hover:border-red-800/60 transition-all"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveVehicle}
        initialVehicle={editingVehicle}
      />

    </div>
  );
};
