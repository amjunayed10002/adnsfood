import type { Food, Order, Settings, User, AdminStats, CustomerSummary } from './types';

const API_BASE = '/api';

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('adns_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON received from server (HTTP ${res.status}).`);
    }
  } else {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 100) || res.statusText}`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Public / Shared
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<Settings>(res);
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse<string[]>(res);
  },

  async getFoods(): Promise<Food[]> {
    const res = await fetch(`${API_BASE}/foods`);
    return handleResponse<Food[]>(res);
  },

  // Auth
  async register(payload: {
    username: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    address: string;
    area: string;
    city: string;
  }): Promise<{ message: string; token: string; role: 'customer'; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: { login: string; password: string }): Promise<{ message: string; token: string; role: 'admin' | 'customer'; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async adminLogin(payload: { email: string; password: string }): Promise<{ message: string; token: string; role: 'admin'; user: User }> {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ authenticated: boolean; role?: 'admin' | 'customer'; user?: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async logout(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    localStorage.removeItem('adns_token');
    return handleResponse(res);
  },

  // Orders
  async createOrder(payload: {
    items: { id: number; quantity: number }[];
    address: string;
    area: string;
    city: string;
    instructions: string;
    payment_method: 'COD' | 'bKash';
    bkash_txn?: string;
  }): Promise<{ message: string; order_id: string; order: Order; total: number; status: string }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: getHeaders(),
    });
    return handleResponse<Order[]>(res);
  },

  async getOrderById(id: string | number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<Order>(res);
  },

  // Admin APIs
  async getAdminFoods(): Promise<Food[]> {
    const res = await fetch(`${API_BASE}/admin/foods`, {
      headers: getHeaders(),
    });
    return handleResponse<Food[]>(res);
  },

  async addFood(food: Partial<Food>): Promise<{ message: string; food: Food }> {
    const res = await fetch(`${API_BASE}/admin/foods`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(food),
    });
    return handleResponse(res);
  },

  async updateFood(id: number, food: Partial<Food>): Promise<{ message: string; food: Food }> {
    const res = await fetch(`${API_BASE}/admin/foods/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(food),
    });
    return handleResponse(res);
  },

  async toggleFoodStatus(id: number): Promise<{ message: string; status: 'active' | 'inactive'; food: Food }> {
    const res = await fetch(`${API_BASE}/admin/foods/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async toggleFoodAvailability(id: number): Promise<{ message: string; availability: boolean; food: Food }> {
    const res = await fetch(`${API_BASE}/admin/foods/${id}/toggle-availability`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteFood(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/foods/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateOrderStatus(id: number, status: Order['status']): Promise<{ message: string; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async updateSettings(settings: Partial<Settings>): Promise<{ message: string; settings: Settings }> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  async getAdminCustomers(): Promise<CustomerSummary[]> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getHeaders(),
    });
    return handleResponse<CustomerSummary[]>(res);
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<AdminStats>(res);
  },

  async getDbStatus(): Promise<{
    mode: string;
    isMongoConnected: boolean;
    mongoConfigured: boolean;
    totalFoods: number;
    totalOrders: number;
    totalUsers: number;
    dataFile: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/db-status`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
