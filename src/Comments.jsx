import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { COMMENT_STATES, loadComments, moderateComment } from './comments-api.mjs';
import './comments.css';

const date = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(value));

export default function Comments() {
  const [view, setView] = useState('pending');
  const [limit, setLimit] = useState(25);
  const [result, setResult] = useState({ notes: [], counts: {}, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [saving, setSaving] = useState(false);
  const sequence = useRef(0);
  const busy = useRef(false);
  const statusRef = useRef(null);

  const refresh = useCallback(async (preserveError = false) => {
    if (busy.current) return;
    const current = ++sequence.current;
    try {
      const next = await loadComments(supabase, view, limit);
      if (current !== sequence.current) return;
      setResult(next); if (!preserveError) setError('');
    } catch (err) {
      if (current === sequence.current) setError(err.message);
    } finally { if (current === sequence.current) setLoading(false); }
  }, [view, limit]);

  useEffect(() => {
    refresh();
    const check = () => { if (!document.hidden) refresh(); };
    const timer = window.setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { ++sequence.current; clearInterval(timer); document.removeEventListener('visibilitychange', check); };
  }, [refresh]);

  function switchView(next) {
    if (busy.current) return;
    if (next === view) { refresh(); return; }
    setView(next); setLimit(25); setLoading(true); setError(''); setNotice(''); setConfirmation(null);
  }

  async function decide() {
    if (!confirmation || busy.current) return;
    busy.current = true; ++sequence.current; setSaving(true); setError(''); setNotice('');
    try {
      await moderateComment(supabase, confirmation.comment, confirmation.decision);
      setNotice(confirmation.decision === 'approved'
        ? 'approved. this comment is now available on the article when readers open or refresh it.'
        : 'denied. this comment stays private and is saved in your denied list.');
      setConfirmation(null);
    } catch (err) { setError(err.message); setConfirmation(null); }
    finally {
      busy.current = false; setSaving(false);
      // Reload authoritative state even after a lost response, before another decision.
      await refresh(true); statusRef.current?.focus();
    }
  }

  return <section className="view-stack comments-inbox" aria-label="comment review inbox">
    <div className="page-lead comments-lead">
      <div><p className="eyebrow">innerg reads / editorial inbox</p><h2>give each voice a place.</h2><p>review anonymous notes before they appear on your article.</p></div>
      <a className="secondary-button comments-open-read" href="https://www.innergreads.study/reads/#feedback-section" target="_blank" rel="noopener noreferrer">open a.r.t. article</a>
    </div>
    <div className="comments-toolbar">
      <div className="filter-tabs comments-tabs" role="group" aria-label="filter comments">
        {COMMENT_STATES.map(state => <button type="button" key={state} className={view === state ? 'active' : ''} aria-pressed={view === state} disabled={saving} onClick={() => switchView(state)}>{state}<span>{result.counts[state] ?? '—'}</span></button>)}
      </div>
      <button type="button" className="secondary-button" onClick={() => refresh()} disabled={saving || loading}>refresh inbox</button>
    </div>
    <div ref={statusRef} className="comments-status" tabIndex={-1}>
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-live="polite">{notice}</p>
    </div>
    {loading ? <div className="comments-empty" role="status">loading your comment inbox…</div>
      : error ? <div className="comments-empty"><h3>your comments are still saved.</h3><p>refresh to load the latest decisions. no further action is available until this check succeeds.</p><button className="secondary-button" onClick={() => refresh()} type="button">try again</button></div>
      : result.notes.length === 0 ? <div className="comments-empty"><p className="eyebrow">{view === 'pending' ? 'inbox clear' : view}</p><h3>{view === 'pending' ? 'nothing waiting for review.' : `no ${view} comments yet.`}</h3><p>new notes arrive here automatically. this view checks for updates every 30 seconds while open.</p></div>
      : <div className="comments-list">{result.notes.map(comment => {
        const selected = confirmation?.comment.id === comment.id;
        return <article className="comment-card" key={comment.id} aria-label={`anonymous note received ${date(comment.created_at)}`}>
          <header><div><p className="eyebrow">{comment.slug === 'art-era' ? 'a.r.t. / anonymous reader' : 'innerg reads / anonymous reader'}</p><time dateTime={comment.created_at}>{date(comment.created_at)} eastern</time></div><span className={`comment-state is-${comment.review_status}`}>{comment.review_status}</span></header>
          <blockquote>{comment.message}</blockquote>
          {comment.reviewed_at && <p className="comment-reviewed">reviewed {date(comment.reviewed_at)} eastern</p>}
          {selected ? <div className="comment-confirm" role="group" aria-label="confirm comment decision"><p>{confirmation.decision === 'approved' ? 'publish this anonymous comment for everyone to read?' : 'keep this comment private in your denied list?'}</p><p className="comment-confirm-note">{confirmation.decision === 'approved' ? 'check for personal details, spam, or abuse before approving.' : 'this does not delete the comment. you can approve it later.'}</p><div className="comment-actions"><button className="primary-button" type="button" disabled={saving} onClick={decide}>{saving ? 'saving decision…' : confirmation.decision === 'approved' ? 'confirm approval' : 'confirm denial'}</button><button className="secondary-button" type="button" disabled={saving} onClick={() => setConfirmation(null)}>cancel</button></div></div>
            : <div className="comment-actions">{comment.review_status !== 'approved' && <button className="primary-button" type="button" disabled={saving} onClick={() => setConfirmation({ comment, decision: 'approved' })}>approve</button>}{comment.review_status !== 'denied' && <button className="secondary-button comment-deny" type="button" disabled={saving} onClick={() => setConfirmation({ comment, decision: 'denied' })}>{comment.review_status === 'approved' ? 'deny / hide from site' : 'deny'}</button>}</div>}
        </article>;
      })}</div>}
    {!error && result.hasMore && <button type="button" className="secondary-button" disabled={saving || loading} onClick={() => { setLoading(true); setLimit(value => value + 25); }}>load more comments</button>}
    <p className="comments-privacy">only your founder account can review these notes. approving publishes the text, never the reader’s identity. no site deployment is needed.</p>
  </section>;
}
