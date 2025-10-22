import React from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const QuickStockCheck: React.FC = () => {
  const { items, loading, refreshData } = useData();

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
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">Quickly view reorder status for all items</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-white/80 border border-white/20 rounded-xl hover:bg-white transition-colors duration-200 self-start sm:self-auto text-base md:text-lg touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base font-medium">Refresh</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <p className="text-gray-500 text-lg">No items found. Add items to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickStockCheck;
