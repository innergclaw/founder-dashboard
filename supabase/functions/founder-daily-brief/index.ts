import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FOUNDER_ID = "75677100-97b7-4578-92c5-cf131997b580";
const DASHBOARD_URL = "https://innergclaw.github.io/founder-dashboard/";
const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

type Row = Record<string, any>;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function env(name: string) {
  return Deno.env.get(name)?.trim() || "";
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

function serviceHeaders(prefer = "") {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(), ...(init.headers || {}) },
  });
  if (!response.ok) throw new Error(`database_request_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function localParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, hour: Number(value.hour) };
}

function isQuietHour(hour: number, start: number, end: number) {
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

function brandLabel(value?: string | null) {
  return value || "PERSONAL";
}

function formatEastern(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
}

async function insertAlert(alert: Row) {
  const rows = await requestJson("founder_alerts?on_conflict=owner_id,fingerprint", {
    method: "POST",
    headers: serviceHeaders("resolution=ignore-duplicates,return=representation"),
    body: JSON.stringify({ owner_id: FOUNDER_ID, ...alert }),
  });
  return rows?.[0] || null;
}

function buildMessage(mode: string, alerts: Row[], summary: Row) {
  const heading = mode === "morning" ? "Morning founder brief" : mode === "midday" ? "Midday founder pulse" : mode === "evening" ? "Evening founder reset" : "Founder alert";
  const lines = [
    heading,
    "",
    `${summary.openJobs} open jobs · ${summary.overdueJobs} overdue · ${summary.attentionProjects} projects need attention`,
  ];
  if (!alerts.length) lines.push("", "Nothing new requires your attention right now.");
  alerts.slice(0, 6).forEach((alert) => lines.push("", `${alert.severity === "urgent" ? "URGENT" : alert.severity === "attention" ? "ATTENTION" : "UPDATE"} · ${brandLabel(alert.brand)}`, alert.title, alert.message));
  if (alerts.length > 6) lines.push("", `+ ${alerts.length - 6} more alerts in the dashboard`);
  lines.push("", `Open dashboard: ${DASHBOARD_URL}`);
  return lines.join("\n");
}

async function sendTelegram(text: string) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_FOUNDER_ALERT_CHAT_ID") || env("TELEGRAM_CHAT_ID") || env("TELEGRAM_OWNER_STACK_CHAT_ID");
  const threadId = env("TELEGRAM_FOUNDER_ALERT_THREAD_ID");
  if (!token || !chatId) return { ok: false, status: "not_configured" };
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      ...(threadId ? { message_thread_id: Number(threadId) } : {}),
      text,
      disable_web_page_preview: true,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok === true, status: response.ok && data.ok === true ? "sent" : "failed", message_id: data?.result?.message_id || null };
}

async function resolveBrevoKey() {
  if (env("BREVO_API_KEY")) return env("BREVO_API_KEY");
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/innergreads_get_brevo_api_key`, {
    method: "POST",
    headers: serviceHeaders(),
    body: "{}",
  });
  if (!response.ok) return "";
  const key = await response.json().catch(() => "");
  return typeof key === "string" ? key.trim() : "";
}

