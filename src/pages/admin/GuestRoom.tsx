import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Loader2, UserPlus, X, Calendar } from 'lucide-react';
import { fetchSheet, addRow, updateRow, deleteRow } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';

interface GuestRoomEntry {
  _rowIndex?: number;
  'Guest Names': string;
  'Check-in Date': string;
  'Check-out Date': string;
  'Days Stayed': string;
  'Working Location': string;
  'Purpose of Visit': string;
  'Contact Number': string;
  'Room Number': string;
  'Guest_id'?: string;
}

const initialFormState: GuestRoomEntry = {
  'Guest Names': '',
  'Check-in Date': '',
  'Check-out Date': '',
  'Days Stayed': '0',
  'Working Location': '',
  'Purpose of Visit': '',
  'Contact Number': '',
  'Room Number': '',
};

export default function GuestRoom() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  const [entries, setEntries] = useState<GuestRoomEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GuestRoomEntry>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [guestList, setGuestList] = useState<string[]>(['']);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (formData['Check-in Date'] && formData['Check-out Date']) {
      const start = new Date(formData['Check-in Date']);
      const end = new Date(formData['Check-out Date']);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, 'Days Stayed': diffDays.toString() }));
    }
  }, [formData['Check-in Date'], formData['Check-out Date']]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSheet('guest_room_users');
      setEntries(data);
    } catch (error) {
      console.error('Failed to load guest room entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (entry?: GuestRoomEntry) => {
    if (entry) {
      setFormData(entry);
      setEditingRow(entry._rowIndex || null);
      setGuestList([entry['Guest Names']]);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
      setGuestList(['']);
    }
    setIsModalOpen(true);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const names = guestList.filter(n => n.trim() !== '');
      if (names.length === 0) {
        toast.error('Please add at least one guest name');
        return;
      }

      setIsSaving(true);
      
      if (editingRow !== null) {
        // Update existing row (single guest)
        const finalData = { ...formData, 'Guest Names': names[0] };
        await updateRow('guest_room_users', editingRow, finalData);
        toast.success('Entry updated successfully');
      } else {
        // Add multiple rows for new entries
        let maxId = 0;
        entries.forEach(e => {
          if (e.Guest_id && e.Guest_id.startsWith('SPMG')) {
            const num = parseInt(e.Guest_id.replace('SPMG', ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });

        for (let i = 0; i < names.length; i++) {
          const guestId = `SPMG${String(maxId + 1 + i).padStart(4, '0')}`;
          const finalData = { 
            ...formData, 
            'Guest Names': names[i],
            'Guest_id': guestId 
          };
          await addRow('guest_room_users', finalData);
        }
        toast.success(`${names.length} guest(s) added successfully`);
      }
      
      await loadEntries();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setIsDeleting(true);
        await deleteRow('guest_room_users', rowIndex);
        toast.success('Entry deleted successfully');
        await loadEntries();
      } catch (error) {
        console.error('Failed to delete entry:', error);
        toast.error('Failed to delete entry');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const addGuestField = () => setGuestList([...guestList, '']);
  const removeGuestField = (index: number) => {
    if (guestList.length > 1) {
      const newList = [...guestList];
      newList.splice(index, 1);
      setGuestList(newList);
    }
  };
  const updateGuestName = (index: number, value: string) => {
    const newList = [...guestList];
    newList[index] = value;
    setGuestList(newList);
  };

  const filteredEntries = entries.filter(entry => 
    String(entry['Guest Names'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(entry['Room Number'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Guest Room Users</h1>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search guests or room..." 
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
                <th className="px-6 py-4">Guest ID</th>
                <th className="px-6 py-4">Guest Names</th>
                <th className="px-6 py-4">Room No</th>
                <th className="px-6 py-4">Check-in</th>
                <th className="px-6 py-4">Check-out</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr key={entry._rowIndex || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{entry.Guest_id}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium truncate max-w-xs">{entry['Guest Names']}</td>
                    <td className="px-6 py-4 text-slate-600">{entry['Room Number']}</td>
                    <td className="px-6 py-4 text-slate-600">{entry['Check-in Date']}</td>
                    <td className="px-6 py-4 text-slate-600">{entry['Check-out Date']}</td>
                    <td className="px-6 py-4 text-slate-600">{entry['Days Stayed']}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleViewDetails(entry)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(entry)}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit / Extend Stay"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => entry._rowIndex && handleDelete(entry._rowIndex)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
                {editingRow !== null ? 'Edit / Extend Guest Stay' : 'Add New Guest Entry'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {editingRow !== null ? 'Guest Names' : 'Guest Names'}
                    </label>
                    {editingRow === null && (
                      <button 
                        type="button"
                        onClick={addGuestField}
                        className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Add Another Guest
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {guestList.map((name, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={`Guest ${idx + 1} Name`}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={name}
                          onChange={(e) => updateGuestName(idx, e.target.value)}
                          readOnly={editingRow !== null}
                        />
                        {editingRow === null && guestList.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeGuestField(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData['Check-in Date']}
                      onChange={(e) => setFormData({...formData, 'Check-in Date': e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData['Check-out Date']}
                      onChange={(e) => setFormData({...formData, 'Check-out Date': e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Days Stayed</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 focus:outline-none"
                      value={formData['Days Stayed']}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter room number"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData['Room Number']}
                      onChange={(e) => setFormData({...formData, 'Room Number': e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="Enter contact number"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData['Contact Number']}
                      onChange={(e) => setFormData({...formData, 'Contact Number': e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Working Location</label>
                    <input 
                      type="text" 
                      placeholder="Enter guest's working location"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData['Working Location']}
                      onChange={(e) => setFormData({...formData, 'Working Location': e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Visit</label>
                  <textarea 
                    rows={3} 
                    placeholder="Enter purpose of visit" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Purpose of Visit']}
                    onChange={(e) => setFormData({...formData, 'Purpose of Visit': e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)} 
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

      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Guest Entry Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-4">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key.startsWith('_')) return null;
                  return (
                    <div key={key} className="border-b border-slate-50 pb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 mt-1">{String(value) || '-'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Blur Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-lg font-bold text-slate-800">Deleting Entry...</p>
            <p className="text-sm text-slate-500">Please wait while the record is being removed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
