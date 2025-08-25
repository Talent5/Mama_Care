import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Globe, 
  User, 
  LogOut,
  ChevronDown,
  Menu,
  X,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import SearchBar from '../common/SearchBar';
import notificationService, { type NotificationData, type NotificationStats } from '../../services/notificationService';

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({
    unread: 0,
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (isLoadingNotifications) return; // Prevent concurrent requests
    
    setIsLoadingNotifications(true);
    try {
      const [notificationData, stats] = await Promise.all([
        notificationService.fetchNotifications(),
        notificationService.getStats()
      ]);
      
      setNotifications(notificationData);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Don't show error to user for background refresh failures
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isLoadingNotifications]);

  // Load notifications on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initNotifications = async () => {
      if (isMounted) {
        await loadNotifications();
      }
    };
    
    initNotifications();
    
    // Refresh every 10 minutes instead of 5 minutes to reduce load
    const interval = setInterval(() => {
      if (isMounted) {
        loadNotifications();
      }
    }, 600000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read
    await notificationService.markAsRead(notification.id);
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Update stats
    setNotificationStats(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1)
    }));
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Handle mark all notifications as read
  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationStats(prev => ({ ...prev, unread: 0 }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation handlers
  const handleViewProfile = () => {
    setShowProfile(false);
    navigate('/settings', { state: { activeTab: 'profile' } });
  };

  const handleSettings = () => {
    setShowProfile(false);
    navigate('/settings');
  };

  // Get icon for notification type
  const getNotificationIcon = (notification: NotificationData) => {
    switch (notification.severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 lg:left-64 right-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-3 sm:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>

        {/* Search bar */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 lg:flex-initial">
          <SearchBar className="flex-1 lg:w-80 xl:w-96" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online status - hidden on small screens */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Online</span>
          </div>
          
          {/* Globe button - hidden on mobile */}
          <button className="hidden sm:block p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 group">
            <Globe className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 relative group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
              {notificationStats.unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-medium px-1">
                  {notificationStats.unread > 99 ? '99+' : notificationStats.unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {notificationStats.unread} new
                      </span>
                      {notificationStats.unread > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-[#4ea674] hover:text-[#3d8b5e] font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {notificationStats.critical > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {notificationStats.critical} critical
                      </span>
                    )}
                    {notificationStats.warning > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-3 h-3" />
                        {notificationStats.warning} warning
                      </span>
                    )}
                    {notificationStats.info > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <CheckCircle className="w-3 h-3" />
                        {notificationStats.info} info
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ea674] mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notificationService.formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            notification.severity === 'critical' ? 'bg-red-100 text-red-600' :
                            notification.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.severity}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button className="w-full text-sm text-[#4ea674] hover:text-[#3d8b5e] font-medium transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
            >
              <Avatar
                src={user?.avatar}
                name={user?.name || 'User'}
                size="md"
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ') || 'User'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 ${
                showProfile ? 'rotate-180' : ''
              }`} />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user?.avatar}
                        name={user?.name || 'User'}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email || 'user@example.com'}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {user?.role?.replace('_', ' ') || 'User'} • {user?.facility || 'MamaCare'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleViewProfile}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">View Profile</span>
                    </button>
                    <button 
                      onClick={handleSettings}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;