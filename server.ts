import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple Data Persistence
const DATA_FILE = path.join(process.cwd(), "data.json");

async function loadData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      // Extracted from provided PDF/Images
      budgetStructure: [
        { 
          bab: "220", 
          name: "Goods and Services (اجناس او خدمات)", 
          fasls: [
            { 
              code: "22100", 
              name: "Travel (سفریه)",
              items: [
                { code: "22101", name: "Allowance - Domestic" },
                { code: "22102", name: "Travel - Domestic" }
              ]
            },
            { 
              code: "22300", 
              name: "Contract Services (خدمات قراردادي)",
              items: [
                { code: "22301", name: "Printing (مطبوع)" },
                { code: "22304", name: "Security Services" }
              ]
            },
            { 
              code: "22600", 
              name: "Fuel (روغنیات)",
              items: [
                { code: "22601", name: "Fuel Vehicles" },
                { code: "22602", name: "Gas" }
              ]
            },
            { 
              code: "22700", 
              name: "Tools and Materials (سامان و لوازم)",
              items: [
                { code: "22701", name: "Office Equipment & Supplies" },
                { code: "22705", name: "Furniture (فرنیچر)" }
              ]
            }
          ]
        },
        {
          bab: "224",
          name: "Repairs and Maintenance (ترمیمات)",
          fasls: [
            {
              code: "22400",
              name: "Maintenance Services",
              items: [
                { code: "22401", name: "Construction Repairs" },
                { code: "22408", name: "Office Equipment & Computer Repairs" }
              ]
            }
          ]
        }
      ],
      items: [
        { id: '1', name: 'Printing - Exam Papers', bab_code: '220', fasl_code: '22300', item_code: '22301', category: 'Contract Services', stock: 5000, unit: 'sheets', status: 'In Stock' }
      ],
      requests: [],
      receivings: []
    };
  }
}

async function saveData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

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
    const { bab_code, fasl_code, item_code, name } = req.body;
    
    if (!bab_code || !fasl_code || !item_code) {
      return res.status(400).json({ error: "Budget codes required." });
    }

    const newItem = { ...req.body, id: Date.now().toString() };
    data.items.push(newItem);
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
    const newRequest = { ...req.body, id: `REQ-${Date.now().toString().slice(-4)}`, date: new Date().toISOString().split('T')[0], progress: 0 };
    data.requests.push(newRequest);
    await saveData(data);
    res.status(201).json(newRequest);
  });

  // Receiving API
  app.get("/api/receivings", async (req, res) => {
    const data = await loadData();
    res.json(data.receivings);
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
