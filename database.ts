import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'database.sqlite');
const OLD_DB_FILE = path.join(process.cwd(), 'db.json');

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    profileImage TEXT
  );
`);

// Manual migrations
try { db.exec("ALTER TABLE users ADD COLUMN image TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE personnel ADD COLUMN image TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE faculties ADD COLUMN image TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE adminUnits ADD COLUMN image TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE departments ADD COLUMN image TEXT;"); } catch (e) {}

try { db.exec("ALTER TABLE items ADD COLUMN qrCodeId TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN qrCodeValue TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN syncStatus TEXT DEFAULT 'synced';"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN localTempId TEXT;"); } catch (e) {}

try { db.exec("ALTER TABLE receivings ADD COLUMN qrCodeId TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE receivings ADD COLUMN qrCodeValue TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE receivings ADD COLUMN syncStatus TEXT DEFAULT 'synced';"); } catch (e) {}
try { db.exec("ALTER TABLE receivings ADD COLUMN localTempId TEXT;"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT,
    item_code TEXT,
    category TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT,
    location TEXT,
    status TEXT,
    department TEXT,
    isDeleted INTEGER DEFAULT 0,
    qrCodeId TEXT,
    qrCodeValue TEXT,
    syncStatus TEXT DEFAULT 'synced',
    localTempId TEXT
  );

  CREATE TABLE IF NOT EXISTS receivings (
    id TEXT PRIMARY KEY,
    date TEXT,
    item_code TEXT,
    item_name TEXT,
    quantity REAL,
    supplier TEXT,
    received_by TEXT,
    invoice_number TEXT,
    createdAt TEXT,
    isDeleted INTEGER DEFAULT 0,
    qr_code TEXT,
    qrCodeId TEXT,
    qrCodeValue TEXT,
    syncStatus TEXT DEFAULT 'synced',
    localTempId TEXT
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    trackingId TEXT,
    projectName TEXT,
    requestedBy TEXT,
    items TEXT, -- JSON string
    status TEXT,
    progress REAL,
    createdAt TEXT,
    isDeleted INTEGER DEFAULT 0,
    takenStatus TEXT -- 'TAKEN' or 'NOT_TAKEN'
  );

  CREATE TABLE IF NOT EXISTS tenders (
    id TEXT PRIMARY KEY,
    requestId TEXT,
    tenderNumber TEXT,
    createdAt TEXT,
    items TEXT, -- JSON string
    status TEXT,
    isDeleted INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    tenderId TEXT,
    supplierName TEXT,
    items TEXT, -- JSON string
    totalAmount REAL,
    isWinner INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    submittedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    poNumber TEXT,
    tenderId TEXT,
    quotationId TEXT,
    requestId TEXT,
    supplierName TEXT,
    items TEXT, -- JSON string
    status TEXT,
    createdAt TEXT,
    isDeleted INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user TEXT,
    action TEXT,
    target TEXT,
    type TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    itemId TEXT,
    type TEXT, -- IN or OUT
    quantity REAL,
    faculty TEXT,
    personName TEXT,
    supplier TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS faculties (
    id TEXT PRIMARY KEY,
    name TEXT,
    count INTEGER DEFAULT 0,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT,
    facultyId TEXT,
    image TEXT,
    FOREIGN KEY(facultyId) REFERENCES faculties(id)
  );

  CREATE TABLE IF NOT EXISTS adminUnits (
    id TEXT PRIMARY KEY,
    name TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    name TEXT,
    jobTitle TEXT,
    facultyId TEXT,
    departmentId TEXT,
    idNumber TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY,
    personId TEXT,
    personName TEXT,
    itemId TEXT,
    itemName TEXT,
    itemCode TEXT,
    quantity REAL,
    timestamp TEXT,
    notes TEXT,
    facultyId TEXT,
    faculty TEXT,
    departmentId TEXT,
    adminUnitId TEXT,
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS codes (
    id TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    time TEXT,
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS trash (
    trashId TEXT PRIMARY KEY,
    id TEXT,
    name TEXT,
    trashDate TEXT,
    expiresAt TEXT,
    originalModule TEXT,
    reason TEXT,
    data TEXT -- Original object JSON
  );

  CREATE TABLE IF NOT EXISTS sent_emails (
    id TEXT PRIMARY KEY,
    data TEXT
  );
`);

