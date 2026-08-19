const FOUNDER_ID = "75677100-97b7-4578-92c5-cf131997b580";
const ALLOWED_SOURCES = new Set(["github-actions", "dashboard-manual", "codex-skill"]);
const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function decodeClaims(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

async function requestJson(url: string, serviceKey: string, init: RequestInit = {}) {
  const result = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  if (!result.ok) throw new Error(`Database request failed with ${result.status}`);
  const text = await result.text();
  return text ? JSON.parse(text) : null;
}

async function checkLiveUrl(url?: string | null) {
  if (!url) return { status: null, ok: null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    let result = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (result.status === 405) result = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    return { status: result.status, ok: result.ok };
  } catch {
    return { status: 0, ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRepository(repoUrl?: string | null) {
  if (!repoUrl) return null;
  const name = repoUrl.replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "");
  if (!name.includes("/")) return null;
  const result = await fetch(`https://api.github.com/repos/${name}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "innerg-founder-dashboard-sync" },
  });
  if (!result.ok) return { ok: false, status: result.status };
  const data = await result.json();
  return {
    ok: true,
    status: result.status,
    pushed_at: data.pushed_at,
    archived: data.archived,
    default_branch: data.default_branch,
    visibility: data.visibility,
    open_issues: data.open_issues_count,
  };
}

function calculateHealth(live: { ok: boolean | null }, repo: Record<string, unknown> | null) {
  if (live.ok === false) return repo?.ok ? 60 : 45;
  if (live.ok === true) return repo?.ok === false ? 90 : 100;
  return repo?.ok ? 90 : 70;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const claims = decodeClaims(request);
  if (claims.role !== "anon" && claims.sub !== FOUNDER_ID) return response({ error: "Forbidden" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return response({ error: "Cloud configuration unavailable" }, 500);

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* An empty body is valid. */ }
  const source = ALLOWED_SOURCES.has(String(body.source)) ? String(body.source) : "github-actions";
  const restUrl = `${supabaseUrl}/rest/v1`;

  try {
    const recent = await requestJson(`${restUrl}/founder_sync_runs?owner_id=eq.${FOUNDER_ID}&status=eq.success&started_at=gte.${encodeURIComponent(new Date(Date.now() - 15 * 60 * 1000).toISOString())}&select=id,started_at&limit=1`, serviceKey);
    if (recent?.length && body.force !== true) return response({ ok: true, skipped: true, reason: "A fresh sync already exists." });

    const [run] = await requestJson(`${restUrl}/founder_sync_runs`, serviceKey, {
      method: "POST",
      body: JSON.stringify({ owner_id: FOUNDER_ID, source, status: "running" }),
    });
    const projects = await requestJson(`${restUrl}/founder_projects?owner_id=eq.${FOUNDER_ID}&select=id,name,live_url,repo_url`, serviceKey);

    let updated = 0;
    let failures = 0;
    await Promise.all(projects.map(async (project: Record<string, string>) => {
      try {
        const [live, repo] = await Promise.all([checkLiveUrl(project.live_url), checkRepository(project.repo_url)]);
        const now = new Date().toISOString();
        await requestJson(`${restUrl}/founder_projects?id=eq.${project.id}&owner_id=eq.${FOUNDER_ID}`, serviceKey, {
          method: "PATCH",
          body: JSON.stringify({
            health: calculateHealth(live, repo),
            live_status: live.status,
            repo_state: repo || {},
            last_repo_push_at: repo?.pushed_at || null,
            last_verified_at: now,
            sync_source: source,
            updated_at: now,
          }),
        });
        updated += 1;
      } catch (error) {
        failures += 1;
        console.error(`Project sync failed: ${project.name}`, error);
      }
    }));

    const status = failures ? "partial" : "success";
    await requestJson(`${restUrl}/founder_sync_runs?id=eq.${run.id}`, serviceKey, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        projects_checked: projects.length,
        projects_updated: updated,
        summary: { failures },
        finished_at: new Date().toISOString(),
      }),
    });
    return response({ ok: failures === 0, status, projects_checked: projects.length, projects_updated: updated });
  } catch (error) {
    console.error("Founder dashboard sync failed", error);
    return response({ error: "Sync failed" }, 500);
  }
});

