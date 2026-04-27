import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(cors());
app.use(express.json());

// --- Database Helper ---
function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { 
        items: [
          { id: '1', name: 'Printing Paper A4', item_code: '22301', category: 'Stationery', quantity: 500, unit: 'BOX', location: 'Zone A-01', status: 'In Stock' },
          { id: '2', name: 'Engine Oil 10W40', item_code: '22601', category: 'Fuel', quantity: 50, unit: 'LTR', location: 'Cold Storage', status: 'In Stock' }
        ], 
        receivings: [], 
        requests: [], 
        tenders: [], 
        quotations: [], 
        orders: [],
        trash: [],
        notifications: [],
        users: [{ id: 'admin', email: 'admin@kandahar.edu.af', profileImage: null }]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content || '{"items":[], "receivings":[], "requests":[], "tenders":[], "quotations":[], "orders":[], "trash":[], "notifications":[], "users":[]}');
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

// --- API Routes ---

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

// --- Chatbot API ---
app.post("/api/chat", (req, res) => {
  const { message, lang } = req.body;
  const db = getDb();
  let response = "";
  const msg = message.toLowerCase();

  const isPs = lang === 'ps';

  if (msg.includes("inventory") || msg.includes("stock") || msg.includes("جنس") || msg.includes("ګودام")) {
    const totalItems = db.items.length;
    const lowStock = db.items.filter((i: any) => i.status === 'Low Stock').length;
    if (isPs) {
      response = `موږ په ګودام کې ${totalItems} ډوله ځانګړي توکي لرو. ${lowStock} توکي په لږ مقدار (Low Stock) کې دي.`;
    } else {
      response = `We have ${totalItems} unique items in the inventory. ${lowStock} items are currently in low stock status.`;
    }
  } else if (msg.includes("request") || msg.includes("status") || msg.includes("غوښتنه") || msg.includes("حالت")) {
    const pending = db.requests.filter((r: any) => r.status === 'Pending').length;
    const approved = db.requests.filter((r: any) => r.status === 'Approved').length;
    if (isPs) {
      response = `په سیسټم کې ${db.requests.length} غوښتنې ثبت شوي دي. له دې جملې څخه ${pending} غوښتنې پاتې (Pending) دي او ${approved} تایید شوي دي.`;
    } else {
      response = `There are ${db.requests.length} total requests. ${pending} are pending and ${approved} have been approved.`;
    }
  } else if (msg.includes("tender") || msg.includes("procurement") || msg.includes("نرخ") || msg.includes("تدارکات")) {
    const tenders = db.tenders.length;
    const active = db.tenders.filter((t: any) => t.status === 'Active').length;
    if (isPs) {
      response = `په سیسټم کې ${tenders} تدارکاتي پاڼې ثبت شوي دي. ${active} یې اوس مهال فعالې دي.`;
    } else {
      response = `We have ${tenders} procurement tenders registered. ${active} of them are currently active.`;
    }
  } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("سلام")) {
    if (isPs) {
      response = "سلام! زه ستاسو هوښیار مرستندوی یم. څنګه کولی شم تاسو سره د ګودام په مدیریت کې مرسته وکړم؟";
    } else {
      response = "Hello! I'm your AI Warehouse Assistant. How can I help you manage the warehouse today?";
    }
  } else {
    if (isPs) {
      response = "بښنه غواړم، په دې اړه معلومات نلرم. مهرباني وکړئ د موجودۍ، غوښتنو یا تدارکاتو په اړه وپوښتئ.";
    } else {
      response = "I'm sorry, I don't have information on that topic. Please ask about inventory, requests, or procurement.";
    }
  }
  
  console.log(`Chatbot [${lang}]: ${message} -> ${response}`);
  res.json({ response });
});

// --- Receiving API ---
app.get("/api/receivings", (req, res) => {
  const db = getDb();
  const active = (db.receivings || []).filter((r: any) => !r.isDeleted);
  res.json(active);
});

app.post("/api/v1/receiving", (req, res) => {
  const db = getDb();
  const { item_code, quantity } = req.body;
  const qtyNum = Number(quantity);
  
  const newReceiving = {
    id: randomUUID(),
    ...req.body,
    quantity: qtyNum,
    createdAt: new Date().toISOString()
  };
  
  // Update Inventory Stock
  const item = db.items.find((i: any) => i.item_code === item_code);
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
  res.json(newReceiving);
});

app.put("/api/v1/receiving/:id", (req, res) => {
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

  items.forEach((itemData: any) => {
    const qtyNum = Number(itemData.quantity) || 0;
    const newReceiving = {
      id: randomUUID(),
      ...itemData,
      quantity: qtyNum,
      createdAt: new Date().toISOString()
    };
    db.receivings.push(newReceiving);

    const item = db.items.find((i: any) => i.item_code === itemData.item_code);
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
  res.json({ success: true, count: items.length });
});

app.delete("/api/v1/receiving/:id", (req, res) => {
  const db = getDb();
  const id = req.params.id;
  // Search in both id and _id for robustness
  const index = db.receivings.findIndex((r: any) => r.id === id || r._id === id);
  
  if (index === -1) {
    console.log(`DEBUG: Delete failed - Record ${id} not found in database`);
    return res.status(404).json({ error: "Record not found" });
  }
  
  const rec = db.receivings[index];
  console.log(`DEBUG: Moving record to trash (Soft Delete):`, rec);
  
  // Mark as deleted
  rec.isDeleted = true;
  rec.deletedAt = new Date().toISOString();
  
  // Sync Inventory (Subtract the quantity that was added by this receiving)
  if (rec.item_code) {
    const item = db.items.find((i: any) => i.item_code === rec.item_code);
    if (item) {
      const quantityToRemove = Number(rec.quantity) || 0;
      const oldQty = Number(item.quantity) || 0;
      item.quantity = Math.max(0, oldQty - quantityToRemove);
      item.status = item.quantity > 10 ? 'In Stock' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock');
      console.log(`DEBUG: Item ${item.item_code} stock updated: ${oldQty} -> ${item.quantity}`);
    }
  }
  
  saveDb(db);
  res.json({ success: true, message: "Item moved to Trash", deletedId: id });
});

// --- Notifications & SMS API ---
app.post("/api/notifications/sms", (req, res) => {
  const { to, message } = req.body;
  console.log(`[SMS SERVICE] Sending to ${to}: ${message}`);
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
      .filter((r: any) => r.item_code === item.item_code)
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