// --- Budget Tree Data (Full Hierarchy) ---
export const BUDGET_TREE = [
  {
    bab: "220",
    name: "Travel & Allowance (سفریه او امتیازات)",
    fasls: [
      {
        code: "221",
        name: "Allowances (امتیازات)",
        items: [
          { code: "22100", name: "Domestic Allowance (امتياز داخلی)" },
          { code: "22101", name: "International Allowance (امتياز بين المللی)" },
          { code: "22102", name: "Domestic Travel (سفریه داخلی)" },
          { code: "22103", name: "International Travel (سفریه خارجی)" },
          { code: "22104", name: "Uniformed Domestic Allowance (سفريه داخلی کارندان يونبفورم)" },
          { code: "22105", name: "Travel Advance (پيشکی های سفريه)" }
        ]
      },
      {
        code: "223",
        name: "Contract Services (خدمات قراردادي)",
        items: [
          { code: "22300", name: "Public Relations & Advertising (خدمات اشتهازی تبلغاتی اجتماعی)" },
          { code: "22301", name: "Printing (مطبع)" },
          { code: "22302", name: "Accounting & Audit (تفتيش و محاسبه)" },
          { code: "22303", name: "Engineering & Design (انجنری و ډيزان)" },
          { code: "22304", name: "Security Services (خدماتی امنيتی)" },
          { code: "22305", name: "Freight & Handling (کرايه و جابجاشدن)" },
          { code: "22306", name: "Training & Seminars (سمنارها و کورس های اموزيشی)" },
          { code: "22307", name: "Development Consulting (بوديجه انکشافی و شرکت های مشورتی)" },
          { code: "22308", name: "Individual Consultants (بوديجه انکشافی مشاورين انفرادی)" },
          { code: "22309", name: "NGO Development Services (انکشافی خدمات موسسات غير دولتی)" },
          { code: "22310", name: "Project Management (بوديجه انکشافی اداره پروژه)" },
          { code: "22311", name: "Development Admin Fee (نکشافی فيس های اداری)" }
        ]
      },
      {
        code: "226",
        name: "Fuel (روغنیات)",
        items: [
          { code: "22601", name: "Fuel Vehicles (روغنيات)" },
          { code: "22602", name: "Gas (ګاز)" },
          { code: "22603", name: "Domestic Fuel (روغنيات داخلی)" }
        ]
      },
      {
        code: "227",
        name: "Tools & Materials (سامان و لوازم)",
        items: [
          { code: "22700", name: "Medical & Laboratory (طبی و البراتوار)" },
          { code: "22701", name: "Office Equipment & Supplies (تجهزات و تدارکات دفتری)" },
          { code: "22702", name: "Household & Kitchen (منزل و اشپزهانه)" },
          { code: "22703", name: "Education & Recreational (مواد تعلمی و تفريحی)" },
          { code: "22704", name: "Clothing (لباس)" },
          { code: "22705", name: "Furniture (فرنيچر)" },
          { code: "22706", name: "Valuable Papers (اسناد و اوراق)" },
          { code: "22707", name: "Agriculture Tools (سامان و لوازم زراعتی)" },
          { code: "22708", name: "Military Equipment (تجهزات و لوارم نظامی)" },
          { code: "22709", name: "Gifts (تحايف)" }
        ]
      }
    ]
  },
  {
    bab: "222",
    name: "Food (غذا)",
    fasls: [
      {
        code: "222",
        name: "Food Items",
        items: [
          { code: "22201", name: "Food - Non Salary (غذا - بدون معاش)" },
          { code: "22202", name: "Advance of Food (پيشکي هاي غذا بدون معاش)" }
        ]
      }
    ]
  },
  {
    bab: "224",
    name: "Repairs & Maintenance (ترميمات و مراقبت)",
    fasls: [
      {
        code: "224",
        name: "Maintenance Items",
        items: [
          { code: "22400", name: "Vehicles (وسيله نقليه)" },
          { code: "22401", name: "Construction (تجهزات ساختمانی)" },
          { code: "22409", name: "Office Equipment & Computers (تجهزات دفتری وکمپوټری)" },
          { code: "22417", name: "Buildings (ساختمان ها)" }
        ]
      }
    ]
  },
  {
    bab: "225",
    name: "Utilities (عام المنفعه)",
    fasls: [
      {
        code: "225",
        name: "Utility Services",
        items: [
          { code: "22500", name: "Electricity (برق)" },
          { code: "22501", name: "Water (آب)" },
          { code: "22502", name: "Telecommunication (مخابرات)" }
        ]
      }
    ]
  }
];

