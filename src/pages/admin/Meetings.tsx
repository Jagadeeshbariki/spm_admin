import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Download, Edit2, Trash2, Loader2 } from 'lucide-react';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';
import { useAuth } from '@/lib/AuthContext';

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
  'Aqu_link': '',
};

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Meeting>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [minutesFile, setMinutesFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [aquFile, setAquFile] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');

  const [projectNames, setProjectNames] = useState<string[]>([]);

  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  useEffect(() => {
    loadMeetings();
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const data = await fetchSheet('MasterData');
      const projects = Array.from(new Set(data
        .filter((item: any) => item['dropdwon catagorty'] === 'Project')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean)));
      
      setProjectNames(projects.length > 0 ? projects : ['Project A', 'Project B']);
    } catch (error) {
      setProjectNames(['Project A', 'Project B']);
    }
  };

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

  const formatDateForDisplay = (dateStr: any) => {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      
      // Add 12 hours to compensate for timezone shifts that might have pushed
      // a midnight date to the previous day in UTC.
      const adjustedDate = new Date(date.getTime() + 12 * 60 * 60 * 1000);
      
      const y = adjustedDate.getUTCFullYear();
      const m = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(adjustedDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      const formattedMeeting = { ...meeting };
      // Ensure date is in YYYY-MM-DD format for the input field
      if (formattedMeeting['Meeting Date']) {
        formattedMeeting['Meeting Date'] = formatDateForDisplay(formattedMeeting['Meeting Date']);
      }
      setFormData(formattedMeeting);
      setEditingRow(meeting._rowIndex || null);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
    }
    setMinutesFile(null);
    setPhotoFiles([]);
    setAquFile(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingRow(null);
    setMinutesFile(null);
    setPhotoFiles([]);
    setAquFile(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let minutesUrl = formData['Minutes of Meeting'];
      let photoUrls = formData['Photo Upload (link)'];
      let aquUrl = formData['Aqu_link'];

      if (minutesFile) {
        const { webViewLink } = await uploadFile(minutesFile);
        minutesUrl = webViewLink;
      }

      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(f => uploadFile(f));
        const results = await Promise.all(uploadPromises);
        const newUrls = results.map(r => r.webViewLink).join(', ');
        photoUrls = newUrls;
      }

      if (aquFile) {
        const { webViewLink } = await uploadFile(aquFile);
        aquUrl = webViewLink;
      }

      const dataToSave = {
        ...formData,
        'Minutes of Meeting': minutesUrl,
        'Photo Upload (link)': photoUrls,
        'Aqu_link': aquUrl
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
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Meeting
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
                    <td className="px-6 py-4 text-slate-600">{formatDateForDisplay(meeting['Meeting Date'])}</td>
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
                          onClick={() => handleViewDetails(meeting)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
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
                {editingRow !== null ? 'Edit Meeting' : 'Add New Meeting'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
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
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Project Name']}
                    onChange={(e) => setFormData({...formData, 'Project Name': e.target.value})}
                  >
                    <option value="">Select Project</option>
                    {projectNames.map((proj, idx) => <option key={`${proj}-${idx}`} value={proj}>{proj}</option>)}
                  </select>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo Upload (Max 5)</label>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 5) {
                        alert('You can only upload up to 5 photos');
                        setPhotoFiles(files.slice(0, 5));
                      } else {
                        setPhotoFiles(files);
                      }
                    }}
                  />
                  {formData['Photo Upload (link)'] && photoFiles.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current photos uploaded</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aqu File</label>
                  <input 
                    type="file" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setAquFile(e.target.files?.[0] || null)}
                  />
                  {formData['Aqu_link'] && !aquFile && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {formData['Aqu_link']}</p>
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
                {isSaving ? 'Saving...' : 'Save Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Meeting Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-4">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key.startsWith('_') || key === 'Minutes of Meeting' || key === 'Photo Upload (link)' || key === 'Aqu_link') return null;
                  return (
                    <div key={key} className="border-b border-slate-50 pb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        {key === 'Meeting Date' ? formatDateForDisplay(String(value)) : (String(value) || '-')}
                      </p>
                    </div>
                  );
                })}
                {selectedItem['Minutes of Meeting'] && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Minutes of Meeting</p>
                    <a href={selectedItem['Minutes of Meeting']} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <Download className="w-4 h-4" /> View Document
                    </a>
                  </div>
                )}
                {selectedItem['Photo Upload (link)'] && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Photos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem['Photo Upload (link)'].split(',').map((url: string, i: number) => (
                        <a key={i} href={url.trim()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                          <Eye className="w-4 h-4" /> Photo {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedItem['Aqu_link'] && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aqu File</p>
                    <a href={selectedItem['Aqu_link']} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <Download className="w-4 h-4" /> View Aqu File
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
