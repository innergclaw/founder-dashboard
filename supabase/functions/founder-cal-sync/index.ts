import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FOUNDER_ID = "75677100-97b7-4578-92c5-cf131997b580";
const DASHBOARD_URL = "https://innergclaw.github.io/founder-dashboard/#schedule";
const CAL_API_VERSION = "2026-05-01";
const TIMEZONE = "America/New_York";
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

function localParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const item = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${item.year}-${item.month}-${item.day}`,
    hour: Number(item.hour),
    minute: Number(item.minute),
  };
}

function localDate(value: string) {
  return localParts(new Date(value)).date;
}

function formatEastern(value: string, includeDay = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    ...(includeDay ? { weekday: "short", month: "short", day: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function nextCheckAt() {
  const candidate = new Date();
  candidate.setUTCMinutes(0, 0, 0);
  candidate.setUTCHours(candidate.getUTCHours() + 1);
  for (let index = 0; index < 48; index += 1) {
    const local = localParts(candidate);
    if ((local.hour === 7 || local.hour === 19) && local.minute === 0) return candidate.toISOString();
    candidate.setUTCHours(candidate.getUTCHours() + 1);
  }
  return null;
}

function cleanNames(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => String(item?.name || "").trim()).filter(Boolean).slice(0, 12);
}

function cleanLocation(booking: Row) {
  if (typeof booking.location === "string") return booking.location.slice(0, 2000);
  if (typeof booking.meetingUrl === "string") return booking.meetingUrl.slice(0, 2000);
  if (typeof booking.location?.link === "string") return booking.location.link.slice(0, 2000);
  return null;
}

async function fetchUpcoming(calKey: string, afterStart: string, beforeEnd: string) {
  const bookings: Row[] = [];
  let cursor = "";
  do {
    const url = new URL("https://api.cal.com/v2/bookings");
    url.searchParams.set("status", "upcoming");
    url.searchParams.set("afterStart", afterStart);
    url.searchParams.set("beforeEnd", beforeEnd);
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${calKey}`,
        "cal-api-version": CAL_API_VERSION,
      },
    });
    if (!response.ok) throw new Error(`cal_request_${response.status}`);
    const payload = await response.json();
    if (payload.status !== "success" || !Array.isArray(payload.data)) throw new Error("cal_response_invalid");
    bookings.push(...payload.data);
    cursor = payload.pagination?.hasMore && payload.pagination?.nextCursor ? String(payload.pagination.nextCursor) : "";
  } while (cursor && bookings.length < 1000);
  return bookings;
}

function callLabel(event: Row, includeDay = false) {
  const attendee = event.attendee_names?.[0] ? ` with ${event.attendee_names[0]}` : "";
  return `${formatEastern(event.start_at, includeDay)} · ${event.title}${attendee}`;
}

function buildSummary(mode: string, events: Row[], today: string) {
  const todayEvents = events.filter((event) => localDate(event.start_at) === today);
  const nextEvents = events.slice(0, 5);
  const dayLabel = mode === "evening" ? "Remaining today" : "Today";
  const dayText = todayEvents.length ? todayEvents.slice(0, 4).map((event) => callLabel(event)).join("; ") : "No calls scheduled";
  const weekText = nextEvents.length ? nextEvents.map((event) => callLabel(event, true)).join("; ") : "No calls scheduled";
  return `${dayLabel}: ${dayText}. Next 7 days: ${events.length} call${events.length === 1 ? "" : "s"}. ${weekText}.`;
}

