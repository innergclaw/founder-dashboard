import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

const FOUNDER_ID = "75677100-97b7-4578-92c5-cf131997b580";
const BRAND_ORDER = ["OWNYOURWEB", "INNERGINTEL", "SHOPNASGFX"];
const NAV_ITEMS = [
  ["overview", "Overview", "grid"],
  ["projects", "Projects", "layers"],
  ["schedule", "Schedule", "calendar"],
  ["jobs", "Jobs", "check"],
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

function timeAgo(value) {
  if (!value) return "No activity found";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
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

function Dashboard({ session, onLogout }) {
  const [view, setView] = useState("overview");
  const [brandFilter, setBrandFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [syncRun, setSyncRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadData = useCallback(async () => {
    setSyncing(true);
    setError("");
    const [projectResult, scheduleResult, jobResult, syncResult] = await Promise.all([
      supabase.from("founder_projects").select("*").eq("owner_id", FOUNDER_ID).order("brand").order("sort_order"),
      supabase.from("founder_schedules").select("*").eq("owner_id", FOUNDER_ID).order("created_at"),
      supabase.from("founder_jobs").select("*").eq("owner_id", FOUNDER_ID).order("created_at", { ascending: false }),
      supabase.from("founder_sync_runs").select("*").eq("owner_id", FOUNDER_ID).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const firstError = projectResult.error || scheduleResult.error || jobResult.error || syncResult.error;
    if (firstError) setError("Cloud sync is temporarily unavailable. Your last loaded view is still here.");
    if (projectResult.data) setProjects(projectResult.data);
    if (scheduleResult.data) setSchedules(scheduleResult.data);
    if (jobResult.data) setJobs(jobResult.data);
    if (syncResult.data) setSyncRun(syncResult.data);
    setLoading(false);
    setSyncing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function refreshCloud() {
    setSyncing(true);
    setError("");
    const { error: syncError } = await supabase.functions.invoke("founder-dashboard-sync", {
      body: { source: "dashboard-manual", force: true },
    });
    if (syncError) setError("The cloud health check could not finish. Your saved dashboard data is still available.");
    await loadData();
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

  function openBrand(brand) { setBrandFilter(brand); setView("projects"); }
  function navigate(nextView) { setView(nextView); setMobileOpen(false); if (nextView !== "projects") setBrandFilter("all"); }

  const filteredProjects = brandFilter === "all" ? projects : projects.filter((project) => project.brand === brandFilter);
  const openJobs = jobs.filter((job) => job.status !== "done");
  const dueJobs = openJobs.filter((job) => job.due_at && new Date(job.due_at) <= new Date(Date.now() + 7 * 86400000));
  const health = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.health, 0) / projects.length) : 0;
  const focus = openJobs.find((job) => job.priority === "urgent") || openJobs.find((job) => job.priority === "high");

  return <div className="dashboard-shell">
    <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="sidebar-brand"><div className="founder-mark compact"><span>N</span><i /></div><div><b>NASIRR MAYO</b><small>Founder Dashboard</small></div></div>
      <nav aria-label="Dashboard navigation">{NAV_ITEMS.map(([id, label, icon]) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)} type="button"><Icon name={icon} /><span>{label}</span>{id === "jobs" && openJobs.length > 0 && <b>{openJobs.length}</b>}</button>)}</nav>
      <section className="ecosystem-mini"><p className="eyebrow">Ecosystem</p>{BRAND_ORDER.map((brand) => <button key={brand} onClick={() => openBrand(brand)} type="button"><i className={`tone-${BRAND_META[brand].tone}`} /><span>{brand}</span><b>{projects.filter((project) => project.brand === brand).length}</b></button>)}</section>
      <div className="sidebar-foot"><div className="cloud-state"><span><i /> Cloud connected</span><small>Supabase · GitHub Pages</small></div><button className="logout-button" onClick={onLogout} type="button"><Icon name="logout" /> Sign out</button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <main className="workspace">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" type="button"><Icon name="menu" /></button>
        <div><p className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date())}</p><h1>{NAV_ITEMS.find(([id]) => id === view)?.[1]}</h1></div>
        <div className="topbar-actions"><span className="sync-label"><i className={syncing ? "syncing" : ""} /> {syncing ? "Syncing" : syncRun?.finished_at ? `Cloud checked ${timeAgo(syncRun.finished_at).toLowerCase()}` : "Cloud connected"}</span><button className="icon-button" onClick={refreshCloud} disabled={syncing} type="button" aria-label="Run cloud health check"><Icon name="refresh" /></button><button className="primary-button compact-button" onClick={() => setComposerOpen(true)} type="button"><Icon name="plus" /> Add job</button></div>
      </header>
      <div className="content">
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")} type="button">Dismiss</button></div>}
        {loading ? <section className="loading-state"><div className="loader" /><h2>Opening the ecosystem</h2><p>Syncing projects, schedules, and jobs from the cloud.</p></section> : <>
          {view === "overview" && <section className="view-stack">
            <div className="hero-card">
              <div><p className="eyebrow">Founder operating view</p><h2>{greeting()}, Nasirr.</h2><p>{focus ? <>Your highest-leverage move is <strong>{focus.title}</strong>.</> : <>The system is clear. Add the next important job when you’re ready to move.</>}</p></div>
              <div className="hero-status"><span>Overall system health</span><strong>{health}<small>%</small></strong><i><b style={{ width: `${health}%` }} /></i></div>
            </div>
            <div className="metrics-grid"><Metric label="Priority projects" value={projects.length} detail={`${BRAND_ORDER.length} connected brands`} tone="lime" /><Metric label="Active schedules" value={schedules.filter((item) => item.status === "active").length} detail="Codex reminders mirrored" tone="gold" /><Metric label="Open jobs" value={openJobs.length} detail={dueJobs.length ? `${dueJobs.length} due within 7 days` : "No immediate deadlines"} tone="blue" /><Metric label="Cloud services" value="12" detail="Active Supabase functions" /></div>
            <div className="section-heading"><div><p className="eyebrow">The three engines</p><h2>Your ecosystem at a glance</h2></div><button className="text-action" onClick={() => navigate("projects")} type="button">View every project <Icon name="arrow" size={16} /></button></div>
            <div className="brand-grid">{BRAND_ORDER.map((brand) => <BrandCard key={brand} brand={brand} projects={projects.filter((project) => project.brand === brand)} jobs={jobs} onOpen={openBrand} />)}</div>
            <div className="overview-split">
              <section><div className="section-heading compact-heading"><div><p className="eyebrow">Operating rhythm</p><h2>Scheduled reminders</h2></div><button className="text-action" onClick={() => navigate("schedule")} type="button">Full schedule <Icon name="arrow" size={16} /></button></div><div className="schedule-list">{schedules.slice(0, 2).map((item) => <ScheduleCard item={item} key={item.id} />)}</div></section>
              <section className="system-panel"><div><p className="eyebrow">Cloud infrastructure</p><h2>Always available</h2><p>The dashboard and its data stay online when your Mac is closed. GitHub Pages serves the interface; Supabase protects your founder data and verifies project health throughout the day.</p></div><div className="system-lines"><span><Icon name="cloud" /> Database and authentication <b>Online</b></span><span><Icon name="github" /> Automatic project checks <b>{syncRun?.finished_at ? timeAgo(syncRun.finished_at) : "Starting"}</b></span><span><Icon name="clock" /> Codex reminder mirror <b>{schedules.length} active</b></span></div></section>
            </div>
          </section>}

          {view === "projects" && <section className="view-stack">
            <div className="page-lead"><div><p className="eyebrow">{syncRun?.finished_at ? `Cloud verified ${formatDate(syncRun.finished_at, { year: true, time: true })}` : "Cloud verification starting"}</p><h2>Important project snapshot</h2><p>The highest-value public systems and operating assets across your three brands.</p></div><div className="filter-tabs" aria-label="Filter projects"><button className={brandFilter === "all" ? "active" : ""} onClick={() => setBrandFilter("all")} type="button">All</button>{BRAND_ORDER.map((brand) => <button className={brandFilter === brand ? "active" : ""} onClick={() => setBrandFilter(brand)} key={brand} type="button">{BRAND_META[brand].short}</button>)}</div></div>
            <div className="projects-grid">{filteredProjects.map((project) => <ProjectCard project={project} key={project.id} />)}</div>
          </section>}

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
