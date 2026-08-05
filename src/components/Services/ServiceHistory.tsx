import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit2, 
  Trash2,
  ReceiptText
} from 'lucide-react';
import type { Vehicle, EnrichedServiceRecord } from '../../types';
import { exportRecordsAsCSV } from '../../services/storage';

interface ServiceHistoryProps {
  records: EnrichedServiceRecord[];
  vehicles: Vehicle[];
  activeVehicleId: string;
  onOpenAddService: () => void;
  onEditRecord: (record: EnrichedServiceRecord) => void;
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
  const [selectedTaxFilter, setSelectedTaxFilter] = useState<'all' | 'tax-deductible' | 'non-deductible'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'cost-desc' | 'mileage-desc'>('date-desc');

  const vehicleMap = useMemo(() => {
    return new Map(vehicles.map(v => [v.id, v]));
  }, [vehicles]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedVehicleFilter !== 'all' && r.vehicleId !== selectedVehicleFilter) return false;
      if (selectedCategoryFilter !== 'all' && r.category !== selectedCategoryFilter) return false;
      if (selectedTypeFilter !== 'all' && r.type !== selectedTypeFilter) return false;
      if (selectedTaxFilter === 'tax-deductible' && !r.isTaxDeductible) return false;
      if (selectedTaxFilter === 'non-deductible' && r.isTaxDeductible) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const vehicle = vehicleMap.get(r.vehicleId);
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase() : '';
        const matchCategory = r.category.toLowerCase().includes(query);
        const matchProvider = (r.provider || '').toLowerCase().includes(query);
        const matchNotes = (r.notes || '').toLowerCase().includes(query);
        return matchCategory || matchProvider || matchNotes || vehicleName.includes(query);
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'cost-desc') return b.cost - a.cost;
      if (sortBy === 'mileage-desc') return b.mileage - a.mileage;
      return 0;
    });
  }, [records, selectedVehicleFilter, selectedCategoryFilter, selectedTypeFilter, selectedTaxFilter, searchQuery, sortBy, vehicleMap]);

  const totalFilteredCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalTaxDeductibleCost = filteredRecords
    .filter(r => r.isTaxDeductible)
    .reduce((sum, r) => sum + r.cost, 0);

  const handleExportCSV = () => {
    exportRecordsAsCSV(filteredRecords, vehicles);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white font-display">Vehicle Logs & Expense History</h1>
          </div>
          <p className="text-xs text-slate-400">
            Comprehensive timeline for repairs, scheduled maintenance, taxes, registrations, and vehicle expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            Print Report
          </button>

          <button
            onClick={onOpenAddService}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Service / Expense
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          
          {/* Search Field */}
          <div className="relative xl:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search category, provider, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filter Vehicle */}
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="all">🚘 All Vehicles ({vehicles.length})</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>

          {/* Filter Category */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="all">📋 All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filter Service Type */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="all">🔧 All Log Types</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Repair">Repair</option>
            <option value="Upgrade">Upgrade</option>
            <option value="Inspection">Inspection</option>
            <option value="Fee / Tax">Fee / Tax</option>
            <option value="Other Expense">Other Expense</option>
          </select>

          {/* Filter Tax Deductible */}
          <select
            value={selectedTaxFilter}
            onChange={(e: any) => setSelectedTaxFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-semibold text-emerald-400"
          >
            <option value="all">🏷️ Tax: All Logs</option>
            <option value="tax-deductible">💵 Tax-Deductible Only</option>
            <option value="non-deductible">❌ Non-Deductible Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="date-desc">📅 Newest First</option>
            <option value="date-asc">📅 Oldest First</option>
            <option value="cost-desc">💲 Highest Cost</option>
            <option value="mileage-desc">🏎️ Highest Mileage</option>
          </select>

        </div>

        {/* Filter Summary & Total Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Showing <strong className="text-cyan-400">{filteredRecords.length}</strong> log entries</span>
          <div className="flex flex-wrap items-center gap-4">
            <span>Total Expenses: <strong className="text-white font-mono text-sm">${totalFilteredCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
              <ReceiptText className="w-3.5 h-3.5" />
              Tax-Deductible: <strong className="font-mono text-sm">${totalTaxDeductibleCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Service Records Table / List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const vehicle = vehicleMap.get(record.vehicleId);

            return (
              <div 
                key={record.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0 mt-0.5">
                    <History className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-white">{record.category}</h3>
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                        record.type === 'Repair' ? 'bg-red-950 text-red-400 border border-red-800' :
                        record.type === 'Maintenance' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        record.type === 'Upgrade' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                        record.type === 'Fee / Tax' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        record.type === 'Inspection' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {record.type}
                      </span>

                      {record.isTaxDeductible && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <ReceiptText className="w-3 h-3" />
                          Tax Deductible
                        </span>
                      )}
                    </div>

                    {vehicle && (
                      <p className="text-xs font-semibold text-cyan-400">
                        🚘 {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>📅 {record.date}</span>
                      <span>•</span>
                      <span>🏎️ {record.mileage.toLocaleString()} mi</span>
                      {record.provider && (
                        <>
                          <span>•</span>
                          <span>🔧 {record.provider}</span>
                        </>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        {record.notes}
                      </p>
                    )}

                    <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>💳 {record.paymentType}</span>
                      <span>• 🕐 {record.time}</span>
                    </div>

                    {/* Multi-User Audit Badges */}
                    {record.loggedBy && (
                      <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>👤 Logged by <strong className="text-slate-400">{record.loggedBy.displayName}</strong></span>
                        {record.lastEditedBy && record.lastEditedBy.uid !== record.loggedBy.uid && (
                          <span>• ✏️ Edited by <strong className="text-slate-400">{record.lastEditedBy.displayName}</strong></span>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Right Side: Cost & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Cost</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      ${record.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 no-print">
                    <button
                      onClick={() => onEditRecord(record)}
                      className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
                      title="Edit Log Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-3xl">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Logs Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No vehicle expense or maintenance records match your current search or filter criteria.
          </p>
          <button
            onClick={onOpenAddService}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            + Add New Log Entry
          </button>
        </div>
      )}

    </div>
  );
};