async function insertAlert(mode: string, localDateValue: string, message: string, firstEvent?: Row) {
  const rows = await requestJson("founder_alerts?on_conflict=owner_id,fingerprint", {
    method: "POST",
    headers: serviceHeaders("resolution=ignore-duplicates,return=representation"),
    body: JSON.stringify({
      owner_id: FOUNDER_ID,
      brand: "PERSONAL",
      title: mode === "morning" ? "Your Cal.com calls for today and this week" : "Your evening Cal.com call check",
      message,
      severity: "info",
      source: "schedule",
      event_at: firstEvent?.start_at || null,
      fingerprint: `cal:${mode}:${localDateValue}`,
      action_url: DASHBOARD_URL,
    }),
  });
  return rows?.[0] || null;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const claims = decodeClaims(request);
  if (claims.role !== "anon" && claims.sub !== FOUNDER_ID) return json({ error: "Forbidden" }, 403);
  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) return json({ error: "Cloud configuration unavailable" }, 500);

  const calKey = request.headers.get("x-cal-api-key")?.trim() || "";
  if (!calKey.startsWith("cal_")) return json({ error: "Cal.com configuration unavailable" }, 500);

  let body: Row = {};
  try { body = await request.json(); } catch { /* Empty body uses automatic mode. */ }

  const local = localParts();
  let mode = String(body.mode || "auto");
  if (mode === "auto") {
    if (local.hour === 7) mode = "morning";
    else if (local.hour === 19) mode = "evening";
    else return json({ ok: true, skipped: true, reason: "outside_check_window" });
  }
  if (!['morning', 'evening', 'manual', 'test'].includes(mode)) return json({ error: "Invalid check mode" }, 400);

  let run: Row | null = null;
  try {
    [run] = await requestJson("founder_calendar_sync_runs", {
      method: "POST",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({ owner_id: FOUNDER_ID, run_type: mode, status: "running" }),
    });

    const afterStart = new Date().toISOString();
    const beforeEnd = new Date(Date.now() + 7 * 86400000).toISOString();
    const bookings = await fetchUpcoming(calKey, afterStart, beforeEnd);
    const now = new Date().toISOString();
    const events = bookings
      .filter((booking) => booking.uid && booking.title && booking.start && booking.end)
      .map((booking) => ({
        owner_id: FOUNDER_ID,
        booking_uid: String(booking.uid),
        title: String(booking.title).slice(0, 300),
        status: String(booking.status || "accepted").slice(0, 40),
        start_at: booking.start,
        end_at: booking.end,
        location: cleanLocation(booking),
        attendee_names: cleanNames(booking.attendees),
        host_names: cleanNames(booking.hosts),
        event_type_id: Number(booking.eventType?.id || booking.eventTypeId) || null,
        source: "cal.com",
        is_current: true,
        last_seen_at: now,
        updated_at: now,
      }));

    if (events.length) {
      await requestJson("founder_calendar_events?on_conflict=owner_id,booking_uid", {
        method: "POST",
        headers: serviceHeaders("resolution=merge-duplicates,return=minimal"),
        body: JSON.stringify(events),
      });
    }

    const existing = await requestJson(`founder_calendar_events?owner_id=eq.${FOUNDER_ID}&is_current=eq.true&start_at=gte.${encodeURIComponent(afterStart)}&start_at=lte.${encodeURIComponent(beforeEnd)}&select=booking_uid`);
    const currentUids = new Set(events.map((event) => event.booking_uid));
    for (const previous of existing || []) {
      if (currentUids.has(previous.booking_uid)) continue;
      await requestJson(`founder_calendar_events?owner_id=eq.${FOUNDER_ID}&booking_uid=eq.${encodeURIComponent(previous.booking_uid)}`, {
        method: "PATCH",
        headers: serviceHeaders("return=minimal"),
        body: JSON.stringify({ is_current: false, updated_at: now }),
      });
    }

    const todayEvents = events.filter((event) => localDate(event.start_at) === local.date);
    const summary = buildSummary(mode, events, local.date);
    await insertAlert(mode, local.date, summary, events[0]);

    await requestJson("founder_schedules?on_conflict=owner_id,source,name", {
      method: "POST",
      headers: serviceHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify({
        owner_id: FOUNDER_ID,
        brand: "PERSONAL",
        name: "Cal.com call checks",
        schedule_label: "Every day at 7:00 AM and 7:00 PM Eastern",
        next_run_at: nextCheckAt(),
        status: "active",
        source: "github-actions",
        notes: "Checks today's calls and the next 7 days, then updates the private dashboard.",
        updated_at: now,
      }),
    });

    await requestJson(`founder_calendar_sync_runs?id=eq.${run.id}`, {
      method: "PATCH",
      headers: serviceHeaders("return=minimal"),
      body: JSON.stringify({ status: "success", bookings_checked: events.length, today_count: todayEvents.length, week_count: events.length, finished_at: now }),
    });

    return json({ ok: true, mode, today_count: todayEvents.length, week_count: events.length, checked_at: now });
  } catch (error) {
    if (run?.id) {
      await requestJson(`founder_calendar_sync_runs?id=eq.${run.id}`, {
        method: "PATCH",
        headers: serviceHeaders("return=minimal"),
        body: JSON.stringify({ status: "failed", finished_at: new Date().toISOString() }),
      }).catch(() => null);
    }
    console.error("founder_cal_sync_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Cal.com check failed" }, 500);
  }
});

