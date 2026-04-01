import { useState, useEffect } from 'react';
import { fetchSheet, addRow, deleteRow } from '@/lib/api';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import DeleteButton from '@/components/DeleteButton';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [dropdownCategory, setDropdownCategory] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [pendingOptions, setPendingOptions] = useState<{ 'formname': string; 'dropdwon catagorty': string; 'dropdwon options': string }[]>([]);

  const formConfig: Record<string, string[]> = {
    'Asset Registry': ['Asset Category', 'Asset Type', 'Units', 'Staff Name'],
    'Asset Usage': ['Units'],
    'Expenses Registry': ['Expense Type', 'Units'],
    'Meetings Tracker': ['Project'],
    'Vendors': ['Vendor Type'],
    'Car Rentals': ['Vehicle Type', 'Employee Name', 'Staff Name'],
    'Staff': ['Staff Name'],
    'Mail Tracker': ['Activity', 'Approved Status'],
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await fetchSheet('MasterData');
      console.log('MasterData result:', result);
      setData(result);
    } catch (error) {
      toast.error('Failed to load master data');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToPending() {
    if (!formName || !dropdownCategory || !dropdownOptions) {
      toast.error('Please enter form name, category, and option');
      return;
    }
    setPendingOptions([...pendingOptions, { 'formname': formName, 'dropdwon catagorty': dropdownCategory, 'dropdwon options': dropdownOptions }]);
    setDropdownOptions('');
  }

  async function handleSubmitAll() {
    if (pendingOptions.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const item of pendingOptions) {
        await addRow('MasterData', item);
      }
      toast.success('All options added');
      setPendingOptions([]);
      loadData();
    } catch (error) {
      toast.error('Failed to add options');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(index: number) {
    console.log('Attempting to delete row at index:', index);
    setIsSubmitting(true);
    try {
      await deleteRow('MasterData', index);
      toast.success('Option deleted');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete option');
    } finally {
      setIsSubmitting(false);
    }
  }

  const groupedData = data.reduce((acc, item) => {
    const key = `${item.formname} - ${item['dropdwon catagorty']}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={cn("p-4 md:p-6 overflow-x-hidden", isSubmitting && "blur-sm pointer-events-none")}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-lg font-bold text-slate-800">Updating Master Data...</p>
            <p className="text-sm text-slate-500">Please wait while we sync with the spreadsheet</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Master Data Settings</h1>
        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'office admin') && (
          <Link 
            to="/admin/water-collective-management"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <MapPin className="w-4 h-4" /> Water Collective Sites
          </Link>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Option</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setDropdownCategory(''); }}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full"
            >
              <option value="">Select Form Name</option>
              {Object.keys(formConfig).map(form => <option key={form} value={form}>{form}</option>)}
            </select>
            <select
              value={dropdownCategory}
              onChange={(e) => setDropdownCategory(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full"
              disabled={!formName}
            >
              <option value="">Select Category</option>
              {(formConfig[formName] || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Option"
                value={dropdownOptions}
                onChange={(e) => setDropdownOptions(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 w-full"
              />
              <button
                onClick={handleAddToPending}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {pendingOptions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Pending Options:</h3>
              <ul className="space-y-2 mb-4">
                {pendingOptions.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-slate-100 p-2 rounded-lg text-sm">
                    <span>{item['formname']} - {item['dropdwon catagorty']}: {item['dropdwon options']}</span>
                    <button onClick={() => setPendingOptions(pendingOptions.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSubmitAll}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 w-full md:w-auto"
              >
                Submit All
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedData).map(([groupKey, items]) => (
            <div key={groupKey} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h3 className="font-semibold text-slate-800 mb-4">{groupKey}</h3>
              <ul className="space-y-2">
                {(items as any[]).map((item: any, idx: number) => (
                  <li key={`${groupKey}-${item['dropdwon options']}-${idx}`} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-sm">
                    <span>{item['dropdwon options']}</span>
                    <DeleteButton onClick={() => handleDelete(item._rowIndex)} className="text-red-500 hover:text-red-700" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
