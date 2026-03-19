import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    Bill_id: '',
    date: '',
    Expense_type: 'Electricity',
    Amount: '',
    Description: '',
    Paid_by: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleOpenModal = (expense?: any) => {
    if (expense) {
      setEditingRow(expense._rowIndex);
      setFormData({
        Bill_id: expense.Bill_id || '',
        date: expense.date || '',
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let Bill_url = editingRow ? expenses.find(e => e._rowIndex === editingRow)?.Bill_url : '';
      
      if (file) {
        const uploadRes = await uploadFile(file);
        Bill_url = uploadRes.url;
      }

      const rowData = { ...formData, Bill_url };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Expenses Management</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select className="bg-transparent border-none outline-none text-sm text-slate-600">
              <option>All Types</option>
              <option>Electricity</option>
              <option>Internet</option>
              <option>Kitchen</option>
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
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">No expenses found</td></tr>
              ) : (
                expenses.map((expense, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{expense.Bill_id}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.date}</td>
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
                      <button onClick={() => handleOpenModal(expense)} className="text-slate-400 hover:text-blue-600 mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(expense._rowIndex)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{editingRow ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill ID</label>
                <input type="text" value={formData.Bill_id} onChange={e => setFormData({...formData, Bill_id: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Type</label>
                <select value={formData.Expense_type} onChange={e => setFormData({...formData, Expense_type: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Electricity</option>
                  <option>Internet</option>
                  <option>Kitchen</option>
                  <option>Courier</option>
                  <option>Guest Room</option>
                  <option>Others</option>
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
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50" disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingRow ? 'Update Expense' : 'Save Expense')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
