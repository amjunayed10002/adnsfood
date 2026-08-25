import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { MongoClient, Db } from 'mongodb';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data Directory for persistent local document store fallback
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'adns_food_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------
// Types
// ----------------------------------------------------
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  address: string;
  area: string;
  city: string;
  status: 'active' | 'inactive' | 'admin';
  created_at: string;
}

export interface Food {
  id: number;
  name: string;
  category: string;
  description: string;
  photo: string;
  original_price: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  final_price: number;
  prep_time?: string;
  availability: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OrderItemSnapshot {
  id: number;
  name: string;
  quantity: number;
  original_price: number;
  price: number; // final price per unit at time of order
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  subtotal: number;
  photo?: string;
}

export interface Order {
  id: number;
  order_id: string;
  user_id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  instructions: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: 'COD' | 'bKash';
  bkash_txn?: string;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  restaurant_name: string;
  logo_url?: string;
  tagline?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  bkash_number: string;
  delivery_charge: number;
  restaurant_open: boolean;
  min_order: number;
  contact_phone: string;
  contact_email: string;
  address: string;
  announcement: string;
}

interface DatabaseSchema {
  users: User[];
  foods: Food[];
  orders: Order[];
  settings: Settings;
  categories: string[];
}

// ----------------------------------------------------
// Password Hashing Utility (built-in secure crypto)
// ----------------------------------------------------
function hashPassword(password: string): string {
  const salt = 'adns_food_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function calcFinalPrice(price: number, discountType: 'none' | 'percentage' | 'fixed', discountValue: number): number {
  const p = Number(price) || 0;
  const d = Number(discountValue) || 0;
  if (discountType === 'percentage') {
    return Math.round(Math.max(0, p * (1 - d / 100)) * 100) / 100;
  }
  if (discountType === 'fixed') {
    return Math.round(Math.max(0, p - d) * 100) / 100;
  }
  return p;
}

// ----------------------------------------------------
// Initial Seed Data for ADN's Food
// ----------------------------------------------------
const DEFAULT_SETTINGS: Settings = {
  id: 1,
  restaurant_name: "ADN's Food",
  logo_url: '',
  tagline: 'Delicious Food, Delivered Hot',
  hero_title: 'Delicious Food, Delivered Hot to Your Door.',
  hero_subtitle: 'Savor chef-crafted gourmet burgers, cheesy hand-tossed pizzas, crispy fried chicken, and cooling shakes. Fast delivery across the city with bKash and Cash on Delivery.',
  hero_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  bkash_number: '01712-345678',
  delivery_charge: 60,
  restaurant_open: true,
  min_order: 150,
  contact_phone: '+880 1712-345678',
  contact_email: 'support@adnsfood.com',
  address: 'Road #11, Banani / Dhanmondi, Dhaka, Bangladesh',
  announcement: '🔥 Free delivery on special platters! Welcome to ADN\'s Food — Fresh & Taste Guaranteed!',
};

const DEFAULT_CATEGORIES = [
  'All',
  'Burger',
  'Pizza',
  'Fried Chicken',
  'Rice Bowls',
  'Snacks & Fries',
  'Beverages & Shakes',
  'Desserts',
];

const DEFAULT_FOODS: Food[] = [
  {
    id: 1,
    name: 'ADN Signature Monster Burger',
    category: 'Burger',
    description: 'Double grilled chicken patty with melted cheddar cheese, caramelized onions, fresh lettuce, and secret ADN garlic cream sauce.',
    photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    original_price: 350,
    discount_type: 'percentage',
    discount_value: 15,
    final_price: 297.5,
    prep_time: '15-20 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Crispy Smoky Zinger Burger',
    category: 'Burger',
    description: 'Ultra-crispy golden fried chicken breast fillets loaded with spicy mayo, pickles, and butter-toasted brioche bun.',
    photo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    original_price: 260,
    discount_type: 'fixed',
    discount_value: 30,
    final_price: 230,
    prep_time: '12-15 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'BBQ Chicken Feast Pizza (12")',
    category: 'Pizza',
    description: 'Hand-tossed crust topped with rich smoky BBQ chicken chunks, mozzarella cheese blend, capsicum, red onions, and oregano drizzle.',
    photo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    original_price: 650,
    discount_type: 'percentage',
    discount_value: 20,
    final_price: 520,
    prep_time: '20-25 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Four Cheese Margherita Pizza (12")',
    category: 'Pizza',
    description: 'Classic Italian style with premium mozzarella, parmesan, gouda, fresh basil, and savory sun-ripened tomato marinara.',
    photo: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    original_price: 580,
    discount_type: 'none',
    discount_value: 0,
    final_price: 580,
    prep_time: '18-22 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Crispy Peri-Peri Fried Chicken (4 Pcs)',
    category: 'Fried Chicken',
    description: 'Marinated overnight with African peri-peri spices, deep-fried to crunchy perfection, served with garlic mayo dip.',
    photo: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    original_price: 380,
    discount_type: 'percentage',
    discount_value: 10,
    final_price: 342,
    prep_time: '15-20 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Spicy Naga Chicken Rice Bowl',
    category: 'Rice Bowls',
    description: 'Steaming fragrant butter rice topped with spicy naga glazed chicken tenders, cucumber salad, and poached egg.',
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    original_price: 290,
    discount_type: 'fixed',
    discount_value: 40,
    final_price: 250,
    prep_time: '12-15 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Loaded Cheesy Beef Fries',
    category: 'Snacks & Fries',
    description: 'Golden french fries smothered in cheddar cheese sauce, minced spiced beef bolognese, jalapeños, and ranch dressing.',
    photo: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
    original_price: 240,
    discount_type: 'none',
    discount_value: 0,
    final_price: 240,
    prep_time: '10-12 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Chocolate Lava Cake with Vanilla Gelato',
    category: 'Desserts',
    description: 'Warm, gooey dark Belgian chocolate volcano cake paired with chilled Madagascar vanilla scoop.',
    photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    original_price: 220,
    discount_type: 'percentage',
    discount_value: 10,
    final_price: 198,
    prep_time: '8-10 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Chilled Mango Mint Cooler',
    category: 'Beverages & Shakes',
    description: 'Refreshing sweet Alphonso mango pulp blended with fresh mint leaves, crushed ice, and lime.',
    photo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    original_price: 130,
    discount_type: 'none',
    discount_value: 0,
    final_price: 130,
    prep_time: '5 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Cold Coffee with Ice Cream',
    category: 'Beverages & Shakes',
    description: 'Rich espresso blended with chilled milk, dark chocolate syrup, and a scoop of velvety vanilla ice cream.',
    photo: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    original_price: 160,
    discount_type: 'fixed',
    discount_value: 20,
    final_price: 140,
    prep_time: '5 min',
    availability: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin_1',
    username: 'admin',
    name: 'ADN Restaurant Administrator',
    email: 'admin@adnsfood.com',
    phone: '01700-000000',
    password_hash: hashPassword('admin123'),
    address: 'HQ ADN Food, Dhanmondi',
    area: 'Dhanmondi',
    city: 'Dhaka',
    status: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr_demo_customer',
    username: 'customer',
    name: 'Adnan Mahmud',
    email: 'customer@adnsfood.com',
    phone: '01812-345678',
    password_hash: hashPassword('customer123'),
    address: 'House #45, Road #7, Sector 3, Uttara',
    area: 'Uttara',
    city: 'Dhaka',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

// Initial Demo Order for Instant Exploration
const DEFAULT_ORDERS: Order[] = [
  {
    id: 1,
    order_id: 'ADNF-20260825-7891',
    user_id: 'usr_demo_customer',
    customer_name: 'Adnan Mahmud',
    phone: '01812-345678',
    email: 'customer@adnsfood.com',
    address: 'House #45, Road #7, Sector 3, Uttara',
    area: 'Uttara',
    city: 'Dhaka',
    instructions: 'Please provide extra ketchup and napkins. Call on arrival.',
    items: [
      {
        id: 1,
        name: 'ADN Signature Monster Burger',
        quantity: 2,
        original_price: 350,
        price: 297.5,
        discount_type: 'percentage',
        discount_value: 15,
        subtotal: 595,
        photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 9,
        name: 'Chilled Mango Mint Cooler',
        quantity: 2,
        original_price: 130,
        price: 130,
        discount_type: 'none',
        discount_value: 0,
        subtotal: 260,
        photo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 855,
    delivery_charge: 60,
    total: 915,
    payment_method: 'bKash',
    bkash_txn: 'BK92A761XQ',
    status: 'Preparing',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ----------------------------------------------------
// Persistent Document Store & MongoDB Sync Engine
// ----------------------------------------------------
let memoryDb: DatabaseSchema = {
  users: DEFAULT_USERS,
  foods: DEFAULT_FOODS,
  orders: DEFAULT_ORDERS,
  settings: DEFAULT_SETTINGS,
  categories: DEFAULT_CATEGORIES,
};

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;
let mongoUri = process.env.MONGODB_URI || '';

function loadLocalDatabase(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryDb = {
        users: parsed.users || DEFAULT_USERS,
        foods: parsed.foods || DEFAULT_FOODS,
        orders: parsed.orders || DEFAULT_ORDERS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        categories: parsed.categories || DEFAULT_CATEGORIES,
      };
      console.log('✅ Loaded persistent local database successfully.');
    } else {
      saveLocalDatabase();
      console.log('🌱 Initialized and seeded local database.');
    }
  } catch (err) {
    console.error('⚠️ Failed to load local database, resetting to defaults:', err);
  }
}

function saveLocalDatabase(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Failed to persist local database:', err);
  }
}

async function initMongo(): Promise<void> {
  mongoUri = (process.env.MONGODB_URI || '').trim();
  
  // Only attempt MongoDB connection if a valid URI scheme is provided
  if (!mongoUri || mongoUri === 'MY_MONGODB_URI' || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
    console.log('ℹ️ MongoDB URI not configured. Running smoothly with persistent document engine.');
    isMongoConnected = false;
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB instance...');
    mongoClient = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      tlsAllowInvalidCertificates: true,
      directConnection: mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'),
    });
    
    await mongoClient.connect();
    mongoDb = mongoClient.db('adns_food');
    isMongoConnected = true;
    console.log('🚀 Connected to MongoDB successfully!');

    // Sync seed data to MongoDB if collection is empty
    const foodsCol = mongoDb.collection('foods');
    const count = await foodsCol.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding MongoDB collections from catalog...');
      await mongoDb.collection('foods').insertMany(DEFAULT_FOODS as any);
      await mongoDb.collection('users').insertMany(DEFAULT_USERS as any);
      await mongoDb.collection('settings').insertOne(DEFAULT_SETTINGS as any);
      await mongoDb.collection('orders').insertMany(DEFAULT_ORDERS as any);
    }
  } catch (err: any) {
    console.log(`ℹ️ MongoDB connection not available (${err.message || 'offline'}). Running seamlessly on local persistent document store.`);
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch {
        // ignore
      }
      mongoClient = null;
    }
    mongoDb = null;
    isMongoConnected = false;
  }
}

// ----------------------------------------------------
// Authentication Helpers & Tokens
// ----------------------------------------------------
interface SessionPayload {
  userId: string;
  role: 'admin' | 'customer';
  name: string;
  email: string;
}

const sessions = new Map<string, SessionPayload>();

function createSession(user: User): string {
  const token = 'adn_token_' + crypto.randomBytes(32).toString('hex');
  const role = user.status === 'admin' ? 'admin' : 'customer';
  sessions.set(token, {
    userId: user.id,
    role,
    name: user.name,
    email: user.email,
  });
  return token;
}

function getAuthUser(req: Request): SessionPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return sessions.get(token) || null;
}

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// 1. System & Database Status
app.get('/api/admin/db-status', (req: Request, res: Response) => {
  res.json({
    mode: isMongoConnected ? 'MongoDB (Live Atlas/Connected)' : 'Local High-Speed Persistent Document DB',
    isMongoConnected,
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    totalFoods: memoryDb.foods.length,
    totalOrders: memoryDb.orders.length,
    totalUsers: memoryDb.users.length,
    dataFile: DATA_FILE,
  });
});

