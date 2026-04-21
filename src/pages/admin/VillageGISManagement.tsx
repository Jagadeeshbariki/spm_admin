import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Upload, 
  FileText, 
  Trash2, 
  AlertCircle, 
  Download,
  Loader2,
  Table as TableIcon,
  Search,
  Layers,
  MapPin
} from 'lucide-react';
import { fetchSheet, addRow, deleteRow, uploadFile, WATER_COLLECTIVES_FOLDER_ID } from '@/lib/api';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import DeleteButton from '@/components/DeleteButton';
import { cn } from '@/lib/utils';

interface ActivityAsset {
  _rowIndex?: number;
  'Mandal'?: string;
  'Village Name'?: string;
  'Activity Name'?: string;
  'Latitude'?: string | number;
  'Longitude'?: string | number;
  'Details'?: string;
  'Asset Type'?: string;
  [key: string]: any;
}

export default function VillageGISManagement() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [data, setData] = useState<ActivityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData().then(() => {
      if (highlightId) {
        setTimeout(() => {
          const element = document.getElementById(`row-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    });
  }, [highlightId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchSheet('village_assets');
      setData(result);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBoundaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.loading('Uploading Boundary GeoJSON...', { id: 'geojson' });
    try {
      const result = await uploadFile(file, WATER_COLLECTIVES_FOLDER_ID);
      const fileId = result.id;

      // Store in Polygons_manyam sheet (Water Collective Spreadsheet)
      await addRow('Polygons_manyam', {
        'Name': file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        'Region Type': 'Boundary',
        'File Name': file.name,
        'File ID': fileId,
        'GeoJSON URL': result.url || result.webViewLink,
        'Last Updated': new Date().toLocaleString()
      });

      toast.success('Boundary file uploaded and added to Polygons_manyam', { id: 'geojson' });
      // Tell them to refresh the map
      toast('Refresh the "About Region" map to see changes', { icon: '🔄' });
    } catch (e) {
      toast.error('Failed to upload GeoJSON', { id: 'geojson' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          
          // Basic validation of headers
          const requiredHeaders = ['Mandal', 'Village Name', 'Activity Name', 'Latitude', 'Longitude'];
          const headers = Object.keys(rows[0] || {});
          const missing = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missing.length > 0) {
            toast.error(`Missing columns: ${missing.join(', ')}`);
            setIsUploading(false);
            return;
          }

          toast.loading(`Uploading ${rows.length} records...`, { id: 'upload' });
          
          // Batch upload (sequential since Apps Script might struggle with parallel)
          for (const row of rows) {
            await addRow('village_assets', row);
          }
          
          toast.success('Successfully uploaded all records', { id: 'upload' });
          loadData();
        } catch (error) {
          toast.error('Upload failed', { id: 'upload' });
        } finally {
          setIsUploading(false);
          if (e.target) e.target.value = '';
        }
      }
    });
  };

  const handleDelete = async (rowIndex: number) => {
    try {
      await deleteRow('village_assets', rowIndex);
      toast.success('Record deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const filteredData = data.filter(item => 
    item['Village Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item['Activity Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Mandal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Region Asset Management</h1>
          <p className="text-slate-500 mt-1">Upload and manage regional activity-wise GIS data</p>
        </div>
        <div className="flex items-center gap-3">
          <label className={cn(
            "bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-200",
            isUploading && "opacity-50 pointer-events-none"
          )}>
            <Layers className="w-4 h-4" />
            Upload Boundary (GeoJSON)
            <input 
              type="file" 
              accept=".json,.geojson" 
              className="hidden" 
              onChange={handleBoundaryUpload} 
              disabled={isUploading}
            />
          </label>
          <label className={cn(
            "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-blue-200",
            isUploading && "opacity-50 pointer-events-none"
          )}>
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Upload CSV
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1 underline">CSV Format Requirements:</p>
          <p>Ensure your CSV has these headers: <code className="bg-amber-100 px-1 rounded">Mandal</code>, <code className="bg-amber-100 px-1 rounded">Village Name</code>, <code className="bg-amber-100 px-1 rounded">Activity Name</code>, <code className="bg-amber-100 px-1 rounded">Latitude</code>, <code className="bg-amber-100 px-1 rounded">Longitude</code></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <TableIcon className="w-4 h-4" />
            <span>{filteredData.length} Records</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Mandal</th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Coords</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No records found. Upload a CSV to get started.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isHighlighted = highlightId && (item._rowIndex?.toString() === highlightId);

                  return (
                    <tr 
                      key={item._rowIndex || idx} 
                      id={`row-${item._rowIndex}`}
                      className={cn(
                        "hover:bg-slate-50/50 transition-all duration-1000",
                        isHighlighted && "bg-blue-50 ring-2 ring-blue-500 ring-inset"
                      )}
                    >
                      <td className="px-6 py-4 font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          {isHighlighted && <MapPin className="w-3 h-3 text-blue-600 animate-bounce" />}
                          {item.Mandal}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item['Village Name']}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium text-xs border border-blue-100">
                          {item['Activity Name']}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {parseFloat(item.Latitude as any).toFixed(4)}, {parseFloat(item.Longitude as any).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DeleteButton 
                          onClick={() => item._rowIndex && handleDelete(item._rowIndex)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-2"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
