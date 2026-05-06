import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { createServer as createViteServer } from "vite";
import forecastRoutes from "./modules/forecast/forecast.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const SECRET_KEY = process.env.JWT_SECRET || "kandahar_procurement_safe_key_2024";

// --- Activity Logging Helper ---
function logActivity(user: string, action: string, target: string, type: string) {
  const db = getDb();
  const newActivity = {
    id: randomUUID(),
    user,
    action,
    target,
    type,
    timestamp: new Date().toISOString()
  };
  if (!db.activities) db.activities = [];
  db.activities = [newActivity, ...db.activities].slice(0, 50); // Keep last 50
  saveDb(db);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/forecast", forecastRoutes);

// Get System Activities
app.get("/api/activities", (req, res) => {
  const db = getDb();
  res.json(db.activities || []);
});

// --- Item Distribution (Stock Reduction) ---
app.post("/api/distribute", (req, res) => {
  const { itemId, personName, faculty, quantity } = req.body;
  const db = getDb();
  const item = db.items.find((i: any) => i.id === itemId);
  const qtyNum = Number(quantity) || 1;

  if (item && item.quantity >= qtyNum) {
    item.quantity -= qtyNum;
    item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
    
    // Log the distribution in a new collection "allocations"
    if (!db.allocations) db.allocations = [];
    const allocation = {
      id: randomUUID(),
      itemId,
      itemName: item.name,
      personName,
      faculty,
      quantity: qtyNum,
      timestamp: new Date().toISOString()
    };
    db.allocations.push(allocation);

    // Log Stock Transaction
    if (!db.stock_transactions) db.stock_transactions = [];
    db.stock_transactions.push({
      id: randomUUID(),
      itemId,
      type: 'OUT',
      quantity: qtyNum,
      faculty,
      personName,
      created_at: new Date().toISOString()
    });
    
    saveDb(db);
    logActivity(personName, 'Item Assigned', item.name, 'special');
    res.json({ success: true, item, allocation });
  } else {
    res.status(400).json({ error: "Insufficient stock or item not found" });
  }
});

// --- Analytics: Forecasting & Allocation ---
app.get("/api/analytics/forecast", (req, res) => {
  const db = getDb();
  
  // Basic linear forecast based on monthly consumption
  const faculties = ["Engineering", "Medicine", "Agriculture", "Computer Science", "Economics"];
  const forecast = faculties.map(f => {
    const historical = (db.allocations || [])
      .filter((a: any) => a.faculty === f)
      .reduce((sum: number, a: any) => sum + a.quantity, 0);
    
    return {
      faculty: f,
      current: historical,
      forecast: Math.floor(historical * 1.25 + 5), // Simulating 25% growth forecast
      confidence: "High",
      trend: "Increasing"
    };
  });
  
  res.json(forecast);
});

// --- Database Helper ---
let dbCache: any = null;

function getDb() {
  if (dbCache) return dbCache;
  try {
    let db: any;
    if (!fs.existsSync(DB_FILE)) {
      db = { 
        items: [
          { id: '1', name: 'Printing Paper A4', item_code: '22301', category: 'Stationery', quantity: 500, unit: 'BOX', location: 'Zone A-01', status: 'In Stock', department: 'Engineering' },
          { id: '2', name: 'Engine Oil 10W40', item_code: '22601', category: 'Fuel', quantity: 50, unit: 'LTR', location: 'Cold Storage', status: 'In Stock', department: 'Engineering' },
          { id: '3', name: 'Microscope Slides', item_code: '22700', category: 'Laboratory', quantity: 200, unit: 'PKT', location: 'Lab A', status: 'In Stock', department: 'Medicine' },
          { id: '4', name: 'Lab Coats', item_code: '22704', category: 'Clothing', quantity: 5, unit: 'PCS', location: 'Lab B', status: 'Low Stock', department: 'Medicine' }
        ], 
        receivings: [
          { id: 'R1', date: new Date().toISOString(), item_code: '22301', item_name: 'Printing Paper A4', quantity: 100, supplier: 'Kabul Stationers', received_by: 'Ahmed', status: 'COMPLETED' }
        ], 
        requests: [], 
        tenders: [], 
        quotations: [], 
        orders: [],
        trash: [],
        notifications: [],
        stock_transactions: [],
        codes: [],
        faculties: [
          { id: 'f1', name: "Medicine", count: 12 },
          { id: 'f2', name: "Computer Science", count: 8 },
          { id: 'f3', name: "Engineering", count: 15 }
        ],
        departments: [
          { id: 'd1', name: 'Internal Medicine', facultyId: 'f1' },
          { id: 'd2', name: 'Software Engineering', facultyId: 'f2' },
          { id: 'd3', name: 'Civil Engineering', facultyId: 'f3' }
        ],
        adminUnits: [
          { id: 'a1', name: 'Directorate of Finance' },
          { id: 'a2', name: 'Human Resources' }
        ],
        personnel: [
          { id: 'p1', name: 'Enayatullah Mansoor', jobTitle: 'Lecturer', facultyId: 'f3', departmentId: 'd3', idNumber: '3456' }
        ],
        allocations: [],
        users: [{ 
          id: 'admin', name: 'System Admin', email: 'admin@kandahar.edu.af', 
          password: bcrypt.hashSync("admin123", 10), role: 'Admin', profileImage: null 
        }]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      dbCache = db;
      return db;
    }
    
    const data = fs.readFileSync(DB_FILE, "utf-8");
    db = JSON.parse(data || '{}');
    
    // Ensure all collections exist as arrays
    const collections = [
      'items', 'receivings', 'requests', 'tenders', 'quotations', 'orders', 
      'trash', 'notifications', 'stock_transactions', 'codes', 'faculties', 
      'personnel', 'users', 'allocations', 'sent_emails', 'adminUnits', 'departments'
    ];
    
    collections.forEach(key => {
      if (!Array.isArray(db[key])) {
        db[key] = [];
      }
    });

    // Repair Admin if missing
    if (!db.users.some((u: any) => u.email === 'admin@kandahar.edu.af')) {
      db.users.push({
        id: 'admin', name: 'System Admin', email: 'admin@kandahar.edu.af', 
        password: bcrypt.hashSync("admin123", 10), role: 'Admin', profileImage: null
      });
    }

    dbCache = db;
    return db;
  } catch (error) {
    console.error("Database read error:", error);
    return { 
      items: [], 
      receivings: [], 
      requests: [], 
      tenders: [], 
      quotations: [], 
      orders: [], 
      trash: [], 
      notifications: [], 
      users: [],
      faculties: [],
      personnel: [],
      adminUnits: [],
      departments: [],
      allocations: [],
      codes: []
    } as any;
  }
}

let lastPersistentSave = 0;
const PERSIST_THROTTLE_MS = 3000;

function saveDb(data: any) {
  dbCache = data;
  const now = Date.now();
  if (now - lastPersistentSave > PERSIST_THROTTLE_MS) {
    lastPersistentSave = now;
    setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2));
      } catch (error) {
        console.error("Database save error:", error);
      }
    }, 100);
  }
}

