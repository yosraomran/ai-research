
import Database from "better-sqlite3";
const db = new Database("leads.db");
const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get('lead-1777977160486-0');
console.log("Current Lead Status:", lead?.status);
console.log("Draft Subject:", lead?.draftSubject);
