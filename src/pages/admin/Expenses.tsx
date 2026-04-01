import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    Bill_id: '',
    date: '',
    Expense_type: 'Electricity',
    Amount: '',
    Description: '',
    Paid_by: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [farmNames, setFarmNames] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('All Types');

  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  useEffect(() => {
    loadData();
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const data = await fetchSheet('MasterData');
      const types = data
        .filter((item: any) => item['dropdwon catagorty'] === 'Expense Type')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean);
      
      const uniqueTypes = Array.from(new Set(types));
      const defaultTypes = ['Electricity', 'Internet', 'Kitchen', 'Courier', 'Guest Room', 'Others'];
      setExpenseTypes(uniqueTypes.length > 0 ? uniqueTypes : defaultTypes);
    } catch (error) {
      setExpenseTypes(['Electricity', 'Internet', 'Kitchen', 'Courier', 'Guest Room', 'Others']);
    }
  };

  const loadData = async () => {
    try {
      const data = await fetchSheet('expenses');
      setExpenses(data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateStr: any) => {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      
      // Add 12 hours to compensate for timezone shifts
      const adjustedDate = new Date(date.getTime() + 12 * 60 * 60 * 1000);
      
      const y = adjustedDate.getUTCFullYear();
      const m = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(adjustedDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const handleOpenModal = (expense?: any) => {
    if (expense) {
      setEditingRow(expense._rowIndex);
      const formattedDate = expense.date ? formatDateForDisplay(expense.date) : '';
      setFormData({
        Bill_id: expense.Bill_id || '',
        date: formattedDate,
        Expense_type: expense.Expense_type || 'Electricity',
        Amount: expense.Amount || '',
        Description: expense.Description || '',
        Paid_by: expense.Paid_by || '',
      });
    } else {
      setEditingRow(null);
      setFormData({
        Bill_id: '',
        date: '',
        Expense_type: 'Electricity',
        Amount: '',
        Description: '',
        Paid_by: '',
      });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let Bill_url = editingRow ? expenses.find(e => e._rowIndex === editingRow)?.Bill_url : '';
      
      if (file) {
        const uploadRes = await uploadFile(file);
        Bill_url = uploadRes.url;
      }

      let finalBillId = formData.Bill_id;
      if (!editingRow) {
        let maxId = 0;
        expenses.forEach(e => {
          if (e.Bill_id && typeof e.Bill_id === 'string' && e.Bill_id.startsWith('SPMBILL')) {
            const num = parseInt(e.Bill_id.replace('SPMBILL', ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
        finalBillId = `SPMBILL${String(maxId + 1).padStart(5, '0')}`;
      }

      const rowData = { ...formData, Bill_id: finalBillId, Bill_url };

      if (editingRow) {
        await updateRow('expenses', editingRow, rowData);
        toast.success('Expense updated successfully!');
      } else {
        await addRow('expenses', rowData);
        toast.success('Expense added successfully!');
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteRow('expenses', rowIndex);
      toast.success('Expense deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    return filterType === 'All Types' || expense.Expense_type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Expenses Management</h1>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-sm text-slate-600"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              {expenseTypes.map((type, idx) => (
                <option key={`${type}-${idx}`} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input type="text" placeholder="Search expenses..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Bill ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Expense Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Bill URL</th>
                <th className="px-6 py-4">Paid By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">No expenses found</td></tr>
              ) : (
                filteredExpenses.map((expense, idx) => (
                  <tr key={expense.Bill_id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{expense.Bill_id}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDateForDisplay(expense.date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {expense.Expense_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{expense.Amount}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.Description}</td>
                    <td className="px-6 py-4">
                      {expense.Bill_url && (
                        <a href={expense.Bill_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> View
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{expense.Paid_by}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleViewDetails(expense)} className="text-slate-400 hover:text-blue-600 mr-3" title="View Details">
                        <Search className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => handleOpenModal(expense)} className="text-slate-400 hover:text-blue-600 mr-3">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(expense._rowIndex)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{editingRow ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Type</label>
                <select value={formData.Expense_type} onChange={e => setFormData({...formData, Expense_type: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Type</option>
                  {expenseTypes.map((type, idx) => <option key={`${type}-${idx}`} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" value={formData.Amount} onChange={e => setFormData({...formData, Amount: e.target.value})} placeholder="Enter amount" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} placeholder="Enter description" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bill</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paid By</label>
                <input type="text" value={formData.Paid_by} onChange={e => setFormData({...formData, Paid_by: e.target.value})} placeholder="Enter name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50" disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingRow ? 'Update Expense' : 'Save Expense')}
              </button>
            </div>
          </div>
        </div>
      )}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Expense Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-4">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key.startsWith('_') || key === 'Bill_url') return null;
                  return (
                    <div key={key} className="border-b border-slate-50 pb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        {key === 'date' ? formatDateForDisplay(String(value)) : (String(value) || '-')}
                      </p>
                    </div>
                  );
                })}
                {selectedItem.Bill_url && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attachment</p>
                    <a href={selectedItem.Bill_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <Download className="w-4 h-4" /> View Bill/Document
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