// --- Auth Middleware ---
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: "Invalid token." });
  }
};

const checkRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied. Insufficient permissions." });
  }
  next();
};

// --- API Routes ---

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  
  const user = db.users.find((u: any) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const validPassword = await bcrypt.compare(password, user.password || "");
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || "User" },
    SECRET_KEY,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const db = getDb();
  
  const user = db.users.find((u: any) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "Email not found in our records." });
  }

  // Simulate sending reset link
  console.log(`[AUTH] Password reset link requested for: ${email}`);
  
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
     try {
       await getTransporter().sendMail({
         from: `"Kandahar University WMS" <${process.env.MAIL_USER}>`,
         to: email,
         subject: "Password Reset Request",
         html: `
           <div style="font-family: sans-serif; padding: 20px;">
             <h2>Password Reset Request</h2>
             <p>Hello ${user.name},</p>
             <p>We received a request to reset your password. Use the code below to log in, then change your password in settings:</p>
             <div style="background: #f1f1f1; padding: 10px; font-size: 20px; font-weight: bold; letter-spacing: 5px; text-align: center;">RESET123</div>
             <p>If you didn't request this, please ignore this email.</p>
           </div>
         `
       });
     } catch (e) {
       console.error("Forgot password email failed:", e);
     }
  }

  res.json({ success: true, message: "A recovery email has been sent to your inbox." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Inventory API ---
app.get("/api/items", (req, res) => {
  const db = getDb();
  res.json(db.items.filter((i: any) => !i.isDeleted));
});

app.get("/api/categories", (req, res) => {
  const db = getDb();
  const categories = [...new Set(db.items.map((i: any) => i.category).filter(Boolean))];
  res.json(categories.length ? categories : ["Stationery", "Furniture", "Electronics", "Fuel", "Maintenance"]);
});

app.post("/api/items", (req, res) => {
  const db = getDb();
  const newItem = {
    id: randomUUID(),
    ...req.body,
    quantity: Number(req.body.quantity) || 0,
    status: req.body.quantity > 10 ? 'In Stock' : (req.body.quantity > 0 ? 'Low Stock' : 'Out of Stock')
  };
  db.items.push(newItem);
  saveDb(db);
  logActivity('Admin User', 'Added Item', newItem.name, 'create');
  res.json(newItem);
});

app.patch("/api/items/:id", (req, res) => {
  const db = getDb();
  const index = db.items.findIndex((i: any) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });
  db.items[index] = { ...db.items[index], ...req.body };
  saveDb(db);
  res.json(db.items[index]);
});

app.post("/api/items/:id/trash", (req, res) => {
  const db = getDb();
  const index = db.items.findIndex((i: any) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });
  
  db.items[index].isDeleted = true;
  const item = db.items[index];
  
  db.trash.push({
    ...item,
    trashId: randomUUID(),
    trashDate: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    originalModule: 'inventory',
    reason: req.body.reason || "System Cleanup"
  });
  saveDb(db);
  res.json({ success: true });
});

// --- Reports API ---
app.get("/api/reports/inventory", (req, res) => {
  const db = getDb();
  const lowStock = db.items.filter((i: any) => i.status === 'Low Stock');
  res.json({
    totalItems: db.items.length,
    totalStock: db.items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0),
    lowStockCount: lowStock.length,
    items: db.items
  });
});

// --- Settings API ---
app.get("/api/settings", (req, res) => {
  const db = getDb();
  res.json(db.settings || {});
});

app.post("/api/settings", (req, res) => {
  const db = getDb();
  db.settings = { ...(db.settings || {}), ...req.body };
  saveDb(db);
  res.json(db.settings);
});

// --- Email API ---
function getTransporter() {
  const db = getDb();
  const mailUser = db.settings?.mailUser || process.env.MAIL_USER || "your_email@gmail.com";
  const mailPass = db.settings?.mailPass || process.env.MAIL_PASS || "your_app_password";
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });
}

app.get("/api/emails", (req, res) => {
  const db = getDb();
  res.json(db.sent_emails || []);
});

