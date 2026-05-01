import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
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
app.use(express.json());

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
function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { 
        items: [
          { id: '1', name: 'Printing Paper A4', item_code: '22301', category: 'Stationery', quantity: 500, unit: 'BOX', location: 'Zone A-01', status: 'In Stock', department: 'Engineering' },
          { id: '2', name: 'Engine Oil 10W40', item_code: '22601', category: 'Fuel', quantity: 50, unit: 'LTR', location: 'Cold Storage', status: 'In Stock', department: 'Engineering' },
          { id: '3', name: 'Microscope Slides', item_code: '22700', category: 'Laboratory', quantity: 200, unit: 'PKT', location: 'Lab A', status: 'In Stock', department: 'Medicine' },
          { id: '4', name: 'Lab Coats', item_code: '22704', category: 'Clothing', quantity: 5, unit: 'PCS', location: 'Lab B', status: 'Low Stock', department: 'Medicine' },
          { id: '5', name: 'Calculatory Devices', item_code: '22701', category: 'Electronics', quantity: 150, unit: 'UNIT', location: 'Zone C', status: 'In Stock', department: 'Engineering' },
          { id: '6', name: 'Server Rack', item_code: '22701', category: 'Electronics', quantity: 2, unit: 'UNIT', location: 'Data Center', status: 'Low Stock', department: 'Computer Science' },
          { id: '7', name: 'Fertilizer Samples', item_code: '22700', category: 'Agricultural', quantity: 80, unit: 'KG', location: 'Silo 1', status: 'In Stock', department: 'Agriculture' },
          { id: '8', name: 'Keyboard Mechanical', item_code: '22701', category: 'Electronics', quantity: 120, unit: 'PCS', location: 'Lab IT', status: 'In Stock', department: 'Computer Science' }
        ], 
        receivings: [
          { id: 'R1', date: new Date(Date.now() - 3600000).toISOString(), item_code: '22301', item_name: 'Printing Paper A4', quantity: 100, supplier: 'Kabul Stationers', received_by: 'Ahmed', status: 'COMPLETED' },
          { id: 'R2', date: new Date(Date.now() - 7200000).toISOString(), item_code: '22601', item_name: 'Engine Oil 10W40', quantity: 200, supplier: 'Petro Supply', received_by: 'Jan', status: 'COMPLETED' },
          { id: 'R3', date: new Date(Date.now() - 86400000).toISOString(), item_code: '22700', item_name: 'Microscope Slides', quantity: 50, supplier: 'MediLab Co', received_by: 'Karim', status: 'COMPLETED' },
          { id: 'R4', date: new Date(Date.now() - 172800000).toISOString(), item_code: '22701', item_name: 'Server Rack', quantity: 1, supplier: 'IT Solutions', received_by: 'Nadir', status: 'COMPLETED' }
        ], 
        requests: [], 
        tenders: [], 
        quotations: [], 
        orders: [],
        trash: [],
        notifications: [],
        faculties: [
          { name: "Medicine", image: "https://images.unsplash.com/photo-1576091160550-217359f48866?w=200&h=200&fit=crop", count: 12 },
          { name: "Computer Science", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop", count: 8 },
          { name: "Engineering", image: "https://images.unsplash.com/photo-1581094724018-0902f5a8987b?w=200&h=200&fit=crop", count: 15 },
          { name: "Agriculture", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop", count: 5 },
        ],
        personnel: [
          { id: 'p1', faculty: "Medicine", name: "Dr. Ahmad Shah", image: "https://i.pravatar.cc/150?u=ahmad", item: "Microscope X1", date: "2024-05-01", exists: true },
          { id: 'p2', faculty: "Medicine", name: "Dr. Laila Jan", image: "https://i.pravatar.cc/150?u=laila", item: "None", date: "N/A", exists: true },
          { id: 'p3', faculty: "Computer Science", name: "Eng. Mustafa", image: "https://i.pravatar.cc/150?u=mustafa", item: "Server Rack", date: "2024-04-28", exists: true },
        ],
        users: [{ 
          id: 'admin', 
          name: 'System Admin',
          email: 'admin@kandahar.edu.af', 
          password: bcrypt.hashSync("admin123", 10),
          role: 'Admin',
          profileImage: null 
        }]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(content || '{"items":[], "receivings":[], "requests":[], "tenders":[], "quotations":[], "orders":[], "trash":[], "notifications":[], "users":[]}');
    
    // Repair/Sync Admin User (Self-healing)
    const adminIndex = db.users.findIndex((u: any) => u.email === 'admin@kandahar.edu.af');
    if (adminIndex === -1) {
      db.users.push({
        id: 'admin',
        name: 'System Admin',
        email: 'admin@kandahar.edu.af',
        password: bcrypt.hashSync("admin123", 10),
        role: 'Admin',
        profileImage: null
      });
      saveDb(db);
    } else {
      // Force update password for the admin user to ensure "admin123" works
      const admin = db.users[adminIndex];
      if (!admin.password || admin.password.length < 20) {
        admin.password = bcrypt.hashSync("admin123", 10);
        admin.role = 'Admin';
        saveDb(db);
      }
    }
    
    // Ensure faculties and personnel exist
    if (!db.faculties) db.faculties = [];
    if (!db.personnel) db.personnel = [];
    
    return db;
  } catch (error) {
    console.error("Database read error:", error);
    return { items: [], receivings: [], requests: [], tenders: [], quotations: [], orders: [], trash: [], notifications: [], users: [] };
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database save error:", error);
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Inventory API ---
app.get("/api/items", (req, res) => {
  const db = getDb();
  res.json(db.items);
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
  
  const item = db.items.splice(index, 1)[0];
  db.trash.push({
    ...item,
    trashId: randomUUID(),
    deletedAt: new Date().toISOString(),
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

// --- Email API ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER || "your_email@gmail.com",
    pass: process.env.MAIL_PASS || "your_app_password"
  }
});

app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("Email credentials not configured in environment variables.");
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER || "your_email@gmail.com",
      to,
      subject,
      text,
      html: html || text
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
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
      await transporter.sendMail({
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
  res.json(db.requests);
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

// --- Trash & Bin API ---
app.get("/api/trash", (req, res) => {
  const db = getDb();
  res.json(db.trash);
});

app.post("/api/trash/restore/:trashId", (req, res) => {
  const db = getDb();
  const index = db.trash.findIndex((t: any) => t.trashId === req.params.trashId);
  if (index === -1) return res.status(404).json({ error: "Item not found in trash" });
  
  const item = db.trash.splice(index, 1)[0];
  const { trashId, deletedAt, originalModule, reason, ...originalItem } = item;
  
  if (originalModule === 'inventory') {
    db.items.push(originalItem);
  } else {
    // Default to items if unknown
    db.items.push(originalItem);
  }
  
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

// --- Traceability (Faculties & Personnel) API ---
app.get("/api/faculties", (req, res) => {
  const db = getDb();
  res.json(db.faculties || []);
});

app.post("/api/faculties", (req, res) => {
  const db = getDb();
  if (!db.faculties) db.faculties = [];
  const newFaculty = { ...req.body, count: req.body.count || 0 };
  db.faculties.push(newFaculty);
  saveDb(db);
  res.json(newFaculty);
});

app.get("/api/personnel", (req, res) => {
  const db = getDb();
  res.json(db.personnel || []);
});

app.post("/api/personnel", (req, res) => {
  const db = getDb();
  if (!db.personnel) db.personnel = [];
  const newPerson = { id: randomUUID(), ...req.body };
  db.personnel.push(newPerson);
  
  // Update faculty count
  if (db.faculties) {
    const faculty = db.faculties.find((f: any) => f.name === newPerson.faculty);
    if (faculty) faculty.count = (faculty.count || 0) + 1;
  }
  
  saveDb(db);
  res.json(newPerson);
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
  res.json(db.requests);
});

app.get("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  res.json(db.tenders);
});

app.post("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  const { requestId } = req.body;
  const request = db.requests.find((r: any) => r.id === requestId);
  if (!request) return res.status(404).json({ error: "Request not found" });

  const newTender = {
    id: randomUUID(),
    requestId,
    tenderNumber: ` عـ-${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
    items: request.items,
    status: "OPEN"
  };

  request.status = "TENDER_CREATED";
  db.tenders.push(newTender);
  saveDb(db);
  res.json(newTender);
});

app.get("/api/procurement/quotations", (req, res) => {
  const db = getDb();
  res.json(db.quotations);
});

app.post("/api/procurement/quotations", (req, res) => {
  const db = getDb();
  const quotation = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    isWinner: false,
    ...req.body
  };
  db.quotations.push(quotation);
  saveDb(db);
  res.json(quotation);
});

app.post("/api/procurement/select-winner", (req, res) => {
  const db = getDb();
  const { tenderId, quotationId } = req.body;
  
  db.quotations.forEach((q: any) => {
    if (q.tenderId === tenderId) q.isWinner = (q.id === quotationId);
  });

  const tender = db.tenders.find((t: any) => t.id === tenderId);
  if (tender) tender.status = "WINNER_SELECTED";

  const winQ = db.quotations.find(q => q.id === quotationId);
  const newOrder = {
    id: randomUUID(),
    tenderId,
    quotationId,
    poNumber: `PO-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "ISSUED",
    supplierName: winQ?.supplierName,
    items: winQ?.items
  };
  db.orders.push(newOrder);
  saveDb(db);
  res.json(newOrder);
});

app.get("/api/procurement/orders", (req, res) => {
  const db = getDb();
  res.json(db.orders);
});

app.post("/api/procurement/orders", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const db = getDb();
  const newOrder = {
    id: randomUUID(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  if (!db.orders) db.orders = [];
  db.orders.push(newOrder);
  saveDb(db);
  res.status(201).json(newOrder);
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
  res.json(BUDGET_TREE);
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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Vite server failed to start", err);
  }
}

startServer();
