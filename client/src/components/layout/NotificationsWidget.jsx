import React, { useEffect, useState } from 'react';
import * as api from '@/api/client';
import toast from 'react-hot-toast';

const NotificationsWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.default.get('/social/notifications');
      setNotifications(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  const handleMarkSeen = async (id) => {
    try {
      await api.default.patch(`/social/notifications/${id}/seen`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unseenCount = notifications.filter((n) => !n.seen).length;

  return (
    <div className="notif-widget-wrap">
      <button
        id="notif-toggle-btn"
        className="btn btn-ghost btn-sm notif-btn"
        onClick={() => setOpen(!open)}
        aria-label="View notifications"
      >
        🔔
        {unseenCount > 0 && <span className="notif-badge">{unseenCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown card animate-scale-in">
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            <button className="notif-close-inline" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="notif-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkSeen(n.id)}
                className={`notif-item ${n.seen ? 'seen' : 'unseen'}`}
                id={`notif-item-${n.id}`}
              >
                <div className="notif-avatar">
                  {n.sender_avatar ? (
                    <img src={n.sender_avatar} alt={n.sender_name} />
                  ) : (
                    n.sender_name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="notif-body">
                  <p className="notif-message text-xs">{n.message}</p>
                  <span className="notif-time text-xxs text-muted">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="notif-empty text-xs text-muted">No recent notifications</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        .notif-widget-wrap { position: relative; display: inline-block; }
        .notif-btn { position: relative; font-size: 1.15rem; padding: var(--space-2); }
        .notif-badge { position: absolute; top: 2px; right: 2px; background: var(--color-accent-coral); color: white; font-size: 9px; font-weight: 700; border-radius: 50%; min-width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--color-bg-primary); }
        
        .notif-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 280px; max-height: 350px; display: flex; flex-direction: column; z-index: 1100; box-shadow: var(--shadow-lg); overflow: hidden; background: var(--color-bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); }
        .notif-dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-subtle); }
        .notif-close-inline { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; }
        .notif-list { display: flex; flex-direction: column; overflow-y: auto; }
        .notif-item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background var(--transition-fast); }
        .notif-item:hover { background: var(--glass-bg); }
        .notif-item.unseen { background: rgba(99,102,241,0.06); border-left: 2.5px solid var(--color-brand-400); }
        .notif-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--color-bg-elevated); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); border: 1px solid var(--border-subtle); overflow: hidden; }
        .notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .notif-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .notif-message { line-height: 1.3; font-weight: 500; color: var(--text-primary); }
        .notif-time { font-size: 0.7rem; }
        .notif-empty { text-align: center; padding: var(--space-6) 0; }
        .text-xxs { font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

export default NotificationsWidget;
