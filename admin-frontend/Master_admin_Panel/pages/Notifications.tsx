import React, { useState, useEffect } from 'react';
import { NotificationComposer } from '../components/NotificationComposer';
import {
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Loader2,
  Calendar,
} from 'lucide-react';
import { getAdminAnnouncements, toggleAdminAnnouncement, deleteAdminAnnouncement } from '../services/adminApi';

export const Notifications: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleToggle = async (id: string, currentState: boolean) => {
    setActionLoadingId(id);
    try {
      await toggleAdminAnnouncement(id, !currentState);
      await fetchAnnouncements();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deleteAdminAnnouncement(id);
      await fetchAnnouncements();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="text-blue-600" size={26} />
          Notification & Announcement Center
        </h1>
        <p className="text-slate-500 mt-1">
          Broadcast instant system announcements, maintenance alerts, or targeted bulletins to tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NotificationComposer onAnnouncementCreated={fetchAnnouncements} />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            Recent Announcements
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-semibold">
              {announcements.length}
            </span>
          </h3>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No announcements dispatched yet.
              </div>
            ) : (
              announcements.map((note) => (
                <div key={note.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {note.type === 'info' && <Info size={16} className="text-blue-500 shrink-0" />}
                      {note.type === 'warning' && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                      {note.type === 'important' && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
                      {note.type === 'maintenance' && <ShieldAlert size={16} className="text-purple-500 shrink-0" />}
                      <span className="font-semibold text-slate-900 text-sm line-clamp-1">{note.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(note.id, note.is_active)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                          note.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {note.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{note.message}</p>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                    <span>Target: <strong className="text-slate-700 capitalize">{note.target}</strong></span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
