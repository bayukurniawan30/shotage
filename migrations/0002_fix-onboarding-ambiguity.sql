create or replace function public.ensure_user_onboarded(
  requested_user_id text,
  requested_email text
)
returns table (
  user_id text,
  email text,
  credits_balance integer,
  credits_debt integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  welcome_grant_count integer := 0;
begin
  if requested_user_id is null or btrim(requested_user_id) = '' then
    raise exception 'A non-empty authenticated user id is required';
  end if;

  insert into public.user_profiles (user_id, email)
  values (requested_user_id, nullif(btrim(requested_email), ''))
  on conflict on constraint user_profiles_pkey do update
  set
    email = coalesce(excluded.email, user_profiles.email),
    updated_at = case
      when excluded.email is not null
        and excluded.email is distinct from user_profiles.email
      then now()
      else user_profiles.updated_at
    end;

  insert into public.credit_ledger (
    user_id,
    amount,
    action_type,
    description,
    idempotency_key
  )
  values (
    requested_user_id,
    100,
    'signup_bonus',
    'Welcome credits',
    'signup_bonus:' || requested_user_id
  )
  on conflict do nothing;

  get diagnostics welcome_grant_count = row_count;

  if welcome_grant_count = 1 then
    update public.user_profiles
    set
      credits_balance = credits_balance + 100,
      updated_at = now()
    where user_profiles.user_id = requested_user_id;
  end if;

  return query
  select
    profile.user_id,
    profile.email,
    profile.credits_balance,
    profile.credits_debt,
    profile.created_at,
    profile.updated_at
  from public.user_profiles as profile
  where profile.user_id = requested_user_id;
end;
$$;

comment on function public.ensure_user_onboarded(text, text) is
  'Creates an application profile and grants exactly one 100-credit signup bonus.';

revoke all on function public.ensure_user_onboarded(text, text) from public;