async function sendEmail(subject: string, text: string) {
  const recipient = env("FOUNDER_ALERT_EMAIL");
  const apiKey = await resolveBrevoKey();
  if (!recipient || !apiKey) return { ok: false, status: "not_configured" };
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: "Founder Dashboard", email: env("BREVO_SENDER_EMAIL") || "ownyourwebsmm@gmail.com" },
      to: [{ email: recipient }],
      subject,
      textContent: text,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:32px;color:#171914;background:#f7f3e8"><h1 style="font-size:28px">${escapeHtml(subject)}</h1><pre style="white-space:pre-wrap;font:15px/1.6 Arial,sans-serif">${escapeHtml(text)}</pre></div>`,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.ok ? "sent" : "failed", message_id: data?.messageId || null };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const claims = decodeClaims(request);
  if (claims.role !== "anon" && claims.sub !== FOUNDER_ID) return json({ error: "Forbidden" }, 403);
  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) return json({ error: "Cloud configuration unavailable" }, 500);

  let body: Row = {};
  try { body = await request.json(); } catch { /* Empty body means automatic mode. */ }

  try {
    const [preferencesRows, projects, jobs, schedules] = await Promise.all([
      requestJson(`founder_notification_preferences?owner_id=eq.${FOUNDER_ID}&select=*&limit=1`),
      requestJson(`founder_projects?owner_id=eq.${FOUNDER_ID}&select=*`),
      requestJson(`founder_jobs?owner_id=eq.${FOUNDER_ID}&status=neq.done&select=*`),
      requestJson(`founder_schedules?owner_id=eq.${FOUNDER_ID}&status=eq.active&select=*`),
    ]);
    const preferences = preferencesRows?.[0] || {
      timezone: "America/New_York", morning_brief_hour: 7, midday_brief_hour: 12, evening_brief_hour: 18,
      reminder_lead_hours: 24, telegram_enabled: true, email_enabled: false, quiet_hours_start: 21, quiet_hours_end: 7,
    };
    const local = localParts(preferences.timezone);
    let mode = String(body.mode || "auto");
    if (mode === "auto") {
      if (local.hour === preferences.morning_brief_hour) mode = "morning";
      else if (local.hour === preferences.midday_brief_hour) mode = "midday";
      else if (local.hour === preferences.evening_brief_hour) mode = "evening";
      else mode = "pulse";
    }
    if (!["morning", "midday", "evening", "pulse", "manual", "test"].includes(mode)) return json({ error: "Invalid briefing mode" }, 400);

    const [run] = await requestJson("founder_brief_runs", {
      method: "POST",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({ owner_id: FOUNDER_ID, run_type: mode, status: "running" }),
    });

    const now = Date.now();
    const leadLimit = now + Number(preferences.reminder_lead_hours || 24) * 3600000;
    const candidates: Row[] = [];

    for (const job of jobs || []) {
      if (!job.due_at) continue;
      const due = new Date(job.due_at).getTime();
      if (due < now) candidates.push({
        brand: job.brand, title: `Overdue: ${job.title}`, message: `This was due ${formatEastern(job.due_at)}. Decide, delegate, or reschedule it.`, severity: "urgent", source: "deadline", event_at: job.due_at,
        fingerprint: `deadline:${job.id}:overdue:${local.date}`, action_url: `${DASHBOARD_URL}#jobs`,
      });
      else if (due <= leadLimit) candidates.push({
        brand: job.brand, title: `Coming due: ${job.title}`, message: `Due ${formatEastern(job.due_at)}.`, severity: job.priority === "urgent" ? "urgent" : "attention", source: "deadline", event_at: job.due_at,
        fingerprint: `deadline:${job.id}:upcoming:${local.date}`, action_url: `${DASHBOARD_URL}#jobs`,
      });
    }

    for (const project of projects || []) {
      if (project.status === "attention" || Number(project.health) < 80) candidates.push({
        brand: project.brand, title: `${project.name} needs attention`, message: project.next_action || `System health is ${project.health}%.`, severity: Number(project.health) < 60 ? "urgent" : "attention", source: "project-health",
        fingerprint: `project:${project.id}:attention:${local.date}`, action_url: project.live_url || `${DASHBOARD_URL}#projects`,
      });
    }

    for (const schedule of schedules || []) {
      if (!schedule.next_run_at) continue;
      const next = new Date(schedule.next_run_at).getTime();
      if (next >= now && next <= leadLimit) candidates.push({
        brand: schedule.brand, title: schedule.name, message: `${schedule.schedule_label}. Next run ${formatEastern(schedule.next_run_at)}.`, severity: "info", source: "schedule", event_at: schedule.next_run_at,
        fingerprint: `schedule:${schedule.id}:${local.date}`, action_url: `${DASHBOARD_URL}#schedule`,
      });
    }

    const attentionProjects = (projects || []).filter((project: Row) => project.status === "attention" || Number(project.health) < 80).length;
    const overdueJobs = (jobs || []).filter((job: Row) => job.due_at && new Date(job.due_at).getTime() < now).length;
    const summary = { openJobs: jobs?.length || 0, overdueJobs, attentionProjects, activeSchedules: schedules?.length || 0 };

    if (["morning", "midday", "evening", "manual", "test"].includes(mode)) candidates.unshift({
      brand: "PERSONAL", title: mode === "morning" ? "Your day is ready" : mode === "evening" ? "Close the day with clarity" : "Founder briefing updated",
      message: `${summary.openJobs} open jobs, ${summary.overdueJobs} overdue, ${summary.attentionProjects} projects needing attention.`, severity: summary.overdueJobs ? "urgent" : summary.attentionProjects ? "attention" : "info", source: "daily-brief",
      fingerprint: mode === "test" ? `daily-brief:test:${Date.now()}` : `daily-brief:${mode}:${local.date}`, action_url: `${DASHBOARD_URL}#briefing`,
    });

    const createdAlerts = (await Promise.all(candidates.map(insertAlert))).filter(Boolean);
    const quiet = isQuietHour(local.hour, preferences.quiet_hours_start, preferences.quiet_hours_end);
    const scheduledBrief = ["morning", "midday", "evening", "test"].includes(mode);
    const hasUrgent = createdAlerts.some((alert: Row) => alert.severity === "urgent");
    const shouldDeliver = body.deliver !== false && createdAlerts.length > 0 && (!quiet || hasUrgent) && (scheduledBrief || hasUrgent);
    const text = buildMessage(mode, createdAlerts, summary);
    const deliveries: Row = {};

    if (shouldDeliver && preferences.telegram_enabled) deliveries.telegram = await sendTelegram(text);
    if (shouldDeliver && preferences.email_enabled) deliveries.email = await sendEmail(mode === "morning" ? "Your morning founder brief" : "Founder Dashboard alert", text);

    const deliveryFailed = Object.values(deliveries).some((item: any) => item && !item.ok && item.status !== "not_configured");
    const status = deliveryFailed ? "partial" : "success";
    await requestJson(`founder_brief_runs?id=eq.${run.id}`, {
      method: "PATCH",
      headers: serviceHeaders("return=minimal"),
      body: JSON.stringify({ status, alerts_created: createdAlerts.length, summary, deliveries, finished_at: new Date().toISOString() }),
    });

    return json({ ok: status === "success", mode, alerts_created: createdAlerts.length, summary, deliveries, quiet_hours: quiet, telegram_due: shouldDeliver && preferences.telegram_enabled, message: text });
  } catch (error) {
    console.error("founder_daily_brief_failed", error);
    return json({ error: "Founder briefing failed" }, 500);
  }
});
