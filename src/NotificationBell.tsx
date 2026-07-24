import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function formatTimeAgo(timestamp: number) {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useQuery(api.medical.getNotifications) || [];
    const markRead = useMutation(api.medical.markNotificationsAsRead);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markRead();
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full hover:bg-white/5 transition-colors group"
            >
                <span className="text-xl group-hover:scale-110 transition-transform block">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-background">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 bg-section-dark border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markRead()}
                                    className="text-[10px] text-primary hover:underline uppercase tracking-wider font-bold"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`p-4 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'SOS' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    n.type === 'ORDER' ? 'bg-green-500' : 'bg-primary'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-white leading-tight mb-1">{n.title}</p>
                                                    <p className="text-xs text-text-muted leading-relaxed mb-2">{n.message}</p>
                                                    <p className="text-[10px] text-text-muted/60">
                                                        {formatTimeAgo(n.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-text-muted italic text-sm">
                                    <div className="text-3xl mb-3 opacity-20">📭</div>
                                    <p>No notifications yet</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white/5 text-center border-t border-white/5">
                            <button className="text-[10px] text-text-muted hover:text-white uppercase tracking-widest font-bold">
                                View All Activity
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
