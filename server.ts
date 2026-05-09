import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { createServer as createViteServer } from "vite";
import db, { migrateFromJson, BUDGET_TREE } from "./database";
import forecastRoutes from "./modules/forecast/forecast.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "kandahar_procurement_safe_key_2024";

// Run migration
migrateFromJson();

// --- Activity Logging Helper ---
function logActivity(user: string, action: string, target: string, type: string) {
  const newActivity = {
    id: randomUUID(),
    user,
    action,
    target,
    type,
    timestamp: new Date().toISOString()
  };
  
  db.prepare('INSERT INTO activities (id, user, action, target, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
    .run(newActivity.id, newActivity.user, newActivity.action, newActivity.target, newActivity.type, newActivity.timestamp);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
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

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    return res.status(404).json({ error: "Email not found in our records." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);

  console.log(`[AUTH] Password reset directly for: ${email}`);
  logActivity('System', 'Password Reset', email, 'security');
  
  res.json({ success: true, message: "Password updated successfully." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Inventory API ---
app.get("/api/items", (req, res) => {
  const items = db.prepare('SELECT * FROM items WHERE isDeleted = 0').all();
  res.json(items);
});

app.get("/api/categories", (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND isDeleted = 0').all().map((c: any) => c.category);
  res.json(categories.length ? categories : ["Stationery", "Furniture", "Electronics", "Fuel", "Maintenance"]);
});

app.post("/api/items", (req, res) => {
  const id = randomUUID();
  const { name, item_code, category, quantity, unit, location, department, qrCodeId, qrCodeValue, syncStatus, localTempId } = req.body;
  const qty = Number(quantity) || 0;
  const status = qty > 10 ? 'In Stock' : (qty > 0 ? 'Low Stock' : 'Out of Stock');

  db.prepare('INSERT INTO items (id, name, item_code, category, quantity, unit, location, status, department, isDeleted, qrCodeId, qrCodeValue, syncStatus, localTempId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)')
    .run(id, name, item_code, category, qty, unit, location, status, department, qrCodeId || null, qrCodeValue || null, syncStatus || 'synced', localTempId || null);
    
  const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  logActivity('Admin User', 'Added Item', name, 'create');
  res.json(newItem);
});

app.patch("/api/items/:id", (req, res) => {
  const fields = req.body;
  const id = req.params.id;
  
  if (fields.quantity !== undefined) {
    fields.quantity = Number(fields.quantity);
    fields.status = fields.quantity > 10 ? 'In Stock' : (fields.quantity > 0 ? 'Low Stock' : 'Out of Stock');
  }

  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE items SET ${setClause} WHERE id = ?`).run(...values, id);
  const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.json(updatedItem);
});

// --- QR Code API ---
app.get("/api/items/qr/:qrCodeId", (req, res) => {
  const { qrCodeId } = req.params;
  const item = db.prepare('SELECT * FROM items WHERE qrCodeId = ? AND isDeleted = 0').get(qrCodeId);
  if (!item) return res.status(404).json({ error: "Item not found or invalid QR code." });
  res.json(item);
});

app.post("/api/items/qr/resolve", (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ error: "QR data is required" });

  // Try to find by qrCodeId or qrCodeValue or item_code
  let item: any = db.prepare('SELECT * FROM items WHERE (qrCodeId = ? OR qrCodeValue = ? OR item_code = ?) AND isDeleted = 0').get(qrData, qrData, qrData);
  
  if (!item) {
    // Also check receivings
    const rec: any = db.prepare('SELECT * FROM receivings WHERE (qrCodeId = ? OR qrCodeValue = ? OR item_code = ?) AND isDeleted = 0').get(qrData, qrData, qrData);
    if (rec) {
      return res.json({ type: 'receiving', data: rec, syncStatus: rec.syncStatus || 'synced' });
    }
    return res.status(404).json({ error: "Item not found or invalid QR code." });
  }
  
  res.json({ type: 'item', data: item, syncStatus: item.syncStatus || 'synced' });
});

app.post("/api/items/:id/qrcode", (req, res) => {
  const { id } = req.params;
  const { qrCodeId, qrCodeValue } = req.body;
  
  db.prepare('UPDATE items SET qrCodeId = ?, qrCodeValue = ?, syncStatus = ? WHERE id = ?')
    .run(qrCodeId, qrCodeValue, 'synced', id);
  
  const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.json(updatedItem);
});

app.post("/api/items/:id/trash", (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;
  
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
  if (!item) return res.status(404).json({ error: "Item not found" });

  db.transaction(() => {
    db.prepare('UPDATE items SET isDeleted = 1 WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, expiresAt, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, item.name, new Date().toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 'inventory', reason || "System Cleanup", JSON.stringify(item));
  })();
  
  res.json({ success: true });
});

// --- Reports API ---
app.get("/api/reports/inventory", (req, res) => {
  const items = db.prepare('SELECT * FROM items WHERE isDeleted = 0').all();
  const lowStock = items.filter((i: any) => i.status === 'Low Stock');
  res.json({
    totalItems: items.length,
    totalStock: items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0),
    lowStockCount: lowStock.length,
    items: items
  });
});

app.get("/api/activities", (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 100').all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Settings API ---
app.get("/api/settings", (req, res) => {
  const settings: any = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  rows.forEach((r: any) => {
    settings[r.key] = JSON.parse(r.value);
  });
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  const settings = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(settings).forEach(([k, v]) => {
    stmt.run(k, JSON.stringify(v));
  });
  res.json(settings);
});

// --- Mailing Helper ---
async function getTransporter() {
  const settings: any = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  rows.forEach((r: any) => {
    settings[r.key] = JSON.parse(r.value);
  });
  
  let mailUser = settings.mailUser || process.env.MAIL_USER || "your_email@gmail.com";
  let mailPass = settings.mailPass || process.env.MAIL_PASS || "your_app_password";
  
  if (Array.isArray(settings.mailConfigs) && settings.mailConfigs.length > 0) {
    const defaultConfig = settings.mailConfigs.find((c: any) => c.isDefault) || settings.mailConfigs[0];
    if (defaultConfig) {
      mailUser = defaultConfig.user;
      mailPass = defaultConfig.pass;
    }
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });
}

// --- Email API ---
app.get("/api/emails", (req, res) => {
  const emails = db.prepare('SELECT * FROM sent_emails').all().map((e: any) => JSON.parse(e.data));
  res.json(emails);
});

app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html, requestId, type } = req.body;
  
  const mailSettings: any = {};
  db.prepare('SELECT * FROM settings WHERE key IN (?, ?)').all('mailUser', 'mailPass').forEach((r: any) => {
    mailSettings[r.key] = JSON.parse(r.value);
  });

  const mailUser = mailSettings.mailUser || process.env.MAIL_USER;
  const mailPass = mailSettings.mailPass || process.env.MAIL_PASS;

  let success = false;
  let errorMsg = null;
  let simulated = true;

  try {
    const isRealReady = !!mailUser && 
                       !!mailPass && 
                       mailPass !== "your_app_password" &&
                       mailUser.includes('@');

    if (isRealReady) {
      simulated = false;
      const transporter = await getTransporter();
      try {
        await transporter.sendMail({
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
      } else {
        errorMsg = "System in Simulation Mode: Gmail credentials not fully configured in Settings. Please enter your Gmail and App Password.";
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

    db.prepare('INSERT INTO sent_emails (id, data) VALUES (?, ?)').run(emailLog.id, JSON.stringify(emailLog));
    
    res.json({ ...emailLog, success, simulated });
  } catch (error) {
    res.status(500).json({ error: "System failure in email module" });
  }
});

app.patch("/api/emails/:id", (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.json({ success: true });

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  
  try {
    db.prepare(`UPDATE sent_emails SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/emails", auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM sent_emails ORDER BY id DESC').all().map((r: any) => JSON.parse(r.data));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Receiving API ---
app.get("/api/receivings", (req, res) => {
  const rows = db.prepare('SELECT * FROM receivings WHERE isDeleted = 0').all();
  res.json(rows);
});

app.post("/api/v1/receiving", (req, res) => {
  const { item_code, quantity, item_name, supplier, date, invoice_number, qrCodeId, qrCodeValue, syncStatus, localTempId } = req.body;
  const qtyNum = Number(quantity);
  
  const exists = db.prepare('SELECT id FROM receivings WHERE isDeleted = 0 AND item_code = ? AND supplier = ? AND date = ? AND invoice_number = ?')
    .get(item_code, supplier, date, invoice_number);
  
  if (exists) {
    return res.status(409).json({ error: "Duplicate record already exists in ledger" });
  }

  const item = db.prepare('SELECT * FROM items WHERE item_code = ?').get(item_code) as any;
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.transaction(() => {
    db.prepare('INSERT INTO receivings (id, date, item_code, item_name, quantity, supplier, received_by, invoice_number, createdAt, isDeleted, qrCodeId, qrCodeValue, syncStatus, localTempId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)')
      .run(id, date, item_code, item_name || (item ? item.name : item_code), qtyNum, supplier, req.body.received_by, invoice_number, createdAt, qrCodeId || null, qrCodeValue || null, syncStatus || 'synced', localTempId || null);

    if (item) {
      const newQty = (Number(item.quantity) || 0) + qtyNum;
      const status = newQty > 10 ? 'In Stock' : 'Low Stock';
      db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, item.id);
    } else {
      db.prepare('INSERT INTO items (id, name, item_code, quantity, unit, status, location, isDeleted, qrCodeId, qrCodeValue, syncStatus, localTempId) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)')
        .run(randomUUID(), item_name || item_code, item_code, qtyNum, req.body.unit || 'PCS', 'In Stock', req.body.warehouse_location || 'General', qrCodeId || null, qrCodeValue || null, syncStatus || 'synced', localTempId || null);
    }

    db.prepare('INSERT INTO stock_transactions (id, itemId, type, quantity, supplier, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), item ? item.id : id, 'IN', qtyNum, supplier, createdAt);
  })();

  const newReceiving = db.prepare('SELECT * FROM receivings WHERE id = ?').get(id);
  logActivity('Logistics Dept', 'Received Inventory', item_name || item_code, 'create');
  res.json(newReceiving);
});

app.patch("/api/v1/receiving/:id", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const id = req.params.id;
  const fields = req.body;
  
  const oldRec = db.prepare('SELECT * FROM receivings WHERE id = ?').get(id) as any;
  if (!oldRec) return res.status(404).json({ error: "Record not found" });

  if (fields.quantity !== undefined) {
    fields.quantity = Number(fields.quantity);
  }

  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.transaction(() => {
    db.prepare(`UPDATE receivings SET ${setClause} WHERE id = ?`).run(...values, id);

    if (fields.quantity !== undefined) {
      const item = db.prepare('SELECT * FROM items WHERE item_code = ?').get(oldRec.item_code) as any;
      if (item) {
        const diff = fields.quantity - oldRec.quantity;
        const newQty = Math.max(0, (Number(item.quantity) || 0) + diff);
        const status = newQty > 10 ? 'In Stock' : (newQty > 0 ? 'Low Stock' : 'Out of Stock');
        db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, item.id);
      }
    }
  })();

  const updatedRec = db.prepare('SELECT * FROM receivings WHERE id = ?').get(id);
  res.json({ receiving: updatedRec });
});

app.delete("/api/v1/receiving/:id", auth, checkRole(["Admin", "SuperAdmin"]), (req: any, res) => {
  const id = req.params.id;
  const rec = db.prepare('SELECT * FROM receivings WHERE id = ?').get(id) as any;
  
  if (!rec) {
    return res.status(404).json({ error: "Record not found in the Database ledger." });
  }
  
  db.transaction(() => {
    db.prepare('UPDATE receivings SET isDeleted = 1 WHERE id = ?').run(id);
    
    if (rec.item_code) {
      const item = db.prepare('SELECT * FROM items WHERE item_code = ?').get(rec.item_code) as any;
      if (item) {
        const newQty = Math.max(0, (Number(item.quantity) || 0) - (Number(rec.quantity) || 0));
        const status = newQty > 10 ? 'In Stock' : (newQty > 0 ? 'Low Stock' : 'Out of Stock');
        db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, item.id);
      }
    }

    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, rec.item_name || rec.item_code, new Date().toISOString(), 'receiving', `System Delete by ${req.user.email}`, JSON.stringify(rec));
  })();
  
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
      const transporter = await getTransporter();
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
  const items = db.prepare('SELECT * FROM items WHERE isDeleted = 0').all();
  const receivings = db.prepare('SELECT * FROM receivings WHERE isDeleted = 0').all();

  const analysis = items.map((item: any) => {
    const totalReceived = (receivings || [])
      .filter((r: any) => r.item_code === item.item_code)
      .reduce((sum: number, r: any) => sum + (Number(r.quantity) || 0), 0);
    
    const yearlyTrend = Number(totalReceived) || 100;
    const estimatedNeed = Math.ceil(yearlyTrend * 1.15);
    const gap = Math.max(0, estimatedNeed - (Number(item.quantity) || 0));
    
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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const forecast = months.map((m, i) => ({
    month: m,
    actual: 100 + Math.floor(Math.random() * 50) + (i * 5),
    projected: 110 + Math.floor(Math.random() * 60) + (i * 7)
  }));
  res.json(forecast);
});

app.get("/api/inventory/allocation", (req, res) => {
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
  const requests = db.prepare('SELECT * FROM requests WHERE isDeleted = 0').all().map((r: any) => ({
    ...r,
    items: JSON.parse(r.items || '[]')
  }));
  res.json(requests);
});

app.post("/api/distribute", auth, (req: any, res) => {
  const { itemId, quantity, personName, faculty, department, notes } = req.body;
  const qty = Number(quantity) || 1;

  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as any;
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Deduct stock
    const newQty = Math.max(0, item.quantity - qty);
    const status = newQty > 10 ? 'In Stock' : (newQty > 0 ? 'Low Stock' : 'Out of Stock');
    
    db.transaction(() => {
      db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, itemId);
      
      const id = randomUUID();
      db.prepare(`
        INSERT INTO allocations (id, personId, personName, itemId, itemName, itemCode, quantity, timestamp, notes, facultyId, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISTRIBUTION')
      `).run(id, 'REQ-DIST', personName, itemId, item.name, item.item_code, qty, new Date().toISOString(), notes || "Request Distribution", faculty);

      db.prepare('INSERT INTO notifications (id, title, message, time, type) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), "Stock Distributed", `${qty} units of ${item.name} given to ${personName}`, "Just now", "inventory");
    })();

    res.json({ success: true, newQuantity: newQty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/return-stock", auth, (req: any, res) => {
  const { itemId, quantity, reason } = req.body;
  const qty = Number(quantity) || 1;

  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as any;
    if (!item) return res.status(404).json({ error: "Item not found" });

    const newQty = (item.quantity || 0) + qty;
    const status = newQty > 10 ? 'In Stock' : (newQty > 0 ? 'Low Stock' : 'Out of Stock');

    db.transaction(() => {
      db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, itemId);
      
      db.prepare('INSERT INTO notifications (id, title, message, time, type) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), "Stock Returned", `${qty} units of ${item.name} returned to inventory.`, "Just now", "inventory");
    })();

    res.json({ success: true, newQuantity: newQty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/requests", (req, res) => {
  const id = randomUUID();
  const trackingId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = new Date().toISOString();
  const { projectName, requestedBy, items } = req.body;

  db.transaction(() => {
    db.prepare('INSERT INTO requests (id, trackingId, projectName, requestedBy, items, status, progress, createdAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)')
      .run(id, trackingId, projectName, requestedBy, JSON.stringify(items || []), 'PENDING', 0, createdAt);

    db.prepare('INSERT INTO notifications (id, title, message, time, type) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), "New Request Submitted", `Request ${trackingId} for ${projectName || 'Items'} needs approval.`, "Just now", "request");
  })();
  
  const newRequest = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
  newRequest.items = JSON.parse(newRequest.items || '[]');
  
  logActivity(requestedBy || 'Personnel', 'New Request', projectName || 'Generic Asset', 'special');
  res.json(newRequest);
});

app.patch("/api/requests/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;

  if (fields.items) fields.items = JSON.stringify(fields.items);

  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE requests SET ${setClause} WHERE id = ?`).run(...values, id);
  const updatedReq = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
  if (updatedReq) updatedReq.items = JSON.parse(updatedReq.items || '[]');
  res.json(updatedReq);
});

app.delete("/api/requests/:id", (req, res) => {
  const id = req.params.id;
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
  if (!request) return res.status(404).json({ error: "Request not found" });
  
  db.transaction(() => {
    db.prepare('UPDATE requests SET isDeleted = 1 WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, request.projectName || request.trackingId, new Date().toISOString(), 'requests', 'User deletion', JSON.stringify(request));
  })();
  
  res.json({ success: true });
});

// --- Traceability API (Faculties, Admin Units, Departments, Personnel) ---

app.get("/api/faculties", (req, res) => {
  const rows = db.prepare('SELECT * FROM faculties').all();
  res.json(rows);
});

app.post("/api/faculties", (req, res) => {
  const { name, image } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO faculties (id, name, count, image) VALUES (?, ?, 0, ?)').run(id, name, image);
  const newFaculty = db.prepare('SELECT * FROM faculties WHERE id = ?').get(id);
  res.json(newFaculty);
});

app.patch("/api/faculties/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE faculties SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM faculties WHERE id = ?').get(id);
  res.json(updated);
});

app.delete("/api/faculties/:id", (req, res) => {
  const id = req.params.id;
  const faculty = db.prepare('SELECT * FROM faculties WHERE id = ?').get(id);
  if (!faculty) return res.status(404).json({ error: "Faculty not found" });

  db.transaction(() => {
    db.prepare('DELETE FROM faculties WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, (faculty as any).name, new Date().toISOString(), 'faculties', 'User deletion', JSON.stringify(faculty));
  })();
  res.json({ success: true });
});

app.get("/api/admin-units", (req, res) => {
  const rows = db.prepare('SELECT * FROM adminUnits').all();
  res.json(rows);
});

app.post("/api/admin-units", (req, res) => {
  const { name, image } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO adminUnits (id, name, image) VALUES (?, ?, ?)').run(id, name, image);
  const newUnit = db.prepare('SELECT * FROM adminUnits WHERE id = ?').get(id);
  res.json(newUnit);
});

app.patch("/api/admin-units/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE adminUnits SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM adminUnits WHERE id = ?').get(id);
  res.json(updated);
});

app.delete("/api/admin-units/:id", (req, res) => {
  const id = req.params.id;
  const unit = db.prepare('SELECT * FROM adminUnits WHERE id = ?').get(id);
  if (!unit) return res.status(404).json({ error: "Unit not found" });

  db.transaction(() => {
    db.prepare('DELETE FROM adminUnits WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, (unit as any).name, new Date().toISOString(), 'adminUnits', 'User deletion', JSON.stringify(unit));
  })();
  res.json({ success: true });
});

app.get("/api/departments", (req, res) => {
  const rows = db.prepare('SELECT * FROM departments').all();
  res.json(rows);
});

app.post("/api/departments", (req, res) => {
  const { name, facultyId, image } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO departments (id, name, facultyId, image) VALUES (?, ?, ?, ?)').run(id, name, facultyId, image);
  const newDept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  res.json(newDept);
});

app.patch("/api/departments/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE departments SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  res.json(updated);
});

app.delete("/api/departments/:id", (req, res) => {
  const id = req.params.id;
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!dept) return res.status(404).json({ error: "Department not found" });

  db.transaction(() => {
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, (dept as any).name, new Date().toISOString(), 'departments', 'User deletion', JSON.stringify(dept));
  })();
  res.json({ success: true });
});

app.get("/api/personnel", (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, (SELECT COALESCE(SUM(quantity), 0) FROM allocations WHERE personId = p.id) as itemsCount
    FROM personnel p
  `).all();
  res.json(rows);
});

app.post("/api/personnel", (req, res) => {
  const id = randomUUID();
  const { name, jobTitle, facultyId, departmentId, idNumber, image } = req.body;
  db.prepare('INSERT INTO personnel (id, name, jobTitle, facultyId, departmentId, idNumber, image) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, jobTitle, facultyId, departmentId, idNumber, image);
  const newPerson = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
  res.json(newPerson);
});

app.patch("/api/personnel/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE personnel SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
  res.json(updated);
});

app.delete("/api/personnel/:id", (req, res) => {
  const id = req.params.id;
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
  if (!person) return res.status(404).json({ error: "Personnel not found" });

  db.transaction(() => {
    db.prepare('DELETE FROM personnel WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, (person as any).name, new Date().toISOString(), 'personnel', 'User deletion', JSON.stringify(person));
  })();
  res.json({ success: true });
});

app.get("/api/traceability/history", (req, res) => {
  const { personId, departmentId, facultyId, adminUnitId } = req.query;
  let query = 'SELECT * FROM allocations WHERE 1=1';
  const params: any[] = [];

  if (personId) {
    query += ' AND personId = ?';
    params.push(personId);
  } else if (departmentId) {
    query += ' AND departmentId = ?';
    params.push(departmentId);
  } else if (facultyId) {
    query += ' AND facultyId = ?';
    params.push(facultyId);
  } else if (adminUnitId) {
    query += ' AND adminUnitId = ?';
    params.push(adminUnitId);
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.post("/api/traceability/allocate", (req, res) => {
  const { personId, itemId, quantity, date, notes } = req.body;
  
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(personId) as any;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as any;
  
  if (!person) return res.status(404).json({ error: "Personnel not found" });
  if (!item) return res.status(404).json({ error: "Item not found" });

  const qty = Number(quantity) || 1;
  const id = randomUUID();
  const timestamp = date || new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO allocations (id, personId, personName, itemId, itemName, itemCode, quantity, timestamp, notes, facultyId, departmentId, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL')
    `).run(id, personId, person.name, itemId, item.name, item.item_code, qty, timestamp, notes || "Manual allocation", person.facultyId, person.departmentId);

    if (item.quantity >= qty) {
      const newQty = item.quantity - qty;
      const status = newQty > 10 ? 'In Stock' : (newQty > 0 ? 'Low Stock' : 'Out of Stock');
      db.prepare('UPDATE items SET quantity = ?, status = ? WHERE id = ?').run(newQty, status, itemId);
    }
  })();

  const newAllocation = db.prepare('SELECT * FROM allocations WHERE id = ?').get(id);
  logActivity('Admin', 'Manually Assigned Item', `${item.name} to ${person.name}`, 'special');
  res.json({ success: true, allocation: newAllocation });
});

// --- Trash & Bin API ---
app.get("/api/trash", (req, res) => {
  const rows = db.prepare('SELECT * FROM trash').all().map((t: any) => ({
    ...JSON.parse(t.data),
    trashId: t.trashId,
    trashDate: t.trashDate,
    expiresAt: t.expiresAt,
    originalModule: t.originalModule,
    reason: t.reason
  }));
  res.json(rows);
});

app.post("/api/trash/restore/:trashId", (req, res) => {
  const trashId = req.params.trashId;
  const trashItem = db.prepare('SELECT * FROM trash WHERE trashId = ?').get(trashId) as any;
  if (!trashItem) return res.status(404).json({ error: "Item not found in trash" });
  
  const originalData = JSON.parse(trashItem.data);
  const module = trashItem.originalModule;
  const id = trashItem.id;

  db.transaction(() => {
    db.prepare('DELETE FROM trash WHERE trashId = ?').run(trashId);
    
    let table = '';
    if (module === 'inventory') table = 'items';
    else if (module === 'personnel') table = 'personnel';
    else if (module === 'faculties') table = 'faculties';
    else if (module === 'requests') table = 'requests';
    else if (module === 'receiving') table = 'receivings';
    else if (module === 'tender') table = 'tenders';
    else if (module === 'quotation') table = 'quotations';
    else if (module === 'order') table = 'orders';

    if (table) {
      db.prepare(`UPDATE ${table} SET isDeleted = 0 WHERE id = ?`).run(id);
    }
  })();
  
  res.json({ success: true });
});

app.delete("/api/trash/permanent/:trashId", (req, res) => {
  db.prepare('DELETE FROM trash WHERE trashId = ?').run(req.params.trashId);
  res.json({ success: true });
});

// --- Notifications API ---
app.get("/api/notifications", (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications ORDER BY time DESC').all();
  res.json(rows);
});

app.delete("/api/notifications", (req, res) => {
  db.prepare('DELETE FROM notifications').run();
  res.json({ success: true });
});

// --- Settings & User API ---
app.get("/api/users", (req, res) => {
  const rows = db.prepare('SELECT id, name, email, role, image FROM users').all();
  res.json(rows);
});

app.post("/api/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  const id = randomUUID();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  
  try {
    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, email, hashedPassword, role || 'Department User');
    
    const newUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    res.json(newUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  const fields = req.body;
  const userId = req.params.id;

  if (fields.password) {
    fields.password = await bcrypt.hash(fields.password, 10);
  }

  const keys = Object.keys(fields);
  if (keys.length === 0) return res.json({ success: true });

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  try {
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, userId);
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get("/api/user/profile", (req, res) => {
  // Return the first super admin as a default profile or mock
  const user = db.prepare("SELECT * FROM users WHERE role = 'Super Admin' LIMIT 1").get();
  res.json(user);
});

app.post("/api/user/profile", (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  // Update the first super admin
  db.prepare(`UPDATE users SET ${setClause} WHERE role = 'Super Admin'`).run(...values);
  const user = db.prepare("SELECT * FROM users WHERE role = 'Super Admin' LIMIT 1").get();
  res.json(user);
});

// --- Procurement API ---
app.get("/api/procurement/codes", (req, res) => {
  const codes = db.prepare('SELECT * FROM codes').all().map((c: any) => JSON.parse(c.value));
  res.json(codes);
});

app.get("/api/procurement/requests", (req, res) => {
  const rows = db.prepare('SELECT * FROM requests WHERE isDeleted = 0').all().map((r: any) => ({
    ...r,
    items: JSON.parse(r.items || '[]')
  }));
  res.json(rows);
});

app.get("/api/procurement/tenders", (req, res) => {
  const { requestId } = req.query;
  let query = 'SELECT * FROM tenders WHERE isDeleted = 0';
  const params: any[] = [];
  
  if (requestId) {
    query += ' AND requestId = ?';
    params.push(requestId);
  }
  
  const rows = db.prepare(query).all(...params).map((t: any) => ({
    ...t,
    items: JSON.parse(t.items || '[]')
  }));
  res.json(rows);
});

app.post("/api/procurement/tenders", (req, res) => {
  const { requestId, tenderNumber, items } = req.body;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  
  if (requestId) {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId) as any;
    if (!request) return res.status(404).json({ error: "Request not found" });

    db.transaction(() => {
      db.prepare('INSERT INTO tenders (id, requestId, tenderNumber, createdAt, items, status, isDeleted) VALUES (?, ?, ?, ?, ?, ?, 0)')
        .run(id, requestId, tenderNumber || ` عـ-${Math.floor(Math.random() * 10000)}`, createdAt, JSON.stringify(items || JSON.parse(request.items || '[]')), "OPEN");

      db.prepare('UPDATE requests SET status = ?, progress = ? WHERE id = ?').run("TENDER_CREATED", 50, requestId);
    })();
  } else {
    db.prepare('INSERT INTO tenders (id, requestId, tenderNumber, createdAt, items, status, isDeleted) VALUES (?, ?, ?, ?, ?, ?, 0)')
      .run(id, requestId || null, tenderNumber || ` عـ-${Math.floor(Math.random() * 10000)}`, createdAt, JSON.stringify(items || []), "OPEN");
  }
  
  const newTender = db.prepare('SELECT * FROM tenders WHERE id = ?').get(id) as any;
  if (newTender) newTender.items = JSON.parse(newTender.items || '[]');
  res.json(newTender);
});

app.patch("/api/procurement/tenders/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  if (fields.items) fields.items = JSON.stringify(fields.items);

  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE tenders SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM tenders WHERE id = ?').get(id) as any;
  if (updated) updated.items = JSON.parse(updated.items || '[]');
  res.json(updated);
});

app.delete("/api/procurement/tenders/:id", (req, res) => {
  const id = req.params.id;
  const tender = db.prepare('SELECT * FROM tenders WHERE id = ?').get(id) as any;
  if (!tender) return res.status(404).json({ error: "Tender not found" });
  
  db.transaction(() => {
    db.prepare('UPDATE tenders SET isDeleted = 1 WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, tender.tenderNumber, new Date().toISOString(), 'tender', "Administrative Deletion", JSON.stringify(tender));
  })();
  
  res.json({ success: true });
});

app.get("/api/procurement/quotations", (req, res) => {
  const rows = db.prepare('SELECT * FROM quotations WHERE isDeleted = 0').all().map((q: any) => ({
    ...q,
    items: JSON.parse(q.items || '[]')
  }));
  res.json(rows);
});

app.post("/api/procurement/quotations", (req, res) => {
  const id = randomUUID();
  const { tenderId, supplierName, items, totalAmount } = req.body;
  
  db.prepare('INSERT INTO quotations (id, tenderId, supplierName, items, totalAmount, isWinner, isDeleted, submittedAt) VALUES (?, ?, ?, ?, ?, 0, 0, ?)')
    .run(id, tenderId, supplierName, JSON.stringify(items || []), totalAmount || 0, new Date().toISOString());
    
  const newQ = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (newQ) newQ.items = JSON.parse(newQ.items || '[]');
  res.json(newQ);
});

app.patch("/api/procurement/quotations/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  if (fields.items) fields.items = JSON.stringify(fields.items);

  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE quotations SET ${setClause} WHERE id = ?`).run(...values, id);
  const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (updated) updated.items = JSON.parse(updated.items || '[]');
  res.json(updated);
});

app.delete("/api/procurement/quotations/:id", (req, res) => {
  const id = req.params.id;
  const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  
  db.transaction(() => {
    db.prepare('UPDATE quotations SET isDeleted = 1 WHERE id = ?').run(id);
    db.prepare('INSERT INTO trash (trashId, id, name, trashDate, originalModule, reason, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, `Quotation from ${q.supplierName}`, new Date().toISOString(), 'quotation', "Administrative Deletion", JSON.stringify(q));
  })();
  
  res.json({ success: true });
});

app.post("/api/procurement/select-winner", (req, res) => {
  const { tenderId, quotationId } = req.body;
  
  db.transaction(() => {
    db.prepare('UPDATE quotations SET isWinner = 0 WHERE tenderId = ?').run(tenderId);
    db.prepare('UPDATE quotations SET isWinner = 1 WHERE id = ?').run(quotationId);

    const tender = db.prepare('SELECT * FROM tenders WHERE id = ?').get(tenderId) as any;
    if (tender) {
      db.prepare('UPDATE tenders SET status = ? WHERE id = ?').run("WINNER_SELECTED", tenderId);
      if (tender.requestId) {
        db.prepare('UPDATE requests SET status = ?, progress = ? WHERE id = ?').run("WINNER_SELECTED", 75, tender.requestId);
      }
    }

    const winQ = db.prepare('SELECT * FROM quotations WHERE id = ?').get(quotationId) as any;
    const poId = randomUUID();
    db.prepare('INSERT INTO orders (id, poNumber, tenderId, quotationId, requestId, supplierName, items, status, createdAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)')
      .run(poId, `PO-${Date.now()}`, tenderId, quotationId, tender?.requestId || null, winQ?.supplierName, winQ?.items, "ISSUED", new Date().toISOString());
  })();

  res.json({ success: true });
});

app.get("/api/procurement/orders", (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE isDeleted = 0').all().map((o: any) => ({
    ...o,
    items: JSON.parse(o.items || '[]')
  }));
  res.json(rows);
});

app.post("/api/procurement/orders", (req, res) => {
  const id = randomUUID();
  const { requestId, poNumber, supplierName, items } = req.body;
  
  db.transaction(() => {
    db.prepare('INSERT INTO orders (id, poNumber, tenderId, quotationId, requestId, supplierName, items, status, createdAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)')
      .run(id, poNumber || `PO-${Date.now()}`, req.body.tenderId || null, req.body.quotationId || null, requestId || null, supplierName, JSON.stringify(items || []), "ISSUED", new Date().toISOString());

    if (requestId) {
      db.prepare('UPDATE requests SET status = ?, progress = ? WHERE id = ?').run("Delivered", 100, requestId);
    }
  })();

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (newOrder) newOrder.items = JSON.parse(newOrder.items || '[]');
  res.json(newOrder);
});

app.patch("/api/procurement/orders/:id", (req, res) => {
  const fields = req.body;
  if (fields.items) fields.items = JSON.stringify(fields.items);
  
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);

  db.prepare(`UPDATE orders SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (updated && updated.items) updated.items = JSON.parse(updated.items);
  res.json(updated);
});

app.delete("/api/procurement/orders/:id", (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: "Order not found" });

  db.transaction(() => {
    db.prepare('UPDATE orders SET isDeleted = 1 WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO trash (id, data, type, name, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), JSON.stringify(order), 'order', order.poNumber, 'Administrative Deletion', new Date().toISOString());
  })();
  
  res.json({ success: true });
});

app.get("/api/procurement/codes", (req, res) => {
  const codes = db.prepare('SELECT * FROM codes').all().map((c: any) => JSON.parse(c.value));
  res.json(codes);
});

app.get("/api/codes", (req, res) => {
  const codes = db.prepare('SELECT * FROM codes').all().map((c: any) => JSON.parse(c.value));
  res.json(codes || []);
});

app.post("/api/codes/bab", (req, res) => {
  const newBab = { bab: req.body.bab, name: req.body.name, fasls: [] };
  db.prepare('INSERT INTO codes (id, value) VALUES (?, ?)').run(newBab.bab, JSON.stringify(newBab));
  res.json(newBab);
});

app.delete("/api/codes/bab/:bab", (req, res) => {
  db.prepare('DELETE FROM codes WHERE id = ?').run(req.params.bab);
  res.json({ success: true });
});

app.post("/api/codes/fasl", (req, res) => {
  const { bab, code, name } = req.body;
  const row = db.prepare('SELECT * FROM codes WHERE id = ?').get(bab) as any;
  if (!row) return res.status(404).json({ error: "BaB not found" });
  
  const babData = JSON.parse(row.value);
  const newFasl = { code, name, items: [] };
  babData.fasls.push(newFasl);
  
  db.prepare('UPDATE codes SET value = ? WHERE id = ?').run(JSON.stringify(babData), bab);
  res.json(newFasl);
});

app.delete("/api/codes/fasl/:bab/:fasl", (req, res) => {
  const { bab, fasl } = req.params;
  const row = db.prepare('SELECT * FROM codes WHERE id = ?').get(bab) as any;
  if (row) {
    const babData = JSON.parse(row.value);
    babData.fasls = babData.fasls.filter((f: any) => f.code !== fasl);
    db.prepare('UPDATE codes SET value = ? WHERE id = ?').run(JSON.stringify(babData), bab);
  }
  res.json({ success: true });
});

// --- Codes API ---
app.post("/api/codes/item", (req, res) => {
  const { bab, fasl, code, name } = req.body;
  const row = db.prepare('SELECT value FROM codes WHERE id = ?').get(bab) as any;
  if (!row) return res.status(404).json({ error: "BaB not found" });

  const babData = JSON.parse(row.value);
  const faslObj = babData.fasls.find((f: any) => f.code === fasl);
  if (!faslObj) return res.status(404).json({ error: "Fasl not found" });
  
  faslObj.items.push({ code, name });
  db.prepare('UPDATE codes SET value = ? WHERE id = ?').run(JSON.stringify(babData), bab);
  res.json({ code, name });
});

app.post("/api/codes/restore", auth, (req: any, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM codes').run();
      const stmt = db.prepare('INSERT INTO codes (id, value) VALUES (?, ?)');
      for (const b of BUDGET_TREE) {
        stmt.run(b.bab, JSON.stringify(b));
      }
    })();
    res.json({ success: true, message: "Budget tree hierarchy restored successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/codes/item/:bab/:fasl/:item", (req, res) => {
  const { bab, fasl, item } = req.params;
  const row = db.prepare('SELECT value FROM codes WHERE id = ?').get(bab) as any;
  if (row) {
    const babData = JSON.parse(row.value);
    const faslObj = babData.fasls.find((f: any) => f.code === fasl);
    if (faslObj) {
      faslObj.items = faslObj.items.filter((i: any) => i.code !== item);
      db.prepare('UPDATE codes SET value = ? WHERE id = ?').run(JSON.stringify(babData), bab);
    }
  }
  res.json({ success: true });
});

// --- Background Jobs ---
function cleanupTrash() {
  const now = new Date().toISOString();
  db.prepare('DELETE FROM trash WHERE expiresAt IS NOT NULL AND expiresAt < ?').run(now);
}

// Run cleanup every hour
setInterval(cleanupTrash, 60 * 60 * 1000);

// --- Dashboard API ---
app.get("/api/dashboard/stats", (req, res) => {
  const items = db.prepare('SELECT status, quantity FROM items WHERE isDeleted = 0').all();
  const requests = db.prepare('SELECT status FROM requests WHERE isDeleted = 0').all();
  const tenders = db.prepare('SELECT status FROM tenders WHERE isDeleted = 0').all();

  const lowStockCount = items.filter((i: any) => i.status === 'Low Stock' || i.quantity < 10).length;
  const totalQty = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);

  res.json({
    totalStock: totalQty,
    pendingRequests: requests.filter((r: any) => 
      ['PENDING'].includes(r.status?.toUpperCase())
    ).length,
    lowStock: lowStockCount,
    activeTenders: tenders.filter((t: any) => t.status?.toUpperCase() === 'OPEN').length
  });
});

app.get("/api/dashboard/activities", (req, res) => {
  const activities: any[] = [];

  // From Receivings
  const receivings = db.prepare('SELECT id, item_name, item_code, supplier, quantity, date, createdAt FROM receivings WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT 5').all();
  receivings.forEach((r: any) => {
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
  const requests = db.prepare('SELECT id, projectName, requestedBy, status, createdAt FROM requests WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT 5').all();
  requests.forEach((r: any) => {
    activities.push({
      id: `req-${r.id}`,
      type: 'request',
      title: `New Request: ${r.projectName || 'Items'}`,
      description: `Requester: ${r.requestedBy} | Status: ${r.status}`,
      timestamp: r.createdAt || new Date().toISOString(),
      icon: 'file-text'
    });
  });

  // From Allocations
  const allocations = db.prepare('SELECT id, personName, quantity, timestamp FROM allocations ORDER BY timestamp DESC LIMIT 5').all();
  allocations.forEach((a: any) => {
    activities.push({
      id: `alloc-${a.id}`,
      type: 'allocation',
      title: `Asset Allocated`,
      description: `To: ${a.personName} | Qty: ${a.quantity}`,
      timestamp: a.timestamp || new Date().toISOString(),
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
      console.log(`[SERVER] Ready on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("[SERVER] Fatal startup error:", err);
  }
}

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[SERVER] Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

startServer();
