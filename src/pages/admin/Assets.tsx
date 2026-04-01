import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Box, CheckCircle2, AlertCircle, Wrench, Edit, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';
import DeleteButton from '@/components/DeleteButton';
import { useAuth } from '@/lib/AuthContext';

export default function Assets() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'registry' | 'usage'>('registry');
  const [assets, setAssets] = useState<any[]>([]);
  const [assetUses, setAssetUses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingAssetId, setEditingAssetId] = useState('');
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [commonForm, setCommonForm] = useState({
    'Purchase Date': '',
    purchased_by: '',
    Project: '',
    Vendor: '',
  });
  
  const [assetItems, setAssetItems] = useState([{
    id: Date.now(),
    asset_name: '',
    Asset_Category: 'Electronics',
    Asset_type: 'Laptop',
    Cost: '',
    Warranty: '',
    Status: 'Available',
    'Number of Assets Purchased': '',
    'Unit Price': '',
    'Units': '',
  }]);
  
  const [usageForm, setUsageForm] = useState({
    'Asset Name': '',
    'Assigned To': '',
    Project: '',
    'Issue Date': '',
    'Return Date': '',
    Condition: '',
    'Number of Assets Purchased': '',
    'Unit Price': '',
    'Units': '',
  });

  const [file, setFile] = useState<File | null>(null);

  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);

  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  useEffect(() => {
    loadData();
    loadMasterData();
  }, [activeTab]);

  const loadMasterData = async () => {
    try {
      const data = await fetchSheet('MasterData');
      const categories = Array.from(new Set(data
        .filter((item: any) => item['dropdwon catagorty'] === 'Asset Category')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean)));
      const types = Array.from(new Set(data
        .filter((item: any) => item['dropdwon catagorty'] === 'Asset Type')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean)));
      const staff = Array.from(new Set(data
        .filter((item: any) => item['dropdwon catagorty'] === 'Staff Name')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean)));
      
      setAssetCategories(categories.length > 0 ? categories : ['Electronics', 'Furniture', 'Vehicles']);
      setAssetTypes(types.length > 0 ? types : ['Laptop', 'Monitor', 'Chair']);
      setStaffNames(staff);
    } catch (error) {
      setAssetCategories(['Electronics', 'Furniture', 'Vehicles']);
      setAssetTypes(['Laptop', 'Monitor', 'Chair']);
      setStaffNames([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'registry') {
        const data = await fetchSheet('asset_registry');
        setAssets(data);
      } else {
        const [usageData, assetsData] = await Promise.all([
          fetchSheet('asset_uses'),
          fetchSheet('asset_registry')
        ]);
        setAssetUses(usageData);
        setAssets(assetsData);
      }
    } catch (error) {
      toast.error('Failed to load data');
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

  const handleOpenModal = (item?: any) => {
    if (activeTab === 'registry') {
      if (item) {
        setEditingRow(item._rowIndex);
        setEditingAssetId(item.asset_id || '');
        
        const purchaseDate = item['Purchase Date'] ? formatDateForDisplay(item['Purchase Date']) : '';

        setCommonForm({
          'Purchase Date': purchaseDate,
          purchased_by: item.purchased_by || '',
          Project: item.Project || '',
          Vendor: item.Vendor || '',
        });
        setAssetItems([{
          id: Date.now(),
          asset_name: item.asset_name || '',
          Asset_Category: item.Asset_Category || 'Electronics',
          Asset_type: item.Asset_type || 'Laptop',
          Cost: item.Cost || '',
          Warranty: item.Warranty || '',
          Status: item.Status || 'Available',
          'Number of Assets Purchased': item['Number of Assets Purchased'] || '',
          'Unit Price': item['Unit Price'] || '',
          'Units': item['Units'] || '',
        }]);
      } else {
        setEditingRow(null);
        setEditingAssetId('');
        setCommonForm({
          'Purchase Date': '',
          purchased_by: '',
          Project: '',
          Vendor: '',
        });
        setAssetItems([{
          id: Date.now(),
          asset_name: '',
          Asset_Category: 'Electronics',
          Asset_type: 'Laptop',
          Cost: '',
          Warranty: '',
          Status: 'Available',
          'Number of Assets Purchased': '',
          'Unit Price': '',
          'Units': '',
        }]);
      }
    } else {
      if (item) {
        setEditingRow(item._rowIndex);
        
        const issueDate = item['Issue Date'] ? formatDateForDisplay(item['Issue Date']) : '';
        const returnDate = item['Return Date'] ? formatDateForDisplay(item['Return Date']) : '';

        setUsageForm({
          'Asset Name': item['Asset Name'] || '',
          'Assigned To': item['Assigned To'] || '',
          Project: item.Project || '',
          'Issue Date': issueDate,
          'Return Date': returnDate,
          Condition: item.Condition || '',
          'Number of Assets Purchased': item['Number of Assets Purchased'] || '',
          'Unit Price': item['Unit Price'] || '',
          'Units': item['Units'] || '',
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
          'Number of Assets Purchased': '',
          'Unit Price': '',
          'Units': '',
        });
      }
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
      if (activeTab === 'registry') {
        let Bill_url = editingRow ? assets.find(a => a._rowIndex === editingRow)?.Bill_url : '';
        if (file) {
          const uploadRes = await uploadFile(file);
          Bill_url = uploadRes.url;
        }

        if (editingRow) {
          const rowData = { ...commonForm, ...assetItems[0], asset_id: editingAssetId, Bill_url };
          delete rowData.id;
          await updateRow('asset_registry', editingRow, rowData);
          toast.success('Asset updated successfully!');
        } else {
          let maxId = 0;
          assets.forEach(a => {
            if (a.asset_id && typeof a.asset_id === 'string' && a.asset_id.startsWith('SPMASSET')) {
              const numStr = a.asset_id.replace('SPMASSET', '');
              const num = parseInt(numStr, 10);
              if (!isNaN(num) && num > maxId) {
                maxId = num;
              }
            }
          });
          
          for (let i = 0; i < assetItems.length; i++) {
            const nextId = maxId + 1 + i;
            const finalAssetId = `SPMASSET${nextId.toString().padStart(4, '0')}`;
            const rowData = { ...commonForm, ...assetItems[i], asset_id: finalAssetId, Bill_url };
            delete rowData.id;
            await addRow('asset_registry', rowData);
          }
          toast.success(`${assetItems.length} Asset(s) added successfully!`);
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
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {activeTab === 'registry' ? 'Add Asset' : 'Assign Asset'}
          </button>
        )}
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
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Units</th>
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
                      <td className="px-6 py-4 text-slate-600">{asset['Number of Assets Purchased']}</td>
                      <td className="px-6 py-4 text-slate-600">{asset['Unit Price']}</td>
                      <td className="px-6 py-4 text-slate-600">{asset['Units']}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateForDisplay(asset['Purchase Date'])}</td>
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
                        <button onClick={() => handleViewDetails(asset)} className="text-slate-400 hover:text-blue-600 mr-3" title="View Details">
                          <Search className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => handleOpenModal(asset)} className="text-slate-400 hover:text-blue-600 mr-3">
                              <Edit className="w-4 h-4" />
                            </button>
                            <DeleteButton onClick={() => handleDelete(asset._rowIndex)} />
                          </>
                        )}
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
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Units</th>
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
                      <td className="px-6 py-4 text-slate-600">{usage['Number of Assets Purchased']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage['Unit Price']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage['Units']}</td>
                      <td className="px-6 py-4 text-slate-600">{usage.Project}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateForDisplay(usage['Issue Date'])}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateForDisplay(usage['Return Date'])}</td>
                      <td className="px-6 py-4 text-slate-600">{usage.Condition}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleViewDetails(usage)} className="text-slate-400 hover:text-blue-600 mr-3" title="View Details">
                          <Search className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => handleOpenModal(usage)} className="text-slate-400 hover:text-blue-600 mr-3">
                              <Edit className="w-4 h-4" />
                            </button>
                            <DeleteButton onClick={() => handleDelete(usage._rowIndex)} />
                          </>
                        )}
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
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {activeTab === 'registry' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2">Common Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                        <input type="date" value={commonForm['Purchase Date']} onChange={e => setCommonForm({...commonForm, 'Purchase Date': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Purchased By</label>
                        <select 
                          value={commonForm.purchased_by} 
                          onChange={e => setCommonForm({...commonForm, purchased_by: e.target.value})} 
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Staff</option>
                          {staffNames.map((name, idx) => (
                            <option key={`${name}-${idx}`} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                        <input type="text" value={commonForm.Project} onChange={e => setCommonForm({...commonForm, Project: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                        <input type="text" value={commonForm.Vendor} onChange={e => setCommonForm({...commonForm, Vendor: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bill</label>
                        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Asset Details</h3>
                      {!editingRow && (
                        <button type="button" onClick={() => setAssetItems([...assetItems, { id: Date.now(), asset_name: '', Asset_Category: 'Electronics', Asset_type: 'Laptop', Cost: '', Warranty: '', Status: 'Available', 'Number of Assets Purchased': '', 'Unit Price': '', 'Units': '' }])} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                          <Plus className="w-4 h-4" /> Add Another Asset
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {assetItems.map((item, index) => (
                        <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                          {!editingRow && assetItems.length > 1 && (
                            <button type="button" onClick={() => setAssetItems(assetItems.filter(a => a.id !== item.id))} className="absolute top-2 right-2 text-slate-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                              <input type="text" value={item.asset_name} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].asset_name = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Category</label>
                              <select value={item.Asset_Category} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].Asset_Category = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Category</option>
                                {assetCategories.map((c, idx) => <option key={`${c}-${idx}`} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Type</label>
                              <select value={item.Asset_type} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].Asset_type = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Type</option>
                                {assetTypes.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                              <input type="number" value={item.Cost} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].Cost = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Warranty</label>
                              <input type="text" value={item.Warranty} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].Warranty = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                              <select value={item.Status} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index].Status = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Available</option>
                                <option>In Use</option>
                                <option>Under Repair</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Assets Purchased</label>
                              <input type="number" step="0.01" value={item['Number of Assets Purchased']} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index]['Number of Assets Purchased'] = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                              <input type="number" step="0.01" value={item['Unit Price']} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index]['Unit Price'] = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Units</label>
                              <select value={item['Units']} onChange={e => {
                                const newItems = [...assetItems];
                                newItems[index]['Units'] = e.target.value;
                                setAssetItems(newItems);
                              }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Unit</option>
                                <option value="kg">kg</option>
                                <option value="no">no</option>
                                <option value="lit">lit</option>
                                <option value="mtr">mtr</option>
                                <option value="pkt">pkt</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                    <select value={usageForm['Asset Name']} onChange={e => setUsageForm({...usageForm, 'Asset Name': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select an Asset</option>
                      {assets.map((asset, idx) => (
                        <option key={idx} value={asset.asset_name}>{asset.asset_name} ({asset.asset_id})</option>
                      ))}
                    </select>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Used</label>
                    <input type="number" step="0.01" value={usageForm['Number of Assets Purchased']} onChange={e => setUsageForm({...usageForm, 'Number of Assets Purchased': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                    <input type="number" step="0.01" value={usageForm['Unit Price']} onChange={e => setUsageForm({...usageForm, 'Unit Price': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Units</label>
                    <select value={usageForm['Units']} onChange={e => setUsageForm({...usageForm, 'Units': e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Unit</option>
                      <option value="kg">kg</option>
                      <option value="no">no</option>
                      <option value="lit">lit</option>
                      <option value="mtr">mtr</option>
                      <option value="pkt">pkt</option>
                    </select>
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
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Entry Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-4">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key.startsWith('_') || key === 'id' || key === 'Bill_url') return null;
                  return (
                    <div key={key} className="border-b border-slate-50 pb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        {(key === 'Purchase Date' || key === 'Issue Date' || key === 'Return Date') 
                          ? formatDateForDisplay(String(value)) 
                          : (String(value) || '-')}
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
