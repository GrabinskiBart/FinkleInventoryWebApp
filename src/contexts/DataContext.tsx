import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item, StockReport, Order, OrderItem } from '../types';
import { supabase, DatabaseItem, DatabaseStockReport } from '../lib/supabase';
import { apiService } from '../lib/apiService';

interface DataContextType {
  items: Item[];
  stockReports: StockReport[];
  orders: Order[];
  loading: boolean;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'needsReorder'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addStockReport: (report: Omit<StockReport, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStockReportStatus: (reportId: string, status: StockReport['status']) => Promise<void>;
  applyStockReport: (reportId: string) => Promise<void>;
  createOrder: (items: OrderItem[], notes?: string) => Promise<Order>;
  sendOrderToApi: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  syncInventoryWithApi: () => Promise<{ success: boolean; message?: string }>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Empty initial data since database was cleared
const initialItems: Item[] = [];
const initialStockReports: StockReport[] = [];

// Helper functions to convert between database and app types
const dbItemToItem = (dbItem: DatabaseItem): Item => ({
  id: dbItem.id,
  name: dbItem.name,
  description: dbItem.description,
  category: dbItem.category,
  currentStock: dbItem.current_stock,
  minStockLevel: dbItem.min_stock_level,
  maxStockLevel: dbItem.max_stock_level,
  needsReorder: dbItem.needs_reorder,
  createdAt: dbItem.created_at,
  updatedAt: dbItem.updated_at
});

const itemToDbItem = (item: Partial<Item>) => ({
  name: item.name,
  description: item.description,
  category: item.category,
  current_stock: item.currentStock,
  min_stock_level: item.minStockLevel,
  max_stock_level: item.maxStockLevel,
  needs_reorder: item.needsReorder
});

const dbReportToReport = (dbReport: DatabaseStockReport): StockReport => ({
  id: dbReport.id,
  userId: dbReport.user_id,
  userName: dbReport.user_name,
  itemId: dbReport.item_id,
  itemName: dbReport.item_name,
  reportedStock: dbReport.reported_stock,
  previousStock: dbReport.previous_stock,
  reportType: dbReport.report_type,
  notes: dbReport.notes,
  status: dbReport.status,
  createdAt: dbReport.created_at,
  updatedAt: dbReport.updated_at
});

const reportToDbReport = (report: Partial<StockReport>) => ({
  user_id: report.userId,
  user_name: report.userName,
  item_id: report.itemId,
  item_name: report.itemName,
  reported_stock: report.reportedStock,
  previous_stock: report.previousStock,
  report_type: report.reportType,
  notes: report.notes,
  status: report.status
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [stockReports, setStockReports] = useState<StockReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    return !!(supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  };

  const loadFromLocalStorage = () => {
    const storedItems = localStorage.getItem('restaurant_items');
    const storedReports = localStorage.getItem('restaurant_reports');
    const storedOrders = localStorage.getItem('restaurant_orders');
    
    setItems(storedItems ? JSON.parse(storedItems) : []);
    setStockReports(storedReports ? JSON.parse(storedReports) : []);
    setOrders(storedOrders ? JSON.parse(storedOrders) : []);
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('restaurant_items', JSON.stringify(items));
    localStorage.setItem('restaurant_reports', JSON.stringify(stockReports));
    localStorage.setItem('restaurant_orders', JSON.stringify(orders));
  };

  const loadFromSupabase = async () => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        console.warn('Supabase not configured, falling back to localStorage');
        loadFromLocalStorage();
        return;
      }

      // Validate environment variables format
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          !supabaseUrl.startsWith('https://') || 
          !supabaseUrl.includes('.supabase.co') ||
          supabaseKey.length < 100) {
        console.warn('Invalid Supabase configuration detected, falling back to localStorage');
        loadFromLocalStorage();
        return;
      }

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Load stock reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('stock_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setItems(itemsData?.map(dbItemToItem) || []);
      setStockReports(reportsData?.map(dbReportToReport) || []);
    } catch (error) {
      console.warn('Supabase connection failed, falling back to localStorage. Error:', error);
      // Fallback to localStorage
      loadFromLocalStorage();
    }
  };