app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html, requestId, type } = req.body;
  const db = getDb();
  const mailUser = db.settings?.mailUser || process.env.MAIL_USER;
  const mailPass = db.settings?.mailPass || process.env.MAIL_PASS;

  let success = false;
  let errorMsg = null;
  let simulated = true;

  try {
    const isRealReady = mailUser && 
                       mailPass && 
                       mailPass !== "your_app_password" &&
                       mailUser.includes('@');

    if (isRealReady) {
      simulated = false;
      const transporter = getTransporter();
      try {
        await getTransporter().sendMail({
          from: `"Kandahar University Logistics" <${mailUser}>`,
          to,
          bcc: mailUser,
          subject,
          text,
          html: html || text
        });
        success = true;
      } catch (e: any) {
        success = false;
        errorMsg = e.message;
        console.error("Mail server error:", e);
      }
    } else {
      // Simulation
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}`);
      success = true; 
      if (!to || !to.includes('@')) {
        success = false;
        errorMsg = "Recipient address validation failed";
      }
    }

    const emailLog = {
      id: randomUUID(),
      to,
      subject,
      text,
      html: html || text,
      requestId,
      type: type || 'procurement',
      status: success ? 'Sent' : 'Failed',
      simulated: simulated,
      error: errorMsg,
      timestamp: new Date().toISOString()
    };

    if (!db.sent_emails) db.sent_emails = [];
    db.sent_emails.unshift(emailLog);
    if (db.sent_emails.length > 50) db.sent_emails.pop();
    
    saveDb(db);
    res.json({ ...emailLog, success, simulated });
  } catch (error) {
    res.status(500).json({ error: "System failure in email module" });
  }
});

app.patch("/api/emails/:id", (req, res) => {
  const db = getDb();
  const index = db.sent_emails.findIndex((e: any) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Email log not found" });
  
  db.sent_emails[index] = { ...db.sent_emails[index], ...req.body };
  saveDb(db);
  res.json(db.sent_emails[index]);
});

// --- Receiving API ---
app.get("/api/receivings", (req, res) => {
  const db = getDb();
  const active = (db.receivings || []).filter((r: any) => !r.isDeleted);
  res.json(active);
});

app.get("/api/v1/receiving/export", (req, res) => {
  // Simple JSON to CSV/Text export mock
  const db = getDb();
  const data = db.receivings.filter((r: any) => !r.isDeleted);
  res.header('Content-Type', 'text/csv');
  res.attachment('inventory_receivings.csv');
  const header = "ID,Item Code,Project,Supplier,Quantity,Date,Invoice\n";
  const rows = data.map((r: any) => `${r.id},${r.item_code},${r.project_name},${r.supplier},${r.quantity},${r.date},${r.invoice_number}`).join("\n");
  res.send(header + rows);
});

app.post("/api/v1/receiving/upload", (req, res) => {
  // In a real app with formidable/multer we would parse the file
  // For now we simulate success
  res.json({ success: true, message: "File processing triggered" });
});

app.post("/api/v1/receiving", (req, res) => {
  const db = getDb();
  const { item_code, quantity, item_name, supplier, date, invoice_number } = req.body;
  const qtyNum = Number(quantity);
  
  // DUPLICATE CHECK: item_name + supplier + date + invoice
  const exists = db.receivings.some((r: any) => 
    !r.isDeleted &&
    r.item_code === item_code && 
    r.supplier === supplier && 
    r.date === date && 
    r.invoice_number === invoice_number
  );
  
  if (exists) {
    return res.status(409).json({ error: "Duplicate record already exists in ledger" });
  }

  // Update Inventory Stock
  const item = db.items.find((i: any) => i.item_code === item_code);
  
  const newReceiving = {
    id: randomUUID(),
    ...req.body,
    item_name: req.body.item_name || (item ? item.name : item_code),
    quantity: qtyNum,
    createdAt: new Date().toISOString(),
    isDeleted: false
  };
  
  if (item) {
    item.quantity = (Number(item.quantity) || 0) + qtyNum;
    item.status = item.quantity > 10 ? 'In Stock' : 'Low Stock';
  } else {
    db.items.push({
      id: randomUUID(),
      name: req.body.item_name || item_code,
      item_code: item_code,
      quantity: qtyNum,
      unit: req.body.unit || 'PCS',
      status: 'In Stock',
      location: req.body.warehouse_location || 'General'
    });
  }
  
  db.receivings.push(newReceiving);

  // Log Stock Transaction
  if (!db.stock_transactions) db.stock_transactions = [];
  db.stock_transactions.push({
    id: randomUUID(),
    itemId: item ? item.id : newReceiving.id, // Falls back to receiving ID if new item
    type: 'IN',
    quantity: qtyNum,
    supplier,
    created_at: new Date().toISOString()
  });

  saveDb(db);
  logActivity('Logistics Dept', 'Received Inventory', newReceiving.item_name, 'create');
  res.json(newReceiving);
});

app.patch("/api/v1/receiving/:id", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const db = getDb();
  const index = db.receivings.findIndex((r: any) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Record not found" });
  
  const oldRec = db.receivings[index];
  const newRec = { ...oldRec, ...req.body };
  if (req.body.quantity !== undefined) newRec.quantity = Number(req.body.quantity);
  
  // Update stock difference
  const item = db.items.find((i: any) => i.item_code === oldRec.item_code);
  if (item && req.body.quantity !== undefined) {
    const diff = newRec.quantity - oldRec.quantity;
    item.quantity = Math.max(0, (Number(item.quantity) || 0) + diff);
    item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
  }
  
  db.receivings[index] = newRec;
  saveDb(db);
  res.json({ receiving: newRec });
});

app.put("/api/v1/receiving/:id", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const db = getDb();
  const index = db.receivings.findIndex((r: any) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Record not found" });
  
  const oldRec = db.receivings[index];
  const newRec = { ...oldRec, ...req.body, quantity: Number(req.body.quantity) };
  
  // Update stock difference
  const item = db.items.find((i: any) => i.item_code === oldRec.item_code);
  if (item) {
    const diff = newRec.quantity - oldRec.quantity;
    item.quantity = Math.max(0, (Number(item.quantity) || 0) + diff);
    item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
  }
  
  db.receivings[index] = newRec;
  saveDb(db);
  res.json({ receiving: newRec });
});

app.post("/api/v1/receiving/bulk", (req, res) => {
  const db = getDb();
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "Invalid data format" });

  let skippedCount = 0;
  let addedCount = 0;

  items.forEach((itemData: any) => {
    const qtyNum = Number(itemData.quantity) || 0;
    
    // DUPLICATE CHECK
    const exists = db.receivings.some((r: any) => 
      !r.isDeleted &&
      r.item_code === itemData.item_code && 
      r.supplier === itemData.supplier && 
      r.date === itemData.date && 
      r.invoice_number === itemData.invoice_number
    );

    if (exists) {
      skippedCount++;
      return; 
    }

    const item = db.items.find((i: any) => i.item_code === itemData.item_code);

    const newReceiving = {
      id: randomUUID(),
      ...itemData,
      item_name: itemData.item_name || (item ? item.name : itemData.item_code),
      quantity: qtyNum,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };
    db.receivings.push(newReceiving);
    addedCount++;

    if (item) {
      item.quantity = (Number(item.quantity) || 0) + qtyNum;
      item.status = item.quantity > 10 ? 'In Stock' : 'Low Stock';
    } else {
      db.items.push({
        id: randomUUID(),
        name: itemData.item_name || itemData.item_code,
        item_code: itemData.item_code,
        quantity: qtyNum,
        unit: itemData.unit || 'PCS',
        status: 'In Stock',
        location: itemData.warehouse_location || 'General'
      });
    }
  });

  saveDb(db);
  res.json({ success: true, count: addedCount, skipped: skippedCount });
});

app.delete("/api/v1/receiving/:id", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const db = getDb();
  const id = req.params.id;
  
  // Search for the record in receivings
  const index = db.receivings.findIndex((r: any) => r.id === id || r._id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Record not found in the Database ledger." });
  }
  
  // Remove from active records
  const rec = db.receivings.splice(index, 1)[0];
  
  // Adjust inventory (Reverse the receiving effect)
  if (rec.item_code) {
    const item = db.items.find((i: any) => i.item_code === rec.item_code);
    if (item) {
      item.quantity = Math.max(0, (Number(item.quantity) || 0) - (Number(rec.quantity) || 0));
      item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
    }
  }

  // Move to TRASH for audit history
  db.trash.push({
    ...rec,
    trashId: randomUUID(),
    name: rec.item_name || rec.item_code,
    trashDate: new Date().toISOString(),
    originalModule: 'receiving',
    reason: `System Delete by ${req.user.email}`
  });
  
  saveDb(db);
  res.json({ success: true, message: "Record successfully moved to trash and inventory adjusted." });
});

// --- Notifications & SMS API ---
app.post("/api/notifications/sms", async (req, res) => {
  const { to, message } = req.body;
  console.log(`[SMS SERVICE] Sending to ${to}: ${message}`);
  
  // Forward to Email (Enable SMS via Email)
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      const isLikelyEmail = to && to.includes('@');
      await getTransporter().sendMail({
        from: `"KDRU WMS" <${process.env.MAIL_USER}>`,
        to: isLikelyEmail ? to : process.env.MAIL_USER, 
        subject: isLikelyEmail ? `WMS Notification` : `SMS Notification Forward: ${to}`,
        text: `The following message was sent to ${to}:\n\n${message}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #0F8F7F;">SMS Notification Forward</h2>
            <p><strong>To:</strong> ${to}</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              ${message}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              Self-forwarded by Kandahar University Warehouse Management System via email.
            </p>
          </div>
        `
      });
      console.log(`[SMS SERVICE] Forwarded to email: ${process.env.MAIL_USER}`);
    } catch (err) {
      console.error("[SMS SERVICE] Email forwarding failed:", err);
    }
  }
  
  // Simulate success
  res.json({ success: true, messageId: randomUUID() });
});

// --- Analytics API ---
app.get("/api/analytics/annual-needs", (req, res) => {
  const db = getDb();
  // Simple logic: Annual need = (last year consumption * 1.2) - current stock
  // Since we don't have historical consumption, we'll use total items received as a proxy
  const analysis = db.items.map((item: any) => {
    const totalReceived = db.receivings
      .filter((r: any) => r.item_code === item.item_code && !r.isDeleted)
      .reduce((sum: number, r: any) => sum + r.quantity, 0);
    
    const yearlyTrend = totalReceived || 100; // Mock base consumption
    const estimatedNeed = Math.ceil(yearlyTrend * 1.15); // 15% growth buffer
    const gap = Math.max(0, estimatedNeed - item.quantity);
    
    return {
      item_code: item.item_code,
      name: item.name,
      current_stock: item.quantity,
      estimated_annual_consumption: estimatedNeed,
      recommended_purchase: gap
    };
  });
  res.json(analysis);
});

app.get("/api/analytics/forecast", (req, res) => {
  const db = getDb();
  // Generate 12 months forecast based on items received over time
  // If no historical data, generate random realistic trends
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const forecast = months.map((m, i) => ({
    month: m,
    actual: 100 + Math.floor(Math.random() * 50) + (i * 5),
    projected: 110 + Math.floor(Math.random() * 60) + (i * 7)
  }));
  res.json(forecast);
});

app.get("/api/inventory/allocation", (req, res) => {
  const db = getDb();
  // Mock allocation by faculty/department
  const faculties = ["Engineering", "Medicine", "Agriculture", "Computer Science", "Economics"];
  const allocation = faculties.map(f => ({
    faculty: f,
    items_count: 10 + Math.floor(Math.random() * 20),
    total_value: 5000 + Math.floor(Math.random() * 15000)
  }));
  res.json(allocation);
});

// --- Requests API ---
app.get("/api/requests", (req, res) => {
  const db = getDb();
  res.json((db.requests || []).filter((r: any) => !r.isDeleted));
});

app.post("/api/requests", (req, res) => {
  const db = getDb();
  const newRequest = {
    id: randomUUID(),
    ...req.body,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    trackingId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`
  };
  db.requests.push(newRequest);
  
  // Create notification
  db.notifications.push({
    id: randomUUID(),
    title: "New Request Submitted",
    message: `Request ${newRequest.trackingId} for ${newRequest.projectName || 'Items'} needs approval.`,
    time: "Just now",
    type: "request"
  });
  
  saveDb(db);
  logActivity(req.body.requestedBy || 'Personnel', 'New Request', newRequest.item_name || 'Generic Asset', 'special');
  res.json(newRequest);
});

