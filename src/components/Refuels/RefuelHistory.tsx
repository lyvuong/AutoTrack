import React, { useState, useMemo } from 'react';
import { Fuel, Search, Plus, Calendar, Gauge, DollarSign, Edit2, Trash2, Download, Zap } from 'lucide-react';

import type { Vehicle, EnrichedRefuelRecord } from '../../types';
import { calculateVehicleMpgStats } from '../../utils/mpg';
import { exportRefuelRecordsAsCSV } from '../../services/storage';

interface RefuelHistoryProps {
  records: EnrichedRefuelRecord[];
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onOpenAddService: () => void;
  onEditRecord: (record: EnrichedRefuelRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

export const RefuelHistory: React.FC<RefuelHistoryProps> = ({
  records,
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onOpenAddService,
  onEditRecord,
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tankFilter, setTankFilter] = useState<'all' | 'full' | 'partial'>('all');

  // Compute MPG stats per vehicle and overall. Calculated per-vehicle then
  // combined so "All Vehicles" never mixes odometer readings across cars.
  const enrichedRecords = useMemo(() => {
    if (activeVehicleId) {
      const vehRecords = records.filter(r => r.vehicleId === activeVehicleId);
      return calculateVehicleMpgStats(vehRecords).recordsWithMpg;
    }
    const vehicleMap = new Map<string, EnrichedRefuelRecord[]>();
    records.forEach(r => {
      if (!vehicleMap.has(r.vehicleId)) vehicleMap.set(r.vehicleId, []);
      vehicleMap.get(r.vehicleId)!.push(r);
    });

    const combined: EnrichedRefuelRecord[] = [];
    vehicleMap.forEach((vRecs) => {
      const stats = calculateVehicleMpgStats(vRecs);
      combined.push(...stats.recordsWithMpg);
    });

    return combined.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
  }, [records, activeVehicleId]);

  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(r => {
      const matchesSearch =
        r.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTank =
        tankFilter === 'all' ? true :
        tankFilter === 'full' ? r.isFullTank : !r.isFullTank;

      return matchesSearch && matchesTank;
    });
  }, [enrichedRecords, searchTerm, tankFilter]);

  const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Refuel Log History</h1>
              <p className="text-xs text-slate-400">Track fuelings, stations, costs, and calculated MPG</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportRefuelRecordsAsCSV(filteredRecords, vehicles)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddService}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Refuel</span>
          </button>
        </div>
      </div>

      {/* Filters & Vehicle Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => onSelectVehicle('')}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
              !activeVehicleId
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Vehicles ({records.length})
          </button>
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => onSelectVehicle(v.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                activeVehicleId === v.id
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {v.year} {v.make} {v.model}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gas station, notes, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Tank Filter Toggle */}
        <div className="md:col-span-3 flex items-center space-x-1 bg-slate-900 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setTankFilter('all')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
              tankFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTankFilter('full')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
              tankFilter === 'full' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Tank
          </button>
          <button
            onClick={() => setTankFilter('partial')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
              tankFilter === 'partial' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Partial
          </button>
        </div>
      </div>

      {/* History Table / Card List */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-3">
          <Fuel className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No refuel records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || tankFilter !== 'all'
              ? 'Try adjusting your search filters or tank type selection.'
              : 'Log your first refueling event to start calculating MPG and fuel spend.'}
          </p>
          <button
            onClick={onOpenAddService}
            className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Refuel</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((r) => {
            const veh = vehicleMap.get(r.vehicleId);

            return (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-lg shadow-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left info: Gas station, Date, Vehicle, Badges */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{r.vendor}</span>
                    </h3>

                    {veh && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {veh.year} {veh.make} {veh.model}
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        r.isFullTank
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {r.isFullTank ? 'Full Tank' : 'Partial Tank'}
                    </span>

                    {r.calculatedMpg && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>{r.calculatedMpg.toFixed(1)} MPG</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.date} at {r.time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.odometer.toLocaleString()} mi</span>
                    </span>
                    <span>• {r.paymentType}</span>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 italic">
                      "{r.notes}"
                    </p>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    Category: {r.category}
                  </div>

                  {r.loggedBy && (
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>👤 Logged by <strong className="text-slate-400">{r.loggedBy.displayName}</strong></span>
                      {r.lastEditedBy && r.lastEditedBy.uid !== r.loggedBy.uid && (
                        <span>• ✏️ Edited by <strong className="text-slate-400">{r.lastEditedBy.displayName}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right info: Gallons, Cost, Price/Gal, Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-white flex items-center justify-end space-x-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>{r.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{r.gallons.toFixed(2)} gal</span> @ ${r.pricePerGallon.toFixed(3)}/gal
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditRecord(r)}
                      className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Log"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Log"
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
    </div>
  );
};