// Migration function
export function migrateFromJson() {
  // Seed default admin if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (!userCount || userCount.count === 0) {
    console.log('[SEED] Seeding default admin user...');
    // Default password 'admin123'
    const adminPass = bcrypt.hashSync("admin123", 10); 
    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
      .run('1', 'Admin User', 'admin@kandahar.edu.af', adminPass, 'Super Admin');
  }

  // Always seed BUDGET_TREE if codes table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM codes').get() as any;
  if (count.count === 0) {
    console.log('[SEED] Seeding BUDGET_TREE into codes table...');
    const stmt = db.prepare('INSERT INTO codes (id, value) VALUES (?, ?)');
    for (const b of BUDGET_TREE) {
      stmt.run(b.bab, JSON.stringify(b));
    }
  }

  if (!fs.existsSync(OLD_DB_FILE)) return;

  try {
    const data = JSON.parse(fs.readFileSync(OLD_DB_FILE, 'utf-8'));
    console.log('[MIGRATION] Starting migration from db.json...');

    db.transaction(() => {
      // Users
      if (data.users) {
        const stmt = db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role, image) VALUES (?, ?, ?, ?, ?, ?)');
        for (const u of data.users) stmt.run(u.id, u.name, u.email, u.password, u.role, u.image || u.profileImage);
      }

      // Items
      if (data.items) {
        const stmt = db.prepare('INSERT OR IGNORE INTO items (id, name, item_code, category, quantity, unit, location, status, department, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const i of data.items) stmt.run(i.id, i.name, i.item_code, i.category, i.quantity, i.unit, i.location, i.status, i.department, i.isDeleted ? 1 : 0);
      }

      // Receivings
      if (data.receivings) {
        const stmt = db.prepare('INSERT OR IGNORE INTO receivings (id, date, item_code, item_name, quantity, supplier, received_by, invoice_number, createdAt, isDeleted, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const r of data.receivings) stmt.run(r.id, r.date, r.item_code, r.item_name, r.quantity, r.supplier, r.received_by, r.invoice_number, r.createdAt, r.isDeleted ? 1 : 0, r.qr_code);
      }

      // Requests
      if (data.requests) {
        const stmt = db.prepare('INSERT OR IGNORE INTO requests (id, trackingId, projectName, requestedBy, items, status, progress, createdAt, isDeleted, takenStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const r of data.requests) stmt.run(r.id, r.trackingId, r.projectName, r.requestedBy, JSON.stringify(r.items), r.status, r.progress, r.createdAt, r.isDeleted ? 1 : 0, r.takenStatus || null);
      }

      // Faculties
      if (data.faculties) {
        const stmt = db.prepare('INSERT OR IGNORE INTO faculties (id, name, count) VALUES (?, ?, ?)');
        for (const f of data.faculties) stmt.run(f.id, f.name, f.count);
      }

      // Departments
      if (data.departments) {
        const stmt = db.prepare('INSERT OR IGNORE INTO departments (id, name, facultyId) VALUES (?, ?, ?)');
        for (const d of data.departments) stmt.run(d.id, d.name, d.facultyId);
      }

      // Personnel
      if (data.personnel) {
        const stmt = db.prepare('INSERT OR IGNORE INTO personnel (id, name, jobTitle, facultyId, departmentId, idNumber, image) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const p of data.personnel) stmt.run(p.id, p.name, p.jobTitle, p.facultyId, p.departmentId, p.idNumber, p.image);
      }

      // Activities
      if (data.activities) {
        const stmt = db.prepare('INSERT OR IGNORE INTO activities (id, user, action, target, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        for (const a of data.activities) stmt.run(a.id, a.user, a.action, a.target, a.type, a.timestamp);
      }

      // Stock Transactions
      if (data.stock_transactions) {
        const stmt = db.prepare('INSERT OR IGNORE INTO stock_transactions (id, itemId, type, quantity, faculty, personName, supplier, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        for (const t of data.stock_transactions) stmt.run(t.id, t.itemId, t.type, t.quantity, t.faculty, t.personName, t.supplier, t.created_at);
      }

      // Allocations
      if (data.allocations) {
        const stmt = db.prepare('INSERT OR IGNORE INTO allocations (id, personId, personName, itemId, itemName, itemCode, quantity, timestamp, notes, facultyId, faculty, departmentId, adminUnitId, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const a of data.allocations) stmt.run(a.id, a.personId, a.personName, a.itemId, a.itemName, a.itemCode, a.quantity, a.timestamp, a.notes, a.facultyId, a.faculty, a.departmentId, a.adminUnitId, a.type);
      }

      // Sent Emails
      if (data.sent_emails) {
        const stmt = db.prepare('INSERT OR IGNORE INTO sent_emails (id, data) VALUES (?, ?)');
        for (const e of data.sent_emails) stmt.run(e.id, JSON.stringify(e));
      }

      // Procurement tables
      if (data.tenders) {
        const stmt = db.prepare('INSERT OR IGNORE INTO tenders (id, requestId, tenderNumber, createdAt, items, status, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const t of data.tenders) stmt.run(t.id, t.requestId, t.tenderNumber, t.createdAt, JSON.stringify(t.items), t.status, t.isDeleted ? 1 : 0);
      }

      if (data.quotations) {
        const stmt = db.prepare('INSERT OR IGNORE INTO quotations (id, tenderId, supplierName, items, totalAmount, isWinner, isDeleted, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        for (const q of data.quotations) stmt.run(q.id, q.tenderId, q.supplierName, JSON.stringify(q.items), q.totalAmount, q.isWinner ? 1 : 0, q.isDeleted ? 1 : 0, q.submittedAt);
      }

      if (data.orders) {
        const stmt = db.prepare('INSERT OR IGNORE INTO orders (id, poNumber, tenderId, quotationId, requestId, supplierName, items, status, createdAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const o of data.orders) stmt.run(o.id, o.poNumber, o.tenderId, o.quotationId, o.requestId, o.supplierName, JSON.stringify(o.items), o.status, o.createdAt, o.isDeleted ? 1 : 0);
      }

      // Settings
      if (data.settings) {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        for (const [k, v] of Object.entries(data.settings)) {
           stmt.run(k, JSON.stringify(v));
        }
      }
    })();

    console.log('[MIGRATION] Migration completed successfully.');
    // Rename old file to avoid double migration
    fs.renameSync(OLD_DB_FILE, OLD_DB_FILE + '.bak');
  } catch (err) {
    console.error('[MIGRATION] Fatal error during migration:', err);
  }
}

export default db;
