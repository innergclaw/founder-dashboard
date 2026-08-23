import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("./src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./src/styles.css", import.meta.url), "utf8");
const supabase = readFileSync(new URL("./src/supabase.js", import.meta.url), "utf8");

for (const marker of ["OWNYOURWEB", "INNERGINTEL", "SHOPNASGFX", "founder_projects", "founder_schedules", "founder_jobs", "founder_sync_runs", "founder_alerts", "founder_notification_preferences", "founder_brief_runs", "founder_daily_briefings", "founder_documents", "founder_applications", "founder-dashboard-sync", "founder-daily-brief"]) {
  assert.ok(app.includes(marker), `Missing founder dashboard behavior: ${marker}`);
}
assert.ok(app.includes("signInWithPassword"), "Secure password authentication must remain enabled");
assert.ok(supabase.includes("sb_publishable_"), "A publishable Supabase key is required");
assert.ok(!supabase.includes("service_role"), "A service-role key must never be included in the browser build");
assert.ok(!app.includes("api.github.com/repos"), "Repository checks must run in the cloud, not each visitor's browser");
assert.ok(app.includes("Notification.requestPermission"), "On-device briefing notifications must remain available");
assert.ok(app.includes("Apple Messages") && app.includes("Waiting for connector availability"), "Apple Messages must be labeled pending until a connector is available");
assert.ok(app.includes("Daily voice memo") && app.includes("6:00 PM") && app.includes("8:00 PM"), "The daily voice briefing rhythm must be visible");
assert.ok(app.includes("Private career command center") && app.includes("Professional docs") && app.includes("Job applications"), "The private Professional workspace must remain available");
for (const trait of ["Relentless consistency", "An ownership mindset", "Radical delayed gratification", "Obsession with financial literacy", "Emotional discipline in volatile markets", "Multiple income stream architecture", "High-value network cultivation", "Clear generational vision", "Extreme resourcefulness and problem-solving", "Unshakable self-accountability"]) {
  assert.ok(app.includes(trait), `Missing founder development trait: ${trait}`);
}
assert.ok(app.includes('"development", "Development", "compass"') && app.includes("Four phases of the decade"), "The 30–40 founder development view must remain available");
assert.ok(app.includes("createSignedUrl") && app.includes('from("founder-documents")'), "Professional documents must use private signed storage access");
assert.ok(styles.includes("oklch("), "The dashboard must use the OKLCH color system");
assert.ok(!styles.includes("transition: all"), "Transitions must name the properties they animate");
assert.ok(styles.includes("min-height: 44px"), "Interactive controls need accessible hit areas");
assert.ok(styles.includes("font-variant-numeric: tabular-nums"), "Changing values must use tabular numbers");

console.log("Founder Dashboard verification passed: private auth, three-brand snapshot, 30–40 development framework, professional documents, applications, proactive briefings, alerts, schedules, jobs, accessibility, and design rules are present.");
