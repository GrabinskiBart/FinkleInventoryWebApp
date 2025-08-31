import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Package, Hash, Tag, AlertTriangle, ChefHat, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Item } from '../types';

const ItemManagement: React.FC = () => {
  const { items, addItem, updateItem, deleteItem } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    currentStock: '',
    minStockLevel: '',
    maxStockLevel: ''
  });

  const categories = ['Proteins', 'Produce', 'Dairy', 'Pantry', 'Beverages', 'Frozen', 'Spices & Seasonings', 'Misc'];
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
    { value: 'currentStock', label: 'Current Stock' },
    { value: 'needsReorder', label: 'Reorder Status' },
    { value: 'updatedAt', label: 'Last Updated' }
  ];

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

  const getSortedItems = () => {
    // First filter by search query
    const searchFilteredItems = items.filter(item => {
      if (searchQuery === '') return true;
      const query = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) ||
             item.description.toLowerCase().includes(query) ||
             item.category.toLowerCase().includes(query);
    });

    // Then sort the filtered items
    const sortedItems = [...searchFilteredItems].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Item];
      let bValue: any = b[sortBy as keyof Item];

      // Handle special sorting cases
      if (sortBy === 'needsReorder') {
        // Sort by reorder status (needs reorder first)
        aValue = a.needsReorder ? 1 : 0;
        bValue = b.needsReorder ? 1 : 0;
      } else if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string vs number comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedItems;
  };

  const getPaginatedItems = () => {
    const sortedItems = getSortedItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: sortedItems.slice(startIndex, endIndex),
      totalItems: sortedItems.length,
      totalPages: Math.ceil(sortedItems.length / itemsPerPage)
    };
  };

  // Reset to first page when search or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with appropriate default order
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'currentStock' || newSortBy === 'updatedAt' ? 'asc' : 'asc');
    }
  };

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        category: item.category,
        currentStock: item.currentStock.toString(),
        minStockLevel: item.minStockLevel.toString(),
        maxStockLevel: item.maxStockLevel.toString()
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: categories[0],
        currentStock: '',
        minStockLevel: '',
        maxStockLevel: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      currentStock: '',
      minStockLevel: '',
      maxStockLevel: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentStock = parseInt(formData.currentStock);
    const minStockLevel = parseInt(formData.minStockLevel);
    const maxStockLevel = parseInt(formData.maxStockLevel);
    
    if (isNaN(currentStock) || isNaN(minStockLevel) || isNaN(maxStockLevel) || 
        currentStock < 0 || minStockLevel < 0 || maxStockLevel < 0 || 
        minStockLevel >= maxStockLevel) {
      alert('Please enter valid stock levels. Min level must be less than max level.');
      return;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          currentStock,
          minStockLevel,
          maxStockLevel
        });
      } else {
        await addItem({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          currentStock,
          minStockLevel,
          maxStockLevel
        });
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const getStockStatus = (item: Item) => {
    if (item.currentStock === 0) {
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock', icon: AlertTriangle };
    }
    if (item.needsReorder) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Needs Reorder', icon: AlertTriangle };
    }
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Well Stocked', icon: Package };
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const ItemCard: React.FC<{ item: Item }> = ({ item }) => {
    const stockStatus = getStockStatus(item);
    const StatusIcon = stockStatus.icon;
    
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-2xl flex-shrink-0">{getCategoryIcon(item.category)}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{item.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" />
                <span className="truncate">{item.category}</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span className="truncate">{stockStatus.label}</span>
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 ml-2 flex-shrink-0">
            <p>Updated</p>
            <p>{new Date(item.updatedAt).toLocaleDateString()}</p>
          </div>
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
        
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal(item)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => handleDelete(item.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
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

  const sortedItems = getSortedItems();

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-orange-600" />
            Finkle Inventory System
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            {user?.role === 'admin' 
              ? 'Manage inventory items and set reorder thresholds' 
              : 'Add new inventory items and update existing ones'
            }
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 self-start sm:self-auto text-base md:text-lg touch-manipulation"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-sm sm:text-base md:text-lg">Add New Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8">
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
            Found {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>
      {/* Sorting Controls */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm md:text-base font-medium text-gray-700 flex items-center mr-2">Sort by:</span>
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center gap-1 px-3 py-2 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all duration-200 touch-manipulation ${
                sortBy === option.value
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-orange-50 border border-white/20'
              }`}
            >
              <span>{option.label}</span>
              <span className="ml-1">{getSortIcon(option.value)}</span>
            </button>
          ))}
        </div>
        
        {/* Sort Summary */}
        <div className="mt-3 text-sm md:text-base text-gray-600">
          Showing {totalItems} items sorted by{' '}
          <span className="font-medium">
            {sortOptions.find(opt => opt.value === sortBy)?.label}
          </span>
          {' '}({sortOrder === 'asc' ? 'ascending' : 'descending'})
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
              Filtered by: "{searchQuery}"
            </span>
          )}
          {sortBy === 'currentStock' && sortOrder === 'asc' && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              Lowest stock first
            </span>
          )}
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {paginatedItems.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No items yet</p>
            <p className="text-gray-400">Add your first inventory item to get started</p>
          </div>
        )}
        {items.length > 0 && totalItems === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No items found</p>
            <p className="text-gray-400">Try adjusting your search terms or filters</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors duration-200"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      <PaginationControls />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto tablet-modal">
            <div className="sticky top-0 bg-white rounded-t-2xl p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-base md:text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 tablet-form-grid">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                    className="w-full px-3 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Min Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: e.target.value }))}
                    className="w-full px-3 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Max Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStockLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStockLevel: e.target.value }))}
                    className="w-full px-3 py-3 md:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base md:text-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 md:py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium text-base md:text-lg touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium text-base md:text-lg touch-manipulation"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement;