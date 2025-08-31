import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Package, AlertTriangle, TrendingUp, FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { items, stockReports, loading, refreshData } = useData();

  const userReports = stockReports.filter(report => report.userId === user?.id);
  const pendingReports = stockReports.filter(report => report.status === 'pending');
  const reorderItems = items.filter(item => item.needsReorder);
  const outOfStockItems = items.filter(item => item.currentStock === 0);
  const lowStockItems = items.filter(item => item.currentStock > 0 && item.currentStock <= item.minStockLevel);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    description?: string;
  }> = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-sm font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : value}</p>
          {description && <p className="text-gray-500 text-xs mt-1 truncate">{description}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const RecentReportCard: React.FC<{ report: any }> = ({ report }) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      applied: 'bg-green-100 text-green-800 border-green-200'
    };

    const typeColors = {
      stock_update: 'bg-blue-50 text-blue-700',
      low_stock_alert: 'bg-yellow-50 text-yellow-700',
      out_of_stock: 'bg-red-50 text-red-700'
    };

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <p className="font-medium text-gray-900 text-sm sm:text-base truncate flex-1 mr-2">{report.itemName}</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[report.status]} flex-shrink-0`}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reported:</span>
            <span className="font-medium">{report.reportedStock} units</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Previous:</span>
            <span className="font-medium">{report.previousStock} units</span>
          </div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeColors[report.reportType]}`}>
            {report.reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 truncate flex-1 mr-2">
            {new Date(report.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-gray-600 truncate">by {report.userName}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="p-4 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">Monitor stock levels and manage reorder alerts</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-white/80 border border-white/20 rounded-xl hover:bg-white transition-colors duration-200 self-start sm:self-auto text-base md:text-lg touch-manipulation"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Items"
            value={items.length}
            icon={Package}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            description="Items being tracked"
          />
          <StatCard
            title="Need Reorder"
            value={reorderItems.length}
            icon={AlertTriangle}
            color="bg-gradient-to-r from-red-500 to-red-600"
            description="Below minimum level"
          />
          <StatCard
            title="Pending Reports"
            value={stockReports.filter(report => report.status === 'pending').length}
            icon={Clock}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
            description="Awaiting review"
          />
          <StatCard
            title="Total Reports"
            value={stockReports.length}
            icon={FileText}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            description="All time reports"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">Recent Stock Reports</h2>
            <div className="space-y-4">
              {stockReports.slice(0, 5).map(report => (
                <RecentReportCard key={report.id} report={report} />
              ))}
              {stockReports.length === 0 && (
                <p className="text-gray-500 text-center py-8">No reports yet</p>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">Stock Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 sm:p-4 bg-red-50 rounded-xl">
                <span className="text-red-700 font-medium text-sm sm:text-base md:text-lg">Out of Stock</span>
                <span className="text-red-900 font-bold text-lg md:text-xl">{outOfStockItems.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <span className="text-yellow-700 font-medium text-sm sm:text-base md:text-lg">Low Stock</span>
                <span className="text-yellow-900 font-bold text-lg md:text-xl">{lowStockItems.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-green-50 rounded-xl">
                <span className="text-green-700 font-medium text-sm sm:text-base md:text-lg">Well Stocked</span>
                <span className="text-green-900 font-bold text-lg md:text-xl">{items.length - reorderItems.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                <span className="text-blue-700 font-medium text-sm sm:text-base md:text-lg">Applied Reports</span>
                <span className="text-blue-900 font-bold text-lg md:text-xl">{stockReports.filter(r => r.status === 'applied').length}</span>
              </div>
            </div>
          </div>
        </div>

        {reorderItems.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              Reorder Alert - {reorderItems.length} Item{reorderItems.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reorderItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 border border-red-200">
                  <h3 className="font-medium text-gray-900 text-base md:text-lg truncate">{item.name}</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-2 truncate">{item.category}</p>
                  <div className="space-y-1">
                    <p className="text-red-800 font-bold text-sm md:text-base">Current: {item.currentStock} units</p>
                    <p className="text-xs md:text-sm text-gray-600">Min Level: {item.minStockLevel} units</p>
                    <p className="text-xs md:text-sm text-gray-600">Max Level: {item.maxStockLevel} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">Help keep track of stock levels by reporting what you see</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-white/80 border border-white/20 rounded-xl hover:bg-white transition-colors duration-200 self-start sm:self-auto text-base md:text-lg touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base font-medium">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="My Reports"
          value={userReports.length}
          icon={FileText}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          description="Total reports submitted"
        />
        <StatCard
          title="Pending Review"
          value={userReports.filter(r => r.status === 'pending').length}
          icon={Clock}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          description="Awaiting admin review"
        />
        <StatCard
          title="Applied Reports"
          value={userReports.filter(r => r.status === 'applied').length}
          icon={CheckCircle}
          color="bg-gradient-to-r from-green-500 to-green-600"
          description="Successfully processed"
        />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">Your Recent Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {userReports.slice(0, 6).map(report => (
            <RecentReportCard key={report.id} report={report} />
          ))}
          {userReports.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg md:text-xl font-medium">No reports yet</p>
              <p className="text-gray-400 text-base md:text-lg">Start reporting stock levels to help maintain inventory</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;