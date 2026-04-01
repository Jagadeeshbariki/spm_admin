import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, FileJson, X, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile, WATER_COLLECTIVES_FOLDER_ID } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';

interface WaterCollectiveSite {
  _rowIndex?: number;
  'Water Collective Name': string;
  'Mandal': string;
  'GP': string;
  'Village': string;
  'GeoJSON URL': string;
  'File Name': string;
}

const initialFormState: WaterCollectiveSite = {
  'Water Collective Name': '',
  'Mandal': '',
  'GP': '',
  'Village': '',
  'GeoJSON URL': '',
  'File Name': '',
};

export default function WaterCollectiveManagement() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin'; // Only admin and office admin can edit this now

  const [sites, setSites] = useState<WaterCollectiveSite[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<WaterCollectiveSite>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSheet('water_collectives');
      setSites(data);
    } catch (error) {
      console.error('Failed to load water collectives:', error);
      toast.error('Failed to load sites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (site?: WaterCollectiveSite) => {
    if (site) {
      setFormData(site);
      setEditingRow(site._rowIndex || null);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData['Water Collective Name']) {
      toast.error('Water Collective Name is required');
      return;
    }

    try {
      setIsSaving(true);
      let geoJsonUrl = formData['GeoJSON URL'];
      let fileName = formData['File Name'];

      if (file) {
        toast.loading('Uploading GeoJSON to Drive...', { id: 'upload' });
        const uploadResult = await uploadFile(file, WATER_COLLECTIVES_FOLDER_ID);
        geoJsonUrl = uploadResult.url || uploadResult.webViewLink;
        fileName = file.name;
        toast.success('File uploaded successfully', { id: 'upload' });
      }

      const dataToSave = {
        ...formData,
        'GeoJSON URL': geoJsonUrl,
        'File Name': fileName,
      };

      if (editingRow !== null) {
        await updateRow('water_collectives', editingRow, dataToSave);
        toast.success('Site updated successfully');
      } else {
        await addRow('water_collectives', dataToSave);
        toast.success('Site added successfully');
      }

      setIsModalOpen(false);
      loadSites();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save site');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    try {
      await deleteRow('water_collectives', rowIndex);
      toast.success('Site deleted successfully');
      loadSites();
    } catch (error) {
      toast.error('Failed to delete site');
    }
  };

  const filteredSites = sites.filter(site => 
    site['Water Collective Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site['Village']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site['Mandal']?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link 
          to="/admin/settings"
          className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
          title="Back to Settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Water Collective Management</h1>
          <p className="text-slate-500 text-sm">Manage water collective sites and their GeoJSON data</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex-1"></div>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Site
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search sites, villages, or mandals..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Water Collective Name</th>
                <th className="px-6 py-4">Mandal</th>
                <th className="px-6 py-4">GP</th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">GeoJSON File</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.length > 0 ? filteredSites.map((site) => (
                <tr key={site._rowIndex} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{site['Water Collective Name']}</td>
                  <td className="px-6 py-4 text-slate-600">{site['Mandal']}</td>
                  <td className="px-6 py-4 text-slate-600">{site['GP']}</td>
                  <td className="px-6 py-4 text-slate-600">{site['Village']}</td>
                  <td className="px-6 py-4">
                    {site['GeoJSON URL'] ? (
                      <a 
                        href={site['GeoJSON URL']} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileJson className="w-4 h-4" />
                        {site['File Name'] || 'View File'}
                      </a>
                    ) : (
                      <span className="text-slate-400">No file</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <>
                          <button 
                            onClick={() => handleOpenModal(site)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => site._rowIndex && handleDelete(site._rowIndex)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No sites found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRow !== null ? 'Edit Water Collective' : 'Add New Water Collective'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Water Collective Name *</label>
                  <input 
                    type="text" 
                    value={formData['Water Collective Name']}
                    onChange={e => setFormData({...formData, 'Water Collective Name': e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Seethampeta Dam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mandal</label>
                  <input 
                    type="text" 
                    value={formData['Mandal']}
                    onChange={e => setFormData({...formData, 'Mandal': e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Mandal Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GP (Gram Panchayat)</label>
                  <input 
                    type="text" 
                    value={formData['GP']}
                    onChange={e => setFormData({...formData, 'GP': e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="GP Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
                  <input 
                    type="text" 
                    value={formData['Village']}
                    onChange={e => setFormData({...formData, 'Village': e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Village Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GeoJSON File (Google Drive)</label>
                  <div className="flex flex-col gap-2">
                    {formData['GeoJSON URL'] && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-700 text-sm truncate">
                          <FileJson className="w-4 h-4 shrink-0" />
                          <span className="truncate">{formData['File Name'] || 'Current File'}</span>
                        </div>
                        <a href={formData['GeoJSON URL']} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-medium hover:underline">View</a>
                      </div>
                    )}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".json,.geojson"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="hidden" 
                        id="geojson-upload"
                      />
                      <label 
                        htmlFor="geojson-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">
                          {file ? file.name : 'Upload new GeoJSON file'}
                        </span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">File will be uploaded to Google Drive and linked here.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRow !== null ? 'Update Site' : 'Save Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
