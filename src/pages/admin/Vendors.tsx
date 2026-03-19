import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Loader2 } from 'lucide-react';
import { fetchSheet, addRow, updateRow, deleteRow } from '../../lib/api';

interface Vendor {
  _rowIndex?: number;
  'vendor_id': string;
  'Vendor Name': string;
  'Service Type': string;
  'Contact Person': string;
  'Phone': string;
  'Email': string;
  'Address': string;
  'GST Number': string;
  'bank Account Name': string;
  'Account Number': string;
  'IFSC_code': string;
  'Branch': string;
}

const initialFormState: Vendor = {
  'vendor_id': '',
  'Vendor Name': '',
  'Service Type': '',
  'Contact Person': '',
  'Phone': '',
  'Email': '',
  'Address': '',
  'GST Number': '',
  'bank Account Name': '',
  'Account Number': '',
  'IFSC_code': '',
  'Branch': ''
};

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Vendor>(initialFormState);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('All Services');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSheet('Vendor_Management');
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      alert('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setFormData(vendor);
      setEditingRow(vendor._rowIndex || null);
    } else {
      setFormData(initialFormState);
      setEditingRow(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingRow(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (editingRow !== null) {
        await updateRow('Vendor_Management', editingRow, formData);
      } else {
        await addRow('Vendor_Management', formData);
      }
      
      await loadVendors();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      alert('Failed to save vendor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        setIsLoading(true);
        await deleteRow('Vendor_Management', rowIndex);
        await loadVendors();
      } catch (error) {
        console.error('Failed to delete vendor:', error);
        alert('Failed to delete vendor');
        setIsLoading(false);
      }
    }
  };

  const serviceTypes = Array.from(new Set(vendors.map(v => v['Service Type']).filter(Boolean)));

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor['Vendor Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor['Contact Person']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = filterService === 'All Services' || vendor['Service Type'] === filterService;
    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Vendors</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-sm text-slate-600"
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              <option value="All Services">All Services</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search vendors..." 
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
                <th className="px-6 py-4">Vendor ID</th>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading vendors...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <tr key={vendor._rowIndex || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{vendor.vendor_id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{vendor['Vendor Name']}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {vendor['Service Type']}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{vendor['Contact Person']}</td>
                    <td className="px-6 py-4 text-slate-600">{vendor.Phone}</td>
                    <td className="px-6 py-4 text-slate-600">{vendor.Email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleOpenModal(vendor)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => vendor._rowIndex && handleDelete(vendor._rowIndex)}
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
                {editingRow !== null ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter vendor ID" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter vendor name" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Vendor Name']}
                    onChange={(e) => setFormData({...formData, 'Vendor Name': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Electronics, Transport" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Service Type']}
                    onChange={(e) => setFormData({...formData, 'Service Type': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input 
                    type="text" 
                    placeholder="Enter contact person" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Contact Person']}
                    onChange={(e) => setFormData({...formData, 'Contact Person': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    placeholder="Enter phone number" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Phone}
                    onChange={(e) => setFormData({...formData, Phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Email}
                    onChange={(e) => setFormData({...formData, Email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter GST number" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['GST Number']}
                    onChange={(e) => setFormData({...formData, 'GST Number': e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea 
                    rows={2} 
                    placeholder="Enter full address" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Address}
                    onChange={(e) => setFormData({...formData, Address: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="font-medium text-slate-800 mb-2 mt-2">Bank Details</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter bank account name" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['bank Account Name']}
                    onChange={(e) => setFormData({...formData, 'bank Account Name': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter account number" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData['Account Number']}
                    onChange={(e) => setFormData({...formData, 'Account Number': e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    placeholder="Enter IFSC code" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.IFSC_code}
                    onChange={(e) => setFormData({...formData, IFSC_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                  <input 
                    type="text" 
                    placeholder="Enter branch" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Branch}
                    onChange={(e) => setFormData({...formData, Branch: e.target.value})}
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
                {isSaving ? 'Saving...' : 'Save Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
