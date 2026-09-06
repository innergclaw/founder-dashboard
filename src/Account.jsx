import React, { useState } from "react";
import { supabase } from "./supabase";

export default function Account({ email }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(""); setSaved(false);
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.code === "same_password" ? "Choose a password different from your current password." : "The password could not be changed. Check the password requirements. If your session needs verification, sign out and sign back in before trying again.");
        return;
      }
      setPassword(""); setConfirmation(""); setSaved(true);
    } catch { setError("The password could not be changed. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <section className="view-stack">
    <div className="page-lead"><div><p className="eyebrow">Founder account</p><h2>Change your password</h2><p>Signed in as {email}. This changes the password for this Supabase account.</p></div></div>
    <form className="proposal-card proposal-editor account-form" onSubmit={submit}>
      <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={busy} /></label>
      <p>Use at least 12 characters. Enter and submit your password here yourself.</p>
      {error && <p className="error-banner" role="alert">{error}</p>}
      {saved && <p className="proposal-save-message" role="status">Your password has been changed.</p>}
      <button type="submit" className="primary-button" disabled={busy}>{busy ? "Updating…" : "Change password"}</button>
    </form>
  </section>;
}
