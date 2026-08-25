import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

const FOUNDER_ID = "75677100-97b7-4578-92c5-cf131997b580";
const BRAND_ORDER = ["OWNYOURWEB", "INNERGINTEL", "SHOPNASGFX"];
const NAV_ITEMS = [
  ["overview", "Overview", "grid"],
  ["briefing", "Briefing", "bell"],
  ["chief", "Chief of Staff", "message"],
  ["agents", "Agents", "layers"],
  ["projects", "Projects", "layers"],
  ["development", "Development", "compass"],
  ["professional", "Professional", "briefcase"],
  ["schedule", "Schedule", "calendar"],
  ["jobs", "Jobs", "check"],
];

const WEALTH_BUILDER_TRAITS = [
  ["01", "Relentless consistency", "Keep the promise after the excitement wears off."],
  ["02", "An ownership mindset", "Build equity, control the asset, and protect the relationship."],
  ["03", "Radical delayed gratification", "Trade short-term appearance for long-term freedom."],
  ["04", "Obsession with financial literacy", "Know how money moves, compounds, gets taxed, and carries risk."],
  ["05", "Emotional discipline in volatile markets", "Make decisions from a plan instead of fear, urgency, or hype."],
  ["06", "Multiple income stream architecture", "Create connected income streams that do not all depend on the same labor."],
  ["07", "High-value network cultivation", "Build trusted relationships with people who create, teach, fund, and execute."],
  ["08", "Clear generational vision", "Define what the next generation should inherit, understand, and improve."],
  ["09", "Extreme resourcefulness and problem-solving", "Use what is available, find the missing piece, and keep moving."],
  ["10", "Unshakable self-accountability", "Tell yourself the truth, correct course, and finish what matters."],
];

const DEVELOPMENT_PHASES = [
  ["30–32", "Foundation", "Consistency, ownership, financial literacy, and self-accountability."],
  ["33–35", "Architecture", "Delayed gratification, resourcefulness, and connected income streams."],
  ["36–38", "Expansion", "Emotional discipline, stronger decisions, and a high-value network."],
  ["39–40", "Stewardship", "Generational vision, protected assets, and systems that can outlive your daily labor."],
];

const BRAND_META = {
  OWNYOURWEB: { label: "OWNYOURWEB", short: "OYW", strap: "Services → systems → ownership", tone: "lime" },
  INNERGINTEL: { label: "INNERGINTEL", short: "IG", strap: "Education → intelligence → leverage", tone: "gold" },
  SHOPNASGFX: { label: "SHOPNASGFX", short: "SNG", strap: "Design → identity → value", tone: "blue" },
  PERSONAL: { label: "PERSONAL", short: "NGM", strap: "Focus → discipline → movement", tone: "cream" },
};

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <><path d="M9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    external: <><path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    cloud: <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>,
    github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3 1S18.2.6 15 2.5a13.4 13.4 0 0 0-6 0C5.8.6 4.7 1 4.7 1a5 5 0 0 0-.1 3A5.4 5.4 0 0 0 3.2 7.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 9 18v4"/><path d="M9 18c-4.5 2-5-2-7-2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    sunrise: <><path d="M12 2v3M4.2 6.2l2.1 2.1M2 14h3M19 14h3M17.7 8.3l2.1-2.1"/><path d="M5 18a7 7 0 0 1 14 0M3 22h18"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}

function formatDate(value, options = {}) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: options.year ? "numeric" : undefined,
    hour: options.time ? "numeric" : undefined,
    minute: options.time ? "2-digit" : undefined,
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function formatBriefingDate(value) {
  if (!value) return "No reflection yet";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(`${value}T12:00:00Z`));
}

