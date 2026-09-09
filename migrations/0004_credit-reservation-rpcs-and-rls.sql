-- The application uses a trusted server-only owner connection. Enabling RLS with
-- no mutation policies denies direct client access even if table grants are added
-- accidentally later. Owner access is intentionally not forced so Hono can invoke
-- the security-invoker RPCs below through DATABASE_URL.
alter table public.user_profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.processed_webhook_events enable row level security;

revoke all on table public.user_profiles from public;
revoke all on table public.credit_ledger from public;
revoke all on table public.credit_reservations from public;
revoke all on table public.processed_webhook_events from public;
