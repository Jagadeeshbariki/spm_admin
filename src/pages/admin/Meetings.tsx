import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Download, Edit2, Trash2, Loader2 } from 'lucide-react';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';

interface Meeting {
  _rowIndex?: number;
  'Meeting Date': string;
  'Project Name': string;
  'Meeting Type (Internal/External)': string;
  'Reason': string;
  'Participants': string;
  'Minutes of Meeting': string;
  'Photo Upload (link)': string;
  'Aqu_link': string;
}

const initialFormState: Meeting = {
  'Meeting Date': '',
  'Project Name': '',
  'Meeting Type (Internal/External)': 'Internal',
  'Reason': '',
  'Participants': '',
  'Minutes of Meeting': '',
  'Photo Upload (link)': '',
  'Aqu_link': ''
};

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Meeting>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [minutesFile, setMinutesFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSheet('meeting_tracker');
      setMeetings(data);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      alert('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      setFormData(meeting);
      setEditingRow(meeting._rowIndex || null);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
    }
    setMinutesFile(null);
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingRow(null);
    setMinutesFile(null);
    setPhotoFile(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let minutesUrl = formData['Minutes of Meeting'];
      let photoUrl = formData['Photo Upload (link)'];

      if (minutesFile) {
        const { webViewLink } = await uploadFile(minutesFile);
        minutesUrl = webViewLink;
      }

      if (photoFile) {
        const { webViewLink } = await uploadFile(photoFile);
        photoUrl = webViewLink;
      }

      const dataToSave = {
        ...formData,
        'Minutes of Meeting': minutesUrl,
        'Photo Upload (link)': photoUrl
      };

      if (editingRow !== null) {
        await updateRow('meeting_tracker', editingRow, dataToSave);
      } else {
        await addRow('meeting_tracker', dataToSave);
      }
      
      await loadMeetings();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save meeting:', error);
      alert('Failed to save meeting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        setIsLoading(true);
        await deleteRow('meeting_tracker', rowIndex);
        await loadMeetings();
      } catch (error) {
        console.error('Failed to delete meeting:', error);
        alert('Failed to delete meeting');
        setIsLoading(false);
      }
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = 
      meeting['Project Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting['Reason']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All Types' || meeting['Meeting Type (Internal/External)'] === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Meetings Tracker</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Meeting
        </button>
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
              <option>All Types</option>
              <option>Internal</option>
              <option>External</option>
            </select>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search meetings..." 
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
                <th className="px-6 py-4">Meeting Date</th>
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Minutes</th>
                <th className="px-6 py-4">Photo</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading meetings...
                  </td>
                </tr>
              ) : filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No meetings found
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meeting, index) => (
                  <tr key={meeting._rowIndex || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{meeting['Meeting Date']}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{meeting['Project Name']}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        meeting['Meeting Type (Internal/External)'] === 'Internal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {meeting['Meeting Type (Internal/External)']}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{meeting['Reason']}</td>
                    <td className="px-6 py-4 text-slate-600">{meeting['Participants']}</td>
                    <td className="px-6 py-4">
                      {meeting['Minutes of Meeting'] ? (
                        <a href={meeting['Minutes of Meeting']} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> MoM
                        </a>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {meeting['Photo Upload (link)'] ? (
                        <a href={meeting['Photo Upload (link)']} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> Photo
                        </a>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleOpenModal(meeting)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => meeting._rowIndex && handleDelete(meeting._rowIndex)}
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
                {editingRow !== null ? 'Edit Meeting' : 'Add New Meeting'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Meeting Date']}
                    onChange={(e) => setFormData({...formData, 'Meeting Date': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter project" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Project Name']}
                    onChange={(e) => setFormData({...formData, 'Project Name': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Type</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Meeting Type (Internal/External)']}
                    onChange={(e) => setFormData({...formData, 'Meeting Type (Internal/External)': e.target.value})}
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Participants</label>
                  <input 
                    type="text" 
                    placeholder="Enter number or names" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Participants']}
                    onChange={(e) => setFormData({...formData, 'Participants': e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea 
                    rows={3} 
                    placeholder="Enter meeting reason" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Reason']}
                    onChange={(e) => setFormData({...formData, 'Reason': e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minutes of Meeting</label>
                  <input 
                    type="file" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setMinutesFile(e.target.files?.[0] || null)}
                  />
                  {formData['Minutes of Meeting'] && !minutesFile && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {formData['Minutes of Meeting']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo Upload</label>
                  <input 
                    type="file" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  {formData['Photo Upload (link)'] && !photoFile && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {formData['Photo Upload (link)']}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aqu Link</label>
                  <input 
                    type="url" 
                    placeholder="Enter link" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Aqu_link']}
                    onChange={(e) => setFormData({...formData, 'Aqu_link': e.target.value})}
                  />
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
                {isSaving ? 'Saving...' : 'Save Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
