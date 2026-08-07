import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import type { Vehicle, EnrichedServiceRecord, EnrichedRefuelRecord } from '../../types';
import { BarChart3, PieChart as PieIcon, DollarSign, TrendingUp, ReceiptText, Fuel } from 'lucide-react';

interface CostAnalyticsProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  records: EnrichedServiceRecord[];
  refuelRecords: EnrichedRefuelRecord[];
}

const STATION_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const CATEGORY_COLORS: Record<string, string> = {
  'Oil Change': '#0284c7',
  'Brakes': '#ef4444',
  'Tires & Alignment': '#f59e0b',
  'Engine & Transmission': '#8b5cf6',
  'Battery & Electrical': '#10b981',
  'Suspension & Steering': '#ec4899',
  'HVAC / AC': '#06b6d4',
  'Scheduled Maintenance': '#6366f1',
  'General Repair': '#f97316',
  'Detailing & Body': '#14b8a6',
  'Registration': '#059669',
  'Safety Inspection': '#d97706',
  'Emission Inspection': '#ca8a04',
  'Property Tax': '#16a34a',
  'Insurance': '#2563eb',
  'Parking': '#4f46e5',
  'Traffic Tickets': '#dc2626',
  'Tolls': '#0284c7',
  'Decal & License': '#9333ea',
  'Inspection & Registration': '#64748b',
  'Fuel Log': '#84cc16',
  'Other': '#94a3b8'
};

const TYPE_COLORS: Record<string, string> = {
  'Maintenance': '#38bdf8',
  'Repair': '#f87171',
  'Upgrade': '#c084fc',
  'Inspection': '#a3e635',
  'Fee / Tax': '#10b981',
  'Other Expense': '#a855f7'
};

export const CostAnalytics: React.FC<CostAnalyticsProps> = ({
  vehicles,
  activeVehicleId,
  records,
  refuelRecords
}) => {
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId);
  const filteredRecords = useMemo(() => {
    return activeVehicleId === 'all'
      ? records
      : records.filter(r => r.vehicleId === activeVehicleId);
  }, [records, activeVehicleId]);

  const filteredRefuelRecords = useMemo(() => {
    return activeVehicleId === 'all'
      ? refuelRecords
      : refuelRecords.filter(r => r.vehicleId === activeVehicleId);
  }, [refuelRecords, activeVehicleId]);

  // Aggregate monthly fuel spend
  const fuelMonthlyData = useMemo(() => {
    const monthsMap: Record<string, { month: string; cost: number }> = {};
    const sorted = [...filteredRefuelRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(r => {
      if (!r.date) return;
      const monthKey = r.date.substring(0, 7);
      if (!monthsMap[monthKey]) {
        const dateObj = new Date(r.date + 'T00:00:00');
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthsMap[monthKey] = { month: monthName, cost: 0 };
      }
      monthsMap[monthKey].cost += r.amountPaid;
    });
    return Object.values(monthsMap);
  }, [filteredRefuelRecords]);

  // Aggregate fuel spend by vendor/gas station
  const fuelVendorData = useMemo(() => {
    const vendorMap: Record<string, number> = {};
    filteredRefuelRecords.forEach(r => {
      vendorMap[r.vendor] = (vendorMap[r.vendor] || 0) + r.amountPaid;
    });
    return Object.entries(vendorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRefuelRecords]);

  const totalFuelSpent = filteredRefuelRecords.reduce((sum, r) => sum + r.amountPaid, 0);

  // Aggregate monthly expenses
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { month: string; cost: number }> = {};
    
    // Sort records chronologically
    const sorted = [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(r => {
      if (!r.date) return;
      const monthKey = r.date.substring(0, 7); // YYYY-MM
      if (!monthsMap[monthKey]) {
        const dateObj = new Date(r.date + 'T00:00:00');
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthsMap[monthKey] = { month: monthName, cost: 0 };
      }
      monthsMap[monthKey].cost += r.cost;
    });

    return Object.values(monthsMap);
  }, [filteredRecords]);

  // Aggregate cost by Category
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredRecords.forEach(r => {
      catMap[r.category] = (catMap[r.category] || 0) + r.cost;
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Aggregate cost by Type
  const typeData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    filteredRecords.forEach(r => {
      typeMap[r.type] = (typeMap[r.type] || 0) + r.cost;
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const totalSpent = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalTaxDeductible = filteredRecords
    .filter(r => r.isTaxDeductible)
    .reduce((sum, r) => sum + r.cost, 0);
  const taxDeductiblePercent = totalSpent > 0 ? ((totalTaxDeductible / totalSpent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Cost & Expense Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Expense trends, tax deductions, and category breakdown for {activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : 'All Vehicles'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 border border-slate-750 px-4 py-2 rounded-xl text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Total Spending</span>
            <span className="text-lg font-extrabold text-white font-mono">
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-800/80 px-4 py-2 rounded-xl text-right">
            <span className="text-[11px] text-emerald-400 block font-bold flex items-center justify-end gap-1">
              <ReceiptText className="w-3.5 h-3.5" />
              Tax Deductible ({taxDeductiblePercent}%)
            </span>
            <span className="text-lg font-extrabold text-emerald-300 font-mono">
              ${totalTaxDeductible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl text-slate-400">
          No expense records available to render analytics charts. Log services or vehicle expenses first.
        </div>
      ) : (
        <>
          {/* Monthly Trend Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Monthly Vehicle Expense Trend ($)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                  />
                  <Bar dataKey="cost" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Pie Chart */}
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-amber-400" />
                Cost Breakdown by Category
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Type Breakdown Chart */}
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Expense & Service Distribution
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeData.map((entry) => (
                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Fuel Spend Analytics */}
      {filteredRefuelRecords.length > 0 && (
        <>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-400" />
                Fuel Spend Analytics
              </h2>
              <div className="bg-emerald-950/80 border border-emerald-800/80 px-4 py-2 rounded-xl text-right">
                <span className="text-[11px] text-emerald-400 block font-bold">Total Fuel Spend</span>
                <span className="text-lg font-extrabold text-emerald-300 font-mono">
                  ${totalFuelSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Fuel Cost']}
                  />
                  <Bar dataKey="cost" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-400" />
              Fuel Spend by Gas Station
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelVendorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {fuelVendorData.map((entry, idx) => (
                      <Cell key={entry.name} fill={STATION_COLORS[idx % STATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