// 2. Settings API
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(memoryDb.settings);
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const d = req.body || {};
  memoryDb.settings = {
    ...memoryDb.settings,
    restaurant_name: d.restaurant_name !== undefined ? String(d.restaurant_name).trim() : memoryDb.settings.restaurant_name,
    logo_url: d.logo_url !== undefined ? String(d.logo_url).trim() : (memoryDb.settings.logo_url || ''),
    tagline: d.tagline !== undefined ? String(d.tagline).trim() : (memoryDb.settings.tagline || 'Delicious Food, Delivered Hot'),
    hero_title: d.hero_title !== undefined ? String(d.hero_title).trim() : (memoryDb.settings.hero_title || 'Delicious Food, Delivered Hot to Your Door.'),
    hero_subtitle: d.hero_subtitle !== undefined ? String(d.hero_subtitle).trim() : (memoryDb.settings.hero_subtitle || ''),
    hero_image: d.hero_image !== undefined ? String(d.hero_image).trim() : (memoryDb.settings.hero_image || ''),
    bkash_number: d.bkash_number !== undefined ? String(d.bkash_number).trim() : memoryDb.settings.bkash_number,
    delivery_charge: Number(d.delivery_charge) >= 0 ? Number(d.delivery_charge) : (memoryDb.settings.delivery_charge ?? 60),
    min_order: Number(d.min_order) >= 0 ? Number(d.min_order) : (memoryDb.settings.min_order ?? 0),
    restaurant_open: typeof d.restaurant_open === 'boolean' ? d.restaurant_open : memoryDb.settings.restaurant_open,
    contact_phone: d.contact_phone !== undefined ? String(d.contact_phone).trim() : memoryDb.settings.contact_phone,
    contact_email: d.contact_email !== undefined ? String(d.contact_email).trim() : memoryDb.settings.contact_email,
    address: d.address !== undefined ? String(d.address).trim() : memoryDb.settings.address,
    announcement: d.announcement !== undefined ? String(d.announcement).trim() : memoryDb.settings.announcement,
  };
  saveLocalDatabase();
  res.json({ message: 'Restaurant settings updated successfully.', settings: memoryDb.settings });
});

