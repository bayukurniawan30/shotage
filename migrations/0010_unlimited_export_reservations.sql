-- Unlimited users are selected only by the trusted Hono server from the
-- server-only UNLIMITED_USER_IDS allowlist. Their exports still receive a
-- reservation so idempotency, concurrency, settlement, and cleanup behave the
-- same as metered exports, but no credits or ledger entries are consumed.
create or replace function public.reserve_unlimited_export(
  requested_user_id text,
  requested_idempotency_key text,
  requested_project_hash text,
  requested_kind text,
  requested_format text,
  requested_scale integer,
  requested_stage_scope text,
  requested_stage_count integer,
  requested_video_duration_seconds numeric
)
returns table (
  result_code text,
  reservation_id uuid,
  reservation_status text,
  credit_amount integer,
  protected_retry boolean,
  balance integer,
  expires_at timestamptz,
  replayed boolean
)
language plpgsql
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  profile_balance integer;
  open_reservations integer;
  existing_reservation public.credit_reservations%rowtype;
  created_reservation public.credit_reservations%rowtype;
begin
  if requested_user_id is null or btrim(requested_user_id) = '' then
    raise exception 'A non-empty authenticated user id is required';
  end if;

  if requested_idempotency_key is null or btrim(requested_idempotency_key) = ''
    or requested_project_hash !~ '^[0-9a-f]{64}$'
    or requested_kind not in ('image', 'video')
    or requested_stage_scope not in ('current', 'all')
    or requested_stage_count < 1 or requested_stage_count > 100
    or requested_scale < 1 or requested_scale > 4
  then
    return query select 'INVALID_REQUEST', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  if requested_kind = 'image' then
    if requested_format not in ('png', 'jpeg', 'webp')
      or requested_video_duration_seconds is not null
    then
      return query select 'INVALID_REQUEST', null::uuid, null::text, null::integer,
        false, null::integer, null::timestamptz, false;
      return;
    end if;
  elsif requested_format not in ('mp4', 'webm')
    or requested_video_duration_seconds is null
    or requested_video_duration_seconds <= 0
    or requested_video_duration_seconds > 30
  then
    return query select 'INVALID_REQUEST', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  select profile.credits_balance
  into profile_balance
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'PROFILE_NOT_FOUND', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  perform public.release_expired_credit_reservations(requested_user_id);
  select profile.credits_balance into profile_balance
  from public.user_profiles as profile where profile.user_id = requested_user_id;

  select reservation.*
  into existing_reservation
  from public.credit_reservations as reservation
  where reservation.idempotency_key = requested_idempotency_key;

  if found then
    if existing_reservation.user_id is distinct from requested_user_id
      or existing_reservation.project_hash is distinct from requested_project_hash
      or existing_reservation.export_kind is distinct from requested_kind
      or existing_reservation.export_format is distinct from requested_format
      or existing_reservation.export_scale is distinct from requested_scale
      or existing_reservation.stage_scope is distinct from requested_stage_scope
      or existing_reservation.stage_count is distinct from requested_stage_count
      or existing_reservation.video_duration_seconds
        is distinct from requested_video_duration_seconds
    then
      return query select 'IDEMPOTENCY_CONFLICT', null::uuid, null::text,
        null::integer, false, profile_balance, null::timestamptz, false;
      return;
    end if;

    return query select
      'OK', existing_reservation.id, existing_reservation.status,
      existing_reservation.credit_amount, existing_reservation.protected_retry,
      profile_balance, existing_reservation.expires_at, true;
    return;
  end if;

  select count(*)::integer
  into open_reservations
  from public.credit_reservations as reservation
  where reservation.user_id = requested_user_id
    and reservation.status = 'reserved'
    and reservation.expires_at > now();

  if open_reservations >= 3 then
    return query select 'TOO_MANY_OPEN_RESERVATIONS', null::uuid, null::text,
      0, false, profile_balance, null::timestamptz, false;
    return;
  end if;

  insert into public.credit_reservations (
    user_id,
    idempotency_key,
    project_hash,
    export_kind,
    export_format,
    export_scale,
    stage_scope,
    stage_count,
    video_duration_seconds,
    credit_amount,
    protected_retry,
    expires_at
  ) values (
    requested_user_id,
    requested_idempotency_key,
    requested_project_hash,
    requested_kind,
    requested_format,
    requested_scale,
    requested_stage_scope,
    requested_stage_count,
    requested_video_duration_seconds,
    0,
    false,
    now() + interval '30 minutes'
  )
  returning * into created_reservation;

  return query select
    'OK', created_reservation.id, created_reservation.status, 0, false,
    profile_balance, created_reservation.expires_at, false;
end;
$$;
