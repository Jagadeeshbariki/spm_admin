import { Link } from 'react-router-dom';
import { Building2, Users, ShieldCheck } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Topbar />

      <main>
        {/* Hero Section */}
        <section className="py-24 px-8 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Streamline Your Office Operations
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            A comprehensive administration panel for managing expenses, assets, meetings, car rentals, and vendors efficiently in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/admin/dashboard" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
              Go to Dashboard
            </Link>
          </div>
        </section>

        {/* Office Admin Section */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Office Admin</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Asset Management</h3>
                <p className="text-slate-600">Track all company assets, their usage, warranty status, and maintenance schedules.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Vendor Relations</h3>
                <p className="text-slate-600">Maintain a centralized database of all vendors, service types, and payment details.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Expense Tracking</h3>
                <p className="text-slate-600">Monitor monthly expenses, categorize spending, and generate detailed financial reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Section */}
        <section className="py-20 bg-slate-100 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-3xl font-bold mb-8 text-slate-900">Admin</h2>
            <p className="text-slate-600 mb-8">Future features and administrative settings will be available here.</p>
            <Link to="/admin/settings" className="bg-slate-800 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
              Go to Settings
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