// 3. Categories API
app.get('/api/categories', (req: Request, res: Response) => {
  res.json(memoryDb.categories);
});

// 4. Foods API
app.get('/api/foods', (req: Request, res: Response) => {
  // Public only sees active foods
  const activeFoods = memoryDb.foods.filter((f) => f.status === 'active');
  res.json(activeFoods);
});

app.get('/api/admin/foods', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }
  res.json(memoryDb.foods);
});

app.post('/api/admin/foods', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const d = req.body || {};
  if (!d.name || d.original_price === undefined || d.original_price === '') {
    return res.status(400).json({ error: 'Food name and original price are required.' });
  }

  const maxId = memoryDb.foods.reduce((max, f) => Math.max(max, f.id), 0);
  const origPrice = Number(d.original_price) || 0;
  const discType = d.discount_type || 'none';
  const discVal = Number(d.discount_value) || 0;
  const finalPrice = calcFinalPrice(origPrice, discType, discVal);

  const newFood: Food = {
    id: maxId + 1,
    name: String(d.name).trim(),
    category: d.category || 'Others',
    description: d.description || '',
    photo: d.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    original_price: origPrice,
    discount_type: discType,
    discount_value: discVal,
    final_price: finalPrice,
    prep_time: d.prep_time || '15-20 min',
    availability: d.availability !== undefined ? Boolean(d.availability) : true,
    status: d.status === 'inactive' ? 'inactive' : 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryDb.foods.unshift(newFood);
  saveLocalDatabase();
  res.json({ message: 'Food item added successfully.', food: newFood });
});

