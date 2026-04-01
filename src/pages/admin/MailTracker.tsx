import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Loader2, 
  Mail, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Package,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  ExternalLink,
  Layers,
  Users,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSheet, addRow, updateRow, deleteRow, uploadFile } from '../../lib/api';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

interface Product {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Transaction {
  _rowIndex?: number;
  Transaction_ID: string;
  Mail_Subject: string;
  Activity: string;
  Approval_Date: string;
  Product_Name: string;
  Quantity: number;
  Unit_Price: number;
  Total: number;
  Total_Amount: number;
  Payment_Status: 'Pending' | 'Paid';
  Bill_Status: 'Not Received' | 'Received';
  Bill_Upload: string;
  Batch_Number: string;
  HO_Status: 'Not Sent' | 'Sent' | 'Verified';
  Remarks: string;
  PC_Meeting_Status?: 'Pending' | 'Approved' | 'Rejected';
  PO_Status?: 'Not Created' | 'Created' | 'Sent';
  PO_Upload?: string;
  Approved_Status?: string;
  Responsible_Person?: string;
}

interface Batch {
  _rowIndex?: number;
  Batch_ID: string;
  Batch_Date: string;
  Total_Amount: number;
  Number_of_Bills: number;
  HO_Status: string;
}

export default function MailTracker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'batches'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [approvedStatuses, setApprovedStatuses] = useState<string[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [billFilter, setBillFilter] = useState('All');
  const [hoFilter, setHoFilter] = useState('All');
  
  // Selection for Batching
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    Mail_Subject: '',
    Activity: '',
    Approval_Date: '',
    Payment_Status: 'Pending' as const,
    Bill_Status: 'Not Received' as const,
    Bill_Upload: '',
    Batch_Number: '',
    HO_Status: 'Not Sent' as const,
    Remarks: '',
    PC_Meeting_Status: 'Pending' as const,
    PO_Status: 'Not Created' as const,
    PO_Upload: '',
    Approved_Status: '',
    Responsible_Person: '',
  });
  
  const [products, setProducts] = useState<Product[]>([
    { name: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  
  const [file, setFile] = useState<File | null>(null);
  const [poFile, setPoFile] = useState<File | null>(null);

  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  useEffect(() => {
    loadData();
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const data = await fetchSheet('MasterData');
      
      const activityOptions = data
        .filter((item: any) => item['formname'] === 'Mail Tracker' && item['dropdwon catagorty'] === 'Activity')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean);
      setActivities(Array.from(new Set(activityOptions)));

      const approvedOptions = data
        .filter((item: any) => item['formname'] === 'Mail Tracker' && item['dropdwon catagorty'] === 'Approved Status')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean);
      setApprovedStatuses(Array.from(new Set(approvedOptions)));

      const staffOptions = data
        .filter((item: any) => item['formname'] === 'Staff' && item['dropdwon catagorty'] === 'Staff Name')
        .map((item: any) => item['dropdwon options'])
        .filter(Boolean);
      setStaffNames(Array.from(new Set(staffOptions)));
    } catch (error) {
      console.error('Failed to load master data');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [transData, batchData] = await Promise.all([
        fetchSheet('mail_tracker'),
        fetchSheet('mail_tracker_batches')
      ]);
      setTransactions(transData);
      setBatches(batchData);
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

  const totalAmount = useMemo(() => {
    return products.reduce((sum, p) => sum + p.total, 0);
  }, [products]);

  const handleProductChange = (index: number, field: keyof Product, value: any) => {
    const newProducts = [...products];
    const product = { ...newProducts[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      product.total = (product.quantity || 0) * (product.unitPrice || 0);
    }
    
    newProducts[index] = product;
    setProducts(newProducts);
  };

  const addProductRow = () => {
    setProducts([...products, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeProductRow = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingRow(transaction._rowIndex || null);
      
      // Find all products for this "Mail" (grouped by Subject and Date)
      const mailProducts = transactions
        .filter(t => t.Mail_Subject === transaction.Mail_Subject && t.Approval_Date === transaction.Approval_Date)
        .map(t => ({
          name: t.Product_Name,
          quantity: t.Quantity,
          unitPrice: t.Unit_Price,
          total: t.Total
        }));

      const formattedDate = transaction.Approval_Date ? formatDateForDisplay(transaction.Approval_Date) : '';
      setFormData({
        Mail_Subject: transaction.Mail_Subject || '',
        Activity: transaction.Activity || '',
        Approval_Date: formattedDate,
        Payment_Status: transaction.Payment_Status || 'Pending',
        Bill_Status: transaction.Bill_Status || 'Not Received',
        Bill_Upload: transaction.Bill_Upload || '',
        Batch_Number: transaction.Batch_Number || '',
        HO_Status: transaction.HO_Status || 'Not Sent',
        Remarks: transaction.Remarks || '',
        PC_Meeting_Status: transaction.PC_Meeting_Status || 'Pending',
        PO_Status: transaction.PO_Status || 'Not Created',
        PO_Upload: transaction.PO_Upload || '',
        Approved_Status: transaction.Approved_Status || '',
        Responsible_Person: transaction.Responsible_Person || '',
      });
      setProducts(mailProducts.length > 0 ? mailProducts : [{ name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    } else {
      setEditingRow(null);
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const localToday = `${y}-${m}-${d}`;

      setFormData({
        Mail_Subject: '',
        Activity: '',
        Approval_Date: localToday,
        Payment_Status: 'Pending',
        Bill_Status: 'Not Received',
        Bill_Upload: '',
        Batch_Number: '',
        HO_Status: 'Not Sent',
        Remarks: '',
        PC_Meeting_Status: 'Pending',
        PO_Status: 'Not Created',
        PO_Upload: '',
        Approved_Status: '',
        Responsible_Person: '',
      });
      setProducts([{ name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    }
    setFile(null);
    setPoFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Mail_Subject || !formData.Activity || !formData.Approval_Date) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      let billUrl = formData.Bill_Upload;
      if (file) {
        const uploadResult = await uploadFile(file);
        billUrl = uploadResult.webViewLink || uploadResult.url;
      }

      let poUrl = formData.PO_Upload;
      if (poFile) {
        const uploadResult = await uploadFile(poFile);
        poUrl = uploadResult.webViewLink || uploadResult.url;
      }

      // If editing, we need to handle multiple rows. 
      // Simplest way: Delete all rows for this Mail and re-add.
      if (editingRow !== null) {
        const originalTrans = transactions.find(t => t._rowIndex === editingRow);
        if (originalTrans) {
          const rowsToDelete = transactions
            .filter(t => t.Mail_Subject === originalTrans.Mail_Subject && t.Approval_Date === originalTrans.Approval_Date)
            .map(t => t._rowIndex!)
            .sort((a, b) => b - a); // Delete from bottom up to keep indices valid if using index-based delete
          
          for (const rowIndex of rowsToDelete) {
            await deleteRow('mail_tracker', rowIndex);
          }
        }
      }

      // Add one row per product
      for (const product of products) {
        const rowData = {
          ...formData,
          Bill_Upload: billUrl,
          PO_Upload: poUrl,
          Total_Amount: totalAmount,
          Product_Name: product.name,
          Quantity: product.quantity,
          Unit_Price: product.unitPrice,
          Total: product.total,
          Transaction_ID: `P1198-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };
        await addRow('mail_tracker', rowData);
      }

      toast.success(editingRow !== null ? 'Transaction updated' : 'Transaction added');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this entire mail entry?')) return;
    setIsDeleting(true);
    try {
      const transToDelete = transactions.find(t => t._rowIndex === rowIndex);
      if (transToDelete) {
        const rowsToDelete = transactions
          .filter(t => t.Mail_Subject === transToDelete.Mail_Subject && t.Approval_Date === transToDelete.Approval_Date)
          .map(t => t._rowIndex!)
          .sort((a, b) => b - a);
        
        for (const idx of rowsToDelete) {
          await deleteRow('mail_tracker', idx);
        }
      }
      toast.success('Mail entry deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  // Group transactions for the table display
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction } = {};
    transactions.forEach(t => {
      const key = `${t.Mail_Subject}_${t.Approval_Date}`;
      if (!groups[key]) {
        groups[key] = { ...t };
      }
    });
    return Object.values(groups);
  }, [transactions]);

  const filteredTransactions = groupedTransactions.filter(t => {
    const matchesSearch = t.Mail_Subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.Transaction_ID?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || t.Payment_Status === paymentFilter;
    const matchesBill = billFilter === 'All' || t.Bill_Status === billFilter;
    const matchesHO = hoFilter === 'All' || t.HO_Status === hoFilter;
    return matchesSearch && matchesPayment && matchesBill && matchesHO;
  });

  const dashboardMetrics = useMemo(() => {
    const totalApproved = transactions.reduce((sum, t) => sum + (Number(t.Total_Amount) || 0), 0);
    const pendingPayments = transactions.filter(t => t.Payment_Status === 'Pending').reduce((sum, t) => sum + (Number(t.Total_Amount) || 0), 0);
    const billsNotReceived = transactions.filter(t => t.Bill_Status === 'Not Received').length;
    const pendingPCMeetings = transactions.filter(t => t.Total_Amount > 35000 && t.PC_Meeting_Status === 'Pending').length;
    
    return { totalApproved, pendingPayments, billsNotReceived, pendingPCMeetings };
  }, [transactions]);

  const handleCreateBatch = async () => {
    if (selectedTransactionIds.length === 0) {
      toast.error('Please select transactions to batch');
      return;
    }

    const selectedTrans = transactions.filter(t => selectedTransactionIds.includes(t.Transaction_ID));
    const totalBatchAmount = selectedTrans.reduce((sum, t) => sum + (Number(t.Total_Amount) || 0), 0);
    const batchId = `BAT-${Date.now()}`;

    setIsSaving(true);
    try {
      // 1. Create Batch
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const localToday = `${y}-${m}-${d}`;

      await addRow('mail_tracker_batches', {
        Batch_ID: batchId,
        Batch_Date: localToday,
        Total_Amount: totalBatchAmount,
        Number_of_Bills: selectedTrans.length,
        HO_Status: 'Not Sent'
      });

      // 2. Update Transactions with Batch ID
      for (const trans of selectedTrans) {
        await updateRow('mail_tracker', trans._rowIndex!, { Batch_Number: batchId });
      }

      toast.success(`Batch ${batchId} created successfully`);
      setSelectedTransactionIds([]);
      loadData();
    } catch (error) {
      toast.error('Failed to create batch');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Received':
      case 'Verified':
      case 'Approved':
      case 'Sent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending':
      case 'Not Received':
      case 'Not Sent':
      case 'Not Created':
      case 'Rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'In Progress':
      case 'Created':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={cn("p-4 md:p-6 space-y-6", (isSaving || isDeleting) && "blur-sm pointer-events-none")}>
      {/* Loading Overlay */}
      {(isSaving || isDeleting) && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-lg font-bold text-slate-800">
              {isDeleting ? 'Deleting Entry...' : 'Saving Changes...'}
            </p>
            <p className="text-sm text-slate-500">Please wait while we update the database</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mail Tracker</h1>
          <p className="text-slate-500 text-sm">Track email approvals, bills, and batches</p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-6 py-3 font-medium text-sm transition-colors relative",
            activeTab === 'dashboard' ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Dashboard
          {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={cn(
            "px-6 py-3 font-medium text-sm transition-colors relative",
            activeTab === 'transactions' ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Transactions
          {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('batches')}
          className={cn(
            "px-6 py-3 font-medium text-sm transition-colors relative",
            activeTab === 'batches' ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Batches
          {activeTab === 'batches' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Approved</p>
                  <p className="text-2xl font-bold text-slate-800">₹{dashboardMetrics.totalApproved.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Pending Payments</p>
                  <p className="text-2xl font-bold text-slate-800">₹{dashboardMetrics.pendingPayments.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Bills Not Received</p>
                  <p className="text-2xl font-bold text-slate-800">{dashboardMetrics.billsNotReceived}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Pending PC Meetings</p>
                  <p className="text-2xl font-bold text-slate-800">{dashboardMetrics.pendingPCMeetings}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Recent Transactions</h3>
              <button onClick={() => setActiveTab('transactions')} className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.Transaction_ID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.Transaction_ID}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        <div className="flex items-center gap-2 group">
                          <span className="truncate" title={t.Mail_Subject}>{t.Mail_Subject}</span>
                          {t.Mail_Subject && (
                            <a 
                              href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(t.Mail_Subject)}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Search in Gmail"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{Number(t.Total_Amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(t.Payment_Status))}>
                          {t.Payment_Status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(t.Bill_Status))}>
                          {t.Bill_Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search subject or ID..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                className="text-sm bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="All">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
              <select 
                className="text-sm bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={billFilter}
                onChange={(e) => setBillFilter(e.target.value)}
              >
                <option value="All">All Bills</option>
                <option value="Not Received">Not Received</option>
                <option value="Received">Received</option>
              </select>
              <select 
                className="text-sm bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={hoFilter}
                onChange={(e) => setHoFilter(e.target.value)}
              >
                <option value="All">All HO Status</option>
                <option value="Not Sent">Not Sent</option>
                <option value="Sent">Sent</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
            {selectedTransactionIds.length > 0 && (
              <button 
                onClick={handleCreateBatch}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                Create Batch ({selectedTransactionIds.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransactionIds(filteredTransactions.filter(t => !t.Batch_Number).map(t => t.Transaction_ID));
                          } else {
                            setSelectedTransactionIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bill</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">HO Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.Transaction_ID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {!t.Batch_Number && (
                          <input 
                            type="checkbox" 
                            checked={selectedTransactionIds.includes(t.Transaction_ID)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTransactionIds([...selectedTransactionIds, t.Transaction_ID]);
                              } else {
                                setSelectedTransactionIds(selectedTransactionIds.filter(id => id !== t.Transaction_ID));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.Transaction_ID}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        <div className="flex items-center gap-2 group">
                          <span className="truncate" title={t.Mail_Subject}>{t.Mail_Subject}</span>
                          {t.Mail_Subject && (
                            <a 
                              href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(t.Mail_Subject)}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Search in Gmail"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{Number(t.Total_Amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(t.Payment_Status))}>
                          {t.Payment_Status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(t.Bill_Status))}>
                            {t.Bill_Status}
                          </span>
                          {t.Bill_Upload && (
                            <a href={t.Bill_Upload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{t.Batch_Number || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(t.HO_Status))}>
                          {t.HO_Status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsViewModalOpen(true);
                            }} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          {userRole === 'admin' && (
                            <button onClick={() => handleDelete(t._rowIndex!)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">No. of Bills</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">HO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.Batch_ID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{b.Batch_ID}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDateForDisplay(b.Batch_Date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{Number(b.Total_Amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{b.Number_of_Bills}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(b.HO_Status))}>
                        {b.HO_Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Transaction Details Modal */}
      {isViewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Transaction Details</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">ID: {selectedTransaction.Transaction_ID}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mail Subject</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{selectedTransaction.Mail_Subject}</p>
                    {selectedTransaction.Mail_Subject && (
                      <a 
                        href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(selectedTransaction.Mail_Subject)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Search in Gmail"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTransaction.Activity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Date</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTransaction.Approval_Date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                  <p className="text-sm font-bold text-blue-600">₹{Number(selectedTransaction.Total_Amount).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Status</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTransaction.Approved_Status || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsible Person</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTransaction.Responsible_Person || '-'}</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</p>
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(selectedTransaction.Payment_Status))}>
                    {selectedTransaction.Payment_Status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Status</p>
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(selectedTransaction.Bill_Status))}>
                    {selectedTransaction.Bill_Status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HO Status</p>
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(selectedTransaction.HO_Status))}>
                    {selectedTransaction.HO_Status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</p>
                  <p className="text-xs font-semibold text-slate-600">{selectedTransaction.Batch_Number || '-'}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Included Products
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase">Product</th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase text-center">Qty</th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase text-right">Price</th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions
                        .filter(t => t.Mail_Subject === selectedTransaction.Mail_Subject && t.Approval_Date === selectedTransaction.Approval_Date)
                        .map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium text-slate-700">{p.Product_Name}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{p.Quantity}</td>
                            <td className="px-4 py-2 text-right text-slate-600">₹{Number(p.Unit_Price).toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-800">₹{Number(p.Total).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Files & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Documents</h3>
                  <div className="flex flex-col gap-2">
                    {selectedTransaction.Bill_Upload ? (
                      <a 
                        href={selectedTransaction.Bill_Upload} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-bold">Bill Document</span>
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs italic">
                        No bill uploaded
                      </div>
                    )}

                    {selectedTransaction.PO_Upload && (
                      <a 
                        href={selectedTransaction.PO_Upload} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-700 hover:bg-purple-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-bold">PO Document</span>
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Remarks</h3>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 min-h-[60px]">
                    {selectedTransaction.Remarks || 'No remarks provided.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRow !== null ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mail Subject *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Mail_Subject}
                    onChange={(e) => setFormData({ ...formData, Mail_Subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Activity *</label>
                  <select 
                    required
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Activity}
                    onChange={(e) => setFormData({ ...formData, Activity: e.target.value })}
                  >
                    <option value="">Select Activity</option>
                    {activities.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Approval Date *</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Approval_Date}
                    onChange={(e) => setFormData({ ...formData, Approval_Date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Approved Status</label>
                  <select 
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Approved_Status}
                    onChange={(e) => setFormData({ ...formData, Approved_Status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    {approvedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Responsible Person</label>
                  <select 
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Responsible_Person}
                    onChange={(e) => setFormData({ ...formData, Responsible_Person: e.target.value })}
                  >
                    <option value="">Select Person</option>
                    {staffNames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {editingRow !== null && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Bill Upload</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          className="hidden" 
                          id="bill-upload"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="bill-upload"
                          className="flex-1 border-2 border-dashed border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-500 flex items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          {file ? file.name : 'Click to upload bill'}
                        </label>
                        {formData.Bill_Upload && !file && (
                          <a href={formData.Bill_Upload} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Payment Status</label>
                      <select 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.Payment_Status}
                        onChange={(e) => setFormData({ ...formData, Payment_Status: e.target.value as any })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Bill Status</label>
                      <select 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.Bill_Status}
                        onChange={(e) => setFormData({ ...formData, Bill_Status: e.target.value as any })}
                      >
                        <option value="Not Received">Not Received</option>
                        <option value="Received">Received</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">HO Status</label>
                      <select 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.HO_Status}
                        onChange={(e) => setFormData({ ...formData, HO_Status: e.target.value as any })}
                      >
                        <option value="Not Sent">Not Sent</option>
                        <option value="Sent">Sent</option>
                        <option value="Verified">Verified</option>
                      </select>
                    </div>
                  </>
                )}

                {totalAmount > 35000 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">PC Meeting Status</label>
                      <select 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.PC_Meeting_Status}
                        onChange={(e) => setFormData({ ...formData, PC_Meeting_Status: e.target.value as any })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">PO Status</label>
                      <select 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.PO_Status}
                        onChange={(e) => setFormData({ ...formData, PO_Status: e.target.value as any })}
                      >
                        <option value="Not Created">Not Created</option>
                        <option value="Created">Created</option>
                        <option value="Sent">Sent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">PO Upload</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          className="hidden" 
                          id="po-upload"
                          onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="po-upload"
                          className="flex-1 border-2 border-dashed border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-500 flex items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          {poFile ? poFile.name : 'Click to upload PO'}
                        </label>
                        {formData.PO_Upload && !poFile && (
                          <a href={formData.PO_Upload} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Products
                  </h3>
                  <button 
                    type="button"
                    onClick={addProductRow}
                    className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
                
                <div className="space-y-3">
                  {products.map((product, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="col-span-12 md:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter product name"
                          className="w-full border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                          value={product.name}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                        <input 
                          type="number" 
                          className="w-full border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</label>
                        <input 
                          type="number" 
                          className="w-full border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                          value={product.unitPrice}
                          onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Total</label>
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700">
                          ₹{product.total.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button 
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Total Transaction Amount</p>
                    <p className="text-2xl font-bold text-blue-700">₹{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Payment Status</label>
                  <select 
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Payment_Status}
                    onChange={(e) => setFormData({ ...formData, Payment_Status: e.target.value as any })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bill Status</label>
                  <select 
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.Bill_Status}
                    onChange={(e) => setFormData({ ...formData, Bill_Status: e.target.value as any })}
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">HO Status</label>
                  <select 
                    className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.HO_Status}
                    onChange={(e) => setFormData({ ...formData, HO_Status: e.target.value as any })}
                  >
                    <option value="Not Sent">Not Sent</option>
                    <option value="Sent">Sent</option>
                    <option value="Verified">Verified</option>
                  </select>
                </div>
              </div>

              {/* Conditional Logic Section */}
              {totalAmount > 35000 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-800">PC Meeting Status</label>
                    <select 
                      className="w-full border-amber-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 transition-all"
                      value={formData.PC_Meeting_Status}
                      onChange={(e) => setFormData({ ...formData, PC_Meeting_Status: e.target.value as any })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-800">PO Status</label>
                    <select 
                      className="w-full border-amber-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 transition-all"
                      value={formData.PO_Status}
                      onChange={(e) => setFormData({ ...formData, PO_Status: e.target.value as any })}
                    >
                      <option value="Not Created">Not Created</option>
                      <option value="Created">Created</option>
                      <option value="Sent">Sent</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Remarks</label>
                <textarea 
                  className="w-full border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                  rows={3}
                  value={formData.Remarks}
                  onChange={(e) => setFormData({ ...formData, Remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRow !== null ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
