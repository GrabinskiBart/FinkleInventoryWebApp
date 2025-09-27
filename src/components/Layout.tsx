import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Package, AlertTriangle, Settings, User, FileText, ChefHat, Menu, X, Send } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminPages = [
    { id: 'dashboard', label: 'Dashboard', icon: Package },
    { id: 'items', label: 'Manage Inventory', icon: Settings },
    { id: 'report', label: 'Stock Check', icon: AlertTriangle },
    { id: 'reports', label: 'Stock Reports', icon: FileText },
    { id: 'orders', label: 'Order Management', icon: Send }
  ];

  const userPages = [
    { id: 'dashboard', label: 'Dashboard', icon: Package },
    { id: 'items', label: 'Manage Inventory', icon: Settings },
    { id: 'report', label: 'Stock Check', icon: AlertTriangle },
    { id: 'reports', label: 'My Reports', icon: FileText },
    { id: 'orders', label: 'Order Management', icon: Send }
  ];

  const pages = user?.role === 'admin' ? adminPages : userPages;

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="flex">
        {/* Mobile Header */}
        <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-white/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Finkle Inventory</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
            >
              {sidebarOpen ? <X className="w-6 h-6 md:w-7 md:h-7" /> : <Menu className="w-6 h-6 md:w-7 md:h-7" />}
            </button>
          </div>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="xl:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed xl:static inset-y-0 left-0 z-50 w-64 md:w-72 bg-white/90 backdrop-blur-sm border-r border-white/20 flex flex-col
          transform transition-transform duration-300 ease-in-out xl:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}>
          <div className="p-6 pt-20 xl:pt-6 flex-1 flex flex-col">
            {/* Desktop Header */}
            <div className="hidden xl:flex items-center gap-3 mb-8">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finkle Inventory</h1>
                <p className="text-sm md:text-base text-gray-600 capitalize">{user?.role} Panel</p>
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="xl:hidden mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-base md:text-lg">{user?.name}</p>
                    <p className="text-sm md:text-base text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-2 flex-1">
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.id}
                    onClick={() => handlePageChange(page.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 md:py-4 rounded-xl text-left transition-all duration-200 touch-manipulation ${
                      currentPage === page.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-medium text-base md:text-lg">{page.label}</span>
                  </button>
                );
              })}
            </nav>


            {/* Desktop User Info & Logout */}
            <div className="hidden xl:block mt-auto pt-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-base md:text-lg">{user?.name}</p>
                    <p className="text-sm md:text-base text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 md:py-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-base md:text-lg">Sign Out</span>
              </button>
            </div>

            {/* Mobile Logout */}
            <div className="xl:hidden mt-auto pt-6">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 md:py-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-base md:text-lg">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-16 xl:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;