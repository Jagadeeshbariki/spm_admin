import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Box, CheckCircle2, AlertCircle, Wrench, Edit, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';

export default function Assets() {
  const [activeTab, setActiveTab] = useState<'registry' | 'usage'>('registry');
  const [assets, setAssets] = useState<any[]>([]);
  const [assetUses, setAssetUses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [registryForm, setRegistryForm] = useState({
    asset_id: '',
    asset_name: '',
    Asset_Category: 'Electronics',
    Asset_type: 'Laptop',
    'Purchase Date': '',
    Cost: '',
    purchased_by: '',
    Project: '',
    Vendor: '',
    Warranty: '',
    Status: 'Available',
  });
  
  const [usageForm, setUsageForm] = useState({
    'Asset Name': '',
    'Assigned To': '',
    Project: '',
    'Issue Date': '',
    'Return Date': '',
    Condition: '',
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'registry') {
        const data = await fetchSheet('asset_registry');
        setAssets(data);
      } else {
        const data = await fetchSheet('asset_uses');
        setAssetUses(data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (activeTab === 'registry') {
      if (item) {
        setEditingRow(item._rowIndex);
        setRegistryForm({
          asset_id: item.asset_id || '',
          asset_name: item.asset_name || '',
          Asset_Category: item.Asset_Category || 'Electronics',
          Asset_type: item.Asset_type || 'Laptop',
          'Purchase Date': item['Purchase Date'] || '',
          Cost: item.Cost || '',
          purchased_by: item.purchased_by || '',
          Project: item.Project || '',
          Vendor: item.Vendor || '',
          Warranty: item.Warranty || '',
          Status: item.Status || 'Available',
        });
      } else {
        setEditingRow(null);
        setRegistryForm({
          asset_id: '',
          asset_name: '',
          Asset_Category: 'Electronics',
          Asset_type: 'Laptop',
          'Purchase Date': '',
          Cost: '',
          purchased_by: '',
          Project: '',
          Vendor: '',
          Warranty: '',
          Status: 'Available',
        });
      }
    } else {
      if (item) {
        setEditingRow(item._rowIndex);
        setUsageForm({
          'Asset Name': item['Asset Name'] || '',
          'Assigned To': item['Assigned To'] || '',
          Project: item.Project || '',
          'Issue Date': item['Issue Date'] || '',
          'Return Date': item['Return Date'] || '',
          Condition: item.Condition || '',
        });
      } else {
        setEditingRow(null);
        setUsageForm({
          'Asset Name': '',
          'Assigned To': '',
          Project: '',
          'Issue Date': '',
          'Return Date': '',
          Condition: '',
        });
      }
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'registry') {
        let Bill_url = editingRow ? assets.find(a => a._rowIndex === editingRow)?.Bill_url : '';
        if (file) {
          const uploadRes = await uploadFile(file);
          Bill_url = uploadRes.url;
        }
        const rowData = { ...registryForm, Bill_url };
        if (editingRow) {
          await updateRow('asset_registry', editingRow, rowData);
          toast.success('Asset updated successfully!');
        } else {
          await addRow('asset_registry', rowData);
          toast.success('Asset added successfully!');
        }
      } else {
        if (editingRow) {
          await updateRow('asset_uses', editingRow, usageForm);
          toast.success('Asset usage updated successfully!');
        } else {
          await addRow('asset_uses', usageForm);
          toast.success('Asset assigned successfully!');
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeTab === 'registry') {
        await deleteRow('asset_registry', rowIndex);
      } else {
        await deleteRow('asset_uses', rowIndex);
      }
      toast.success('Deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Asset Management</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {activeTab === 'registry' ? 'Add Asset' : 'Assign Asset'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Box className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Total Assets</p><p className="text-2xl font-bold text-slate-900">{assets.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">In Use</p><p className="text-2xl font-bold text-slate-900">{assets.filter(a => a.Status === 'In Use').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600"><AlertCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Available</p><p className="text-2xl font-bold text-slate-900">{assets.filter(a => a.Status === 'Available').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 text-red-600"><Wrench className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Under Repair</p><p className="text-2xl font-bold text-slate-900">{assets.filter(a => a.Status === 'Under Repair').length}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('registry')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'registry' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Asset Registry
        </button>
        <button 
          onClick={() => setActiveTab('usage')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'usage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Asset Usage Tracking
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select className="bg-transparent border-none outline-none text-sm text-slate-600">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Furniture</option>
            </select>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input type="text" placeholder="Search assets..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'registry' ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Asset ID</th>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Purchase Date</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Purchased By</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Warranty</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Bill</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={13} className="text-center py-8 text-slate-500">Loading...</td></tr>
                ) : assets.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-8 text-slate-500">No assets found</td></tr>
                ) : (
                  assets.map((asset, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-600">{asset.asset_id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{asset.asset_name}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.Asset_Category}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.Asset_type}</td>
                      <td className="px-6 py-4 text-slate-600">{asset['Purchase Date']}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{asset.Cost}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.purchased_by}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.Project}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.Vendor}</td>
                      <td className="px-6 py-4 text-slate-600">{asset.Warranty}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          asset.Status === 'In Use' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {asset.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {asset.Bill_url && (
                          <a href={asset.Bill_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <Download className="w-4 h-4" /> View
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(asset)} className="text-slate-400 hover:text-blue-600 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(asset._rowIndex)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Return Date</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading...</td></tr>
                ) : assetUses.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">No asset usage found</td></tr>
                ) : (
                  assetUses.map((usage, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{usage['Asset Name']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage['Assigned To']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage.Project}</td>
                      <td className="px-6 py-4 text-slate-600">{usage['Issue Date']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage['Return Date']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage.Condition}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(usage)} className="text-slate-400 hover:text-blue-600 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(usage._rowIndex)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{activeTab === 'registry' ? (editingRow ? 'Edit Asset' : 'Add New Asset') : (editingRow ? 'Edit Assignment' : 'Assign Asset')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {activeTab === 'registry' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID</label>
                    <input type="text" value={registryForm.asset_id} onChange={e => setRegistryForm({...registryForm, asset_id: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                    <input type="text" value={registryForm.asset_name} onChange={e => setRegistryForm({...registryForm, asset_name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset Category</label>
                    <select value={registryForm.Asset_Category} onChange={e => setRegistryForm({...registryForm, Asset_Category: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Electronics</option>
                      <option>Furniture</option>
                      <option>Vehicles</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset Type</label>
                    <select value={registryForm.Asset_type} onChange={e => setRegistryForm({...registryForm, Asset_type: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Laptop</option>
                      <option>Monitor</option>
                      <option>Chair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                    <input type="date" value={registryForm['Purchase Date']} onChange={e => setRegistryForm({...registryForm, 'Purchase Date': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                    <input type="number" value={registryForm.Cost} onChange={e => setRegistryForm({...registryForm, Cost: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchased By</label>
                    <input type="text" value={registryForm.purchased_by} onChange={e => setRegistryForm({...registryForm, purchased_by: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                    <input type="text" value={registryForm.Project} onChange={e => setRegistryForm({...registryForm, Project: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <input type="text" value={registryForm.Vendor} onChange={e => setRegistryForm({...registryForm, Vendor: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Warranty</label>
                    <input type="text" value={registryForm.Warranty} onChange={e => setRegistryForm({...registryForm, Warranty: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={registryForm.Status} onChange={e => setRegistryForm({...registryForm, Status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Available</option>
                      <option>In Use</option>
                      <option>Under Repair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bill</label>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                    <input type="text" value={usageForm['Asset Name']} onChange={e => setUsageForm({...usageForm, 'Asset Name': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                    <input type="text" value={usageForm['Assigned To']} onChange={e => setUsageForm({...usageForm, 'Assigned To': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                    <input type="text" value={usageForm.Project} onChange={e => setUsageForm({...usageForm, Project: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date</label>
                    <input type="date" value={usageForm['Issue Date']} onChange={e => setUsageForm({...usageForm, 'Issue Date': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Return Date</label>
                    <input type="date" value={usageForm['Return Date']} onChange={e => setUsageForm({...usageForm, 'Return Date': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                    <input type="text" value={usageForm.Condition} onChange={e => setUsageForm({...usageForm, Condition: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50" disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingRow ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
