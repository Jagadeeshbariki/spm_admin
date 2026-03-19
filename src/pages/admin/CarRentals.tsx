import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, Loader2 } from 'lucide-react';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';

interface CarRental {
  _rowIndex?: number;
  'Date': string;
  'Project': string;
  'users': string;
  'Travel Route': string;
  'Travel Agent Name': string;
  'Vehicle Type': string;
  'Amount': string;
  'Upload Bill': string;
}

const initialFormState: CarRental = {
  'Date': '',
  'Project': '',
  'users': '',
  'Travel Route': '',
  'Travel Agent Name': '',
  'Vehicle Type': '',
  'Amount': '',
  'Upload Bill': ''
};

export default function CarRentals() {
  const [rentals, setRentals] = useState<CarRental[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CarRental>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSheet('Car_Rental');
      setRentals(data);
    } catch (error) {
      console.error('Failed to load car rentals:', error);
      alert('Failed to load car rentals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (rental?: CarRental) => {
    if (rental) {
      setFormData(rental);
      setEditingRow(rental._rowIndex || null);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
    }
    setBillFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingRow(null);
    setBillFile(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let billUrl = formData['Upload Bill'];

      if (billFile) {
        const { webViewLink } = await uploadFile(billFile);
        billUrl = webViewLink;
      }

      const dataToSave = {
        ...formData,
        'Upload Bill': billUrl
      };

      if (editingRow !== null) {
        await updateRow('Car_Rental', editingRow, dataToSave);
      } else {
        await addRow('Car_Rental', dataToSave);
      }
      
      await loadRentals();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save car rental:', error);
      alert('Failed to save car rental');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (window.confirm('Are you sure you want to delete this car rental entry?')) {
      try {
        setIsLoading(true);
        await deleteRow('Car_Rental', rowIndex);
        await loadRentals();
      } catch (error) {
        console.error('Failed to delete car rental:', error);
        alert('Failed to delete car rental');
        setIsLoading(false);
      }
    }
  };

  const projects = Array.from(new Set(rentals.map(r => r.Project).filter(Boolean)));

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.users?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental['Travel Route']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All Projects' || rental.Project === filterProject;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Car Rentals</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-sm text-slate-600"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="All Projects">All Projects</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search employee or route..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Users</th>
                <th className="px-6 py-4">Travel Route</th>
                <th className="px-6 py-4">Travel Agent</th>
                <th className="px-6 py-4">Vehicle Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bill</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading car rentals...
                  </td>
                </tr>
              ) : filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    No car rentals found
                  </td>
                </tr>
              ) : (
                filteredRentals.map((rental, index) => (
                  <tr key={rental._rowIndex || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{rental.Date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{rental.Project}</td>
                    <td className="px-6 py-4 text-slate-600">{rental.users}</td>
                    <td className="px-6 py-4 text-slate-600">{rental['Travel Route']}</td>
                    <td className="px-6 py-4 text-slate-600">{rental['Travel Agent Name']}</td>
                    <td className="px-6 py-4 text-slate-600">{rental['Vehicle Type']}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{rental.Amount}</td>
                    <td className="px-6 py-4">
                      {rental['Upload Bill'] ? (
                        <a href={rental['Upload Bill']} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> View
                        </a>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleOpenModal(rental)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => rental._rowIndex && handleDelete(rental._rowIndex)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {editingRow !== null ? 'Edit Car Rental Entry' : 'Add Car Rental Entry'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Date}
                    onChange={(e) => setFormData({...formData, Date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <input 
                    type="text" 
                    placeholder="Enter project" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Project}
                    onChange={(e) => setFormData({...formData, Project: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name(s)</label>
                  <input 
                    type="text" 
                    placeholder="Enter employee name" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.users}
                    onChange={(e) => setFormData({...formData, users: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Travel Route</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Office to Airport" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Travel Route']}
                    onChange={(e) => setFormData({...formData, 'Travel Route': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Travel Agent Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter agent name" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Travel Agent Name']}
                    onChange={(e) => setFormData({...formData, 'Travel Agent Name': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Sedan, SUV" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Vehicle Type']}
                    onChange={(e) => setFormData({...formData, 'Vehicle Type': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Amount}
                    onChange={(e) => setFormData({...formData, Amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bill</label>
                  <input 
                    type="file" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                  />
                  {formData['Upload Bill'] && !billFile && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {formData['Upload Bill']}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button 
                onClick={handleCloseModal} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
