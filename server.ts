import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { generateOutreachEmail, researchCompany } from "./src/lib/gemini";

const db = new Database("leads.db");

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    company TEXT,
    role TEXT,
    email TEXT,
    website TEXT,
    status TEXT,
    companySummary TEXT,
    draftSubject TEXT,
    draftBody TEXT,
    createdAt TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/leads", (req, res) => {
    const leads = db.prepare("SELECT * FROM leads ORDER BY createdAt DESC").all();
    res.json(leads);
  });

  app.post("/api/leads/batch", (req, res) => {
    const { leads } = req.body;
    const insert = db.prepare(`
      INSERT OR REPLACE INTO leads 
      (id, name, company, role, email, website, status, companySummary, draftSubject, draftBody, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((leads) => {
      for (const lead of leads) {
        insert.run(
          lead.id, lead.name, lead.company, lead.role, lead.email, 
          lead.website, lead.status, lead.companySummary, 
          lead.draftSubject, lead.draftBody, lead.createdAt || new Date().toISOString()
        );
      }
    });

    transaction(leads);
    res.json({ status: "ok", count: leads.length });
  });

  app.patch("/api/leads/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
    const values = Object.values(updates);
    
    db.prepare(`UPDATE leads SET ${fields} WHERE id = ?`).run(...values, id);
    res.json({ status: "ok" });
  });

  app.post("/api/generate/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`DEBUG: Server starting generation for lead ${id}`);

    try {
      const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Update status to generating
      db.prepare("UPDATE leads SET status = ? WHERE id = ?").run("generating", id);

      console.log(`📡 AI Engine: Starting research for ${lead.company}...`);
      const summary = await researchCompany(lead.company, lead.website);
      
      console.log(`📧 AI Engine: Generating email for ${lead.name}...`);
      const { subject, body } = await generateOutreachEmail(lead, summary);

      const updates = { 
        status: 'drafted', 
        draftSubject: subject, 
        draftBody: body,
        companySummary: summary 
      };

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
      const values = Object.values(updates);
      db.prepare(`UPDATE leads SET ${fields} WHERE id = ?`).run(...values, id);

      console.log(`✅ Server: Generation complete for lead ${id}`);
      res.json({ status: "ok", ...updates });
    } catch (error: any) {
      console.error("❌ Server: Generation Error", error);
      db.prepare("UPDATE leads SET status = ? WHERE id = ?").run("pending", id);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/leads/all", (req, res) => {
    db.prepare("DELETE FROM leads").run();
    res.json({ status: "ok" });
  });

  app.delete("/api/leads/:id", (req, res) => {
    db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
    res.json({ status: "ok" });
  });

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
    console.log(`ColdReach AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
