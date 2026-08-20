alter table public.founder_notification_preferences
  alter column email_enabled set default false;

update public.founder_notification_preferences
set email_enabled = false,
    updated_at = now()
where owner_id = '75677100-97b7-4578-92c5-cf131997b580'
  and email_enabled = true;