app.put('/api/admin/foods/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const id = Number(req.params.id);
  const idx = memoryDb.foods.findIndex((f) => f.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  const d = req.body || {};
  if (!d.name || d.original_price === undefined) {
    return res.status(400).json({ error: 'Food name and price are required.' });
  }

  const origPrice = Number(d.original_price) || 0;
  const discType = d.discount_type || 'none';
  const discVal = Number(d.discount_value) || 0;
  const finalPrice = calcFinalPrice(origPrice, discType, discVal);

  const updatedFood: Food = {
    ...memoryDb.foods[idx],
    name: String(d.name).trim(),
    category: d.category || memoryDb.foods[idx].category,
    description: d.description !== undefined ? d.description : memoryDb.foods[idx].description,
    photo: d.photo !== undefined ? d.photo : memoryDb.foods[idx].photo,
    original_price: origPrice,
    discount_type: discType,
    discount_value: discVal,
    final_price: finalPrice,
    prep_time: d.prep_time || memoryDb.foods[idx].prep_time,
    availability: d.availability !== undefined ? Boolean(d.availability) : memoryDb.foods[idx].availability,
    status: d.status === 'inactive' ? 'inactive' : 'active',
    updated_at: new Date().toISOString(),
  };

  memoryDb.foods[idx] = updatedFood;
  saveLocalDatabase();
  res.json({ message: 'Food updated successfully.', food: updatedFood });
});