function timeAgo(value) {
  if (!value) return "No activity found";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

function syncAge(value) {
  if (!value) return "not yet";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function alertAge(value) {
  if (!value) return "Just now";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Login({ onSession }) {
  const [email, setEmail] = useState("innerg410@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("That login did not work. Check the email and password, then try again.");
      setLoading(false);
      return;
    }
    if (data.user?.id !== FOUNDER_ID) {
      await supabase.auth.signOut();
      setError("This dashboard is restricted to the founder account.");
      setLoading(false);
      return;
    }
    onSession(data.session);
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="founder-mark" aria-label="Nasirr Mayo founder dashboard"><span>N</span><i /></div>
      <div className="login-message">
        <p className="eyebrow">Private founder infrastructure</p>
        <h1>See the whole ecosystem.<br /><em>Move what matters.</em></h1>
        <p>One operating view for the projects, reminders, and jobs behind OWNYOURWEB, INNERGINTEL, and SHOPNASGFX.</p>
      </div>
      <div className="login-brands" aria-label="Connected brands">
        {BRAND_ORDER.map((brand, index) => <div key={brand}><span>0{index + 1}</span><b>{brand}</b></div>)}
      </div>
    </section>
    <section className="login-access">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Founder access</p>
        <h2>Open your dashboard</h2>
        <p className="login-intro">Your cloud workspace is protected by your confirmed administrator account.</p>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Opening…" : <>Enter dashboard <Icon name="arrow" /></>}</button>
        <div className="security-note"><span><Icon name="cloud" size={16} /> Cloud connected</span><span>Founder only</span></div>
      </form>
    </section>
  </main>;
}

function Metric({ label, value, detail, tone = "neutral" }) {
  return <article className={`metric-card tone-${tone}`}><div><p>{label}</p><strong>{value}</strong></div><span>{detail}</span></article>;
}

function BrandCard({ brand, projects, jobs, onOpen }) {
  const meta = BRAND_META[brand];
  const average = projects.length ? Math.round(projects.reduce((sum, item) => sum + item.health, 0) / projects.length) : 0;
  const openJobs = jobs.filter((job) => job.brand === brand && job.status !== "done").length;
  return <article className={`brand-card tone-${meta.tone}`}>
    <div className="brand-card-head"><span className="brand-monogram">{meta.short}</span><span className="live-pill"><i /> Operational</span></div>
    <div><p className="eyebrow">{meta.strap}</p><h3>{meta.label}</h3></div>
    <div className="brand-stats"><div><strong>{projects.length}</strong><span>Priority projects</span></div><div><strong>{average}%</strong><span>System health</span></div><div><strong>{openJobs}</strong><span>Open jobs</span></div></div>
    <button className="text-action" onClick={() => onOpen(brand)} type="button">Open project view <Icon name="arrow" size={16} /></button>
  </article>;
}

function ProjectCard({ project }) {
  const meta = BRAND_META[project.brand];
  const repoState = project.repo_state?.ok ? project.repo_state : null;
  return <article className="project-card">
    <div className="project-card-top"><span className={`brand-chip tone-${meta.tone}`}>{meta.short}</span><span className={`status-chip status-${project.status}`}>{project.status}</span></div>
    <div><h3>{project.name}</h3><p>{project.summary}</p></div>
    <div className="health-row"><span>System health</span><strong>{project.health}%</strong><i><b style={{ width: `${project.health}%` }} /></i></div>
    <div className="next-action"><span>Next action</span><p>{project.next_action}</p></div>
    <div className="project-card-footer">
      <span>{repoState ? timeAgo(repoState.pushed_at) : formatDate(project.last_verified_at, { year: true })}</span>
      <div>{project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer" aria-label={`${project.name} GitHub repository`}><Icon name="github" /></a>}{project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`Open ${project.name}`}><Icon name="external" /></a>}</div>
    </div>
  </article>;
}

function ScheduleCard({ item }) {
  const meta = BRAND_META[item.brand];
  return <article className="schedule-card">
    <div className={`schedule-mark tone-${meta.tone}`}><Icon name="clock" /></div>
    <div><div className="schedule-meta"><span className={`brand-chip tone-${meta.tone}`}>{meta.short}</span><span>{item.source}</span></div><h3>{item.name}</h3><p>{item.schedule_label}</p>{item.notes && <small>{item.notes}</small>}</div>
    <span className={`status-chip status-${item.status}`}>{item.status}</span>
  </article>;
}

function AlertCard({ alert, onStatus }) {
  const meta = BRAND_META[alert.brand || "PERSONAL"] || BRAND_META.PERSONAL;
  return <article className={`alert-card severity-${alert.severity} ${alert.status !== "unread" ? "is-read" : ""}`}>
    <div className="alert-signal"><Icon name={alert.severity === "urgent" ? "bell" : alert.source === "schedule" ? "clock" : "sunrise"} /></div>
    <div className="alert-copy"><div className="alert-meta"><span className={`brand-chip tone-${meta.tone}`}>{meta.short}</span><span>{alert.source.replace("-", " ")}</span><span>{alertAge(alert.created_at)}</span></div><h3>{alert.title}</h3>{alert.message && <p>{alert.message}</p>}</div>
    <div className="alert-actions">{alert.action_url && <a href={alert.action_url} target={alert.action_url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">Open <Icon name="arrow" size={15} /></a>}{alert.status === "unread" && <button onClick={() => onStatus(alert.id, "read")} type="button">Mark read</button>}<button onClick={() => onStatus(alert.id, "dismissed")} type="button">Dismiss</button></div>
  </article>;
}

function ChannelCard({ icon, name, detail, state, tone = "neutral" }) {
  return <article className={`channel-card tone-${tone}`}><span><Icon name={icon} /></span><div><h3>{name}</h3><p>{detail}</p></div><b className={`channel-state state-${state}`}>{state}</b></article>;
}

function ReflectionList({ title, items, tone = "neutral" }) {
  const entries = Array.isArray(items) ? items : [];
  return <section className={`reflection-list tone-${tone}`}>
    <h4>{title}</h4>
    {entries.length ? <ul>{entries.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul> : <p>Nothing recorded.</p>}
  </section>;
}

function DailyReflection({ briefings }) {
  const latest = briefings[0];
  return <section className="reflection-panel" aria-labelledby="reflection-title">
    <div className="reflection-head">
      <div><p className="eyebrow">Daily voice memo</p><h2 id="reflection-title">Founder reflection</h2></div>
      <div className="reflection-rhythm"><span><b>6:00 PM</b> reminder</span><Icon name="arrow" size={15} /><span><b>8:00 PM</b> voice memo</span></div>
    </div>
    {latest ? <>
      <article className="reflection-latest">
        <div className="reflection-summary"><span>{formatBriefingDate(latest.briefing_date)}</span><h3>{latest.summary || "Daily operating review"}</h3><p>Prepared from your founder voice memo and kept private inside this dashboard.</p></div>
        <div className="reflection-grid">
          <ReflectionList title="Completed" items={latest.completed} tone="lime" />
          <ReflectionList title="Decisions" items={latest.decisions} tone="blue" />
          <ReflectionList title="Blockers" items={latest.blockers} tone="gold" />
          <ReflectionList title="Tomorrow's top priorities" items={latest.tomorrow_priorities} tone="lime" />
          <ReflectionList title="Remainder of the week" items={latest.week_focus} tone="blue" />
        </div>
      </article>
      {briefings.length > 1 && <div className="reflection-history"><p className="eyebrow">Recent briefings</p><div>{briefings.slice(1, 8).map((briefing) => <article key={briefing.id}><span>{formatBriefingDate(briefing.briefing_date)}</span><p>{briefing.summary || "Daily operating review"}</p></article>)}</div></div>}
    </> : <div className="reflection-empty">
      <span><Icon name="message" size={24} /></span>
      <div><h3>Your first voice briefing will appear here.</h3><p>At 6:00 PM, Codex will remind you to prepare. Send the voice memo around 8:00 PM with what you completed, what changed, what is blocked, tomorrow's priorities, and the rest-of-week focus.</p></div>
    </div>}
  </section>;
}

function BriefingSettings({ preferences, onSave }) {
  const [draft, setDraft] = useState(preferences);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(preferences); }, [preferences]);
  if (!draft) return null;
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : Number(event.target.value) }));
  async function save(event) { event.preventDefault(); setSaving(true); await onSave(draft); setSaving(false); }
  return <form className="briefing-settings" onSubmit={save}>
    <div className="settings-head"><div><p className="eyebrow">Your operating rhythm</p><h2>Briefing schedule</h2></div><span>Eastern time</span></div>
    <div className="time-settings"><label>Morning brief<select value={draft.morning_brief_hour} onChange={set("morning_brief_hour")}>{Array.from({ length: 24 }, (_, hour) => <option value={hour} key={hour}>{new Date(2026, 0, 1, hour).toLocaleTimeString("en-US", { hour: "numeric" })}</option>)}</select></label><label>Midday pulse<select value={draft.midday_brief_hour} onChange={set("midday_brief_hour")}>{Array.from({ length: 24 }, (_, hour) => <option value={hour} key={hour}>{new Date(2026, 0, 1, hour).toLocaleTimeString("en-US", { hour: "numeric" })}</option>)}</select></label><label>Evening reset<select value={draft.evening_brief_hour} onChange={set("evening_brief_hour")}>{Array.from({ length: 24 }, (_, hour) => <option value={hour} key={hour}>{new Date(2026, 0, 1, hour).toLocaleTimeString("en-US", { hour: "numeric" })}</option>)}</select></label><label>Deadline warning<select value={draft.reminder_lead_hours} onChange={set("reminder_lead_hours")}><option value="6">6 hours ahead</option><option value="12">12 hours ahead</option><option value="24">24 hours ahead</option><option value="48">2 days ahead</option><option value="72">3 days ahead</option></select></label></div>
    <div className="channel-toggles"><label><input type="checkbox" checked={draft.telegram_enabled} onChange={set("telegram_enabled")} /><span><b>Telegram alerts</b><small>Immediate mobile delivery</small></span></label><label><input type="checkbox" checked={draft.email_enabled} onChange={set("email_enabled")} /><span><b>Email backup</b><small>Delivered when configured</small></span></label><label className="disabled-toggle"><input type="checkbox" checked={false} disabled /><span><b>Apple Messages</b><small>Waiting for connector availability</small></span></label></div>
    <button className="primary-button compact-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save daily rhythm"}</button>
  </form>;
}

function JobRow({ job, onStatus, onDelete }) {
  const meta = BRAND_META[job.brand];
  return <article className={`job-row priority-${job.priority}`}>
    <div className="job-main"><div className="job-tags"><span className={`brand-chip tone-${meta.tone}`}>{meta.short}</span><span className="priority-chip">{job.priority}</span></div><h3>{job.title}</h3>{job.details && <p>{job.details}</p>}</div>
    <div className="job-date"><span>Due</span><strong>{job.due_at ? formatDate(job.due_at, { time: true }) : "No deadline"}</strong></div>
    <select aria-label={`Status for ${job.title}`} value={job.status} onChange={(event) => onStatus(job.id, event.target.value)}><option value="queued">Queued</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="done">Done</option></select>
    <button className="icon-button danger-button" onClick={() => onDelete(job)} type="button" aria-label={`Delete ${job.title}`}><Icon name="close" size={16} /></button>
  </article>;
}

function JobComposer({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", brand: "OWNYOURWEB", priority: "medium", due_at: "", details: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase.from("founder_jobs").insert({
      owner_id: FOUNDER_ID,
      title: form.title.trim(),
      brand: form.brand,
      priority: form.priority,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      details: form.details.trim(),
      source: "Founder Dashboard",
    });
    if (insertError) {
      setError("The job could not be saved. Refresh and try again.");
      setSaving(false);
      return;
    }
    setForm({ title: "", brand: "OWNYOURWEB", priority: "medium", due_at: "", details: "" });
    setSaving(false);
    onSaved();
    onClose();
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
      <div className="modal-head"><div><p className="eyebrow">Cloud job queue</p><h2 id="job-modal-title">Add the next move</h2></div><button className="icon-button" onClick={onClose} type="button" aria-label="Close"><Icon name="close" /></button></div>
      <form onSubmit={submit}>
        <label className="field-wide">Job title<input value={form.title} onChange={set("title")} maxLength="160" placeholder="What needs to move?" required autoFocus /></label>
        <label>Brand<select value={form.brand} onChange={set("brand")}>{[...BRAND_ORDER, "PERSONAL"].map((brand) => <option key={brand}>{brand}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={set("priority")}><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label className="field-wide">Due date<input type="datetime-local" value={form.due_at} onChange={set("due_at")} /></label>
        <label className="field-wide">Context and next action<textarea value={form.details} onChange={set("details")} placeholder="Add enough context to pick this up from any device." /></label>
        {error && <p className="form-error field-wide" role="alert">{error}</p>}
        <div className="modal-actions field-wide"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save to cloud"}</button></div>
      </form>
    </section>
  </div>;
}

function ProfessionalWorkspace({ documents, applications, onOpenDocument, onUploadDocument, onApplicationStatus }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const error = await onUploadDocument(file);
    if (error) setUploadError(error);
    setUploading(false);
    event.target.value = "";
  }

  return <section className="view-stack professional-view">
    <div className="professional-hero">
      <div><p className="eyebrow">Private career command center</p><h2>Experience, documents, and opportunities in one place.</h2><p>Keep your professional story current, carry the right documents into every opportunity, and know exactly what needs to move next.</p></div>
      <div className="professional-identity"><span className="brand-monogram">NGM</span><p>Nasirr G. Mayo</p><strong>Creative Digital Specialist</strong><small>Philadelphia, PA · 10+ years building brands, systems, and client experiences</small></div>
    </div>

    <div className="professional-metrics">
      <Metric label="Current documents" value={documents.filter((item) => item.status === "current").length} detail="Private cloud library" tone="lime" />
      <Metric label="Active applications" value={applications.filter((item) => !["closed", "offer"].includes(item.status)).length} detail="Tracked opportunities" tone="blue" />
      <Metric label="Core experience" value="10+ yrs" detail="Creative and digital systems" tone="gold" />
    </div>

    <div className="professional-grid">
      <section className="document-library">
        <div className="section-heading compact-heading"><div><p className="eyebrow">Professional docs</p><h2>Resume and records</h2></div><label className={`upload-button ${uploading ? "is-busy" : ""}`}><Icon name="plus" size={16} />{uploading ? "Uploading…" : "Add PDF"}<input type="file" accept="application/pdf,.pdf" onChange={upload} disabled={uploading} /></label></div>
        {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
        {documents.length ? <div className="document-list">{documents.map((document) => <article className="document-card" key={document.id}>
          <span className="document-icon"><Icon name="file" /></span>
          <div><div className="document-meta"><span>{document.category.replace("-", " ")}</span><span>{document.version_label || "Current"}</span></div><h3>{document.title}</h3><p>{document.description || document.file_name}</p><small>{Math.max(1, Math.round(document.size_bytes / 1024))} KB · Private Supabase storage</small></div>
          <button className="icon-button" onClick={() => onOpenDocument(document)} type="button" aria-label={`Open ${document.title}`}><Icon name="download" /></button>
        </article>)}</div> : <div className="professional-empty"><span><Icon name="file" /></span><div><h3>Your document library is ready.</h3><p>Add the current resume to keep it protected and available from any device.</p></div></div>}
      </section>

      <aside className="professional-profile">
        <p className="eyebrow">Professional snapshot</p><h2>What you bring</h2>
        <p>Creative digital leadership backed by operational discipline, safety awareness, documentation, project coordination, and direct client service.</p>
        <div><span>Brand identity and web systems</span><span>Project coordination and documentation</span><span>Safety awareness and sound judgment</span><span>Client communication and follow-through</span></div>
        <a href="https://nasirr.innergintel.org/" target="_blank" rel="noreferrer">Open Home Base <Icon name="external" size={15} /></a>
      </aside>
    </div>

    <section className="application-board">
      <div className="section-heading compact-heading"><div><p className="eyebrow">Opportunity pipeline</p><h2>Job applications</h2></div><span className="source-note"><i /> Founder only</span></div>
      {applications.length ? <div className="application-list">{applications.map((application) => <article className="application-card" key={application.id}>
        <div className="application-company"><span><Icon name="briefcase" /></span><div><small>{application.company}</small><h3>{application.role}</h3><p>{application.location}</p></div></div>
        <div className="application-notes"><span>Fit and qualification notes</span><p>{application.match_notes}</p></div>
        <div className="application-next"><span>Next action</span><p>{application.next_action}</p></div>
        <div className="application-actions"><select aria-label={`Status for ${application.role}`} value={application.status} onChange={(event) => onApplicationStatus(application.id, event.target.value)}><option value="researching">Researching</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="submitted">Submitted</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="closed">Closed</option></select><a href={application.job_url} target="_blank" rel="noreferrer">Open role <Icon name="external" size={15} /></a></div>
      </article>)}</div> : <div className="professional-empty"><span><Icon name="briefcase" /></span><div><h3>No applications tracked yet.</h3><p>Add an opportunity when it deserves focused follow-through.</p></div></div>}
    </section>
  </section>;
}

function ChiefOfStaffView({ items, onProcessed }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const latest = result?.decision || items[0]?.decision || null;

  async function submit(event) {
    event.preventDefault();
    const founderMessage = message.trim();
    if (!founderMessage) return;
    setSubmitting(true);
    setSubmitError("");
    setResult(null);
    const { data, error } = await supabase.functions.invoke("founder-chief-of-staff", {
      body: { message: founderMessage, source: "dashboard" },
    });
    if (error || !data?.decision) {
      setSubmitError("Agent 1 could not process that check-in. Your message was not added to the queue.");
      setSubmitting(false);
      return;
    }
    setResult(data);
    setMessage("");
    await onProcessed();
    setSubmitting(false);
  }

  return <section className="view-stack chief-view">
    <div className="chief-hero">
      <div><p className="eyebrow">Agent 1 · Founder operations</p><h2>Say it once.<br />Get the next move.</h2><p>Drop in a thought, task, update, or decision. Chief of Staff sorts the brand, protects your focus, and sends only safe internal work into the cloud queue.</p></div>
      <div className="chief-model"><span><i /> Online</span><strong>GPT-OSS 120B</strong><small>Groq Cloud · Supabase policy gate</small></div>
    </div>

    <div className="chief-workspace">
      <form className="chief-intake" onSubmit={submit}>
        <div><p className="eyebrow">Founder check-in</p><h3>What needs attention?</h3><p>Use your natural voice. Context is more useful than perfect wording.</p></div>
        <label htmlFor="chief-message">Message</label>
        <textarea id="chief-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength="12000" placeholder="Example: Review the Nickle Nine Neet artist update and prepare the next internal action." required disabled={submitting} />
        <div className="chief-intake-foot"><small>{message.length.toLocaleString()} / 12,000</small><button className="primary-button" disabled={submitting || !message.trim()} type="submit"><Icon name="arrow" /> {submitting ? "Thinking…" : "Get the next move"}</button></div>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
      </form>

      <section className={`chief-decision ${latest ? `lane-${latest.lane}` : "is-empty"}`} aria-live="polite">
        {submitting ? <div className="chief-thinking"><div className="loader" /><p>Reading the message, checking active work, and applying founder policy.</p></div> : latest ? <>
          <div className="chief-decision-head"><p className="eyebrow">{result ? "New decision" : "Latest decision"}</p><span className="status-chip">{latest.lane}</span></div>
          <div><span className={`brand-chip tone-${BRAND_META[latest.brand]?.tone || "cream"}`}>{latest.brand}</span><h3>{latest.title}</h3><p>{latest.summary}</p></div>
          <div className="chief-next"><span>Recommended next action</span><p>{latest.recommendedNextAction}</p></div>
          <div className="chief-policy"><span>{latest.classification}</span><span>{latest.priority} priority</span><span>{latest.risk} risk</span></div>
          {latest.requiresApproval && <aside><Icon name="bell" size={17} /><div><b>Your approval is required.</b><p>{latest.approvalReason || "This action crosses an external or protected boundary."}</p></div></aside>}
        </> : <div className="chief-empty"><span><Icon name="message" size={24} /></span><div><h3>Ready when you are.</h3><p>Your decision will appear here. New ideas can cool for 24 hours, while existing commitments keep priority.</p></div></div>}
      </section>
    </div>

    <section className="chief-history">
      <div className="section-heading compact-heading"><div><p className="eyebrow">Private decision log</p><h2>Recent check-ins</h2></div><span className="source-note"><i /> Supabase protected</span></div>
      {items.length ? <div className="chief-item-list">{items.slice(0, 8).map((item) => <article key={item.id}>
        <div><span className={`brand-chip tone-${BRAND_META[item.brand]?.tone || "cream"}`}>{item.brand}</span><span className="status-chip">{item.lane}</span></div>
        <h3>{item.title}</h3><p>{item.recommended_next_action}</p><small>{formatDate(item.created_at, { year: true, time: true })} · {item.status.replaceAll("_", " ")}</small>
      </article>)}</div> : <div className="professional-empty"><span><Icon name="message" /></span><div><h3>No Chief of Staff check-ins yet.</h3><p>Your first processed message will create the private decision log.</p></div></div>}
    </section>
  </section>;
}

function AgentsWorkspace({ agents, dispatches, jobs, onDispatched }) {
  const availableJobs = jobs.filter((job) => job.status !== "done" && !dispatches.some((dispatch) => dispatch.job_id === job.id && !["completed", "failed", "cancelled"].includes(dispatch.status)));
  const [jobId, setJobId] = useState(availableJobs[0]?.id || "");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState("");
  const [lastDecision, setLastDecision] = useState(null);
  const [runningDispatchId, setRunningDispatchId] = useState("");
  const [workerError, setWorkerError] = useState("");

  useEffect(() => {
    if (!availableJobs.some((job) => job.id === jobId)) setJobId(availableJobs[0]?.id || "");
  }, [availableJobs, jobId]);

  async function dispatch(event) {
    event.preventDefault();
    if (!jobId) return;
    setDispatching(true);
    setDispatchError("");
    const { data, error } = await supabase.functions.invoke("founder-dispatcher", { body: { job_id: jobId } });
    if (error || (!data?.decision && !data?.existing)) {
      setDispatchError("Agent 2 could not route that job. The job remains unchanged.");
      setDispatching(false);
      return;
    }
    setLastDecision(data.decision || { targetAgent: data.targetAgent, status: data.status });
    await onDispatched();
    setDispatching(false);
  }

  async function runWorker(dispatch) {
    if (dispatch.target_agent !== "research-analyst") return;
    setRunningDispatchId(dispatch.id);
    setWorkerError("");
    const { data, error } = await supabase.functions.invoke("founder-research-analyst", {
      body: { dispatch_id: dispatch.id },
    });
    if (error || !data?.result) {
      setWorkerError("Agent 3 could not finish that research run. The assignment is saved for retry.");
      setRunningDispatchId("");
      await onDispatched();
      return;
    }
    await onDispatched();
    setRunningDispatchId("");
  }

  const activeAgents = agents.filter((agent) => agent.status === "active");
  const selectedJob = jobs.find((job) => job.id === jobId);

  return <section className="view-stack agents-view">
    <div className="agents-hero">
      <div><p className="eyebrow">Founder agent network</p><h2>One voice in.<br />The right worker out.</h2><p>Chief of Staff decides what matters. Dispatcher turns a real job into one clean handoff. Specialist agents stay unavailable until their permissions, tools, and proof standards are ready.</p></div>
      <div className="agent-signal"><span><i /> {activeAgents.length} active</span><strong>02</strong><small>Dispatcher is live</small></div>
    </div>

    <div className="agent-control-grid">
      <form className="dispatch-console" onSubmit={dispatch}>
        <div><p className="eyebrow">Agent 2 · Dispatcher</p><h3>Route an open job</h3><p>Select one cloud job. Agent 2 will build the handoff and check whether the specialist is actually available.</p></div>
        <label htmlFor="dispatch-job">Founder job</label>
        <select id="dispatch-job" value={jobId} onChange={(event) => setJobId(event.target.value)} disabled={dispatching || !availableJobs.length}>
          {!availableJobs.length && <option value="">No unassigned jobs</option>}
          {availableJobs.map((job) => <option value={job.id} key={job.id}>{job.brand} · {job.title}</option>)}
        </select>
        {selectedJob && <div className="dispatch-preview"><span>{selectedJob.priority} priority</span><p>{selectedJob.details || "No additional job context."}</p></div>}
        {lastDecision && <div className="dispatch-result" role="status"><Icon name="check" size={18} /><div><b>Routed to {lastDecision.targetAgent.replaceAll("-", " ")}</b><p>{lastDecision.status.replaceAll("_", " ")}</p></div></div>}
        {dispatchError && <p className="form-error" role="alert">{dispatchError}</p>}
        <button className="primary-button" type="submit" disabled={dispatching || !jobId}><Icon name="arrow" /> {dispatching ? "Routing…" : "Send to Dispatcher"}</button>
      </form>

      <section className="agent-rail" aria-labelledby="agent-roster-title">
        <div><p className="eyebrow">Agent roster</p><h3 id="agent-roster-title">Built in order</h3></div>
        <div>{agents.map((agent) => <article key={agent.id} className={`agent-node status-${agent.status}`}>
          <span>{String(agent.agent_number).padStart(2, "0")}</span>
          <div><small>{agent.status}</small><h4>{agent.name}</h4><p>{agent.role}</p></div>
        </article>)}</div>
      </section>
    </div>

    <section className="dispatch-history">
      <div className="section-heading compact-heading"><div><p className="eyebrow">Handoff ledger</p><h2>Recent assignments</h2></div><span className="source-note"><i /> Founder only</span></div>
      {workerError && <p className="form-error" role="alert">{workerError}</p>}
      {dispatches.length ? <div className="dispatch-list">{dispatches.slice(0, 8).map((dispatch) => <article key={dispatch.id}>
        <div><span className="brand-chip tone-cream">{dispatch.assignment_type}</span><span className="status-chip">{dispatch.status.replaceAll("_", " ")}</span></div>
        <h3>{jobs.find((job) => job.id === dispatch.job_id)?.title || "Founder job"}</h3>
        <p>{dispatch.instructions}</p>
        {dispatch.result?.report && <div className="worker-report">
          <span>Agent 3 report</span>
          <p>{dispatch.result.report}</p>
          {dispatch.result.sources?.length > 0 && <div className="worker-sources">{dispatch.result.sources.slice(0, 6).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title}</a>)}</div>}
        </div>}
        {dispatch.target_agent === "research-analyst" && ["queued", "accepted", "failed"].includes(dispatch.status) && <button className="worker-button" type="button" disabled={Boolean(runningDispatchId)} onClick={() => runWorker(dispatch)}><Icon name="search" size={16} /> {runningDispatchId === dispatch.id ? "Researching…" : dispatch.status === "failed" ? "Retry research" : "Run research"}</button>}
        <small>{dispatch.target_agent.replaceAll("-", " ")} · {formatDate(dispatch.created_at, { year: true, time: true })}</small>
      </article>)}</div> : <div className="professional-empty"><span><Icon name="layers" /></span><div><h3>No assignments yet.</h3><p>Route an open job when it is ready for a specialist handoff.</p></div></div>}
    </section>

    <aside className="mobile-channel-note"><Icon name="message" /><div><p className="eyebrow">Recommended mobile channel</p><h3>Telegram for conversation. Dashboard for control.</h3><p>Telegram will accept typed updates and voice notes, return decisions, and offer approval buttons. This authenticated dashboard remains the record for jobs, assignments, and results.</p></div><span>Next connection</span></aside>
  </section>;
}

