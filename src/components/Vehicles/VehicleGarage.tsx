import React, { useState, useMemo } from 'react';
import { Car, Plus, Edit2, Trash2, CheckCircle2, Gauge, Users, Key, Archive, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import type { Vehicle } from '../../types';
import { VehicleModal } from './VehicleModal';
import { ArchiveVehicleModal } from './ArchiveVehicleModal';

interface VehicleGarageProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  familyCode?: string;
  onSelectVehicle: (id: string) => void;
  onSaveVehicle: (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => void;
  onDeleteVehicle: (id: string) => void;
  onArchiveVehicle?: (id: string, reason?: string) => void;
  onUnarchiveVehicle?: (id: string) => void;
  onOpenSettings?: () => void;
}

export const VehicleGarage: React.FC<VehicleGarageProps> = ({
  vehicles,
  activeVehicleId,
  familyCode,
  onSelectVehicle,
  onSaveVehicle,
  onDeleteVehicle,
  onArchiveVehicle,
  onUnarchiveVehicle,
  onOpenSettings
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingVehicle, setArchivingVehicle] = useState<Vehicle | null>(null);
  const [garageFilter, setGarageFilter] = useState<'active' | 'archived' | 'all'>('active');

  const activeVehicles = useMemo(() => vehicles.filter(v => !v.isArchived), [vehicles]);
  const archivedVehicles = useMemo(() => vehicles.filter(v => v.isArchived), [vehicles]);

  const displayedVehicles = useMemo(() => {
    if (garageFilter === 'active') return activeVehicles;
    if (garageFilter === 'archived') return archivedVehicles;
    return vehicles;
  }, [garageFilter, activeVehicles, archivedVehicles, vehicles]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleOpenArchive = (vehicle: Vehicle) => {
    setArchivingVehicle(vehicle);
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = (vehicleId: string, reason?: string) => {
    if (onArchiveVehicle) {
      onArchiveVehicle(vehicleId, reason);
    }
  };

  const handleRestoreVehicle = (vehicle: Vehicle) => {
    if (onUnarchiveVehicle) {
      onUnarchiveVehicle(vehicle.id);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* Shared Family Garage Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {familyCode ? 'Shared Household Garage' : 'Personal Garage Mode'}
              </span>
              {familyCode ? (
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                  <Key className="w-3 h-3" /> {familyCode}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Private
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {familyCode 
                ? `Syncing vehicles & maintenance logs in real time across family members with code "${familyCode}".`
                : 'Join or create a Household Code in Settings to share vehicles in real time with your spouse.'}
            </p>
          </div>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-3.5 py-2 rounded-xl border border-indigo-800/80 transition-all self-end sm:self-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            <Key className="w-3.5 h-3.5" />
            {familyCode ? 'Manage Code' : 'Set Household Code'}
          </button>
        )}
      </div>

      {/* Header & Garage Filter Tabs */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        {/* Status Filter Tabs (Active / Archived / All) */}
        {vehicles.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setGarageFilter('active')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                garageFilter === 'active'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Active ({activeVehicles.length})
            </button>

            <button
              onClick={() => setGarageFilter('archived')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                garageFilter === 'archived'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Archived ({archivedVehicles.length})
            </button>

            <button
              onClick={() => setGarageFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                garageFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Vehicles ({vehicles.length})
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Grid */}
      {displayedVehicles.length === 0 ? (
        <div className="glass-panel p-8 sm:p-12 text-center rounded-3xl border border-slate-800">
          {garageFilter === 'archived' ? (
            <>
              <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No archived vehicles</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                When you sell, trade in, or retire a vehicle, archive it to keep its history while closing it to new logs.
              </p>
            </>
          ) : (
            <>
              <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                {vehicles.length === 0 ? 'Your garage is empty' : 'No active vehicles found'}
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                {vehicles.length === 0
                  ? 'Get started by creating your first vehicle record.'
                  : 'All your vehicles are currently archived. Add a new vehicle or restore an archived one.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
              >
                + Add First Vehicle
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedVehicles.map((v) => {
            const isActive = v.id === activeVehicleId;
            const isArchived = Boolean(v.isArchived);

            return (
              <div
                key={v.id}
                className={`glass-panel rounded-3xl overflow-hidden flex flex-col justify-between transition-all group relative ${
                  isArchived
                    ? 'border-amber-500/30 bg-slate-900/60 opacity-90'
                    : 'hover:border-cyan-500/40'
                } ${
                  isActive ? 'ring-2 ring-cyan-500 border-cyan-500/60 shadow-xl shadow-cyan-500/10' : ''
                }`}
              >
                {/* Photo Header (Clickable to select active vehicle) */}
                <div 
                  onClick={() => onSelectVehicle(v.id)}
                  className="relative h-44 bg-slate-900 overflow-hidden cursor-pointer group/photo"
                  title={isActive ? 'Active Vehicle' : `Click to view ${v.year} ${v.make} ${v.model}`}
                >
                  {v.photoUrl ? (
                    <img
                      src={v.photoUrl}
                      alt={`${v.make} ${v.model}`}
                      className={`w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500 ${
                        isArchived ? 'grayscale-[40%] contrast-90' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-cyan-950 flex items-center justify-center">
                      <Car className="w-16 h-16 text-slate-700 group-hover/photo:scale-110 transition-transform" />
                    </div>
                  )}

                  {/* Hover Overlay Prompt for Non-Active Vehicles */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-cyan-500 text-slate-950 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-lg transform -translate-y-1 group-hover/photo:translate-y-0 transition-transform">
                        Select Vehicle
                      </span>
                    </div>
                  )}

                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-3 left-3 bg-cyan-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selected
                    </div>
                  )}

                  {/* Archived Banner Badge */}
                  {isArchived && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Archive className="w-3.5 h-3.5" />
                      Archived
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
                  <div 
                    onClick={() => onSelectVehicle(v.id)}
                    className="cursor-pointer group/title"
                    title={isActive ? 'Selected Vehicle' : `Click to select ${v.year} ${v.make} ${v.model}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-800 text-slate-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                        {v.fuelType}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{v.year}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight group-hover/title:text-cyan-400 transition-colors">
                      {v.make} {v.model}
                    </h3>
                    {v.vin && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">VIN: {v.vin}</p>
                    )}
                  </div>

                  {/* Archived Reason Badge */}
                  {isArchived && (
                    <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-amber-300">
                          {v.archiveReason ? v.archiveReason : 'Archived Vehicle'}
                        </div>
                        <div className="text-[11px] text-amber-400/70">
                          Read-only • No new logs can be created
                        </div>
                      </div>
                    </div>
                  )}

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
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold py-2 rounded-xl border border-slate-700 transition-all"
                      title="Edit Vehicle Details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      Edit
                    </button>

                    {isArchived ? (
                      <button
                        onClick={() => handleRestoreVehicle(v)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-100 text-xs font-bold py-2 rounded-xl border border-emerald-800/80 transition-all"
                        title="Restore vehicle to active status"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenArchive(v)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 text-xs font-bold py-2 rounded-xl border border-slate-700 hover:border-amber-800/60 transition-all"
                        title="Archive vehicle (prevent new logs)"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                        Archive
                      </button>
                    )}

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

      {/* Edit/Add Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveVehicle}
        initialVehicle={editingVehicle}
      />

      {/* Archive Vehicle Confirmation Modal */}
      <ArchiveVehicleModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirmArchive={handleConfirmArchive}
        vehicle={archivingVehicle}
      />

    </div>
  );
};
