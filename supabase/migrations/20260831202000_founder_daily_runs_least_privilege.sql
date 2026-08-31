-- Limit browser access to read-only founder reports.

revoke all on public.founder_daily_runs from anon;
revoke all on public.founder_daily_runs from authenticated;
grant select on public.founder_daily_runs to authenticated;
