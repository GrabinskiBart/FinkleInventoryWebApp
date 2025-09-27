import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Send, Package, Clock, CheckCircle, XCircle, Settings, RefreshCw, Trash2, Eye, X } from 'lucide-react';
import { OrderItem, Order } from '../types';
import { apiService } from '../lib/apiService';

const OrderManagement: React.FC = () => {
  const { items, orders, createOrder, sendOrderToApi, syncInventoryWithApi } = useData();
  const { user } = useAuth();
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    baseUrl: '',
    apiKey: '',
  });
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; message?: string }>({});

  const addItemToOrder = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const existingItem = orderItems.find(oi => oi.itemId === itemId);
    if (existingItem) {
      setOrderItems(prev => prev.map(oi => 
        oi.itemId === itemId 
          ? { ...oi, quantity: oi.quantity + 1, totalPrice: (oi.quantity + 1) * (oi.unitPrice || 0) }
          : oi
      ));
    } else {
      const newOrderItem: OrderItem = {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: 0, // You can add pricing logic here
        totalPrice: 0
      };
      setOrderItems(prev => [...prev, newOrderItem]);
    }
  };

  const updateOrderItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.itemId !== itemId));
    } else {
      setOrderItems(prev => prev.map(oi => 
        oi.itemId === itemId 
          ? { ...oi, quantity, totalPrice: quantity * (oi.unitPrice || 0) }
          : oi
      ));
    }
  };

  const updateOrderItemPrice = (itemId: string, unitPrice: number) => {
    setOrderItems(prev => prev.map(oi => 
      oi.itemId === itemId 
        ? { ...oi, unitPrice, totalPrice: oi.quantity * unitPrice }
        : oi
    ));
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder(orderItems, orderNotes);
      setOrderItems([]);
      setOrderNotes('');
      setIsCreateOrderOpen(false);
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOrder = async (orderId: string) => {
    if (window.confirm('Send this order to the external API?')) {
      setIsSubmitting(true);
      try {
        const result = await sendOrderToApi(orderId);
        if (result.success) {
          alert('Order sent successfully!');
        } else {
          alert(`Failed to send order: ${result.message}`);
        }
      } catch (error) {
        console.error('Error sending order:', error);
        alert('Error sending order. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSyncInventory = async () => {
    if (window.confirm('Sync current inventory with external API?')) {
      setIsSubmitting(true);
      try {
        const result = await syncInventoryWithApi();
        if (result.success) {
          alert('Inventory synced successfully!');
        } else {
          alert(`Failed to sync inventory: ${result.message}`);
        }
      } catch (error) {
        console.error('Error syncing inventory:', error);
        alert('Error syncing inventory. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const testApiConnection = async () => {
    setTestingConnection(true);
    try {
      // Update API service configuration
      apiService.updateConfig({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey
      });

      const result = await apiService.testConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Order #{order.id}</h3>
          <p className="text-sm text-gray-600">
            Created: {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Items: {order.items.length} • Total: ${order.totalAmount.toFixed(2)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex-shrink-0 ml-2`}>
          {getStatusIcon(order.status)}
          <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
        </span>
      </div>

      {order.notes && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-gray-700">"{order.notes}"</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedOrder(order)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">View Details</span>
        </button>
        {order.status === 'pending' && (
          <button
            onClick={() => handleSendOrder(order.id)}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send Order</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">Create and send orders to external APIs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApiConfig(true)}
            className="flex items-center gap-2 px-4 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-sm md:text-base touch-manipulation"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">API Config</span>
          </button>
          <button
            onClick={handleSyncInventory}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 md:py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-200 text-sm md:text-base touch-manipulation disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Sync Inventory</span>
          </button>
          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="flex items-center gap-2 px-4 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm md:text-base touch-manipulation"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create Order</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg md:text-xl font-medium">No orders yet</p>
            <p className="text-gray-400 text-base md:text-lg">Create your first order to get started</p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateOrderOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl p-4 sm:p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Create New Order</h2>
                <button
                  onClick={() => setIsCreateOrderOpen(false)}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Available Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Available Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-600">Stock: {item.currentStock}</p>
                      </div>
                      <button
                        onClick={() => addItemToOrder(item.id)}
                        className="ml-2 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm touch-manipulation"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              {orderItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {orderItems.map(orderItem => (
                      <div key={orderItem.itemId} className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{orderItem.itemName}</h4>
                          <button
                            onClick={() => updateOrderItemQuantity(orderItem.itemId, 0)}
                            className="text-red-600 hover:text-red-800 touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={orderItem.quantity}
                              onChange={(e) => updateOrderItemQuantity(orderItem.itemId, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={orderItem.unitPrice || 0}
                              onChange={(e) => updateOrderItemPrice(orderItem.itemId, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                            <input
                              type="text"
                              value={`$${orderItem.totalPrice?.toFixed(2) || '0.00'}`}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreateOrderOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmitting || orderItems.length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium touch-manipulation disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Configuration Modal */}
      {showApiConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md md:max-w-lg">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
                <button
                  onClick={() => setShowApiConfig(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
                <input
                  type="url"
                  value={apiConfig.baseUrl}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key (Optional)</label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Your API key"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {connectionStatus.message && (
                <div className={`p-3 rounded-xl ${
                  connectionStatus.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {connectionStatus.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={testApiConnection}
                  disabled={testingConnection || !apiConfig.baseUrl}
                  className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 font-medium touch-manipulation disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={() => setShowApiConfig(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium touch-manipulation"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl p-4 sm:p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitPrice?.toFixed(2) || '0.00'}</p>
                      </div>
                      <p className="font-bold">${item.totalPrice?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.externalOrderId && (
                <div>
                  <p className="text-sm text-gray-600">External Order ID</p>
                  <p className="font-medium">{selectedOrder.externalOrderId}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Updated</p>
                  <p className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;