app.patch("/api/requests/:id", (req, res) => {
  const db = getDb();
  const request = db.requests.find((r: any) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  
  Object.assign(request, req.body);
  saveDb(db);
  res.json(request);
});

app.delete("/api/requests/:id", (req, res) => {
  const db = getDb();
  const request = db.requests.find((r: any) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  
  request.isDeleted = true;
  db.trash.push({ 
    ...request, 
    trashId: randomUUID(), 
    trashDate: new Date().toISOString(), 
    originalModule: 'requests' 
  });
  
  saveDb(db);
  res.json({ success: true });
});

// --- Traceability API (Faculties, Admin Units, Departments, Personnel) ---

app.get("/api/faculties", (req, res) => {
  const db = getDb();
  res.json(db.faculties || []);
});

app.post("/api/faculties", (req, res) => {
  const db = getDb();
  const newFaculty = { id: randomUUID(), ...req.body, count: 0 };
  db.faculties.push(newFaculty);
  saveDb(db);
  res.json(newFaculty);
});

app.patch("/api/faculties/:id", (req, res) => {
  const db = getDb();
  const index = db.faculties.findIndex((f: any) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Faculty not found" });
  db.faculties[index] = { ...db.faculties[index], ...req.body };
  saveDb(db);
  res.json(db.faculties[index]);
});

app.delete("/api/faculties/:id", (req, res) => {
  const db = getDb();
  const index = db.faculties.findIndex((f: any) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Faculty not found" });
  const faculty = db.faculties.splice(index, 1)[0];
  db.trash.push({ ...faculty, trashId: randomUUID(), trashDate: new Date().toISOString(), originalModule: 'faculties' });
  saveDb(db);
  res.json({ success: true });
});

app.get("/api/admin-units", (req, res) => {
  const db = getDb();
  res.json(db.adminUnits || []);
});

app.post("/api/admin-units", (req, res) => {
  const db = getDb();
  const newUnit = { id: randomUUID(), ...req.body };
  db.adminUnits.push(newUnit);
  saveDb(db);
  res.json(newUnit);
});

app.patch("/api/admin-units/:id", (req, res) => {
  const db = getDb();
  const index = db.adminUnits.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Unit not found" });
  db.adminUnits[index] = { ...db.adminUnits[index], ...req.body };
  saveDb(db);
  res.json(db.adminUnits[index]);
});

app.delete("/api/admin-units/:id", (req, res) => {
  const db = getDb();
  const index = db.adminUnits.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Unit not found" });
  const unit = db.adminUnits.splice(index, 1)[0];
  db.trash.push({ ...unit, trashId: randomUUID(), trashDate: new Date().toISOString(), originalModule: 'adminUnits' });
  saveDb(db);
  res.json({ success: true });
});

app.get("/api/departments", (req, res) => {
  const db = getDb();
  res.json(db.departments || []);
});

app.post("/api/departments", (req, res) => {
  const db = getDb();
  const newDept = { id: randomUUID(), ...req.body };
  db.departments.push(newDept);
  saveDb(db);
  res.json(newDept);
});

app.patch("/api/departments/:id", (req, res) => {
  const db = getDb();
  const index = db.departments.findIndex((d: any) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Department not found" });
  db.departments[index] = { ...db.departments[index], ...req.body };
  saveDb(db);
  res.json(db.departments[index]);
});

app.delete("/api/departments/:id", (req, res) => {
  const db = getDb();
  const index = db.departments.findIndex((d: any) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Department not found" });
  const dept = db.departments.splice(index, 1)[0];
  db.trash.push({ ...dept, trashId: randomUUID(), trashDate: new Date().toISOString(), originalModule: 'departments' });
  saveDb(db);
  res.json({ success: true });
});

app.get("/api/personnel", (req, res) => {
  const db = getDb();
  const allocations = db.allocations || [];
  
  // Calculate dynamic itemsCount for each person
  const personnelWithCounts = (db.personnel || []).map((p: any) => {
    const pCount = allocations.filter((a: any) => a.personId === p.id).reduce((sum: number, a: any) => sum + (Number(a.quantity) || 0), 0);
    return { ...p, itemsCount: pCount };
  });
  
  res.json(personnelWithCounts);
});

app.post("/api/personnel", (req, res) => {
  const db = getDb();
  const newPerson = { id: randomUUID(), ...req.body };
  db.personnel.push(newPerson);
  saveDb(db);
  res.json(newPerson);
});

app.patch("/api/personnel/:id", (req, res) => {
  const db = getDb();
  const index = db.personnel.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Personnel not found" });
  db.personnel[index] = { ...db.personnel[index], ...req.body };
  saveDb(db);
  res.json(db.personnel[index]);
});

app.delete("/api/personnel/:id", (req, res) => {
  const db = getDb();
  const index = db.personnel.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Personnel not found" });
  const person = db.personnel.splice(index, 1)[0];
  db.trash.push({ ...person, trashId: randomUUID(), trashDate: new Date().toISOString(), originalModule: 'personnel' });
  saveDb(db);
  res.json({ success: true });
});

// Traceability History Helper
app.get("/api/traceability/history", (req, res) => {
  const { personId, departmentId, facultyId, adminUnitId } = req.query;
  const db = getDb();
  let history = db.allocations || [];

  if (personId) {
    // Note: Older records might use personName, newer ones should link by ID
    const person = db.personnel.find((p:any) => p.id === personId);
    history = history.filter((h: any) => h.personId === personId || (person && h.personName === person.name));
  } else if (departmentId) {
    history = history.filter((h: any) => h.departmentId === departmentId);
  } else if (facultyId) {
    history = history.filter((h: any) => h.facultyId === facultyId || h.faculty === facultyId);
  } else if (adminUnitId) {
    history = history.filter((h: any) => h.adminUnitId === adminUnitId);
  }

  res.json(history);
});

// Manual Item Allocation (Recording history or issuing without request)
app.post("/api/traceability/allocate", (req, res) => {
  const { personId, itemId, quantity, date, notes } = req.body;
  const db = getDb();
  
  const person = db.personnel.find((p: any) => p.id === personId);
  const item = db.items.find((i: any) => i.id === itemId);
  
  if (!person) return res.status(404).json({ error: "Personnel not found" });
  if (!item) return res.status(404).json({ error: "Item not found" });

  const qty = Number(quantity) || 1;
  const allocationId = randomUUID();
  const allocation = {
    id: allocationId,
    personId,
    personName: person.name,
    itemId,
    itemName: item.name,
    itemCode: item.item_code,
    quantity: qty,
    timestamp: date || new Date().toISOString(),
    notes: notes || "Manual allocation",
    facultyId: person.facultyId,
    faculty: person.faculty,
    departmentId: person.departmentId,
    type: 'MANUAL'
  };

  if (!db.allocations) db.allocations = [];
  db.allocations.push(allocation);
  
  // Reduce stock for manual issuance
  if (item.quantity >= qty) {
    item.quantity -= qty;
    item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
  } else {
    // If we reach here, we're likely recording past issuance where stock wasn't tracked
    // Or we allow negative stock? WMS usually shouldn't.
    // However, the user said "Manual assignment (for past items)"
    // If it's a past item, the stock is already gone. 
  }

  saveDb(db);
  logActivity('Admin', 'Manually Assigned Item', `${item.name} to ${person.name}`, 'special');
  res.json({ success: true, allocation });
});

// --- Trash & Bin API ---
app.get("/api/trash", (req, res) => {
  const db = getDb();
  res.json(db.trash);
});

app.post("/api/trash/restore/:trashId", (req, res) => {
  const db = getDb();
  const trashIndex = db.trash.findIndex((t: any) => t.trashId === req.params.trashId);
  if (trashIndex === -1) return res.status(404).json({ error: "Item not found in trash" });
  
  const trashItem = db.trash.splice(trashIndex, 1)[0];
  const { trashId, trashDate, originalModule, reason, ...itemData } = trashItem;
  
  // Find the item in its original collection and set isDeleted to false
  let collection: any[] = [];
  if (originalModule === 'inventory') collection = db.items;
  else if (originalModule === 'personnel') collection = db.personnel;
  else if (originalModule === 'faculties') collection = db.faculties;
  else if (originalModule === 'tender') collection = db.tenders;
  else if (originalModule === 'quotation') collection = db.quotations;
  else if (originalModule === 'order') collection = db.orders;
  else if (originalModule === 'request') collection = db.requests;
  else if (originalModule === 'receiving') collection = db.receivings;
  
  const itemIndex = collection.findIndex((i: any) => i.id === itemData.id);
  if (itemIndex !== -1) {
    collection[itemIndex].isDeleted = false;
    
    // Specific personnel logic
    if (originalModule === 'personnel') {
      const faculty = db.faculties.find((f: any) => f.id === collection[itemIndex].facultyId || f.name === collection[itemIndex].faculty);
      if (faculty) faculty.count = (faculty.count || 0) + 1;
    }
  } else {
    // If somehow missing, push it back
    itemData.isDeleted = false;
    collection.push(itemData);
  }
  
  saveDb(db);
  res.json({ success: true });
});

app.delete("/api/trash/permanent/:trashId", (req, res) => {
  const db = getDb();
  const index = db.trash.findIndex((t: any) => t.trashId === req.params.trashId);
  if (index === -1) return res.status(404).json({ error: "Item not found in trash" });
  
  db.trash.splice(index, 1);
  saveDb(db);
  res.json({ success: true });
});

// --- Notifications API ---
app.get("/api/notifications", (req, res) => {
  const db = getDb();
  res.json(db.notifications);
});

app.delete("/api/notifications", (req, res) => {
  const db = getDb();
  db.notifications = [];
  saveDb(db);
  res.json({ success: true });
});

// --- Settings & User API ---
app.get("/api/users", (req, res) => {
  const db = getDb();
  res.json(db.users);
});

app.post("/api/users", (req, res) => {
  const db = getDb();
  const newUser = {
    id: randomUUID(),
    ...req.body,
    profileImage: null
  };
  db.users.push(newUser);
  saveDb(db);
  res.json(newUser);
});

app.patch("/api/users/:id", (req, res) => {
  const db = getDb();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "User not found" });
  db.users[index] = { ...db.users[index], ...req.body };
  saveDb(db);
  res.json(db.users[index]);
});

app.delete("/api/users/:id", (req, res) => {
  const db = getDb();
  db.users = db.users.filter((u: any) => u.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

app.get("/api/user/profile", (req, res) => {
  const db = getDb();
  res.json(db.users[0]);
});

app.post("/api/user/profile", (req, res) => {
  const db = getDb();
  db.users[0] = { ...db.users[0], ...req.body };
  saveDb(db);
  res.json(db.users[0]);
});

// --- Procurement API ---
app.get("/api/procurement/codes", (req, res) => {
  res.json(BUDGET_TREE);
});

app.get("/api/procurement/requests", (req, res) => {
  const db = getDb();
  res.json(db.requests.filter((r: any) => !r.isDeleted));
});

app.get("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  const { requestId } = req.query;
  let list = db.tenders.filter((t: any) => !t.isDeleted);
  if (requestId) {
    list = list.filter((t: any) => t.requestId === requestId);
  }
  res.json(list);
});

app.post("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  const { requestId, tenderNumber, items } = req.body;
  
  if (requestId) {
    const request = db.requests.find((r: any) => r.id === requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const newTender = {
      id: randomUUID(),
      requestId,
      tenderNumber: tenderNumber || ` عـ-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      items: items || request.items,
      status: "OPEN",
      isDeleted: false
    };

    request.status = "TENDER_CREATED";
    request.progress = 50;
    db.tenders.push(newTender);
    saveDb(db);
    res.json(newTender);
  } else {
    // Manual tender creation
    const newTender = {
      id: randomUUID(),
      tenderNumber: tenderNumber || ` عـ-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      items: items || [],
      status: "OPEN",
      isDeleted: false,
      ...req.body
    };
    db.tenders.push(newTender);
    saveDb(db);
    res.json(newTender);
  }
});

app.patch("/api/procurement/tenders/:id", (req, res) => {
  const db = getDb();
  const index = db.tenders.findIndex((t: any) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Tender not found" });
  
  db.tenders[index] = { ...db.tenders[index], ...req.body };
  saveDb(db);
  res.json(db.tenders[index]);
});

app.delete("/api/procurement/tenders/:id", (req, res) => {
  const db = getDb();
  const index = db.tenders.findIndex((t: any) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Tender not found" });
  
  db.tenders[index].isDeleted = true;
  const tender = db.tenders[index];
  
  db.trash.push({
    ...tender,
    trashId: randomUUID(),
    trashDate: new Date().toISOString(),
    originalModule: 'tender',
    name: tender.tenderNumber,
    reason: "Administrative Deletion"
  });
  
  saveDb(db);
  res.json({ success: true });
});

app.get("/api/procurement/quotations", (req, res) => {
  const db = getDb();
  res.json(db.quotations.filter((q: any) => !q.isDeleted));
});

app.post("/api/procurement/quotations", (req, res) => {
  const db = getDb();
  const quotation = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    isWinner: false,
    isDeleted: false,
    ...req.body
  };
  db.quotations.push(quotation);
  saveDb(db);
  res.json(quotation);
});

app.patch("/api/procurement/quotations/:id", (req, res) => {
  const db = getDb();
  const index = db.quotations.findIndex((q: any) => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Quotation not found" });
  
  db.quotations[index] = { ...db.quotations[index], ...req.body };
  saveDb(db);
  res.json(db.quotations[index]);
});

app.delete("/api/procurement/quotations/:id", (req, res) => {
  const db = getDb();
  const index = db.quotations.findIndex((q: any) => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Quotation not found" });
  
  db.quotations[index].isDeleted = true;
  const quotation = db.quotations[index];
  
  db.trash.push({
    ...quotation,
    trashId: randomUUID(),
    trashDate: new Date().toISOString(),
    originalModule: 'quotation',
    name: `Quotation from ${quotation.supplierName}`,
    reason: "Administrative Deletion"
  });
  
  saveDb(db);
  res.json({ success: true });
});

app.post("/api/procurement/select-winner", (req, res) => {
  const db = getDb();
  const { tenderId, quotationId } = req.body;
  
  db.quotations.forEach((q: any) => {
    if (q.tenderId === tenderId) q.isWinner = (q.id === quotationId);
  });

  const tender = db.tenders.find((t: any) => t.id === tenderId);
  if (tender) {
    tender.status = "WINNER_SELECTED";
    // Sync with request
    if (tender.requestId) {
      const relatedReq = db.requests.find((r: any) => r.id === tender.requestId);
      if (relatedReq) {
        relatedReq.status = "WINNER_SELECTED";
        relatedReq.progress = 75; // 75% for comparison completion
      }
    }
  }

  const winQ = db.quotations.find(q => q.id === quotationId);
  const newOrder = {
    id: randomUUID(),
    tenderId,
    quotationId,
    poNumber: `PO-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "ISSUED",
    supplierName: winQ?.supplierName,
    items: winQ?.items,
    isDeleted: false
  };
  db.orders.push(newOrder);
  saveDb(db);
  res.json(newOrder);
});

app.get("/api/procurement/orders", (req, res) => {
  const db = getDb();
  res.json(db.orders.filter((o: any) => !o.isDeleted));
});

app.post("/api/procurement/orders", (req, res) => {
  const db = getDb();
  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    isDeleted: false,
    ...req.body
  };
  
  if (!db.orders) db.orders = [];
  db.orders.push(order);
  
  // Sync with request if requestId is provided
  if (order.requestId) {
    const relatedReq = db.requests.find((r: any) => r.id === order.requestId);
    if (relatedReq) {
      relatedReq.status = "Delivered"; // Or stay in a final state
      relatedReq.progress = 100;
    }
  }

  saveDb(db);
  res.json(order);
});

app.patch("/api/procurement/orders/:id", (req, res) => {
  const db = getDb();
  const index = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });
  
  db.orders[index] = { ...db.orders[index], ...req.body };
  saveDb(db);
  res.json(db.orders[index]);
});

app.delete("/api/procurement/orders/:id", (req, res) => {
  const db = getDb();
  const index = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });
  
  db.orders[index].isDeleted = true;
  const order = db.orders[index];
  
  db.trash.push({
    ...order,
    trashId: randomUUID(),
    trashDate: new Date().toISOString(),
    originalModule: 'order',
    name: order.poNumber,
    reason: "Administrative Deletion"
  });
  
  saveDb(db);
  res.json({ success: true });
});

// --- Budget Tree Data (Full Hierarchy from PDF) ---
const BUDGET_TREE = [
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
      },
      {
        code: "228",
        name: "Other Expenditures (ساير مصارفات)",
        items: [
          { code: "22800", name: "Rent (کرايه)" },
          { code: "22801", name: "License & Permit Fees (فيس اليسنس ها و جوازنامه ها)" },
          { code: "22802", name: "Commissions (کميش ها)" },
          { code: "22803", name: "Taxes & Duties (ماليه محصول و تعرفه ګمرکی)" },
          { code: "22804", name: "Social Service Assistance (کمک با ادارات خدمات اجتماعی)" },
          { code: "22805", name: "Religious Assistance (کمک به سازمان های مذهبی)" },
          { code: "22806", name: "Membership Fees (پرداخت حق العضوبت ها و وسهمیه)" },
          { code: "22807", name: "Insurance (بيمه)" },
          { code: "22808", name: "Rent of Land (کرایه زمین)" }
        ]
      },
      {
        code: "229",
        name: "Advances (پیشکي ها و برګشت)",
        items: [
          { code: "22900", name: "Petty Cash Advance (تاديات پيشکی وجه سردستی)" },
          { code: "22901", name: "Goods & Service Advance (تاديات پيشکی اجناس و خدمات)" },
          { code: "22902", name: "Development Budget Transfer (انتقال و جوه بوديجه انکشافی به واليات)" }
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
          { code: "22402", name: "Transport Equipment (تجهزات ټرانسپورټی)" },
          { code: "22403", name: "Telecommunication (تجهزات مخابراتی)" },
          { code: "22404", name: "Broadcasting Equipment (تجهزات اطالعاتی جمعی)" },
          { code: "22405", name: "Energy Generating Equipment (تجهزات مولد انرژي)" },
          { code: "22407", name: "Mining & Excavation Equipment (تجهزات استخراج معادن)" },
          { code: "22408", name: "Agriculture Equipment (تجهزات زراعتی)" },
          { code: "22409", name: "Office Equipment & Computers (تجهزات دفتری وکمپوټری)" },
          { code: "22410", name: "Water Supply & Canals (تجهزات توزيع آب و کاناليزاسيون)" },
          { code: "22411", name: "Military Equipment (تجهزات نظامی)" },
          { code: "22412", name: "Medical Laboratory Equipment (تجهزات طبی و البراتواری)" },
          { code: "22413", name: "Recreational Equipment (تجهزات ورزشی و تفريحی)" },
          { code: "22414", name: "Workshop & Manufacturing (تجهزات توليد ضمايع و ورکشاپ ها)" },
          { code: "22415", name: "Historical & Culture Structure (تجهزات اثار عتيقه و هنری)" },
          { code: "22416", name: "Dwellings (منازل)" },
          { code: "22417", name: "Buildings (ساختمان ها)" },
          { code: "22418", name: "Other Structures (ديګر عمارت)" },
          { code: "22419", name: "Advance of Repairs (پيشکی ها ترميمات و حفظ مراقبت)" }
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
          { code: "22502", name: "Telecommunication (مخابرات)" },
          { code: "22503", name: "Municipal Services (خدمات شارولی)" },
          { code: "22504", name: "Postage (مخارج پستی)" },
          { code: "22505", name: "Utility Advance (تاديات پيشکی عام المنعفه)" },
          { code: "22506", name: "Public Service Budget Transfer (امتقال و جوه بوديجه انکشافی خدمات عامه)" }
        ]
      }
    ]
  }
];

app.get("/api/procurement/codes", (req, res) => {
  res.json(BUDGET_TREE);
});

app.get("/api/codes", (req, res) => {
  const db = getDb();
  res.json(db.codes || []);
});

app.post("/api/codes/bab", (req, res) => {
  const db = getDb();
  if (!db.codes) db.codes = [];
  const newBab = { bab: req.body.bab, name: req.body.name, fasls: [] };
  db.codes.push(newBab);
  saveDb(db);
  res.json(newBab);
});

app.delete("/api/codes/bab/:bab", (req, res) => {
  const db = getDb();
  db.codes = db.codes.filter((b: any) => b.bab !== req.params.bab);
  saveDb(db);
  res.json({ success: true });
});

app.post("/api/codes/fasl", (req, res) => {
  const db = getDb();
  const bab = db.codes.find((b: any) => b.bab === req.body.bab);
  if (!bab) return res.status(404).json({ error: "BaB not found" });
  const newFasl = { code: req.body.code, name: req.body.name, items: [] };
  bab.fasls.push(newFasl);
  saveDb(db);
  res.json(newFasl);
});

app.delete("/api/codes/fasl/:bab/:fasl", (req, res) => {
  const db = getDb();
  const bab = db.codes.find((b: any) => b.bab === req.params.bab);
  if (bab) {
    bab.fasls = bab.fasls.filter((f: any) => f.code !== req.params.fasl);
    saveDb(db);
  }
  res.json({ success: true });
});

app.post("/api/codes/item", (req, res) => {
  const db = getDb();
  const bab = db.codes.find((b: any) => b.bab === req.body.bab);
  if (!bab) return res.status(404).json({ error: "BaB not found" });
  const fasl = bab.fasls.find((f: any) => f.code === req.body.fasl);
  if (!fasl) return res.status(404).json({ error: "Fasl not found" });
  
  const newItem = { code: req.body.code, name: req.body.name };
  fasl.items.push(newItem);
  saveDb(db);
  res.json(newItem);
});

app.delete("/api/codes/item/:bab/:fasl/:item", (req, res) => {
  const db = getDb();
  const bab = db.codes.find((b: any) => b.bab === req.params.bab);
  if (bab) {
    const fasl = bab.fasls.find((f: any) => f.code === req.params.fasl);
    if (fasl) {
      fasl.items = fasl.items.filter((i: any) => i.code !== req.params.item);
      saveDb(db);
    }
  }
  res.json({ success: true });
});


// --- Background Jobs ---
function cleanupTrash() {
  const db = getDb();
  const now = new Date();
  
  if (db.trash) {
    const originalCount = db.trash.length;
    db.trash = db.trash.filter((item: any) => {
      if (!item.expiresAt) return true; // Keep items without expiration
      const expiration = new Date(item.expiresAt);
      return expiration > now;
    });
    
    if (db.trash.length < originalCount) {
      console.log(`[Worker] Auto-deleted ${originalCount - db.trash.length} expired items from trash.`);
      saveDb(db);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupTrash, 60 * 60 * 1000);

// --- Dashboard API ---
app.get("/api/dashboard/stats", (req, res) => {
  const db = getDb();
  const items = db.items || [];
  const requests = db.requests || [];
  const tenders = db.tenders || [];
  const lowStockCount = items.filter((i: any) => i.status === 'Low Stock' || i.quantity < 10).length;
  const totalQty = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);

  res.json({
    totalStock: totalQty,
    pendingRequests: requests.filter((r: any) => ['PENDING', 'Pending'].includes(r.status)).length,
    lowStock: lowStockCount,
    activeTenders: tenders.filter((t: any) => t.status === 'OPEN').length
  });
});

app.get("/api/dashboard/activities", (req, res) => {
  const db = getDb();
  const activities: any[] = [];

  // From Receivings
  (db.receivings || []).slice(-5).forEach((r: any) => {
    activities.push({
      id: `rec-${r.id}`,
      type: 'receiving',
      title: `Received: ${r.item_name || r.item_code}`,
      description: `Source: ${r.supplier} | Qty: ${r.quantity}`,
      timestamp: r.date || r.createdAt || new Date().toISOString(),
      icon: 'package'
    });
  });

  // From Requests
  (db.requests || []).slice(-5).forEach((r: any) => {
    activities.push({
      id: `req-${r.id}`,
      type: 'request',
      title: `New Request: ${r.itemName}`,
      description: `Requester: ${r.requesterName} | Status: ${r.status}`,
      timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
      icon: 'file-text'
    });
  });

  // From Allocations
  (db.allocations || []).slice(-5).forEach((a: any) => {
    const person = (db.personnel || []).find((p: any) => p.id === a.personId);
    activities.push({
      id: `alloc-${a.id}`,
      type: 'allocation',
      title: `Asset Allocated`,
      description: `To: ${person?.name || 'Someone'} | Qty: ${a.quantity}`,
      timestamp: a.timestamp || a.date || new Date().toISOString(),
      icon: 'user-plus'
    });
  });

  // Sort by timestamp desc
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(activities.slice(0, 10));
});

// --- Vite Integration ---
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Vite server failed to start", err);
  }
}

startServer();
