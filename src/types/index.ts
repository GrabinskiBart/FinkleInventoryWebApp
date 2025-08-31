export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  needsReorder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockReport {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  reportedStock: number;
  previousStock: number;
  reportType: 'stock_update' | 'low_stock_alert' | 'out_of_stock';
  notes?: string;
  status: 'pending' | 'reviewed' | 'applied';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}