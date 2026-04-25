import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import multer from "multer";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

// Simple Data Persistence
const DATA_FILE = path.join(process.cwd(), "data.json");

async function loadData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(content);
    // Ensure all required collections exist
    return {
      budgetStructure: data.budgetStructure || [],
      items: data.items || [],
      requests: data.requests || [],
      receivings: data.receivings || [],
      notifications: data.notifications || [],
      transactions: data.transactions || [],
      auditLogs: data.auditLogs || [],
      trash: data.trash || [],
      ...data
    };
  } catch {
    return {
      budgetStructure: [
        { 
          bab: "220", 
          name: "Goods and Services (اجناس او خدمات)", 
          fasls: [
            { code: "22100", name: "Travel (سفریه)", items: [{ code: "22101", name: "Allowance - Domestic" }] },
            { code: "22300", name: "Contract Services (خدمات قراردادي)", items: [{ code: "22301", name: "Printing (مطبوع)" }] },
            { code: "22600", name: "Fuel (روغنیات)", items: [{ code: "22601", name: "Fuel Vehicles" }] },
            { code: "22700", name: "Tools and Materials (سامان و لوازم)", items: [{ code: "22701", name: "Office Equipment & Supplies" }] }
          ]
        }
      ],
      items: [
        { id: '1', name: 'Printing - Exam Papers', bab_code: '220', fasl_code: '22300', item_code: '22301', category: 'Contract Services', stock: 5000, unit: 'sheets', status: 'In Stock', faculty: 'Science', condition: 'New' }
      ],
      requests: [],
      receivings: [],
      notifications: [],
      transactions: [],
      auditLogs: [],
      trash: []
    };
  }
}

