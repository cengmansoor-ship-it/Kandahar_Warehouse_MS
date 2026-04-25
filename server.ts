import express from "express";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "procurement_db.json");

app.use(cors());
app.use(express.json());

// --- Database Helper ---
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { requests: [], tenders: [], quotations: [], orders: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- API Routes ---

// 1. Requests
app.get("/api/procurement/requests", (req, res) => {
  const db = getDb();
  res.json(db.requests);
});

app.post("/api/procurement/requests", (req, res) => {
  const db = getDb();
  const newRequest = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: "PENDING", // PENDING -> TENDER_CREATED
    projectName: req.body.projectName,
    issuer: "Eftikhar Ahmad Hosani", // From document
    items: req.body.items || [], // [{ name, spec, unit, qty }]
    committee: [
      "Nazir Ahmad Qadri",
      "Mawlavi Mohammad Abdullah",
      "Mawlavi Gul Ahmad Hashmi"
    ]
  };
  db.requests.push(newRequest);
  saveDb(db);
  res.json(newRequest);
});

// 2. Tenders
app.get("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  res.json(db.tenders);
});

app.post("/api/procurement/tenders", (req, res) => {
  const db = getDb();
  const { requestId } = req.body;
  
  const request = db.requests.find((r: any) => r.id === requestId);
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.status !== "PENDING") return res.status(400).json({ error: "Tender already exists" });

  const newTender = {
    id: uuidv4(),
    requestId,
    tenderNumber: ` عـ-${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
    items: request.items,
    status: "OPEN" // OPEN -> CLOSED (when quotations >= 3)
  };

  request.status = "TENDER_CREATED";
  db.tenders.push(newTender);
  saveDb(db);
  res.json(newTender);
});

// 3. Quotations (Supplier Bids)
app.post("/api/procurement/quotations", (req, res) => {
  const db = getDb();
  const { tenderId, supplierName, supplierAddress, items } = req.body;
  
  const quotation = {
    id: uuidv4(),
    tenderId,
    supplierName,
    supplierAddress,
    items, // [{ itemId, unitPrice, total }]
    submittedAt: new Date().toISOString(),
    isWinner: false
  };

  db.quotations.push(quotation);
  saveDb(db);
  res.json(quotation);
});

// 4. Comparison & Winner Selection
app.post("/api/procurement/select-winner", (req, res) => {
  const db = getDb();
  const { tenderId, quotationId } = req.body;

  const quotations = db.quotations.filter((q: any) => q.tenderId === tenderId);
  if (quotations.length < 3) {
    return res.status(400).json({ error: "Minimum 3 quotations required before comparison" });
  }

  db.quotations.forEach((q: any) => {
    if (q.tenderId === tenderId) {
      q.isWinner = (q.id === quotationId);
    }
  });

  const tender = db.tenders.find((t: any) => t.id === tenderId);
  if (tender) tender.status = "WINNER_SELECTED";

  // Auto-generate PO
  const winningQuotation = quotations.find(q => q.id === quotationId);
  const newOrder = {
    id: uuidv4(),
    tenderId,
    quotationId,
    poNumber: `PO-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "ISSUED",
    supplierName: winningQuotation.supplierName,
    items: winningQuotation.items
  };
  db.orders.push(newOrder);

  saveDb(db);
  res.json({ message: "Winner selected and PO issued", po: newOrder });
});

// --- Vite Integration ---
async function startServer() {
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

startServer();