function DevelopmentView() {
  return <section className="view-stack development-view">
    <div className="development-hero">
      <div>
        <p className="eyebrow">Founder development · 30–40</p>
        <h2>Build the person who can hold the wealth.</h2>
        <p>This decade is about capacity before display. The goal is to practice these traits long enough that they shape how you decide, build, invest, and lead.</p>
      </div>
      <div className="development-manifesto">
        <span>30</span>
        <div><small>Decade intention</small><strong>Move with patience.<br />Build with ownership.</strong></div>
        <span>40</span>
      </div>
    </div>

    <section className="development-phases" aria-labelledby="development-path-title">
      <div className="section-heading compact-heading"><div><p className="eyebrow">Long-range path</p><h2 id="development-path-title">Four phases of the decade</h2></div><span className="source-note"><i /> Direction, not a deadline</span></div>
      <div className="phase-grid">{DEVELOPMENT_PHASES.map(([years, title, description], index) => <article key={years}>
        <span>{years}</span><small>Phase {index + 1}</small><h3>{title}</h3><p>{description}</p>
      </article>)}</div>
    </section>

    <section className="trait-section" aria-labelledby="wealth-traits-title">
      <div className="section-heading"><div><p className="eyebrow">Personal operating code</p><h2 id="wealth-traits-title">The 10 characteristics of high-level wealth builders</h2></div></div>
      <div className="trait-grid">{WEALTH_BUILDER_TRAITS.map(([number, title, description]) => <article className="trait-card" key={number}>
        <span>{number}</span><div><h3>{title}</h3><p>{description}</p></div>
      </article>)}</div>
    </section>

    <section className="development-rule">
      <span><Icon name="compass" size={26} /></span>
      <div><p className="eyebrow">Daily standard</p><h2>Do not rush the identity.</h2><p>Choose one trait to practice through real decisions each week. Review the evidence in your founder briefing. The work is repetition, not performance.</p></div>
    </section>
  </section>;
}

