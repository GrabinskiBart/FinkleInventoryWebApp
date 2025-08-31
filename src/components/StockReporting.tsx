import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Minus, AlertTriangle, Package, Hash, MessageSquare, Send, ChefHat, Filter, RotateCcw, CheckCircle } from 'lucide-react';

const StockReporting: React.FC = () => {
  const { items, addStockReport } = useData();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [reportingItems, setReportingItems] = useState<{[key: string]: { count: number; notes: string }}>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories = ['All', 'Proteins', 'Produce', 'Dairy', 'Pantry', 'Beverages', 'Frozen', 'Spices & Seasonings', 'Misc'];
  
  const getFilteredAndSortedItems = () => {
    const filtered = items.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort by urgency (out of stock first, then low stock, then by name)
    return filtered.sort((a, b) => {
      const aStatus = getStockStatus(a);
      const bStatus = getStockStatus(b);
      if (aStatus.priority !== bStatus.priority) {
        return bStatus.priority - aStatus.priority;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const getPaginatedItems = () => {
    const sortedItems = getFilteredAndSortedItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: sortedItems.slice(startIndex, endIndex),
      totalItems: sortedItems.length,
      totalPages: Math.ceil(sortedItems.length / itemsPerPage)
    };
  };

  // Reset to first page when search or category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Proteins': return '🥩';
      case 'Produce': return '🥬';
      case 'Dairy': return '🥛';
      case 'Pantry': return '🏺';
      case 'Beverages': return '☕';
      case 'Frozen': return '🧊';
      case 'Spices & Seasonings': return '🌶️';
      case 'Misc': return '📦';
      default: return '📦';
    }
  };

  const getStockStatus = (item: any) => {
    if (item.currentStock === 0) {
      return { color: 'text-red-600', bg: 'bg-red-100 border-red-200', label: 'OUT', priority: 3 };
    }
    if (item.needsReorder) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200', label: 'LOW', priority: 2 };
    }
    return { color: 'text-green-600', bg: 'bg-green-100 border-green-200', label: 'OK', priority: 1 };
  };

  const updateItemCount = (itemId: string, change: number) => {
    setReportingItems(prev => {
      const current = prev[itemId] || { count: items.find(i => i.id === itemId)?.currentStock || 0, notes: '' };
      const newCount = Math.max(0, current.count + change);
      return {
        ...prev,
        [itemId]: { ...current, count: newCount }
      };
    });
  };

  const setItemCount = (itemId: string, count: number) => {
    setReportingItems(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId] || { notes: '' }, 
        count: Math.max(0, count) 
      }
    }));
  };

  const setItemNotes = (itemId: string, notes: string) => {
    setReportingItems(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId] || { count: items.find(i => i.id === itemId)?.currentStock || 0 }, 
        notes 
      }
    }));
  };

  const getItemReportData = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return reportingItems[itemId] || { 
      count: item?.currentStock || 0, 
      notes: '' 
    };
  };

  const hasChanges = () => {
    return Object.keys(reportingItems).some(itemId => {
      const item = items.find(i => i.id === itemId);
      const reportData = reportingItems[itemId];
      return reportData && (reportData.count !== item?.currentStock || reportData.notes.trim());
    });
  };

  const getChangedItems = () => {
    return Object.keys(reportingItems).filter(itemId => {
      const item = items.find(i => i.id === itemId);
      const reportData = reportingItems[itemId];
      return reportData && (reportData.count !== item?.currentStock || reportData.notes.trim());
    }).map(itemId => {
      const item = items.find(i => i.id === itemId)!;
      const reportData = reportingItems[itemId];
      return { item, reportData };
    });
  };

  const submitReports = async () => {
    if (!user) return;

    const changedItems = getChangedItems();
    const isAdmin = user.role === 'admin';
    
    setIsSubmitting(true);
    setSubmitSuccess(false);
    
    try {
      for (const { item, reportData } of changedItems) {
        let reportType: 'stock_update' | 'low_stock_alert' | 'out_of_stock' = 'stock_update';
        
        if (reportData.count === 0) {
          reportType = 'out_of_stock';
        } else if (reportData.count <= item.minStockLevel) {
          reportType = 'low_stock_alert';
        }

        await addStockReport({
          userId: user.id,
          userName: user.name,
          itemId: item.id,
          itemName: item.name,
          reportedStock: reportData.count,
          previousStock: item.currentStock,
          reportType,
          notes: reportData.notes.trim() || undefined,
          status: isAdmin ? 'applied' : 'pending'
        });
      }

      setSubmitSuccess(true);
      setShowReportModal(false);
      
      // Show success message with option to continue or reset
      const successMessage = isAdmin 
        ? `Successfully applied ${changedItems.length} stock update${changedItems.length !== 1 ? 's' : ''}!\n\nStock levels have been automatically updated.`
        : `Successfully submitted ${changedItems.length} stock report${changedItems.length !== 1 ? 's' : ''}!\n\nReports are pending admin review.`;
        
      const continueReporting = window.confirm(
        successMessage + '\n\n' +
        `Click OK to continue with current values, or Cancel to reset all counts.`
      );
      
      if (!continueReporting) {
        setReportingItems({});
      }
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting reports:', error);
      alert('Error submitting reports. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAllCounts = () => {
    if (window.confirm('Reset all counts to current stock levels?')) {
      setReportingItems({});
    }
  };

  // Ultra-Compact Mobile Item Card (16x16 grid)
  const MobileItemCard: React.FC<{ item: any }> = ({ item }) => {
    const stockStatus = getStockStatus(item);
    const reportData = getItemReportData(item.id);
    const hasChanged = reportData.count !== item.currentStock || reportData.notes.trim();

    return (
      <div className={`bg-white/95 backdrop-blur-sm rounded-lg p-2 border transition-all duration-200 hover:shadow-md ${
        hasChanged ? 'border-blue-400 bg-blue-50/70' : 'border-gray-200'
      }`}>
        {/* Ultra-compact header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-sm flex-shrink-0">{getCategoryIcon(item.category)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-xs leading-tight truncate">{item.name}</h3>
            </div>
          </div>
          <div className={`px-1 py-0.5 rounded text-xs font-bold ${stockStatus.bg} ${stockStatus.color} flex-shrink-0 ml-1`}>
            {stockStatus.label}
          </div>
        </div>

        {/* Current stock - ultra compact */}
        <div className="flex justify-between items-center text-xs mb-1 px-1">
          <span className="text-gray-600">Now:</span>
          <span className="font-bold">{item.currentStock}</span>
        </div>
        
        {/* Ultra-compact counter */}
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={() => updateItemCount(item.id, -1)}
            className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 active:bg-red-300 transition-colors duration-200 touch-manipulation flex-shrink-0"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          
          <input
            type="number"
            min="0"
            value={reportData.count}
            onChange={(e) => setItemCount(item.id, parseInt(e.target.value) || 0)}
            className="flex-1 text-center text-xs font-bold bg-white border border-gray-300 rounded py-0.5 px-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent min-w-0"
          />
          
          <button
            onClick={() => updateItemCount(item.id, 1)}
            className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 active:bg-green-300 transition-colors duration-200 touch-manipulation flex-shrink-0"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Ultra-compact quick actions */}
        <div className="grid grid-cols-3 gap-0.5 mb-1">
          <button
            onClick={() => setItemCount(item.id, 0)}
            className="px-1 py-0.5 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 active:bg-red-200 transition-colors duration-200 touch-manipulation"
          >
            0
          </button>
          <button
            onClick={() => setItemCount(item.id, item.minStockLevel)}
            className="px-1 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs hover:bg-yellow-100 active:bg-yellow-200 transition-colors duration-200 touch-manipulation"
          >
            Min
          </button>
          <button
            onClick={() => setItemCount(item.id, item.currentStock)}
            className="px-1 py-0.5 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 touch-manipulation"
          >
            ↺
          </button>
        </div>

        {/* Ultra-compact notes */}
        <input
          type="text"
          value={reportData.notes}
          onChange={(e) => setItemNotes(item.id, e.target.value)}
          placeholder="Notes..."
          className="w-full text-xs border border-gray-300 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent mb-1"
        />

        {/* Ultra-compact change indicator */}
        {hasChanged && (
          <div className="text-xs text-blue-600 font-medium text-center py-0.5 bg-blue-50 rounded border border-blue-200">
            {reportData.count !== item.currentStock && (
              <span>
                {reportData.count > item.currentStock ? '+' : ''}
                {reportData.count - item.currentStock}
              </span>
            )}
            {reportData.notes.trim() && <span className="ml-1">📝</span>}
          </div>
        )}
      </div>
    );
  };

  // Desktop/Tablet Detailed Item Card (for screens >= 640px)
  const DesktopItemCard: React.FC<{ item: any }> = ({ item }) => {
    const stockStatus = getStockStatus(item);
    const reportData = getItemReportData(item.id);
    const hasChanged = reportData.count !== item.currentStock || reportData.notes.trim();

    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border-2 transition-all duration-200 hover:shadow-lg ${
        hasChanged ? 'border-blue-300 bg-blue-50/50' : 'border-white/30'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0">{getCategoryIcon(item.category)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{item.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
              <p className="text-gray-500 text-xs mt-1">{item.category}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color} flex-shrink-0 ml-2`}>
            <AlertTriangle className="w-3 h-3" />
            {stockStatus.label}
          </span>
        </div>

        {/* Stock Information */}
        <div className="space-y-3 mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Stock:</span>
            <span className="text-base sm:text-lg font-bold text-gray-900">{item.currentStock} units</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Min Level:</span>
            <span className="text-sm font-medium text-yellow-700">{item.minStockLevel} units</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Max Level:</span>
            <span className="text-sm font-medium text-green-700">{item.maxStockLevel} units</span>
          </div>
          
          {/* Stock Level Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  item.currentStock === 0 ? 'bg-red-500' :
                  item.needsReorder ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (item.currentStock / item.maxStockLevel) * 100)}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{item.maxStockLevel}</span>
            </div>
          </div>
        </div>
        
        {/* Stock Counter */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Update Stock Count</p>
          
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => updateItemCount(item.id, -1)}
              className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors duration-200 touch-manipulation flex-shrink-0"
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <input
                type="number"
                min="0"
                value={reportData.count}
                onChange={(e) => setItemCount(item.id, parseInt(e.target.value) || 0)}
                className="w-full text-center text-xl font-bold bg-white border border-gray-300 rounded-xl py-3 px-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">New Count</p>
            </div>
            
            <button
              onClick={() => updateItemCount(item.id, 1)}
              className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-xl hover:bg-green-200 active:bg-green-300 transition-colors duration-200 touch-manipulation flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Set Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setItemCount(item.id, 0)}
              className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-colors duration-200 touch-manipulation"
            >
              Empty (0)
            </button>
            <button
              onClick={() => setItemCount(item.id, item.minStockLevel)}
              className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-100 active:bg-yellow-200 transition-colors duration-200 touch-manipulation"
            >
              Min ({item.minStockLevel})
            </button>
            <button
              onClick={() => setItemCount(item.id, item.currentStock)}
              className="px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 touch-manipulation"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
          <textarea
            value={reportData.notes}
            onChange={(e) => setItemNotes(item.id, e.target.value)}
            placeholder="Add notes about quality, expiration, location, etc..."
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Change Summary */}
        {hasChanged && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Changes Summary
            </h4>
            <div className="space-y-2 text-sm">
              {reportData.count !== item.currentStock && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Stock Change:</span>
                  <span className={`font-bold ${
                    reportData.count > item.currentStock ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {reportData.count > item.currentStock ? '+' : ''}
                    {reportData.count - item.currentStock} units
                  </span>
                </div>
              )}
              {reportData.notes.trim() && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 text-xs italic">"{reportData.notes}"</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const paginationData = getPaginatedItems();
  const { items: paginatedItems, totalItems, totalPages } = paginationData;

  const PaginationControls: React.FC = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, start + maxVisiblePages - 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            First
          </button>
          
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  currentPage === pageNum
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
          </button>
          
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-600" />
                Inventory Stock Check
              </h1>
              <p className="text-gray-600 text-sm md:text-base hidden sm:block">Quick count and report current stock levels</p>
              {totalItems > 0 && (
                <p className="text-gray-500 text-xs sm:text-sm md:text-base">
                  Page {currentPage} of {totalPages} • {totalItems} total items
                </p>
              )}
            </div>
            
            {hasChanges() && (
              <div className="flex gap-2">
                <button
                  onClick={resetAllCounts}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 text-sm md:text-base touch-manipulation"
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Reset All</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 md:py-3 rounded-xl font-medium transition-all duration-200 transform text-sm md:text-base touch-manipulation ${
                    submitSuccess 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105' 
                      : isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Submitted!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                      Submit ({getChangedItems().length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-20">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name, description, or category..."
              className="w-full pl-10 pr-4 py-3 md:py-4 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base md:text-lg"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Found {totalItems} item{totalItems !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 text-sm touch-manipulation flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-orange-50 border border-white/20'
                }`}
              >
                {category !== 'All' && <span>{getCategoryIcon(category)}</span>}
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Items Grid */}
        <div className="sm:hidden">
          {/* Mobile: 4x4 grid with ultra-compact cards */}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {paginatedItems.map(item => (
              <MobileItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          {/* Desktop/Tablet: Multi-column grid with detailed cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {paginatedItems.map(item => (
              <DesktopItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {totalItems === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery ? 'No items found' : 'No items in this category'}
            </p>
            <p className="text-gray-400">
              {searchQuery ? 'Try adjusting your search terms' : 'Select a different category to view items'}
            </p>
          </div>
        )}

        <PaginationControls />

        {/* Quick Tips */}
        <div className="mt-6 sm:mt-8 bg-orange-50 border border-orange-200 rounded-2xl p-4 md:p-6">
          <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            Quick Tips
          </h3>
          <ul className="space-y-1 text-xs md:text-sm text-orange-800">
            <li>• Use +/- buttons or type directly to update counts</li>
            <li>• "0" = empty, "Min" = minimum level, "↺" = reset to current</li>
            <li>• Add notes for context (expiration dates, quality issues, etc.)</li>
            <li>• Items are sorted by urgency (out of stock first)</li>
            <li>• Your counts stay visible until you reset or navigate away</li>
            <li>• Use pagination controls to navigate through all items</li>
          </ul>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto tablet-modal">
            <div className="sticky top-0 bg-white rounded-t-2xl p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Confirm Stock Reports</h2>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-3 mb-6">
                {getChangedItems().map(({ item, reportData }) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm md:text-base truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">{item.category}</span>
                    </div>
                    <div className="flex justify-between text-sm md:text-base">
                      <span>Current: {item.currentStock}</span>
                      <span className="font-bold">Reporting: {reportData.count}</span>
                    </div>
                    {reportData.notes.trim() && (
                      <p className="text-xs md:text-sm text-gray-600 mt-1 italic">"{reportData.notes}"</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 md:py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium text-base md:text-lg touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReports}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-3 md:py-4 rounded-xl transition-all duration-200 font-medium text-base md:text-lg touch-manipulation ${
                    isSubmitting 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit All'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockReporting;