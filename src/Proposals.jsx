import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export const PROPOSAL_STAGES = [
  { id: "inquired", label: "Inquired", hint: "Inquiry sent. Waiting for a first response." },
  { id: "in_communication", label: "In communication", hint: "The organization has replied. Discussion is open." },
  { id: "no_reply", label: "No reply", hint: "Marked unanswered after follow-up or review." },
  { id: "confirmed", label: "Confirmed", hint: "Award or agreement confirmed in writing." },
];
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
const dateLabel = (value) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value)) : "Not recorded";
const safeLink = (value) => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
};

function ProposalCard({ proposal, onSave, busy }) {
  const [status, setStatus] = useState(proposal.status);
  const [notes, setNotes] = useState(proposal.notes);
  const [nextAction, setNextAction] = useState(proposal.next_action);
  const [editing, setEditing] = useState(false);
  const source = safeLink(proposal.source_url);
  const thread = safeLink(proposal.email_url);
  useEffect(() => {
    setStatus(proposal.status); setNotes(proposal.notes); setNextAction(proposal.next_action);
  }, [proposal.updated_at]);
  async function submit(event) {
    event.preventDefault();
    if (await onSave(proposal, { status, notes: notes.trim(), next_action: nextAction.trim() })) setEditing(false);
  }
  return <article className="proposal-card" aria-label={`${proposal.organization} proposal`}>
    <div className="proposal-card-heading"><span className="brand-chip tone-lime">{proposal.brand}</span><span>{proposal.buyer_type}</span></div>
    <h4>{proposal.organization}</h4>
    <p className="proposal-title">{proposal.title}</p>
    <div className="proposal-value"><strong>{money(proposal.budget_max)}</strong><span>Maximum budget · USD</span></div>
    <dl className="proposal-dates">
      <div><dt>Proposal due</dt><dd>{dateLabel(proposal.proposal_due)}</dd></div>
      <div><dt>Inquiry sent</dt><dd>{dateLabel(proposal.inquired_on)}</dd></div>
      <div><dt>Last reply</dt><dd>{proposal.last_reply_on ? dateLabel(proposal.last_reply_on) : "Awaiting first reply"}</dd></div>
    </dl>
    <div className="proposal-note"><span className="eyebrow">Latest result</span><p>{proposal.notes || "No result recorded."}</p></div>
    <div className="proposal-note"><span className="eyebrow">Next action</span><p>{proposal.next_action || "Set the next action."}</p></div>
    <div className="proposal-links">{source && <a href={source} target="_blank" rel="noreferrer">RFP posting ↗</a>}{thread && <a href={thread} target="_blank" rel="noreferrer">Email thread ↗</a>}</div>
    <button type="button" className="secondary-button" onClick={() => setEditing(!editing)} aria-expanded={editing} disabled={busy}>{editing ? "Close editor" : "Update result"}</button>
    {editing && <form className="proposal-editor" onSubmit={submit}>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)} disabled={busy}>{PROPOSAL_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
      <label>Result notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={4000} disabled={busy} /></label>
      <label>Next action<textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} rows={3} maxLength={2000} disabled={busy} /></label>
      {status === "confirmed" && <p>Use Confirmed only after a written award or agreement. Add the confirmation details to your result notes.</p>}
      <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save result"}</button>
    </form>}
  </article>;
}

export default function Proposals({ ownerId }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: loadError } = await supabase.from("founder_proposals").select("*").eq("owner_id", ownerId).order("proposal_due", { ascending: true, nullsFirst: false });
      if (loadError) throw loadError;
      setProposals(data || []);
    } catch { setError("Could not load proposals. Your saved records have not changed. Try Refresh proposals."); }
    finally { setLoading(false); }
  }, [ownerId]);
  useEffect(() => { load(); }, [load]);
  async function save(proposal, changes) {
    if (savingId) return false;
    setSavingId(proposal.id); setError(""); setMessage("");
    try {
      const { data, error: saveError } = await supabase.from("founder_proposals")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", proposal.id).eq("owner_id", ownerId).eq("updated_at", proposal.updated_at).select("*").single();
      if (saveError || !data) throw saveError;
      setProposals((items) => items.map((item) => item.id === data.id ? data : item));
      setMessage(`${proposal.organization} saved to ${PROPOSAL_STAGES.find((stage) => stage.id === data.status).label}.`);
      return true;
    } catch {
      setError("Could not save this result. It may have changed on another device. Copy your edits, refresh proposals, and try again.");
      return false;
    } finally { setSavingId(null); }
  }
  const total = proposals.reduce((sum, item) => sum + Number(item.budget_max), 0);
  const confirmedCount = proposals.filter((item) => item.status === "confirmed").length;
  return <section className="view-stack proposals-view">
    <div className="page-lead"><div><p className="eyebrow">OWNYOURWEB · Contract opportunities</p><h2>From inquiry to award</h2><p>Track the conversation, the deadline, and the next move.</p></div><button type="button" className="secondary-button" onClick={load} disabled={loading || !!savingId}>{loading ? "Loading…" : "Refresh proposals"}</button></div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {message && <p className="proposal-save-message" role="status">{message}</p>}
    <div className="proposal-summary" aria-label="Proposal totals">
      <div><span>Potential contract value</span><strong>{loading && !proposals.length ? "—" : money(total)}</strong><p>Combined maximum budgets. Actual awards may differ.</p></div>
      <div><strong>{loading && !proposals.length ? "—" : proposals.length}</strong><span>Opportunities tracked</span></div>
      <div><strong>{loading && !proposals.length ? "—" : confirmedCount}</strong><span>Confirmed awards</span></div>
    </div>
    {loading && !proposals.length ? <p role="status">Loading your private proposal records…</p> : <div className="proposal-board">
      {PROPOSAL_STAGES.map((stage) => {
        const items = proposals.filter((item) => item.status === stage.id);
        return <section key={stage.id} className={`proposal-lane stage-${stage.id}`} aria-labelledby={`proposal-stage-${stage.id}`}>
          <div className="proposal-lane-heading"><h3 id={`proposal-stage-${stage.id}`}>{stage.label}</h3><span>{items.length}</span></div>
          <p className="proposal-stage-hint">{stage.hint}</p>
          {items.length ? items.map((item) => <ProposalCard key={item.id} proposal={item} onSave={save} busy={!!savingId} />) : <p className="proposal-empty">No proposals here yet.</p>}
        </section>;
      })}
    </div>}
    <p className="proposal-footnote">Records stay private to your founder account. Use Update result when a reply or award arrives. Email replies do not change these statuses automatically.</p>
  </section>;
}
