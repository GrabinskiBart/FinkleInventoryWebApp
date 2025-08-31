import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, CheckCircle, XCircle, Eye, Check, Hash, MessageSquare, User, Calendar, X } from 'lucide-react';
import { StockReport } from '../types';

const StockReports: React.FC = () => {
  const { stockReports, updateStockReportStatus, applyStockReport } = useData();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<StockReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const isAdmin = user?.role === 'admin';
  const userReports = isAdmin ? stockReports : stockReports.filter(report => report.userId === user?.id);
  
  const filteredReports = statusFilter === 'All' 
    ? userReports 
    : userReports.filter(report => report.status === statusFilter);

  const statusOptions = ['All', 'pending', 'reviewed', 'applied'];

  const getStatusIcon = (status: StockReport['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'applied': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: StockReport['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'applied': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReportTypeColor = (type: StockReport['reportType']) => {
    switch (type) {
      case 'stock_update': return 'bg-blue-50 text-blue-700';
      case 'low_stock_alert': return 'bg-yellow-50 text-yellow-700';
      case 'out_of_stock': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: StockReport['status']) => {
    try {
      await updateStockReportStatus(reportId, newStatus);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const handleApplyReport = async (reportId: string) => {
    if (window.confirm('This will update the item\'s current stock level. Continue?')) {
      try {
        await applyStockReport(reportId);
        setSelectedReport(null);
      } catch (error) {
        console.error('Error applying report:', error);
        alert('Error applying report. Please try again.');
      }
    }
  };

  const ReportCard: React.FC<{ report: StockReport }> = ({ report }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{report.itemName}</h3>
          <p className="text-sm text-gray-600 truncate">
            Reported by {report.userName} on {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)} flex-shrink-0 ml-2`}>
          {getStatusIcon(report.status)}
          <span className="hidden sm:inline">{report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Report Type:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
            {report.reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Previous Stock:</span>
          <span className="font-medium flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {report.previousStock}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Reported Stock:</span>
          <span className="font-bold flex items-center gap-1 text-base sm:text-lg">
            <Hash className="w-4 h-4" />
            {report.reportedStock}
          </span>
        </div>
        
        {report.reportedStock !== report.previousStock && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Change:</span>
            <span className={`font-medium flex items-center gap-1 ${
              report.reportedStock > report.previousStock ? 'text-green-600' : 'text-red-600'
            }`}>
              {report.reportedStock > report.previousStock ? '+' : ''}
              {report.reportedStock - report.previousStock}
            </span>
          </div>
        )}
      </div>

      {report.notes && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-gray-700 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{report.notes}</span>
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedReport(report)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">View Details</span>
        </button>
        {isAdmin && report.status === 'pending' && (
          <button
            onClick={() => handleApplyReport(report.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors duration-200 text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Apply</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 md:p-10">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'All Stock Reports' : 'My Stock Reports'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            {isAdmin ? 'Review and manage stock level reports from users' : 'Track your submitted stock reports'}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-3 sm:px-4 py-2 md:py-3 rounded-xl font-medium transition-all duration-200 text-sm md:text-base touch-manipulation ${
                statusFilter === status
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-blue-50 border border-white/20'
              }`}
            >
              {status === 'All' ? 'All Reports' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredReports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
        {filteredReports.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg md:text-xl font-medium">No reports found</p>
            <p className="text-gray-400 text-base md:text-lg">
              {statusFilter === 'All' 
                ? 'No stock reports have been submitted yet'
                : `No reports with ${statusFilter} status`
              }
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto tablet-modal">
            <div className="sticky top-0 bg-white rounded-t-2xl p-4 sm:p-8 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Stock Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm md:text-base text-gray-600">Item</p>
                  <p className="font-medium text-lg md:text-xl truncate">{selectedReport.itemName}</p>
                </div>
                <div>
                  <p className="text-sm md:text-base text-gray-600">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm md:text-base text-gray-600">Reported By</p>
                  <p className="font-medium text-base md:text-lg flex items-center gap-2">
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="truncate">{selectedReport.userName}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm md:text-base text-gray-600">Report Date</p>
                  <p className="font-medium text-base md:text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm md:text-base text-gray-600 mb-2">Report Type</p>
                <span className={`inline-block px-3 py-2 rounded-xl text-sm md:text-base font-medium ${getReportTypeColor(selectedReport.reportType)}`}>
                  {selectedReport.reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h3 className="font-medium text-gray-900 text-base md:text-lg mb-4">Stock Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm md:text-base text-gray-600 mb-1">Previous Stock</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center gap-1">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      {selectedReport.previousStock}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm md:text-base text-gray-600 mb-1">Reported Stock</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center gap-1">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      {selectedReport.reportedStock}
                    </p>
                  </div>
                </div>
                
                {selectedReport.reportedStock !== selectedReport.previousStock && (
                  <div className="mt-4 text-center">
                    <p className="text-sm md:text-base text-gray-600 mb-1">Change</p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${
                      selectedReport.reportedStock > selectedReport.previousStock ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.reportedStock > selectedReport.previousStock ? '+' : ''}
                      {selectedReport.reportedStock - selectedReport.previousStock} units
                    </p>
                  </div>
                )}
              </div>

              {selectedReport.notes && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-medium text-blue-900 text-base md:text-lg mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                    Additional Notes
                  </h3>
                  <p className="text-blue-800 text-base md:text-lg">{selectedReport.notes}</p>
                </div>
              )}

              {isAdmin && (
                <div>
                  <h3 className="font-medium text-gray-900 text-base md:text-lg mb-3">Admin Actions</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {selectedReport.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedReport.id, 'reviewed')}
                          className="flex-1 px-4 py-2 md:py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 font-medium text-base md:text-lg touch-manipulation"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => handleApplyReport(selectedReport.id)}
                          className="flex-1 px-4 py-2 md:py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors duration-200 font-medium text-base md:text-lg touch-manipulation"
                        >
                          Apply & Update Stock
                        </button>
                      </>
                    )}
                    {selectedReport.status === 'reviewed' && (
                      <button
                        onClick={() => handleApplyReport(selectedReport.id)}
                        className="flex-1 px-4 py-2 md:py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors duration-200 font-medium text-base md:text-lg touch-manipulation"
                      >
                        Apply & Update Stock
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockReports;