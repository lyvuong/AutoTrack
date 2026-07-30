import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit2, 
  Trash2
} from 'lucide-react';
import type { Vehicle, ServiceRecord } from '../../types';
import { exportRecordsAsCSV } from '../../services/storage';

interface ServiceHistoryProps {
  records: ServiceRecord[];
  vehicles: Vehicle[];
  activeVehicleId: string;
  onOpenAddService: () => void;
  onEditRecord: (record: ServiceRecord) => void;
  onDeleteRecord: (id: string) => void;
}

const CATEGORIES = [
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

export const ServiceHistory: React.FC<ServiceHistoryProps> = ({
  records,
  vehicles,
  activeVehicleId,
  onOpenAddService,
  onEditRecord,
  onDeleteRecord
}) => {
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>(activeVehicleId || 'all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'cost-desc' | 'mileage-desc'>('date-desc');

  const vehicleMap = useMemo(() => {
    return new Map(vehicles.map(v => [v.id, `${v.year} ${v.make} ${v.model}`]));
  }, [vehicles]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedVehicleFilter !== 'all' && r.vehicleId !== selectedVehicleFilter) return false;
      if (selectedCategoryFilter !== 'all' && r.category !== selectedCategoryFilter) return false;
      if (selectedTypeFilter !== 'all' && r.type !== selectedTypeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vehicleName = (vehicleMap.get(r.vehicleId) || '').toLowerCase();
        const matchesCategory = r.category.toLowerCase().includes(q);
        const matchesProvider = r.provider?.toLowerCase().includes(q);
        const matchesNotes = r.notes?.toLowerCase().includes(q);
        const matchesMileage = r.mileage.toString().includes(q);
        const matchesCost = r.cost.toString().includes(q);
        if (!vehicleName.includes(q) && !matchesCategory && !matchesProvider && !matchesNotes && !matchesMileage && !matchesCost) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'cost-desc') return b.cost - a.cost;
      if (sortBy === 'mileage-desc') return b.mileage - a.mileage;
      return 0;
    });
  }, [records, selectedVehicleFilter, selectedCategoryFilter, selectedTypeFilter, searchQuery, sortBy, vehicleMap]);

  const totalFilteredCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);

  const handleExportCSV = () => {
    const csvData = exportRecordsAsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AutoTrack_Service_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Service & Repair History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete maintenance timeline. Search, filter, export or print records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
            title="Export CSV File"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
            title="Print Record Report"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            Print Report
          </button>

          <button
            onClick={onOpenAddService}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Service
          </button>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search provider, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input text-white text-xs rounded-xl pl-9 pr-3 py-2.5"
            />
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="w-full glass-input text-white text-xs rounded-xl p-2.5 bg-slate-900"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>🚗 {v.year} {v.make} {v.model}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full glass-input text-white text-xs rounded-xl p-2.5 bg-slate-900"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Service Type Filter */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full glass-input text-white text-xs rounded-xl p-2.5 bg-slate-900"
            >
              <option value="all">All Types</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Repair">Repair</option>
              <option value="Upgrade">Upgrade</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full glass-input text-white text-xs rounded-xl p-2.5 bg-slate-900"
            >
              <option value="date-desc">Sort: Newest Date</option>
              <option value="date-asc">Sort: Oldest Date</option>
              <option value="cost-desc">Sort: Highest Cost</option>
              <option value="mileage-desc">Sort: Highest Mileage</option>
            </select>
          </div>

        </div>

        {/* Total Results & Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Showing <strong className="text-white">{filteredRecords.length}</strong> service records</span>
          <span>Filtered Total: <strong className="text-cyan-400 font-mono font-bold text-sm">${totalFilteredCost.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Record Table / Cards */}
      {filteredRecords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl text-slate-400">
          No service records found matching your filters.
        </div>
      ) : (
        <>
          {/* Mobile View: Compact, Touch-Friendly Cards (for small screens < 768px) */}
          <div className="md:hidden space-y-3.5">
            {filteredRecords.map((r) => (
              <div key={r.id} className="glass-panel p-4.5 rounded-2xl space-y-3 border border-slate-800">
                
                {/* Header Row: Category, Type Tag & Cost */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-sm text-white block">{r.category}</span>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {vehicleMap.get(r.vehicleId) || 'Unknown'}
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-base text-cyan-400 shrink-0">
                    ${r.cost.toFixed(2)}
                  </span>
                </div>

                {/* Meta Row: Date, Mileage, Type Tag */}
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{r.date}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono font-bold text-slate-200">{r.mileage.toLocaleString()} mi</span>
                  </div>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                    r.type === 'Repair' ? 'bg-red-950 text-red-400 border border-red-800/60' :
                    r.type === 'Maintenance' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' :
                    r.type === 'Upgrade' ? 'bg-purple-950 text-purple-400 border border-purple-800/60' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {r.type}
                  </span>
                </div>

                {/* Provider & Notes */}
                {(r.provider || r.notes) && (
                  <div className="text-xs text-slate-400 space-y-1">
                    {r.provider && (
                      <p className="text-[11px] text-slate-300">
                        <strong className="text-slate-400">Shop:</strong> {r.provider}
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Multi-User Audit Tracking Info */}
                {(r.loggedBy || r.lastEditedBy) && (
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                    {r.loggedBy && (
                      <span>👤 Logged by <strong className="text-slate-200">{r.loggedBy.displayName}</strong></span>
                    )}
                    {r.lastEditedBy && r.lastEditedBy.uid !== r.loggedBy?.uid && (
                      <span>✏️ Edited by <strong className="text-slate-300">{r.lastEditedBy.displayName}</strong></span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60 no-print">
                  <button
                    onClick={() => onEditRecord(r)}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete service record for ${r.category} on ${r.date}?`)) {
                        onDeleteRecord(r.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-red-950/60 text-red-400 px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Desktop View: Full Detail Table (for screens >= 768px) */}
          <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-800">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Category & Type</th>
                    <th className="py-3.5 px-4">Mileage</th>
                    <th className="py-3.5 px-4">Provider / Shop</th>
                    <th className="py-3.5 px-4 text-right">Cost ($)</th>
                    <th className="py-3.5 px-4 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-300">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {vehicleMap.get(r.vehicleId) || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{r.category}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            r.type === 'Repair' ? 'bg-red-950 text-red-400 border border-red-800/60' :
                            r.type === 'Maintenance' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' :
                            r.type === 'Upgrade' ? 'bg-purple-950 text-purple-400 border border-purple-800/60' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {r.type}
                          </span>
                        </div>
                        {r.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 italic max-w-xs">{r.notes}</p>
                        )}
                        {(r.loggedBy || r.lastEditedBy) && (
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            {r.loggedBy && <span>👤 {r.loggedBy.displayName}</span>}
                            {r.lastEditedBy && r.lastEditedBy.uid !== r.loggedBy?.uid && <span>(✏️ {r.lastEditedBy.displayName})</span>}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-300">
                        {r.mileage.toLocaleString()} mi
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {r.provider || 'Self / DIY'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white whitespace-nowrap">
                        ${r.cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete service record for ${r.category} on ${r.date}?`)) {
                                onDeleteRecord(r.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
