import { useState, useEffect } from 'react';
import { Download, Filter, Loader2, FileText } from 'lucide-react';
import { fetchSheet } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    project: 'All Projects',
    expenseType: 'All Types',
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [assets, expenses, rentals, meetings] = await Promise.all([
        fetchSheet('asset_registry'),
        fetchSheet('expenses'),
        fetchSheet('Car_Rental'),
        fetchSheet('meeting_tracker')
      ]);

      const projSet = new Set<string>();
      assets.forEach((a: any) => a.Project && projSet.add(a.Project));
      rentals.forEach((r: any) => r.Project && projSet.add(r.Project));
      meetings.forEach((m: any) => m['Project Name'] && projSet.add(m['Project Name']));
      
      const expSet = new Set<string>();
      expenses.forEach((e: any) => e.Expense_type && expSet.add(e.Expense_type));

      setProjects(Array.from(projSet));
      setExpenseTypes(Array.from(expSet));
    } catch (error) {
      console.error(error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const [expenses, assets, rentals] = await Promise.all([
        fetchSheet('expenses'),
        fetchSheet('asset_registry'),
        fetchSheet('Car_Rental')
      ]);

      let combinedData: any[] = [];

      // Process Expenses
      expenses.forEach((e: any) => {
        if (filters.expenseType !== 'All Types' && e.Expense_type !== filters.expenseType) return;
        if (filters.project !== 'All Projects') return; // Expenses don't have projects in this schema, so if a project is selected, exclude generic expenses or adjust logic. For now, exclude if project is selected.
        
        if (filters.startDate && new Date(e.date) < new Date(filters.startDate)) return;
        if (filters.endDate && new Date(e.date) > new Date(filters.endDate)) return;

        combinedData.push({
          Date: e.date,
          Type: 'Expense',
          Category: e.Expense_type,
          Description: e.Description,
          Project: '-',
          Amount: parseFloat(e.Amount) || 0,
        });
      });

      // Process Assets
      assets.forEach((a: any) => {
        if (filters.expenseType !== 'All Types') return; // Assets aren't expenses
        if (filters.project !== 'All Projects' && a.Project !== filters.project) return;
        
        if (filters.startDate && new Date(a['Purchase Date']) < new Date(filters.startDate)) return;
        if (filters.endDate && new Date(a['Purchase Date']) > new Date(filters.endDate)) return;

        combinedData.push({
          Date: a['Purchase Date'],
          Type: 'Asset Purchase',
          Category: a.Asset_Category,
          Description: a.asset_name,
          Project: a.Project || '-',
          Amount: parseFloat(a.Cost) || 0,
        });
      });

      // Process Rentals
      rentals.forEach((r: any) => {
        if (filters.expenseType !== 'All Types') return; // Rentals aren't standard expenses
        if (filters.project !== 'All Projects' && r.Project !== filters.project) return;
        
        if (filters.startDate && new Date(r.Date) < new Date(filters.startDate)) return;
        if (filters.endDate && new Date(r.Date) > new Date(filters.endDate)) return;

        combinedData.push({
          Date: r.Date,
          Type: 'Car Rental',
          Category: 'Travel',
          Description: `${r['Vehicle Type']} - ${r['Travel Route']}`,
          Project: r.Project || '-',
          Amount: parseFloat(r.Amount) || 0,
        });
      });

      // Sort by date descending
      combinedData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      
      setReportData(combinedData);
      if (combinedData.length === 0) {
        toast.error('No data found for the selected filters');
      } else {
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Project', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        [row.Date, row.Type, row.Category, `"${row.Description || ''}"`, `"${row.Project || ''}"`, row.Amount].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAmount = reportData.reduce((sum, item) => sum + item.Amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            disabled={reportData.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <input 
                type="date" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full" 
              />
              <span className="mx-2 text-slate-400">to</span>
              <input 
                type="date" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={filters.project}
                onChange={e => setFilters({...filters, project: e.target.value})}
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
              >
                <option>All Projects</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expense Type</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={filters.expenseType}
                onChange={e => setFilters({...filters, expenseType: e.target.value})}
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
              >
                <option>All Types</option>
                {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Report
          </button>
        </div>
      </div>

      {reportData.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800">Report Results</h3>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-slate-900">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{row.Date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{row.Type}</td>
                    <td className="px-6 py-4 text-slate-600">{row.Category}</td>
                    <td className="px-6 py-4 text-slate-600">{row.Description}</td>
                    <td className="px-6 py-4 text-slate-600">{row.Project}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">₹{row.Amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Data Generated</h3>
          <p className="text-slate-500 max-w-sm">Select your filters and click "Generate Report" to view the data here.</p>
        </div>
      )}
    </div>
  );
}
