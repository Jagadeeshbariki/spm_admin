import { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Box, 
  CalendarDays, 
  Car, 
  Users,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { fetchSheet } from '../../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyExpenses: 0,
    totalAssets: 0,
    totalMeetings: 0,
    travelExpenses: 0,
    activeVendors: 0,
  });
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expenses, assets, meetings, rentals, vendors] = await Promise.all([
        fetchSheet('expenses'),
        fetchSheet('asset_registry'),
        fetchSheet('meeting_tracker'),
        fetchSheet('Car_Rental'),
        fetchSheet('Vendor_Management')
      ]);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate Metrics
      let monthlyExp = 0;
      const expByMonth: Record<string, number> = {};
      const expByCategory: Record<string, number> = {};

      expenses.forEach((e: any) => {
        const amt = parseFloat(e.Amount) || 0;
        const date = new Date(e.date);
        
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthlyExp += amt;
        }

        const monthName = date.toLocaleString('default', { month: 'short' });
        expByMonth[monthName] = (expByMonth[monthName] || 0) + amt;

        const cat = e.Expense_type || 'Others';
        expByCategory[cat] = (expByCategory[cat] || 0) + amt;
      });

      let travelExp = 0;
      rentals.forEach((r: any) => {
        const amt = parseFloat(r.Amount) || 0;
        const date = new Date(r.Date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          travelExp += amt;
        }
      });

      let currentMonthMeetings = 0;
      meetings.forEach((m: any) => {
        const date = new Date(m['Meeting Date']);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          currentMonthMeetings++;
        }
      });

      setMetrics({
        monthlyExpenses: monthlyExp,
        totalAssets: assets.length,
        totalMeetings: currentMonthMeetings,
        travelExpenses: travelExp,
        activeVendors: vendors.length,
      });

      // Format Chart Data
      const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedExpenseData = Object.keys(expByMonth)
        .map(name => ({ name, amount: expByMonth[name] }))
        .sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
      
      setExpenseData(formattedExpenseData.length > 0 ? formattedExpenseData : [{ name: 'No Data', amount: 0 }]);

      const formattedCategoryData = Object.keys(expByCategory).map(name => ({
        name, value: expByCategory[name]
      }));
      setCategoryData(formattedCategoryData.length > 0 ? formattedCategoryData : [{ name: 'No Data', value: 1 }]);

      // Compile Recent Activity
      const activities: any[] = [];
      
      expenses.slice(-5).forEach((e: any) => {
        if (e.date) {
          activities.push({
            id: `exp-${e._rowIndex}`,
            date: e.date,
            module: 'Expense',
            desc: e.Description || e.Expense_type,
            amount: `₹${e.Amount}`,
            status: 'Paid',
            timestamp: new Date(e.date).getTime()
          });
        }
      });

      assets.slice(-5).forEach((a: any) => {
        if (a['Purchase Date']) {
          activities.push({
            id: `ast-${a._rowIndex}`,
            date: a['Purchase Date'],
            module: 'Asset',
            desc: `New ${a.Asset_type} Added`,
            amount: a.Cost ? `₹${a.Cost}` : '-',
            status: a.Status || 'Active',
            timestamp: new Date(a['Purchase Date']).getTime()
          });
        }
      });

      meetings.slice(-5).forEach((m: any) => {
        if (m['Meeting Date']) {
          activities.push({
            id: `mtg-${m._rowIndex}`,
            date: m['Meeting Date'],
            module: 'Meeting',
            desc: m['Project Name'] || m.Reason,
            amount: '-',
            status: 'Completed',
            timestamp: new Date(m['Meeting Date']).getTime()
          });
        }
      });

      rentals.slice(-5).forEach((r: any) => {
        if (r.Date) {
          activities.push({
            id: `rnt-${r._rowIndex}`,
            date: r.Date,
            module: 'Travel',
            desc: `${r['Vehicle Type']} for ${r.Project}`,
            amount: r.Amount ? `₹${r.Amount}` : '-',
            status: 'Completed',
            timestamp: new Date(r.Date).getTime()
          });
        }
      });

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 8));

    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Monthly Expenses" value={`₹${metrics.monthlyExpenses.toLocaleString()}`} subtext="This Month" icon={IndianRupee} color="bg-blue-100 text-blue-600" />
        <SummaryCard title="Total Assets" value={metrics.totalAssets} subtext="Active" icon={Box} color="bg-emerald-100 text-emerald-600" />
        <SummaryCard title="Total Meetings" value={metrics.totalMeetings} subtext="This Month" icon={CalendarDays} color="bg-purple-100 text-purple-600" />
        <SummaryCard title="Travel Expenses" value={`₹${metrics.travelExpenses.toLocaleString()}`} subtext="This Month" icon={Car} color="bg-orange-100 text-orange-600" />
        <SummaryCard title="Active Vendors" value={metrics.activeVendors} subtext="Registered" icon={Users} color="bg-pink-100 text-pink-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-6">Monthly Expenses Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-6">Expense Categories</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.length > 0 ? recentActivity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {item.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.desc}</td>
                  <td className="px-6 py-4 text-slate-600">{item.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Paid' || item.status === 'Completed' || item.status === 'Active' || item.status === 'Available' || item.status === 'In Use'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No recent activity found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtext, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}
