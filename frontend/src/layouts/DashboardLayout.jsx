import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiFolder, FiUsers, FiClock, FiFileText, FiFile,
  FiSettings, FiMenu, FiX, FiLogOut, FiUser
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for logout confirmation modal

  useEffect(() => {
    // No action needed here; currentUser updates via AuthContext
  }, [currentUser]);

  const handleLogout = () => {
    setShowLogoutModal(true); // Show the confirmation modal
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false); // Close the modal after logout
  };

  const cancelLogout = () => {
    setShowLogoutModal(false); // Close the modal without logging out
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navLinks = [
    { path: '/', name: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: '/projects', name: 'Projects', icon: <FiFolder className="w-5 h-5" /> },
    { path: '/clients', name: 'Clients', icon: <FiUsers className="w-5 h-5" /> },
    { path: '/time', name: 'Time Tracking', icon: <FiClock className="w-5 h-5" /> },
    { path: '/invoices', name: 'Invoices', icon: <FiFileText className="w-5 h-5" /> },
    { path: '/documents', name: 'Documents', icon: <FiFile className="w-5 h-5" /> },
    { path: '/settings', name: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-white border-r lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-primary-600">Freelance Manager</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 -mr-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 overflow-hidden bg-gray-200 rounded-full">
              {currentUser?.profile_image ? (
                <img 
                  src={
                    currentUser.profile_image.startsWith('http') 
                      ? currentUser.profile_image 
                      : `http://localhost:5001${currentUser.profile_image}`
                  } 
                  alt="Profile" 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    console.error('Profile image load error:', e);
                    // Fallback to default icon if image fails
                  }}
                />
              ) : (
                <FiUser className="absolute w-6 h-6 text-gray-400 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{currentUser?.name || currentUser?.username}</h3>
              <p className="text-sm text-gray-500">{currentUser?.specialization || 'Freelancer'}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink 
              key={link.path} 
              to={link.path}
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
              onClick={closeSidebar}
            >
              {link.icon}
              <span className="ml-3">{link.name}</span>
            </NavLink>
          ))}
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-600 transition-colors rounded-md hover:bg-gray-100"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <button 
            onClick={toggleSidebar}
            className="p-1 mr-4 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          
          <div className="flex ml-auto">
            <NavLink 
              to={`/portfolio/${currentUser?.username}`} 
              target="_blank"
              className="flex items-center px-3 py-1 text-sm font-medium border rounded text-primary-600 border-primary-600 hover:bg-primary-50"
            >
              View Portfolio
            </NavLink>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
            <p className="mt-2 text-gray-600">Are you sure you want to log out?</p>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white rounded-md bg-primary-600 hover:bg-primary-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;