function Dashboard({ session, onLogout }) {
  const initialView = window.location.hash.replace("#", "");
  const [view, setView] = useState(NAV_ITEMS.some(([id]) => id === initialView) ? initialView : "overview");
  const [brandFilter, setBrandFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dailyBriefings, setDailyBriefings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [agentItems, setAgentItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [briefRun, setBriefRun] = useState(null);
  const [syncRun, setSyncRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadData = useCallback(async () => {
    setSyncing(true);
    setError("");
    const [projectResult, scheduleResult, jobResult, syncResult, alertResult, preferenceResult, briefResult, dailyBriefingResult, documentResult, applicationResult, agentItemResult, agentResult, dispatchResult] = await Promise.all([
      supabase.from("founder_projects").select("*").eq("owner_id", FOUNDER_ID).order("brand").order("sort_order"),
      supabase.from("founder_schedules").select("*").eq("owner_id", FOUNDER_ID).order("created_at"),
      supabase.from("founder_jobs").select("*").eq("owner_id", FOUNDER_ID).order("created_at", { ascending: false }),
      supabase.from("founder_sync_runs").select("*").eq("owner_id", FOUNDER_ID).order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("founder_alerts").select("*").eq("owner_id", FOUNDER_ID).neq("status", "dismissed").order("created_at", { ascending: false }).limit(50),
      supabase.from("founder_notification_preferences").select("*").eq("owner_id", FOUNDER_ID).maybeSingle(),
      supabase.from("founder_brief_runs").select("*").eq("owner_id", FOUNDER_ID).order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("founder_daily_briefings").select("*").eq("owner_id", FOUNDER_ID).order("briefing_date", { ascending: false }).limit(30),
      supabase.from("founder_documents").select("*").eq("owner_id", FOUNDER_ID).order("created_at", { ascending: false }),
      supabase.from("founder_applications").select("*").eq("owner_id", FOUNDER_ID).order("updated_at", { ascending: false }),
      supabase.from("founder_agent_items").select("*").eq("owner_id", FOUNDER_ID).order("created_at", { ascending: false }).limit(25),
      supabase.from("founder_agents").select("*").eq("owner_id", FOUNDER_ID).order("agent_number"),
      supabase.from("founder_dispatches").select("*").eq("owner_id", FOUNDER_ID).order("created_at", { ascending: false }).limit(25),
    ]);
    const firstError = projectResult.error || scheduleResult.error || jobResult.error || syncResult.error || alertResult.error || preferenceResult.error || briefResult.error || dailyBriefingResult.error || documentResult.error || applicationResult.error || agentItemResult.error || agentResult.error || dispatchResult.error;
    if (firstError) setError("Cloud sync is temporarily unavailable. Your last loaded view is still here.");
    if (projectResult.data) setProjects(projectResult.data);
    if (scheduleResult.data) setSchedules(scheduleResult.data);
    if (jobResult.data) setJobs(jobResult.data);
    if (syncResult.data) setSyncRun(syncResult.data);
    if (alertResult.data) setAlerts(alertResult.data);
    if (preferenceResult.data) setPreferences(preferenceResult.data);
    if (briefResult.data) setBriefRun(briefResult.data);
    if (dailyBriefingResult.data) setDailyBriefings(dailyBriefingResult.data);
    if (documentResult.data) setDocuments(documentResult.data);
    if (applicationResult.data) setApplications(applicationResult.data);
    if (agentItemResult.data) setAgentItems(agentItemResult.data);
    if (agentResult.data) setAgents(agentResult.data);
    if (dispatchResult.data) setDispatches(dispatchResult.data);
    setLoading(false);
    setSyncing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(loadData, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const newest = alerts.find((alert) => alert.status === "unread");
    if (!newest || sessionStorage.getItem("founder-last-notified") === newest.id) return;
    new Notification(newest.title, { body: newest.message || "Founder Dashboard has a new update.", tag: newest.id });
    sessionStorage.setItem("founder-last-notified", newest.id);
  }, [alerts]);

  async function refreshCloud() {
    setSyncing(true);
    setError("");
    const { error: syncError } = await supabase.functions.invoke("founder-dashboard-sync", {
      body: { source: "dashboard-manual", force: true },
    });
    if (syncError) setError("The cloud health check could not finish. Your saved dashboard data is still available.");
    const { error: briefError } = await supabase.functions.invoke("founder-daily-brief", { body: { mode: "manual", deliver: false } });
    if (briefError) setError("Project health refreshed, but the briefing engine could not finish.");
    await loadData();
  }

  async function updateAlert(id, status) {
    const previous = alerts;
    setAlerts((items) => status === "dismissed" ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, status } : item));
    const { error: updateError } = await supabase.from("founder_alerts").update({ status, read_at: status === "read" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", FOUNDER_ID);
    if (updateError) { setAlerts(previous); setError("That alert could not be updated."); }
  }

  async function savePreferences(next) {
    const values = {
      owner_id: FOUNDER_ID,
      morning_brief_hour: next.morning_brief_hour,
      midday_brief_hour: next.midday_brief_hour,
      evening_brief_hour: next.evening_brief_hour,
      reminder_lead_hours: next.reminder_lead_hours,
      telegram_enabled: next.telegram_enabled,
      email_enabled: next.email_enabled,
      updated_at: new Date().toISOString(),
    };
    const { data, error: preferenceError } = await supabase.from("founder_notification_preferences").upsert(values, { onConflict: "owner_id" }).select().single();
    if (preferenceError) { setError("Your briefing rhythm could not be saved."); return; }
    setPreferences(data);
  }

  async function enableBrowserAlerts() {
    if (!("Notification" in window)) { setError("This browser does not support on-device notifications."); return; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setError("Browser notifications were not enabled on this device."); return; }
    await supabase.from("founder_notification_preferences").update({ browser_enabled: true, updated_at: new Date().toISOString() }).eq("owner_id", FOUNDER_ID);
    setPreferences((current) => ({ ...current, browser_enabled: true }));
  }

  async function updateJob(id, status) {
    const previous = jobs;
    setJobs((items) => items.map((job) => job.id === id ? { ...job, status } : job));
    const { error: updateError } = await supabase.from("founder_jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", FOUNDER_ID);
    if (updateError) { setJobs(previous); setError("That job status did not sync. Try again."); }
  }

  async function deleteJob(job) {
    if (!window.confirm(`Remove “${job.title}” from the cloud queue?`)) return;
    const previous = jobs;
    setJobs((items) => items.filter((item) => item.id !== job.id));
    const { error: deleteError } = await supabase.from("founder_jobs").delete().eq("id", job.id).eq("owner_id", FOUNDER_ID);
    if (deleteError) { setJobs(previous); setError("That job could not be removed. Try again."); }
  }

  async function openDocument(document) {
    const { data, error: signedUrlError } = await supabase.storage.from(document.storage_bucket).createSignedUrl(document.storage_path, 60);
    if (signedUrlError || !data?.signedUrl) { setError("That private document could not be opened. Try again."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function uploadDocument(file) {
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF documents can be added here.";
    if (file.size > 10 * 1024 * 1024) return "That PDF is larger than the 10 MB private-document limit.";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storagePath = `${FOUNDER_ID}/professional/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("founder-documents").upload(storagePath, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) return "The PDF could not be uploaded to private storage.";
    const isResume = file.name.toLowerCase().includes("resume");
    const { error: metadataError } = await supabase.from("founder_documents").insert({ owner_id: FOUNDER_ID, title: isResume ? "Nasirr G. Mayo Resume" : file.name.replace(/\.pdf$/i, ""), description: isResume ? "Current professional resume" : "Professional document", category: isResume ? "resume" : "other", file_name: file.name, storage_path: storagePath, mime_type: file.type, size_bytes: file.size, version_label: isResume ? "Current" : "" });
    if (metadataError) { await supabase.storage.from("founder-documents").remove([storagePath]); return "The PDF uploaded, but its library record could not be saved."; }
    await loadData();
    return "";
  }

  async function updateApplicationStatus(id, status) {
    const previous = applications;
    setApplications((items) => items.map((application) => application.id === id ? { ...application, status } : application));
    const values = { status, updated_at: new Date().toISOString(), applied_at: status === "submitted" ? new Date().toISOString() : undefined };
    const { error: updateError } = await supabase.from("founder_applications").update(values).eq("id", id).eq("owner_id", FOUNDER_ID);
    if (updateError) { setApplications(previous); setError("That application status could not be updated."); }
  }

  function openBrand(brand) { setBrandFilter(brand); setView("projects"); window.history.replaceState(null, "", "#projects"); }
  function navigate(nextView) { setView(nextView); window.history.replaceState(null, "", `#${nextView}`); setMobileOpen(false); if (nextView !== "projects") setBrandFilter("all"); }

  const filteredProjects = brandFilter === "all" ? projects : projects.filter((project) => project.brand === brandFilter);
  const openJobs = jobs.filter((job) => job.status !== "done");
  const unreadAlerts = alerts.filter((alert) => alert.status === "unread");
  const dueJobs = openJobs.filter((job) => job.due_at && new Date(job.due_at) <= new Date(Date.now() + 7 * 86400000));
  const health = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.health, 0) / projects.length) : 0;
  const focus = openJobs.find((job) => job.priority === "urgent") || openJobs.find((job) => job.priority === "high");

  return <div className="dashboard-shell">
    <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="sidebar-brand"><div className="founder-mark compact"><span>N</span><i /></div><div><b>NASIRR MAYO</b><small>Founder Dashboard</small></div></div>
      <nav aria-label="Dashboard navigation">{NAV_ITEMS.map(([id, label, icon]) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)} type="button"><Icon name={icon} /><span>{label}</span>{id === "jobs" && openJobs.length > 0 && <b>{openJobs.length}</b>}{id === "briefing" && unreadAlerts.length > 0 && <b>{unreadAlerts.length}</b>}</button>)}</nav>
      <section className="ecosystem-mini"><p className="eyebrow">Ecosystem</p>{BRAND_ORDER.map((brand) => <button key={brand} onClick={() => openBrand(brand)} type="button"><i className={`tone-${BRAND_META[brand].tone}`} /><span>{brand}</span><b>{projects.filter((project) => project.brand === brand).length}</b></button>)}</section>
      <div className="sidebar-foot"><div className="cloud-state"><span><i /> Cloud connected</span><small>Supabase · GitHub Pages</small></div><button className="logout-button" onClick={onLogout} type="button"><Icon name="logout" /> Sign out</button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <main className="workspace">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" type="button"><Icon name="menu" /></button>
        <div><p className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date())}</p><h1>{NAV_ITEMS.find(([id]) => id === view)?.[1]}</h1></div>
        <div className="topbar-actions"><span className="sync-label"><i className={syncing ? "syncing" : ""} /> {syncing ? "Syncing" : syncRun?.finished_at ? `Cloud checked ${syncAge(syncRun.finished_at)}` : "Cloud connected"}</span><button className="icon-button" onClick={refreshCloud} disabled={syncing} type="button" aria-label="Run cloud health check"><Icon name="refresh" /></button><button className="primary-button compact-button" onClick={() => setComposerOpen(true)} type="button"><Icon name="plus" /> Add job</button></div>
      </header>
      <div className="content">
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")} type="button">Dismiss</button></div>}
        {loading ? <section className="loading-state"><div className="loader" /><h2>Opening the ecosystem</h2><p>Syncing projects, schedules, and jobs from the cloud.</p></section> : <>
          {view === "overview" && <section className="view-stack">
            <div className="hero-card">
              <div><p className="eyebrow">Founder operating view</p><h2>{greeting()}, Nasirr.</h2><p>{focus ? <>Your highest-leverage move is <strong>{focus.title}</strong>.</> : <>The system is clear. Add the next important job when you’re ready to move.</>}</p></div>
              <div className="hero-status"><span>Overall system health</span><strong>{health}<small>%</small></strong><i><b style={{ width: `${health}%` }} /></i></div>
            </div>
            <button className={`briefing-strip ${unreadAlerts.some((alert) => alert.severity === "urgent") ? "has-urgent" : ""}`} onClick={() => navigate("briefing")} type="button"><span className="briefing-strip-icon"><Icon name="bell" /></span><span><small>Proactive founder briefing</small><b>{unreadAlerts.length ? `${unreadAlerts.length} update${unreadAlerts.length === 1 ? "" : "s"} waiting before check-in` : "You are caught up. The cloud is still watching."}</b></span><em>{briefRun?.finished_at ? `Last pulse ${syncAge(briefRun.finished_at)}` : "Briefing engine starting"}</em><Icon name="arrow" /></button>
            <div className="metrics-grid"><Metric label="Priority projects" value={projects.length} detail={`${BRAND_ORDER.length} connected brands`} tone="lime" /><Metric label="Active schedules" value={schedules.filter((item) => item.status === "active").length} detail="Codex reminders mirrored" tone="gold" /><Metric label="Open jobs" value={openJobs.length} detail={dueJobs.length ? `${dueJobs.length} due within 7 days` : "No immediate deadlines"} tone="blue" /><Metric label="Cloud pulse" value="1 hr" detail="Checks before you do" /></div>
            <div className="section-heading"><div><p className="eyebrow">The three engines</p><h2>Your ecosystem at a glance</h2></div><button className="text-action" onClick={() => navigate("projects")} type="button">View every project <Icon name="arrow" size={16} /></button></div>
            <div className="brand-grid">{BRAND_ORDER.map((brand) => <BrandCard key={brand} brand={brand} projects={projects.filter((project) => project.brand === brand)} jobs={jobs} onOpen={openBrand} />)}</div>
            <div className="overview-split">
              <section><div className="section-heading compact-heading"><div><p className="eyebrow">Operating rhythm</p><h2>Scheduled reminders</h2></div><button className="text-action" onClick={() => navigate("schedule")} type="button">Full schedule <Icon name="arrow" size={16} /></button></div><div className="schedule-list">{schedules.slice(0, 2).map((item) => <ScheduleCard item={item} key={item.id} />)}</div></section>
              <section className="system-panel"><div><p className="eyebrow">Cloud infrastructure</p><h2>Always available</h2><p>The dashboard and its data stay online when your Mac is closed. GitHub Pages serves the interface; Supabase protects your founder data and verifies project health throughout the day.</p></div><div className="system-lines"><span><Icon name="cloud" /> Database and authentication <b>Online</b></span><span><Icon name="github" /> Automatic project checks <b>{syncRun?.finished_at ? timeAgo(syncRun.finished_at) : "Starting"}</b></span><span><Icon name="clock" /> Codex reminder mirror <b>{schedules.length} active</b></span></div></section>
            </div>
          </section>}

          {view === "briefing" && <section className="view-stack">
            <div className="briefing-hero">
              <div><p className="eyebrow">Prepared before check-in</p><h2>{unreadAlerts.length ? `${unreadAlerts.length} things deserve your attention.` : "Your operating picture is clear."}</h2><p>{unreadAlerts[0]?.message || "The cloud checks projects, deadlines, and active schedules every hour, then brings forward only what changed."}</p><div className="briefing-hero-actions"><button className="primary-button" onClick={refreshCloud} disabled={syncing} type="button"><Icon name="refresh" /> {syncing ? "Preparing…" : "Refresh briefing"}</button>{!preferences?.browser_enabled && <button className="secondary-button" onClick={enableBrowserAlerts} type="button"><Icon name="bell" /> Enable browser alerts</button>}</div></div>
              <div className="today-card"><span><Icon name="sunrise" /></span><small>Right now</small><strong>{openJobs.length}</strong><p>open jobs across the ecosystem</p><div><b>{openJobs.filter((job) => job.due_at && new Date(job.due_at) < new Date()).length}</b> overdue <b>{projects.filter((project) => project.status === "attention" || project.health < 80).length}</b> project alerts</div></div>
            </div>
            <DailyReflection briefings={dailyBriefings} />
            <div className="channel-grid">
              <ChannelCard icon="message" name="Telegram" detail="Immediate mobile alert channel" state={briefRun?.deliveries?.telegram?.status || (preferences?.telegram_enabled ? "ready" : "off")} tone="lime" />
              <ChannelCard icon="mail" name="Email" detail="Backup briefing delivery" state={briefRun?.deliveries?.email?.status || (preferences?.email_enabled ? "ready" : "off")} tone="gold" />
              <ChannelCard icon="bell" name="Browser" detail="Alerts while this dashboard is active" state={preferences?.browser_enabled ? "ready" : "optional"} tone="blue" />
              <ChannelCard icon="message" name="Apple Messages" detail="Reserved for the official connector" state="waiting" />
            </div>
            <div className="section-heading compact-heading"><div><p className="eyebrow">Attention queue</p><h2>What changed</h2></div>{unreadAlerts.length > 0 && <span className="source-note"><i /> {unreadAlerts.length} unread</span>}</div>
            {alerts.length ? <div className="alert-list">{alerts.map((alert) => <AlertCard alert={alert} onStatus={updateAlert} key={alert.id} />)}</div> : <div className="empty-jobs"><span><Icon name="check" size={26} /></span><h3>No alerts are waiting.</h3><p>The next cloud pulse will add an alert only when something changes or needs a decision.</p></div>}
            <BriefingSettings preferences={preferences} onSave={savePreferences} />
            <aside className="context-note"><Icon name="message" /><div><b>Apple Messages status</b><p>The official OpenAI use-case catalog includes iMessage workflows, but no Apple Messages tool is installed in this workspace yet. The channel remains off until the connector is available and authenticated.</p></div></aside>
          </section>}

          {view === "projects" && <section className="view-stack">
            <div className="page-lead"><div><p className="eyebrow">{syncRun?.finished_at ? `Cloud verified ${formatDate(syncRun.finished_at, { year: true, time: true })}` : "Cloud verification starting"}</p><h2>Important project snapshot</h2><p>The highest-value public systems and operating assets across your three brands.</p></div><div className="filter-tabs" aria-label="Filter projects"><button className={brandFilter === "all" ? "active" : ""} onClick={() => setBrandFilter("all")} type="button">All</button>{BRAND_ORDER.map((brand) => <button className={brandFilter === brand ? "active" : ""} onClick={() => setBrandFilter(brand)} key={brand} type="button">{BRAND_META[brand].short}</button>)}</div></div>
            <div className="projects-grid">{filteredProjects.map((project) => <ProjectCard project={project} key={project.id} />)}</div>
          </section>}

          {view === "chief" && <ChiefOfStaffView items={agentItems} onProcessed={loadData} />}
          {view === "agents" && <AgentsWorkspace agents={agents} dispatches={dispatches} jobs={jobs} onDispatched={loadData} />}
          {view === "development" && <DevelopmentView />}
          {view === "professional" && <ProfessionalWorkspace documents={documents} applications={applications} onOpenDocument={openDocument} onUploadDocument={uploadDocument} onApplicationStatus={updateApplicationStatus} />}

          {view === "schedule" && <section className="view-stack">
            <div className="page-lead"><div><p className="eyebrow">Founder rhythm</p><h2>Scheduled reminders</h2><p>Your active recurring Codex work, mirrored into one cloud view.</p></div><span className="source-note"><i /> Source of truth: Codex Automations</span></div>
            <div className="schedule-board">{schedules.map((item) => <ScheduleCard item={item} key={item.id} />)}</div>
            <aside className="context-note"><Icon name="clock" /><div><b>Schedule boundary</b><p>This dashboard reflects the active automation schedule. Changes to actual delivery timing remain controlled by Codex Automations so the interface never claims a reminder was scheduled when it was only written to a database.</p></div></aside>
          </section>}

          {view === "jobs" && <section className="view-stack">
            <div className="page-lead"><div><p className="eyebrow">Founder cloud queue</p><h2>Jobs that need movement</h2><p>Capture work once, then update it from any device.</p></div><button className="primary-button" onClick={() => setComposerOpen(true)} type="button"><Icon name="plus" /> Add a job</button></div>
            <div className="job-summary"><span><b>{jobs.filter((job) => job.status === "queued").length}</b> Queued</span><span><b>{jobs.filter((job) => job.status === "in_progress").length}</b> In progress</span><span><b>{jobs.filter((job) => job.status === "waiting").length}</b> Waiting</span><span><b>{jobs.filter((job) => job.status === "done").length}</b> Done</span></div>
            {jobs.length ? <div className="job-list">{jobs.map((job) => <JobRow key={job.id} job={job} onStatus={updateJob} onDelete={deleteJob} />)}</div> : <div className="empty-jobs"><span><Icon name="check" size={26} /></span><h3>The queue is clear.</h3><p>Add the next important move for any brand and it will stay synced here.</p><button className="secondary-button" onClick={() => setComposerOpen(true)} type="button">Create the first job</button></div>}
          </section>}
        </>}
      </div>
    </main>
    <JobComposer open={composerOpen} onClose={() => setComposerOpen(false)} onSaved={loadData} />
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user?.id === FOUNDER_ID) setSession(data.session);
      else if (data.session) await supabase.auth.signOut();
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession?.user?.id === FOUNDER_ID ? nextSession : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function logout() { await supabase.auth.signOut(); setSession(null); }
  if (!ready) return <main className="boot-screen"><div className="founder-mark"><span>N</span><i /></div><p>Opening Founder Dashboard…</p></main>;
  return session ? <Dashboard session={session} onLogout={logout} /> : <Login onSession={setSession} />;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