app.patch('/api/admin/foods/:id/toggle', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const id = Number(req.params.id);
  const food = memoryDb.foods.find((f) => f.id === id);
  if (!food) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  food.status = food.status === 'active' ? 'inactive' : 'active';
  food.updated_at = new Date().toISOString();
  saveLocalDatabase();
  res.json({
    message: `Food item '${food.name}' is now ${food.status}.`,
    status: food.status,
    food,
  });
});

app.patch('/api/admin/foods/:id/toggle-availability', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const id = Number(req.params.id);
  const food = memoryDb.foods.find((f) => f.id === id);
  if (!food) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  food.availability = !food.availability;
  food.updated_at = new Date().toISOString();
  saveLocalDatabase();
  res.json({
    message: `Food availability updated: ${food.availability ? 'Available' : 'Unavailable'}.`,
    availability: food.availability,
    food,
  });
});

app.delete('/api/admin/foods/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const id = Number(req.params.id);
  const idx = memoryDb.foods.findIndex((f) => f.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  const removed = memoryDb.foods.splice(idx, 1)[0];
  saveLocalDatabase();
  res.json({ message: `${removed.name} was permanently removed from menu.` });
});

// 5. Auth API
app.post('/api/auth/register', (req: Request, res: Response) => {
  const d = req.body || {};
  const requiredKeys = ['username', 'name', 'email', 'phone', 'password', 'address', 'area', 'city'];
  for (const k of requiredKeys) {
    if (!d[k] || String(d[k]).trim() === '') {
      return res.status(400).json({ error: `Please fill in ${k.replace('_', ' ')}.` });
    }
  }

  const email = String(d.email).trim().toLowerCase();
  const username = String(d.username).trim().toLowerCase();

  const existing = memoryDb.users.find(
    (u) => u.email.toLowerCase() === email || u.username.toLowerCase() === username
  );
  if (existing) {
    return res.status(409).json({ error: 'An account with this email or username already exists.' });
  }

  const newUser: User = {
    id: 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    username,
    name: String(d.name).trim(),
    email,
    phone: String(d.phone).trim(),
    password_hash: hashPassword(String(d.password)),
    address: String(d.address).trim(),
    area: String(d.area).trim(),
    city: String(d.city).trim(),
    status: 'active',
    created_at: new Date().toISOString(),
  };

  memoryDb.users.push(newUser);
  saveLocalDatabase();

  const token = createSession(newUser);
  res.json({
    message: 'Registration successful! Welcome to ADN\'s Food.',
    token,
    role: 'customer',
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address,
      area: newUser.area,
      city: newUser.city,
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const d = req.body || {};
  const loginInput = String(d.login || '').trim().toLowerCase();
  const password = String(d.password || '');

  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Please enter both username/email and password.' });
  }

  const user = memoryDb.users.find(
    (u) =>
      (u.username.toLowerCase() === loginInput || u.email.toLowerCase() === loginInput) &&
      u.status !== 'inactive'
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid login details. Please check your username/password.' });
  }

  const token = createSession(user);
  res.json({
    message: 'Login successful!',
    token,
    role: user.status === 'admin' ? 'admin' : 'customer',
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      area: user.area,
      city: user.city,
      status: user.status,
    },
  });
});