async function saveData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function processReceiving(data: any, entry: any) {
  const { 
    item_code, 
    quantity, 
    unit, 
    supplier, 
    date, 
    invoice_number, 
    warehouse_location, 
    condition,
    notes 
  } = entry;

  // Validation
  const required = ['item_code', 'quantity', 'unit', 'supplier', 'date', 'invoice_number', 'warehouse_location', 'condition'];
  for (const field of required) {
    if (!entry[field]) throw new Error(`Missing required field: ${field}`);
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) throw new Error(`Invalid quantity ${quantity}`);

  const validConditions = ['New', 'Used', 'Damaged', 'Returned', 'Needs Inspection'];
  if (!validConditions.includes(condition)) throw new Error(`Invalid condition: ${condition}`);

  const item = data.items.find((i: any) => i.item_code === item_code);
  if (!item) throw new Error(`Item code ${item_code} not found`);

  const newReceiving = {
    id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    item_code,
    item_name: item.name,
    quantity: numQty,
    unit,
    supplier,
    date,
    invoice_number,
    warehouse_location,
    condition,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  data.receivings.push(newReceiving);

  item.stock = (item.stock || 0) + numQty;
  item.unit = unit; // Update unit if changed
  item.status = item.stock > 0 ? 'In Stock' : 'Out of Stock';

  if (!data.transactions) data.transactions = [];
  data.transactions.push({
    id: `TRX-${Date.now()}`,
    item_code,
    quantity: numQty,
    type: "IN",
    ref: newReceiving.id,
    date: newReceiving.date,
    warehouse_location
  });

  data.notifications.push({
    id: Date.now().toString(),
    title: "New items received",
    message: `${numQty} ${unit} of ${item.name} received. Invoice: ${invoice_number}`,
    time: new Date().toISOString()
  });

  return newReceiving;
}

// Mock SMS Service
const sendSMS = (phone: string, message: string) => {
  console.log(`[SMS] Sending to ${phone}: ${message}`);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "Kandahar University WMS (Government Standard)" });
  });

  app.get("/api/codes", async (req, res) => {
    const data = await loadData();
    res.json(data.budgetStructure);
  });

  // Items API
  app.get("/api/items", async (req, res) => {
    const data = await loadData();
    res.json(data.items);
  });

  app.post("/api/items", async (req, res) => {
    const data = await loadData();
    const newItem = { 
      ...req.body, 
      id: Date.now().toString(),
      stock: req.body.stock || 0,
      status: (req.body.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'
    };
    data.items.push(newItem);
    
    // Notification for new item
    data.notifications.push({
      id: Date.now().toString(),
      title: "New SKU Mapped",
      message: `Item ${newItem.name} added to central registry.`,
      time: new Date().toISOString()
    });

    await saveData(data);
    res.status(201).json(newItem);
  });

  // Requests API
  app.get("/api/requests", async (req, res) => {
    const data = await loadData();
    res.json(data.requests);
  });

  app.post("/api/requests", async (req, res) => {
    const data = await loadData();
    const newRequest = { 
      ...req.body, 
      id: `REQ-${Date.now().toString().slice(-4)}`, 
      date: new Date().toISOString().split('T')[0], 
      progress: 10,
      status: 'Pending'
    };
    data.requests.push(newRequest);
    
    // Notify Admin
    data.notifications.push({
      id: Date.now().toString(),
      title: "New Request",
      message: `${newRequest.requester} requested ${newRequest.title}`,
      time: new Date().toISOString()
    });

    await saveData(data);
    res.status(201).json(newRequest);
  });

  // Request Approval & Stock Deduction
  app.patch("/api/requests/:id", async (req, res) => {
    const data = await loadData();
    const { status, progress, quantity } = req.body;
    const requestIndex = data.requests.findIndex((r: any) => r.id === req.params.id);
    
    if (requestIndex === -1) return res.status(404).json({ error: "Request not found" });

    const request = data.requests[requestIndex];
    request.status = status || request.status;
    request.progress = progress !== undefined ? progress : request.progress;

    // Trigger stock deduction if issued/completed
    if (status === 'Approved' && request.item_code) {
       const item = data.items.find((i: any) => i.item_code === request.item_code);
       if (item && item.stock >= (quantity || 1)) {
          item.stock -= (quantity || 1);
          if (item.stock <= 0) item.status = 'Out of Stock';
          else if (item.stock < 10) item.status = 'Low Stock';
          
          // Trigger SMS (Mock)
          sendSMS("+93700000000", `Request ${request.id} for ${item.name} has been approved and issued.`);
       }
    }

    await saveData(data);
    res.json(request);
  });

  // Trash / Item Lifecycle
  app.get("/api/trash", async (req, res) => {
    const data = await loadData();
    res.json(data.trash);
  });

  app.post("/api/items/:id/trash", async (req, res) => {
    const data = await loadData();
    const itemIndex = data.items.findIndex((i: any) => i.id === req.params.id);
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

    const trashedItem = data.items.splice(itemIndex, 1)[0];
    data.trash.push({
      ...trashedItem,
      trashDate: new Date().toISOString(),
      reason: req.body.reason || "Expired / Broken"
    });

    await saveData(data);
    res.json({ message: "Item moved to trash" });
  });

  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    const data = await loadData();
    res.json(data.notifications);
  });

  app.delete("/api/notifications", async (req, res) => {
    const data = await loadData();
    data.notifications = [];
    await saveData(data);
    res.json({ message: "Notifications cleared" });
  });

  // Receiving System V1
  app.post("/api/v1/receiving", async (req, res) => {
    try {
      const data = await loadData();
      const newEntry = await processReceiving(data, req.body);
      await saveData(data);
      res.status(201).json(newEntry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.put("/api/v1/receiving/:id", async (req, res) => {
    try {
      const data = await loadData();
      const receivingIndex = data.receivings.findIndex((r: any) => r.id === req.params.id);
      if (receivingIndex === -1) return res.status(404).json({ error: "Receiving record not found" });
      
      const oldRec = { ...data.receivings[receivingIndex] };
      const { item_code, quantity, supplier, date, notes } = req.body;
      const numQty = Number(quantity);
      
      if (isNaN(numQty) || numQty <= 0) throw new Error("Invalid quantity");
      
      const oldItem = data.items.find((i: any) => i.item_code === oldRec.item_code);
      const newItem = data.items.find((i: any) => i.item_code === item_code);
      
      if (!newItem) throw new Error("Target item not found");
      
      // Stock Correction
      if (oldRec.item_code === item_code) {
        const diff = numQty - oldRec.quantity;
        if (oldItem.stock + diff < 0) throw new Error("Correction would result in negative stock");
        oldItem.stock += diff;
      } else {
        // Item changed
        if (oldItem.stock - oldRec.quantity < 0) throw new Error("Removal from old item would result in negative stock");
        oldItem.stock -= oldRec.quantity;
        newItem.stock += numQty;
      }
      
      // Update item status
      if (oldItem) oldItem.status = oldItem.stock > 0 ? 'In Stock' : 'Out of Stock';
      if (newItem) newItem.status = newItem.stock > 0 ? 'In Stock' : 'Out of Stock';

      // Update record
      const updatedRec = {
        ...oldRec,
        item_code,
        item_name: newItem.name,
        quantity: numQty,
        supplier,
        date,
        notes,
        updatedAt: new Date().toISOString()
      };
      data.receivings[receivingIndex] = updatedRec;
      
      // Audit Log
      data.auditLogs.push({
        id: `AUD-${Date.now()}`,
        action: "RECEIVING_UPDATED",
        receivingId: oldRec.id,
        oldValues: oldRec,
        newValues: updatedRec,
        changedBy: "Admin", // Mocked for now
        changedAt: new Date().toISOString()
      });
      
      // Stock Transaction
      data.transactions.push({
        id: `TRX-${Date.now()}`,
        item_code: item_code,
        oldQuantity: oldRec.quantity,
        newQuantity: numQty,
        difference: oldRec.item_code === item_code ? (numQty - oldRec.quantity) : numQty,
        type: "ADJUSTMENT",
        ref: oldRec.id,
        reason: "Receiving record edited",
        date: new Date().toISOString().split('T')[0]
      });

      await saveData(data);
      res.json({
        success: true,
        receiving: updatedRec,
        stockBalance: newItem.stock,
        message: "Receiving updated successfully"
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/v1/receiving/:id", async (req, res) => {
    try {
      const data = await loadData();
      const receivingIndex = data.receivings.findIndex((r: any) => r.id === req.params.id);
      if (receivingIndex === -1) return res.status(404).json({ error: "Record not found" });
      
      const rec = data.receivings[receivingIndex];
      const item = data.items.find((i: any) => i.item_code === rec.item_code);
      
      if (item) {
        if (item.stock - rec.quantity < 0) throw new Error("Deleting this record would result in negative stock");
        item.stock -= rec.quantity;
        item.status = item.stock > 0 ? 'In Stock' : 'Out of Stock';
      }
      
      data.receivings.splice(receivingIndex, 1);
      
      data.auditLogs.push({
        id: `AUD-${Date.now()}`,
        action: "RECEIVING_DELETED",
        receivingId: rec.id,
        values: rec,
        changedAt: new Date().toISOString()
      });

      await saveData(data);
      res.json({ message: "Record deleted and stock adjusted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/v1/receiving/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const data = await loadData();
      const workbook = XLSX.read(req.file.buffer);
      const sheetName = workbook.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          // Normalize keys (Item Name -> item_name, etc)
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            normalized[normalizedKey] = row[key];
          });

          // Map common variations to required internal keys
          const mapped = {
            item_code: normalized.item_code || normalized.sku || normalized.code,
            quantity: normalized.quantity || normalized.qty || normalized.amount,
            unit: normalized.unit || normalized.uom,
            supplier: normalized.supplier || normalized.vendor,
            date: normalized.date || normalized.receiving_date,
            invoice_number: normalized.invoice_number || normalized.invoice_no || normalized.ref,
            warehouse_location: normalized.warehouse_location || normalized.location || normalized.zone,
            condition: normalized.condition || normalized.status,
            notes: normalized.notes || normalized.remarks
          };

          await processReceiving(data, mapped);
          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(error.message);
        }
      }

      await saveData(data);
      res.json({
        total: rows.length,
        success: successCount,
        failed: failedCount,
        errors
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to process Excel" });
    }
  });

  app.get("/api/v1/receiving/export", async (req, res) => {
    try {
      const data = await loadData();
      const exportData = data.receivings.map((r: any) => ({
        itemName: r.item_name,
        itemCode: r.item_code,
        quantity: r.quantity,
        unit: r.unit,
        supplier: r.supplier,
        date: r.date,
        invoiceNumber: r.invoice_number,
        warehouseLocation: r.warehouse_location,
        condition: r.condition,
        notes: r.notes
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Receivings");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=receivings.xlsx");
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Receivings API
  app.get("/api/receivings", async (req, res) => {
    const data = await loadData();
    res.json(data.receivings || []);
  });

  // Vite middleware for development
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
}

startServer().catch(console.error);
