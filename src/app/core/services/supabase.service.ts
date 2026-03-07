import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'customer';
  expiry?: string;
}

export interface Customer {
  id: string;
  username: string;
  password: string;
  expiry?: string;
  currentStock: number;
}

export interface Client {
  id: string;
  name: string;
  master_password?: string;
  current_stock: number;
}

export interface Voucher {
  id?: string;
  customerId: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  mpGross: number;
  mpTunch: number;
  mpFine: number;
  fineWeight: number;
  grossWeight: number;
  netWeight: number;
  items: VoucherItem[];
}

export interface VoucherItem {
  id?: string;
  voucherId?: string;
  description: string;
  stamp: string;
  gross: number;
  less: number;
  tunch: number;
  wastage: number;
  pieces: number;
  finalWeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<any, any, any>;
  private currentUser = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUser.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Set current user in the service
   */
  setCurrentUser(user: User | null): void {
    this.currentUser.next(user);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  /**
   * Get current user observable
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Seed default admin account
   */
  async seedDefaultAdmin(): Promise<void> {
    try {
      const { data: existing } = await this.supabase
        .from('admin')
        .select('*')
        .eq('username', 'admin')
        .single();

      if (!existing) {
        await this.supabase
          .from('admin')
          .insert([{ username: 'admin', password: 'admin123' }]);
      }
    } catch (error) {
      console.error('Error seeding admin:', error);
    }
  }

  /**
   * Login user (Admin or Customer)
   */
  async login(username: string, password: string): Promise<User | null> {
    try {
      // Try admin login
      const { data: admin } = await this.supabase
        .from('admin')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (admin) {
        const user: User = {
          id: admin.id || username,
          username: admin.username,
          role: 'admin'
        };
        this.setCurrentUser(user);
        return user;
      }

      // Try customer login
      const { data: customer } = await this.supabase
        .from('customers')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (customer) {
        // Check expiry date
        const today = new Date().toISOString().split('T')[0];
        if (customer.expiry && today > String(customer.expiry)) {
          throw new Error('Account expired');
        }

        const user: User = {
          id: customer.id,
          username: customer.username,
          role: 'customer',
          expiry: customer.expiry
        };
        this.setCurrentUser(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Create new customer account (Admin only)
   */
  async createCustomer(username: string, password: string, expiry: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .insert([{ username, password, expiry }])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get all customers (Admin only)
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('id, username, password, expiry')
        .order('username');

      if (error) throw error;
      const rows = (data || []) as Array<{
        id: string;
        username: string;
        password: string;
        expiry?: string;
      }>;

      return rows.map((row) => ({
        id: row.id,
        username: row.username,
        password: row.password,
        expiry: row.expiry,
        currentStock: 0
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  /**
   * Get customer's clients
   */
  async getCustomerClients(customerId: string): Promise<Client[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_clients')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer clients:', error);
      return [];
    }
  }

  /**
   * Create or update customer client
   */
  async saveCustomerClient(customerId: string, client: any): Promise<any> {
    try {
      if (client.id) {
        // Update existing
        const { data, error } = await this.supabase
          .from('customer_clients')
          .update({
            name: client.name,
            master_password: client.master_password,
            current_stock: client.current_stock
          })
          .eq('id', client.id)
          .select();

        if (error) throw error;
        return data?.[0];
      } else {
        // Create new
        const { data, error } = await this.supabase
          .from('customer_clients')
          .insert([{
            customer_id: customerId,
            name: client.name,
            master_password: client.master_password,
            current_stock: client.current_stock || 0
          }])
          .select();

        if (error) throw error;
        return data?.[0];
      }
    } catch (error) {
      console.error('Error saving customer client:', error);
      throw error;
    }
  }

  /**
   * Update client stock
   */
  async updateClientStock(clientId: string, stock: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('customer_clients')
        .update({ current_stock: stock })
        .eq('id', clientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating client stock:', error);
      throw error;
    }
  }

  /**
   * Delete customer client
   */
  async deleteCustomerClient(clientId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('customer_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer client:', error);
      throw error;
    }
  }

  /**
   * Delete customer (Admin only)
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      // Delete all clients first
      await this.supabase
        .from('customer_clients')
        .delete()
        .eq('customer_id', customerId);

      // Delete customer
      const { error } = await this.supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Save voucher with items
   */
  async saveVoucher(customerId: string, clientId: string, voucher: Voucher): Promise<any> {
    try {
      // Get next voucher number for this client
      const { data: existingVouchers } = await this.supabase
        .from('vouchers')
        .select('voucher_number')
        .eq('client_id', clientId);

      const voucherNumber = (existingVouchers?.length || 0) + 1;

      // Insert voucher (aligned with legacy index.html schema)
      const { data: voucherData, error: voucherError } = await this.supabase
        .from('vouchers')
        .insert([{
          client_id: clientId,
          voucher_number: voucherNumber,
          date: voucher.date,
          opening_balance: voucher.openingBalance,
          closing_balance: voucher.closingBalance,
          mp_gross: voucher.mpGross,
          mp_tunch: voucher.mpTunch,
          mp_fine: voucher.mpFine
        }])
        .select();

      if (voucherError) throw voucherError;

      const newVoucher = voucherData?.[0];
      if (!newVoucher) throw new Error('Failed to create voucher');

      // Insert items
      const items = voucher.items.map(item => ({
        voucher_id: newVoucher.id,
        description: item.description,
        stamp: item.stamp,
        gross_weight: item.gross,
        less_weight: item.less,
        tunch: item.tunch,
        wastage: item.wastage,
        pcs: item.pieces,
        final_weight: item.finalWeight
      }));

      const { error: itemsError } = await this.supabase
        .from('voucher_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Update selected client stock
      await this.supabase
        .from('customer_clients')
        .update({ current_stock: voucher.closingBalance })
        .eq('id', clientId);

      return newVoucher;
    } catch (error) {
      console.error('Error saving voucher:', error);
      throw error;
    }
  }

  /**
   * Get vouchers for date range
   */
  async getVouchers(userId: string, startDate: string, endDate: string, role: 'admin' | 'customer' = 'customer'): Promise<any[]> {
    try {
      const { data: baseVouchers, error } = await this.supabase
        .from('vouchers')
        .select(`
          *,
          customer_clients(name, customer_id),
          voucher_items(*)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      const vouchers = baseVouchers || [];

      let filtered = vouchers;
      if (role !== 'admin') {
        const { data: clients, error: clientsError } = await this.supabase
          .from('customer_clients')
          .select('id')
          .eq('customer_id', userId);

        if (clientsError) throw clientsError;
        const allowedClientIds = new Set((clients || []).map(c => String(c.id)));
        filtered = vouchers.filter(v => allowedClientIds.has(String(v.client_id)));
      }

      return filtered.map((voucher: any) => {
        const items = (voucher.voucher_items || []) as any[];
        const grossWeight = items.reduce((sum, item) => sum + Number(item.gross_weight ?? item.gross ?? 0), 0);
        const netWeight = items.reduce(
          (sum, item) => sum + (Number(item.gross_weight ?? item.gross ?? 0) - Number(item.less_weight ?? item.less ?? 0)),
          0
        );
        const fineWeight = items.reduce((sum, item) => sum + Number(item.final_weight ?? item.finalWeight ?? 0), 0);

        return {
          ...voucher,
          opening_stock: Number(voucher.opening_stock ?? voucher.opening_balance ?? 0),
          closing_stock: Number(voucher.closing_stock ?? voucher.closing_balance ?? 0),
          gross_weight: Number(voucher.gross_weight ?? grossWeight),
          net_weight: Number(voucher.net_weight ?? netWeight),
          fine_weight: Number(voucher.fine_weight ?? fineWeight)
        };
      });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return [];
    }
  }

  /**
   * Load report range grouped by customer -> clients -> vouchers
   * (aligned with legacy index.html behavior)
   */
  async getReportRange(userId: string, startDate: string, endDate: string, role: 'admin' | 'customer' = 'customer'): Promise<any[]> {
    try {
      const { data: vouchers, error: vouchersError } = await this.supabase
        .from('vouchers')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (vouchersError) throw vouchersError;
      let filteredVouchers = vouchers || [];

      // Load clients for current scope
      let clients: any[] = [];
      if (role === 'admin') {
        const clientIds = [...new Set(filteredVouchers.map(v => v.client_id).filter(Boolean))];
        if (clientIds.length > 0) {
          const { data, error } = await this.supabase
            .from('customer_clients')
            .select('*')
            .in('id', clientIds);
          if (error) throw error;
          clients = data || [];
        }
      } else {
        const { data, error } = await this.supabase
          .from('customer_clients')
          .select('*')
          .eq('customer_id', userId);
        if (error) throw error;
        clients = data || [];

        const allowed = new Set(clients.map(c => String(c.id)));
        filteredVouchers = filteredVouchers.filter(v => allowed.has(String(v.client_id)));
      }

      const customerIds = [...new Set(clients.map(c => c.customer_id).filter(Boolean))];
      let customers: any[] = [];
      if (customerIds.length > 0) {
        const { data, error } = await this.supabase
          .from('customers')
          .select('*')
          .in('id', customerIds);
        if (error) throw error;
        customers = data || [];
      }

      const vouchersByClient: Record<string, any[]> = {};
      filteredVouchers.forEach(v => {
        const key = String(v.client_id);
        if (!vouchersByClient[key]) vouchersByClient[key] = [];
        vouchersByClient[key].push(v);
      });

      return customers
        .map(customer => {
          const customerClients = clients
            .filter(client => String(client.customer_id) === String(customer.id))
            .map(client => ({
              ...client,
              vouchers: (vouchersByClient[String(client.id)] || []).map(v => ({
                ...v,
                closing_value: Number(v.closing_balance ?? v.closing_stock ?? 0)
              }))
            }))
            .filter(client => client.vouchers.length > 0);

          return {
            ...customer,
            clients: customerClients
          };
        })
        .filter(customer => customer.clients.length > 0);
    } catch (error) {
      console.error('Error loading report range:', error);
      return [];
    }
  }

  /**
   * Get full voucher data for receipt printing
   */
  async getVoucherPrintData(voucherId: string): Promise<{
    voucher: any;
    items: any[];
    clientName: string;
    customerName: string;
  } | null> {
    try {
      const { data: voucher, error: voucherError } = await this.supabase
        .from('vouchers')
        .select('*')
        .eq('id', voucherId)
        .single();
      if (voucherError || !voucher) throw voucherError || new Error('Voucher not found');

      const { data: items, error: itemsError } = await this.supabase
        .from('voucher_items')
        .select('*')
        .eq('voucher_id', voucherId)
        .order('id', { ascending: true });
      if (itemsError) throw itemsError;

      const { data: client, error: clientError } = await this.supabase
        .from('customer_clients')
        .select('*')
        .eq('id', voucher.client_id)
        .single();
      if (clientError || !client) throw clientError || new Error('Client not found');

      const { data: customer, error: customerError } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', client.customer_id)
        .single();
      if (customerError || !customer) throw customerError || new Error('Customer not found');

      return {
        voucher,
        items: items || [],
        clientName: client.name || 'Unknown',
        customerName: customer.username || ''
      };
    } catch (error) {
      console.error('Error loading voucher print data:', error);
      return null;
    }
  }

  /**
   * Update customer expiry date (Admin only)
   */
  async updateCustomerExpiry(customerId: string, expiry: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('customers')
        .update({ expiry })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating customer expiry:', error);
      throw error;
    }
  }

  /**
   * Get all customers with their clients (for admin)
   */
  async getAllCustomersWithClients(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select(`
          id,
          username,
          expiry,
          customer_clients(*)
        `)
        .order('username');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers with clients:', error);
      return [];
    }
  }
}
