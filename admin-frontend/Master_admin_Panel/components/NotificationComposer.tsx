import React, { useState } from 'react';
import { Send, AlertCircle, Info, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { createAdminAnnouncement } from '../services/adminApi';

interface NotificationComposerProps {
  onAnnouncementCreated: () => void;
}

export const NotificationComposer: React.FC<NotificationComposerProps> = ({ onAnnouncementCreated }) => {
  const [targetType, setTargetType] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [priority, setPriority] = useState<'info' | 'warning' | 'important' | 'maintenance'>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAdminAnnouncement({
        title: title.trim(),
        message: message.trim(),
        type: priority,
        target: targetType,
        target_id: targetType !== 'all' && targetId ? targetId.trim() : null,
      });

      setTitle('');
      setMessage('');
      setTargetId('');
      onAnnouncementCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Send size={18} className="text-blue-600" />
        Compose Broadcast Announcement
      </h3>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Broadcast to All Users</option>
            <option value="business">Specific Business Tenant</option>
            <option value="user">Specific User ID</option>
          </select>
        </div>

        {targetType !== 'all' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target {targetType === 'business' ? 'Business ID' : 'User Email / ID'}
            </label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Paste ID..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Category & Priority</label>
        <div className="flex flex-wrap gap-4 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="priority"
              value="info"
              checked={priority === 'info'}
              onChange={() => setPriority('info')}
              className="text-blue-600"
            />
            <span className="flex items-center gap-1 text-slate-700">
              <Info size={14} className="text-blue-500" /> Information
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="priority"
              value="warning"
              checked={priority === 'warning'}
              onChange={() => setPriority('warning')}
              className="text-amber-600"
            />
            <span className="flex items-center gap-1 text-slate-700">
              <AlertTriangle size={14} className="text-amber-500" /> Warning
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="priority"
              value="important"
              checked={priority === 'important'}
              onChange={() => setPriority('important')}
              className="text-rose-600"
            />
            <span className="flex items-center gap-1 text-slate-700">
              <AlertCircle size={14} className="text-rose-500" /> Important
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="priority"
              value="maintenance"
              checked={priority === 'maintenance'}
              onChange={() => setPriority('maintenance')}
              className="text-purple-600"
            />
            <span className="flex items-center gap-1 text-slate-700">
              <ShieldAlert size={14} className="text-purple-500" /> Maintenance
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Scheduled GST Compliance Update This Weekend"
          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the update, impact, and expected resolution..."
          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
        ></textarea>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Broadcasting...' : 'Broadcast Announcement'}
        </button>
      </div>
    </form>
  );
};