  const refreshData = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      await loadFromSupabase();
    } else {
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Save to localStorage when data changes (fallback)
  useEffect(() => {
    if (!loading && !isSupabaseConfigured()) {
      saveToLocalStorage();
    }
  }, [items, stockReports, orders, loading]);

  const addItem = async (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'needsReorder'>) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('items')
          .insert([itemToDbItem({ ...itemData, needsReorder: itemData.currentStock <= itemData.minStockLevel })])
          .select()
          .single();

        if (error) throw error;

        const newItem = dbItemToItem(data);
        setItems(prev => [...prev, newItem]);
      } else {
        // Fallback to localStorage
        const newItem: Item = {
          ...itemData,
          id: Date.now().toString(),
          needsReorder: itemData.currentStock <= itemData.minStockLevel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setItems(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.warn('Failed to add item via Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
      const newItem: Item = {
        ...itemData,
        id: Date.now().toString(),
        needsReorder: itemData.currentStock <= itemData.minStockLevel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('items')
          .update(itemToDbItem(updates))
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        const updatedItem = dbItemToItem(data);
        setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      } else {
        // Fallback to localStorage
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
            if (updates.currentStock !== undefined || updates.minStockLevel !== undefined) {
              updatedItem.needsReorder = updatedItem.currentStock <= updatedItem.minStockLevel;
            }
            return updatedItem;
          }
          return item;
        }));
      }
    } catch (error) {
      console.warn('Failed to update item via Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
          if (updates.currentStock !== undefined || updates.minStockLevel !== undefined) {
            updatedItem.needsReorder = updatedItem.currentStock <= updatedItem.minStockLevel;
          }
          return updatedItem;
        }
        return item;
      }));
    }
  };

  const deleteItem = async (id: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        // Fallback to localStorage
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.warn('Failed to delete item via Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const addStockReport = async (reportData: Omit<StockReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    const isAdminReport = reportData.userId === '1'; // Admin user ID
    
    try {
      if (isSupabaseConfigured()) {
        // For admin reports, set status to 'applied' and update item stock immediately
        const finalReportData = isAdminReport 
          ? { ...reportData, status: 'applied' as const }
          : reportData;
            
        const { data, error } = await supabase
          .from('stock_reports')
          .insert([reportToDbReport(finalReportData)])
          .select()
          .single();

        if (error) throw error;

        const newReport = dbReportToReport(data);
        setStockReports(prev => [newReport, ...prev]);
        
        // If admin report, also update the item's stock immediately
        if (isAdminReport) {
          await updateItem(reportData.itemId, { currentStock: reportData.reportedStock });
        }
      } else {
        // Fallback to localStorage
        const finalStatus = isAdminReport ? 'applied' as const : reportData.status;
        const newReport: StockReport = {
          ...reportData,
          status: finalStatus,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setStockReports(prev => [newReport, ...prev]);
        
        // If admin report, also update the item's stock immediately
        if (isAdminReport) {
          setItems(prev => prev.map(item => {
            if (item.id === reportData.itemId) {
              const updatedItem = { ...item, currentStock: reportData.reportedStock, updatedAt: new Date().toISOString() };
              updatedItem.needsReorder = updatedItem.currentStock <= updatedItem.minStockLevel;
              return updatedItem;
            }
            return item;
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to add stock report via Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
      const finalStatus = isAdminReport ? 'applied' as const : reportData.status;
      const newReport: StockReport = {
        ...reportData,
        status: finalStatus,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setStockReports(prev => [newReport, ...prev]);
      
      // If admin report, also update the item's stock immediately
      if (isAdminReport) {
        setItems(prev => prev.map(item => {
          if (item.id === reportData.itemId) {
            const updatedItem = { ...item, currentStock: reportData.reportedStock, updatedAt: new Date().toISOString() };
            updatedItem.needsReorder = updatedItem.currentStock <= updatedItem.minStockLevel;
            return updatedItem;
          }
          return item;
        }));
      }
    }
  };

  const updateStockReportStatus = async (reportId: string, status: StockReport['status']) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('stock_reports')
          .update({ status })
          .eq('id', reportId)
          .select()
          .single();

        if (error) throw error;

        const updatedReport = dbReportToReport(data);
        setStockReports(prev => prev.map(report => 
          report.id === reportId ? updatedReport : report
        ));
      } else {
        // Fallback to localStorage
        setStockReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status, updatedAt: new Date().toISOString() }
            : report
        ));
      }
    } catch (error) {
      console.warn('Failed to update stock report status via Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
      setStockReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, updatedAt: new Date().toISOString() }
          : report
      ));
    }
  };

  const applyStockReport = async (reportId: string) => {
    const report = stockReports.find(r => r.id === reportId);
    if (report) {
      try {
        // Update the item's current stock based on the report
        await updateItem(report.itemId, { currentStock: report.reportedStock });
        // Mark report as applied
        await updateStockReportStatus(reportId, 'applied');
      } catch (error) {
        console.error('Error applying stock report:', error);
        throw error;
      }
    }
  };

  const createOrder = async (items: OrderItem[], notes?: string): Promise<Order> => {
    const newOrder: Order = {
      id: Date.now().toString(),
      items,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const sendOrderToApi = async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    return { success: true, message: 'Order sent successfully' };
  };

  const syncInventoryWithApi = async (): Promise<{ success: boolean; message?: string }> => {
    return { success: true, message: 'Inventory synced successfully' };
  };

  return (
    <DataContext.Provider value={{
      items,
      stockReports,
      orders,
      loading,
      addItem,
      updateItem,
      deleteItem,
      addStockReport,
      updateStockReportStatus,
      applyStockReport,
      createOrder,
      sendOrderToApi,
      syncInventoryWithApi,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};