app.post('/api/auth/admin/login', (req: Request, res: Response) => {
  const d = req.body || {};
  const emailOrUser = String(d.email || d.login || '').trim().toLowerCase();
  const password = String(d.password || '');

  if (!emailOrUser || !password) {
    return res.status(400).json({ error: 'Please provide administrator email/username and password.' });
  }

  // Find admin by email, username, or default admin account
  const user = memoryDb.users.find(
    (u) =>
      (u.email.toLowerCase() === emailOrUser || u.username.toLowerCase() === emailOrUser) &&
      u.status === 'admin'
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid administrator email/username or password.' });
  }

  const token = createSession(user);
  res.json({
    message: 'Admin authorization verified.',
    token,
    role: 'admin',
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      area: user.area || '',
      city: user.city || '',
      status: 'admin',
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    return res.json({ authenticated: false });
  }

  const user = memoryDb.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    role: session.role,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      area: user.area,
      city: user.city,
      status: user.status,
    },
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    sessions.delete(token);
  }
  res.json({ message: 'Logged out successfully.' });
});

// 6. Orders API
app.post('/api/orders', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    return res.status(401).json({ error: 'Please login or register before placing your order.' });
  }

  const user = memoryDb.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  const d = req.body || {};
  const rawItems = d.items || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty. Please add delicious food items to your cart.' });
  }

  if (!memoryDb.settings.restaurant_open) {
    return res.status(400).json({ error: 'ADN\'s Food is currently closed. Please check back during open hours.' });
  }

  // Address validation
  const address = String(d.address || user.address || '').trim();
  const area = String(d.area || user.area || '').trim();
  const city = String(d.city || user.city || 'Dhaka').trim();

  if (!address) {
    return res.status(400).json({ error: 'Please provide a valid delivery address.' });
  }

  // Server-side validation of foods, price calculations, and snapshot creation
  let calculatedSubtotal = 0;
  const itemsSnapshot: OrderItemSnapshot[] = [];

  for (const it of rawItems) {
    const food = memoryDb.foods.find((f) => f.id === Number(it.id) && f.status === 'active');
    if (!food) {
      return res.status(400).json({ error: `One of the ordered items (${it.name || 'food'}) is no longer on our menu.` });
    }
    if (!food.availability) {
      return res.status(400).json({ error: `"${food.name}" is currently unavailable in the kitchen.` });
    }

    const qty = parseInt(it.quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ error: `Invalid quantity for ${food.name}.` });
    }

    const itemPrice = food.final_price;
    const itemSubtotal = Math.round(itemPrice * qty * 100) / 100;
    calculatedSubtotal += itemSubtotal;

    itemsSnapshot.push({
      id: food.id,
      name: food.name,
      quantity: qty,
      original_price: food.original_price,
      price: itemPrice,
      discount_type: food.discount_type,
      discount_value: food.discount_value,
      subtotal: itemSubtotal,
      photo: food.photo,
    });
  }

  calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
  const deliveryCharge = Number(memoryDb.settings.delivery_charge) || 0;
  const grandTotal = Math.round((calculatedSubtotal + deliveryCharge) * 100) / 100;

  if (grandTotal < memoryDb.settings.min_order) {
    return res.status(400).json({ error: `Minimum order amount is ৳${memoryDb.settings.min_order}. Current total is ৳${grandTotal}.` });
  }

  const paymentMethod = d.payment_method === 'bKash' ? 'bKash' : 'COD';
  const bkashTxn = String(d.bkash_txn || '').trim();

  if (paymentMethod === 'bKash' && !bkashTxn) {
    return res.status(400).json({ error: 'Please enter your bKash transaction number to complete the order.' });
  }

  // Generate Unique Order ID: ADNF-YYYYMMDD-XXXX
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randCode = crypto.randomBytes(2).toString('hex').toUpperCase();
  const orderId = `ADNF-${todayStr}-${randCode}`;

  const maxId = memoryDb.orders.reduce((max, o) => Math.max(max, o.id), 0);
  const newOrder: Order = {
    id: maxId + 1,
    order_id: orderId,
    user_id: user.id,
    customer_name: user.name,
    phone: user.phone,
    email: user.email,
    address,
    area,
    city,
    instructions: String(d.instructions || '').trim(),
    items: itemsSnapshot,
    subtotal: calculatedSubtotal,
    delivery_charge: deliveryCharge,
    total: grandTotal,
    payment_method: paymentMethod,
    bkash_txn: paymentMethod === 'bKash' ? bkashTxn : undefined,
    status: 'Pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryDb.orders.unshift(newOrder);
  saveLocalDatabase();

  res.json({
    message: 'Order placed successfully!',
    order_id: orderId,
    order: newOrder,
    total: grandTotal,
    status: 'Pending',
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  if (session.role === 'admin') {
    return res.json(memoryDb.orders);
  }

  const userOrders = memoryDb.orders.filter((o) => o.user_id === session.userId);
  res.json(userOrders);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const param = req.params.id;
  const order = memoryDb.orders.find(
    (o) => o.id === Number(param) || o.order_id.toLowerCase() === param.toLowerCase()
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (session.role !== 'admin' && order.user_id !== session.userId) {
    return res.status(403).json({ error: 'Access denied to this order.' });
  }

  res.json(order);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const id = Number(req.params.id);
  const order = memoryDb.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const status = req.body?.status;
  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status value.' });
  }

  order.status = status;
  order.updated_at = new Date().toISOString();
  saveLocalDatabase();

  res.json({
    message: `Order ${order.order_id} status updated to ${status}.`,
    order,
  });
});

// 7. Admin Customer & Analytics API
app.get('/api/admin/customers', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const customerList = memoryDb.users
    .filter((u) => u.status !== 'admin')
    .map((u) => {
      const orders = memoryDb.orders.filter((o) => o.user_id === u.id);
      const totalSpent = orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        address: u.address,
        area: u.area,
        city: u.city,
        status: u.status,
        created_at: u.created_at,
        orders_count: orders.length,
        total_spent: Math.round(totalSpent * 100) / 100,
        orders,
      };
    });

  res.json(customerList);
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required.' });
  }

  const orders = memoryDb.orders;
  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
  const todaySales = todayOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSales = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = {
    total_orders: orders.length,
    pending: orders.filter((o) => o.status === 'Pending').length,
    confirmed: orders.filter((o) => o.status === 'Confirmed').length,
    preparing: orders.filter((o) => o.status === 'Preparing').length,
    delivery: orders.filter((o) => o.status === 'Out for Delivery').length,
    delivered: orders.filter((o) => o.status === 'Delivered').length,
    cancelled: orders.filter((o) => o.status === 'Cancelled').length,
    customers: memoryDb.users.filter((u) => u.status !== 'admin').length,
    foods: memoryDb.foods.filter((f) => f.status === 'active').length,
    today_orders: todayOrders.length,
    today_sales: Math.round(todaySales * 100) / 100,
    total_sales: Math.round(totalSales * 100) / 100,
  };

  res.json(stats);
});

// ----------------------------------------------------
// Static & Frontend Handling in Production / Dev
// ----------------------------------------------------
async function startServer() {
  loadLocalDatabase();
  await initMongo();

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev mode, attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍔 ADN's Food backend server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
