import re

content = """import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Activity, Users, Package, TrendingUp, ChevronDown, ChevronRight, 
  IndianRupee, Zap, FileText, Calendar, Award, AlertTriangle, MapPin
} from 'lucide-react';
import { ExpandableChartBox } from './ExpandableChartBox';
import { cn } from '@/lib/utils';

interface DashboardProps {
  microEnterprises: any[];
}

export function UtilizationDashboard({ microEnterprises = [] }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('executive');

  const tabs = [
    { id: 'executive', label: 'Executive Overview', icon: Activity },
    { id: 'performance', label: 'Unit Performance', icon: BarChart },
    { id: 'ranking', label: 'Monthly Ranking', icon: Award },
    { id: 'individual', label: 'Individual Unit', icon: FileText },
    { id: 'farmer', label: 'Farmer Usage', icon: Users },
  ];

  // Helper to parse all records
  const data = useMemo(() => {
    return microEnterprises.filter(m => m.table_list_pd1 && m.table_list_pd2).map(m => {
      const pd1 = m.table_list_pd1;
      const pd2 = m.table_list_pd2;
      const pd = m.table_list_pd;
      
      const dateStr = pd1.processing_date || m.__system?.submissionDate;
      const date = new Date(dateStr);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthSort = date.toISOString().substring(0, 7);

      return {
        unitId: pd1.farmer_select || pd1.farmer_name,
        unitName: String(pd1.farmer_name || 'Unknown').trim(),
        machineType: String(pd1.Machine_type || 'Unknown').replace(/_/g, ' '),
        district: String(pd?.district || 'Unknown').trim(),
        block: String(pd?.block || 'Unknown').trim(),
        gp: String(pd?.gp || 'Unknown').trim(),
        village: String(pd?.village || 'Unknown').trim(),
        monthYear,
        monthSort,
        date,
        qty: parseFloat(pd2.processing_qty_kgs) || 0,
        revenue: parseFloat(pd2.rent_amount) || 0,
        farmers: parseInt(pd2.processing_farmer) || 1, // Sometimes this is a count, sometimes ID. The user says "Unique farmers served". We'll treat the number as count or 1 if invalid.
        processing_farmer: pd2.processing_farmer, // Store original
        timeMins: parseFloat(pd2.time_mins) || 0
      };
    });
  }, [microEnterprises]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                isActive ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'executive' && <ExecutiveOverview data={data} />}
        {activeTab === 'performance' && <UnitPerformance data={data} />}
        {activeTab === 'ranking' && <MonthlyRanking data={data} />}
        {activeTab === 'individual' && <IndividualUnit data={data} />}
        {activeTab === 'farmer' && <FarmerUsage data={data} />}
      </div>
    </div>
  );
}

// --- SUB PAGES ---

function ExecutiveOverview({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalRevenue = 0;
    let totalFarmers = 0;
    const uniqueUnits = new Set();
    const activeUnitsThisMonth = new Set();
    
    // Sort to find latest month
    const sortedDates = [...new Set(data.map(d => d.monthSort))].sort().reverse();
    const latestMonth = sortedDates[0];

    const monthlyData: Record<string, { qty: number, activeUnits: Set<string>, farmers: number }> = {};
    const unitStats: Record<string, { qty: number, name: string }> = {};

    data.forEach(d => {
      totalQty += d.qty;
      totalRevenue += d.revenue;
      totalFarmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);
      uniqueUnits.add(d.unitId);
      
      if (d.monthSort === latestMonth) {
        activeUnitsThisMonth.add(d.unitId);
      }

      if (!monthlyData[d.monthSort]) {
        monthlyData[d.monthSort] = { qty: 0, activeUnits: new Set(), farmers: 0 };
      }
      monthlyData[d.monthSort].qty += d.qty;
      monthlyData[d.monthSort].activeUnits.add(d.unitId);
      monthlyData[d.monthSort].farmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);

      if (!unitStats[d.unitId]) {
        unitStats[d.unitId] = { qty: 0, name: d.unitName };
      }
      unitStats[d.unitId].qty += d.qty;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([m, val]) => ({
        month: m,
        monthName: new Date(m + "-01").toLocaleString('default', { month: 'short', year: '2-digit' }),
        qty: val.qty,
        activeUnits: val.activeUnits.size,
        farmers: val.farmers
      }));

    const topUnits = Object.values(unitStats)
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 10);

    return {
      totalUnits: uniqueUnits.size,
      activeUnits: activeUnitsThisMonth.size,
      totalQty,
      totalRevenue,
      totalFarmers,
      avgKgPerUnit: uniqueUnits.size > 0 ? (totalQty / uniqueUnits.size) : 0,
      monthlyTrend,
      topUnits,
      latestMonth
    };
  }, [data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Units" value={stats.totalUnits} icon={Package} color="blue" />
        <KpiCard title="Active Units" value={stats.activeUnits} subtitle={`in ${stats.latestMonth}`} icon={Activity} color="emerald" />
        <KpiCard title="Total Quantity" value={`${Math.round(stats.totalQty).toLocaleString()} KG`} icon={Package} color="purple" />
        <KpiCard title="Farmers Served" value={stats.totalFarmers.toLocaleString()} icon={Users} color="amber" />
        <KpiCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="green" />
        <KpiCard title="Avg KG / Unit" value={`${Math.round(stats.avgKgPerUnit)} KG`} icon={TrendingUp} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpandableChartBox title="Monthly Processing Trend (KG)" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="qty" name="Quantity (KG)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Top Processing Units (KG)" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topUnits} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="qty" name="Quantity (KG)" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpandableChartBox title="Monthly Active Units" className="p-4" contentClassName="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="activeUnits" name="Active Units" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Monthly Farmers Served" className="p-4" contentClassName="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="farmers" name="Farmers Served" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChartBox>
      </div>
    </div>
  );
}

function UnitPerformance({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    const unitMap: Record<string, any> = {};
    data.forEach(d => {
      if (!unitMap[d.unitId]) {
        unitMap[d.unitId] = {
          id: d.unitId,
          name: d.unitName,
          village: d.village,
          machine: d.machineType,
          qty: 0,
          farmers: 0,
          revenue: 0
        };
      }
      unitMap[d.unitId].qty += d.qty;
      unitMap[d.unitId].farmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);
      unitMap[d.unitId].revenue += d.revenue;
    });

    return Object.values(unitMap).sort((a,b) => b.qty - a.qty);
  }, [data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Processing Unit Ranking</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Unit Name</th>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">Machine Type</th>
                <th className="px-4 py-3 text-right">KG Processed</th>
                <th className="px-4 py-3 text-right">Farmers</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-500">#{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{row.village}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{row.machine}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{Math.round(row.qty).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.farmers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">₹{row.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpandableChartBox title="Unit-wise Farmers Served" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.slice(0, 15)} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="farmers" name="Farmers" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Unit-wise Revenue (₹)" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.slice(0, 15)} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>
      </div>
    </div>
  );
}

function MonthlyRanking({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    const monthlyUnitMap: Record<string, Record<string, any>> = {};
    
    data.forEach(d => {
      if (!monthlyUnitMap[d.monthSort]) monthlyUnitMap[d.monthSort] = {};
      if (!monthlyUnitMap[d.monthSort][d.unitId]) {
        monthlyUnitMap[d.monthSort][d.unitId] = {
          id: d.unitId,
          name: d.unitName,
          qty: 0,
          farmers: 0,
          revenue: 0
        };
      }
      monthlyUnitMap[d.monthSort][d.unitId].qty += d.qty;
      monthlyUnitMap[d.monthSort][d.unitId].farmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);
      monthlyUnitMap[d.monthSort][d.unitId].revenue += d.revenue;
    });

    const ranking = Object.entries(monthlyUnitMap)
      .sort((a,b) => b[0].localeCompare(a[0]))
      .map(([month, units]) => {
        const sortedUnits = Object.values(units).sort((a,b) => b.qty - a.qty);
        const topUnit = sortedUnits[0];
        return {
          monthSort: month,
          monthName: new Date(month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' }),
          topUnit: topUnit?.name || '-',
          qty: topUnit?.qty || 0,
          farmers: topUnit?.farmers || 0,
          revenue: topUnit?.revenue || 0,
          allUnits: sortedUnits
        };
      });

    return ranking;
  }, [data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Monthly Top Performers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Highest Unit</th>
                <th className="px-4 py-3 text-right">KG Processed</th>
                <th className="px-4 py-3 text-right">Farmers</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((row) => (
                <tr key={row.monthSort} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.monthName}</td>
                  <td className="px-4 py-3 font-bold text-blue-600 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    {row.topUnit}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{Math.round(row.qty).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.farmers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">₹{row.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IndividualUnit({ data }: { data: any[] }) {
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const uniqueUnits = useMemo(() => {
    const map = new Map();
    data.forEach(d => {
      if (!map.has(d.unitId)) map.set(d.unitId, d.unitName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name));
  }, [data]);

  useEffect(() => {
    if (!selectedUnit && uniqueUnits.length > 0) {
      setSelectedUnit(uniqueUnits[0].id);
    }
  }, [uniqueUnits, selectedUnit]);

  const stats = useMemo(() => {
    if (!selectedUnit) return null;
    
    const unitData = data.filter(d => d.unitId === selectedUnit);
    if (unitData.length === 0) return null;

    let totalQty = 0;
    let totalRevenue = 0;
    let totalFarmers = 0;
    const monthlyMap: Record<string, any> = {};

    unitData.forEach(d => {
      totalQty += d.qty;
      totalRevenue += d.revenue;
      totalFarmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);
      
      if (!monthlyMap[d.monthSort]) {
        monthlyMap[d.monthSort] = { qty: 0, revenue: 0, farmers: 0 };
      }
      monthlyMap[d.monthSort].qty += d.qty;
      monthlyMap[d.monthSort].revenue += d.revenue;
      monthlyMap[d.monthSort].farmers += isNaN(parseInt(d.processing_farmer)) ? 1 : parseInt(d.processing_farmer);
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([m, val]) => ({
        month: m,
        monthName: new Date(m + "-01").toLocaleString('default', { month: 'short', year: '2-digit' }),
        ...val
      }));

    let bestMonth = { name: '-', qty: 0 };
    monthlyTrend.forEach(m => {
      if (m.qty > bestMonth.qty) {
        bestMonth = { name: m.monthName, qty: m.qty };
      }
    });

    // Growth calculation
    let growth = 0;
    if (monthlyTrend.length >= 2) {
      const current = monthlyTrend[monthlyTrend.length - 1].qty;
      const prev = monthlyTrend[monthlyTrend.length - 2].qty;
      if (prev > 0) growth = ((current - prev) / prev) * 100;
    }

    const info = unitData[0]; // Get static info from first record

    return {
      totalQty,
      totalRevenue,
      totalFarmers,
      avgQty: monthlyTrend.length > 0 ? totalQty / monthlyTrend.length : 0,
      bestMonth: bestMonth.name,
      growth,
      monthlyTrend,
      info: {
        name: info.unitName,
        village: info.village,
        gp: info.gp,
        block: info.block,
        machine: info.machineType
      }
    };
  }, [data, selectedUnit]);

  if (!stats) return <div className="p-8 text-center text-slate-500">No data available</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{stats.info.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 capitalize">
              <MapPin className="w-3.5 h-3.5" />
              {stats.info.village}, {stats.info.block} | {stats.info.machine}
            </div>
          </div>
        </div>
        <select 
          value={selectedUnit} 
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {uniqueUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard title="Total KG" value={Math.round(stats.totalQty).toLocaleString()} icon={Package} color="purple" />
        <KpiCard title="Total Farmers" value={stats.totalFarmers.toLocaleString()} icon={Users} color="blue" />
        <KpiCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="green" />
        <KpiCard title="Avg KG / Month" value={Math.round(stats.avgQty).toLocaleString()} icon={Activity} color="amber" />
        <KpiCard title="Best Month" value={stats.bestMonth} icon={Award} color="emerald" />
        <KpiCard title="Current Growth" value={`${stats.growth > 0 ? '+' : ''}${stats.growth.toFixed(1)}%`} icon={TrendingUp} color={stats.growth >= 0 ? "emerald" : "rose"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpandableChartBox title="Monthly Processing (KG)" className="p-4" contentClassName="h-[250px] w-full mt-4 md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="qty" name="Quantity (KG)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Farmers Served" className="p-4" contentClassName="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="farmers" name="Farmers" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Revenue (₹)" className="p-4" contentClassName="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ExpandableChartBox>
      </div>
    </div>
  );
}

function FarmerUsage({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    const farmerMap: Record<string, { qty: number, visits: number, village: string }> = {};
    const villageMap: Record<string, Set<string>> = {};
    
    data.forEach(d => {
      // In ODK, processing_farmer could be a string name or a number. 
      // We will try to group by processing_farmer + village to distinguish if names are same
      const fKey = `${d.processing_farmer}_${d.village}`;
      if (!farmerMap[fKey]) {
        farmerMap[fKey] = { qty: 0, visits: 0, village: d.village };
      }
      farmerMap[fKey].qty += d.qty;
      farmerMap[fKey].visits += 1;

      if (!villageMap[d.village]) villageMap[d.village] = new Set();
      villageMap[d.village].add(fKey);
    });

    const farmersList = Object.entries(farmerMap).map(([id, val]) => ({
      id,
      name: id.split('_')[0],
      ...val
    }));

    const uniqueFarmersCount = farmersList.length;
    const repeatFarmersCount = farmersList.filter(f => f.visits > 1).length;
    const totalQty = farmersList.reduce((acc, f) => acc + f.qty, 0);

    const villageStats = Object.entries(villageMap)
      .map(([name, set]) => ({ name, farmers: set.size }))
      .sort((a,b) => b.farmers - a.farmers)
      .slice(0, 10);

    const topFarmers = farmersList
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 10);

    return {
      uniqueFarmersCount,
      repeatFarmersCount,
      repeatRate: uniqueFarmersCount > 0 ? (repeatFarmersCount / uniqueFarmersCount) * 100 : 0,
      totalQty,
      avgQty: uniqueFarmersCount > 0 ? totalQty / uniqueFarmersCount : 0,
      villagesCovered: Object.keys(villageMap).length,
      villageStats,
      topFarmers
    };
  }, [data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard title="Unique Farmers" value={stats.uniqueFarmersCount.toLocaleString()} icon={Users} color="blue" />
        <KpiCard title="Repeat Farmers" value={stats.repeatFarmersCount.toLocaleString()} icon={Activity} color="purple" />
        <KpiCard title="Repeat Rate" value={`${stats.repeatRate.toFixed(1)}%`} icon={TrendingUp} color="emerald" />
        <KpiCard title="Villages Covered" value={stats.villagesCovered.toLocaleString()} icon={MapPin} color="amber" />
        <KpiCard title="Total Processed" value={`${Math.round(stats.totalQty).toLocaleString()} KG`} icon={Package} color="cyan" />
        <KpiCard title="Avg KG / Farmer" value={`${Math.round(stats.avgQty)} KG`} icon={Award} color="rose" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpandableChartBox title="Top Villages by Farmers Served" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.villageStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', textTransform: 'capitalize' }} />
              <Bar dataKey="farmers" name="Farmers" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>

        <ExpandableChartBox title="Top Farmers by Processing Quantity (KG)" className="p-4" contentClassName="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topFarmers} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="qty" name="Quantity (KG)" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChartBox>
      </div>
    </div>
  );
}

// --- SHARED UI ---
function KpiCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    rose: 'bg-rose-50 text-rose-600',
    green: 'bg-green-50 text-green-600',
  };
  
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">{title}</h4>
        <div className={cn("p-1.5 rounded-lg", colorClasses[color] || 'bg-slate-50 text-slate-600')}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-xl font-black text-slate-800">{value}</div>
        {subtitle && <div className="text-[10px] font-medium text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
"""

with open('src/components/UtilizationDashboard.tsx', 'w') as f:
    f.write(content)
