import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("./src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./src/styles.css", import.meta.url), "utf8");
const supabase = readFileSync(new URL("./src/supabase.js", import.meta.url), "utf8");

for (const marker of ["OWNYOURWEB", "INNERGINTEL", "SHOPNASGFX", "founder_projects", "founder_schedules", "founder_jobs", "founder_sync_runs", "founder-dashboard-sync"]) {
  assert.ok(app.includes(marker), `Missing founder dashboard behavior: ${marker}`);
}
assert.ok(app.includes("signInWithPassword"), "Secure password authentication must remain enabled");
assert.ok(supabase.includes("sb_publishable_"), "A publishable Supabase key is required");
assert.ok(!supabase.includes("service_role"), "A service-role key must never be included in the browser build");
assert.ok(!app.includes("api.github.com/repos"), "Repository checks must run in the cloud, not each visitor's browser");
assert.ok(styles.includes("oklch("), "The dashboard must use the OKLCH color system");
assert.ok(!styles.includes("transition: all"), "Transitions must name the properties they animate");
assert.ok(styles.includes("min-height: 44px"), "Interactive controls need accessible hit areas");
assert.ok(styles.includes("font-variant-numeric: tabular-nums"), "Changing values must use tabular numbers");

console.log("Founder Dashboard verification passed: private auth, three-brand snapshot, schedules, jobs, accessibility, and design rules are present.");
