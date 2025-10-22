import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, RefreshCw, RotateCcw } from 'lucide-react';

const QuickStockCheck: React.FC = () => {
  const { items, loading, refreshData, updateItem } = useData();
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(items.map(item => item.category)));

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'needs-reorder' && item.needsReorder) ||
      (statusFilter === 'stock-ok' && !item.needsReorder);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleQuickUpdate = async (itemId: string, minLevel: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateItem(itemId, { currentStock: minLevel });
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Quick Stock Check</h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">Quickly view and update reorder status for all items</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-white/80 border border-white/20 rounded-xl hover:bg-white transition-colors duration-200 self-start sm:self-auto text-base md:text-lg touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base font-medium">Refresh</span>
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 mb-6">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-base md:text-lg touch-manipulation"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-200 text-sm md:text-base touch-manipulation ${
                categoryFilter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-200 text-sm md:text-base touch-manipulation ${
                  categoryFilter === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-200 text-sm md:text-base touch-manipulation ${
                statusFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('needs-reorder')}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-200 text-sm md:text-base touch-manipulation ${
                statusFilter === 'needs-reorder'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Needs Reorder
            </button>
            <button
              onClick={() => setStatusFilter('stock-ok')}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-200 text-sm md:text-base touch-manipulation ${
                statusFilter === 'stock-ok'
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Stock OK
            </button>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <p className="text-gray-500 text-lg">
            {items.length === 0 ? 'No items found. Add items to get started.' : 'No items match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-4 truncate">{item.category}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-semibold">{item.currentStock} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min Level:</span>
                  <span className="font-semibold">{item.minStockLevel} units</span>
                </div>
              </div>

              <div className="space-y-2">
                {item.needsReorder ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium text-base cursor-default"
                  >
                    <XCircle className="w-5 h-5" />
                    Needs Reorder
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-medium text-base cursor-default"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Stock OK
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleQuickUpdate(item.id, item.minStockLevel)}
                    disabled={updatingItems.has(item.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {updatingItems.has(item.id) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Set to Min Level
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickStockCheck;
