import { Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function DeleteButton({ onClick, className = "text-slate-400 hover:text-red-600" }: { onClick: () => void, className?: string }) {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (role !== 'admin' && role !== 'office admin') return null;
  return (
    <button onClick={onClick} className={className}>
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
