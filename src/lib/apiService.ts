import { Order, OrderItem, ApiConfig } from '../types';

// Default API configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: import.meta.env.VITE_EXTERNAL_API_URL || 'https://api.example.com',
  apiKey: import.meta.env.VITE_EXTERNAL_API_KEY,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

class ApiService {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Add API key to headers if provided
    if (this.config.apiKey) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-API-Key': this.config.apiKey
      };
    }
  }

  // Update API configuration
  updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.apiKey) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-API-Key': this.config.apiKey
      };
    }
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('API request timed out');
        }
        throw error;
      }
      
      throw new Error('Unknown API error occurred');
    }
  }

  // Send order to external API
  async sendOrder(order: Order): Promise<{ success: boolean; externalOrderId?: string; message?: string }> {
    try {
      const orderPayload = {
        orderId: order.id,
        items: order.items.map(item => ({
          productId: item.itemId,
          productName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0
        })),
        totalAmount: order.totalAmount,
        timestamp: order.createdAt,
        notes: order.notes
      };

      const response = await this.makeRequest<{
        success: boolean;
        orderId?: string;
        message?: string;
      }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      return {
        success: response.success,
        externalOrderId: response.orderId,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to send order:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send order'
      };
    }
  }

  // Get order status from external API
  async getOrderStatus(externalOrderId: string): Promise<{
    status: string;
    message?: string;
    trackingInfo?: any;
  }> {
    try {
      const response = await this.makeRequest<{
        status: string;
        message?: string;
        trackingInfo?: any;
      }>(`/orders/${externalOrderId}/status`);

      return response;
    } catch (error) {
      console.error('Failed to get order status:', error);
      throw error;
    }
  }

  // Send inventory update to external API
  async syncInventory(items: { itemId: string; itemName: string; currentStock: number }[]): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const inventoryPayload = {
        timestamp: new Date().toISOString(),
        items: items.map(item => ({
          productId: item.itemId,
          productName: item.itemName,
          stockLevel: item.currentStock
        }))
      };

      const response = await this.makeRequest<{
        success: boolean;
        message?: string;
      }>('/inventory/sync', {
        method: 'POST',
        body: JSON.stringify(inventoryPayload),
      });

      return response;
    } catch (error) {
      console.error('Failed to sync inventory:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync inventory'
      };
    }
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('/health', { method: 'GET' });
      return { success: true, message: 'API connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'API connection failed'
      };
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export default ApiService;