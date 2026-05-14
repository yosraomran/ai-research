
import Database from "better-sqlite3";
const db = new Database("leads.db");

try {
    const lead = db.prepare("SELECT id FROM leads LIMIT 1").get();
    if (lead) {
        console.log("Testing PATCH for lead:", lead.id);
        const updates = { status: 'test' };
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
        const values = Object.values(updates);
        const result = db.prepare(`UPDATE leads SET ${fields} WHERE id = ?`).run(...values, lead.id);
        console.log("Update result:", result);
    } else {
        console.log("No leads found to test.");
    }
} catch (err) {
    console.error("Database test failed:", err);
}
