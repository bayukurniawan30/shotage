create or replace function public.release_expired_credit_reservations(
  requested_user_id text
)
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare
  refunded_credits integer := 0;
begin
  with released as (
    update public.credit_reservations as reservation
    set
      status = 'released',
      released_at = now(),
      updated_at = now()
    where reservation.user_id = requested_user_id
      and reservation.status = 'reserved'
      and reservation.expires_at <= now()
    returning reservation.id, reservation.user_id, reservation.credit_amount,
      reservation.project_hash
  ), refunds as (
    insert into public.credit_ledger (
      user_id,
      amount,
      action_type,
      description,
      idempotency_key,
      reservation_id,
      project_hash
    )
    select
      released.user_id,
      released.credit_amount,
      'reservation_expiry_release',
      'Expired export reservation refund',
      'reservation_expiry_release:' || released.id::text,
      released.id,
      released.project_hash
    from released
    where released.credit_amount > 0
    on conflict do nothing
    returning amount
  )
  select coalesce(sum(refunds.amount), 0)::integer
  into refunded_credits
  from refunds;

  if refunded_credits > 0 then
    update public.user_profiles as profile
    set
      credits_balance = profile.credits_balance + refunded_credits,
      updated_at = now()
    where profile.user_id = requested_user_id;
  end if;

  return refunded_credits;
end;
$$;

create or replace function public.reserve_export_credits(
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
  profile_debt integer;
  calculated_cost integer;
  open_reservations integer;
  retry_source_id uuid;
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
    calculated_cost := (case when requested_scale <= 2 then 15 else 30 end)
      * requested_stage_count;
  else
    if requested_format not in ('mp4', 'webm')
      or requested_video_duration_seconds is null
      or requested_video_duration_seconds <= 0
      or requested_video_duration_seconds > 30
    then
      return query select 'INVALID_REQUEST', null::uuid, null::text, null::integer,
        false, null::integer, null::timestamptz, false;
      return;
    end if;
    calculated_cost := case when requested_video_duration_seconds <= 10 then 75 else 120 end;
  end if;

  select profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'PROFILE_NOT_FOUND', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  perform public.release_expired_credit_reservations(requested_user_id);
  select profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt
  from public.user_profiles as profile
  where profile.user_id = requested_user_id;

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
      'OK',
      existing_reservation.id,
      existing_reservation.status,
      existing_reservation.credit_amount,
      existing_reservation.protected_retry,
      profile_balance,
      existing_reservation.expires_at,
      true;
    return;
  end if;

  if profile_debt > 0 then
    return query select 'ACCOUNT_IN_DEBT', null::uuid, null::text, calculated_cost,
      false, profile_balance, null::timestamptz, false;
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
      calculated_cost, false, profile_balance, null::timestamptz, false;
    return;
  end if;

  select paid.id
  into retry_source_id
  from public.credit_reservations as paid
  where paid.user_id = requested_user_id
    and paid.status = 'settled'
    and paid.credit_amount > 0
    and paid.settled_at >= now() - interval '5 minutes'
    and paid.project_hash = requested_project_hash
    and paid.export_kind = requested_kind
    and paid.export_format = requested_format
    and paid.export_scale = requested_scale
    and paid.stage_scope = requested_stage_scope
    and paid.stage_count = requested_stage_count
    and paid.video_duration_seconds is not distinct from requested_video_duration_seconds
    and not exists (
      select 1
      from public.credit_reservations as retry
      where retry.user_id = requested_user_id
        and retry.protected_retry = true
        and retry.created_at >= paid.settled_at
        and retry.project_hash = paid.project_hash
        and retry.export_kind = paid.export_kind
        and retry.export_format = paid.export_format
        and retry.export_scale = paid.export_scale
        and retry.stage_scope = paid.stage_scope
        and retry.stage_count = paid.stage_count
        and retry.video_duration_seconds is not distinct from paid.video_duration_seconds
    )
  order by paid.settled_at desc
  limit 1;

  if retry_source_id is not null then
    calculated_cost := 0;
  end if;

  if profile_balance < calculated_cost then
    return query select 'INSUFFICIENT_CREDITS', null::uuid, null::text,
      calculated_cost, retry_source_id is not null, profile_balance,
      null::timestamptz, false;
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
    calculated_cost,
    retry_source_id is not null,
    now() + interval '30 minutes'
  )
  returning * into created_reservation;

  if calculated_cost > 0 then
    insert into public.credit_ledger (
      user_id,
      amount,
      action_type,
      description,
      idempotency_key,
      reservation_id,
      project_hash,
      metadata
    ) values (
      requested_user_id,
      -calculated_cost,
      'export_reservation',
      'Export credit reservation',
      'reservation_debit:' || created_reservation.id::text,
      created_reservation.id,
      requested_project_hash,
      jsonb_build_object('kind', requested_kind, 'format', requested_format)
    );

    update public.user_profiles as profile
    set
      credits_balance = profile.credits_balance - calculated_cost,
      updated_at = now()
    where profile.user_id = requested_user_id
    returning profile.credits_balance into profile_balance;
  end if;

  return query select
    'OK',
    created_reservation.id,
    created_reservation.status,
    created_reservation.credit_amount,
    created_reservation.protected_retry,
    profile_balance,
    created_reservation.expires_at,
    false;
end;
$$;

create or replace function public.settle_export_reservation(
  requested_user_id text,
  requested_reservation_id uuid,
  requested_idempotency_key text
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
  target public.credit_reservations%rowtype;
begin
  select profile.credits_balance
  into profile_balance
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'NOT_FOUND', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  perform public.release_expired_credit_reservations(requested_user_id);
  select profile.credits_balance into profile_balance
  from public.user_profiles as profile where profile.user_id = requested_user_id;

  if exists (
    select 1 from public.credit_reservations as reservation
    where reservation.settle_idempotency_key = requested_idempotency_key
      and reservation.id <> requested_reservation_id
  ) then
    return query select 'IDEMPOTENCY_CONFLICT', null::uuid, null::text,
      null::integer, false, profile_balance, null::timestamptz, false;
    return;
  end if;

  select reservation.* into target
  from public.credit_reservations as reservation
  where reservation.id = requested_reservation_id
    and reservation.user_id = requested_user_id
  for update;

  if not found then
    return query select 'NOT_FOUND', null::uuid, null::text, null::integer,
      false, profile_balance, null::timestamptz, false;
    return;
  end if;

  if target.status = 'settled' then
    return query select 'OK', target.id, target.status, target.credit_amount,
      target.protected_retry, profile_balance, target.expires_at, true;
    return;
  end if;

  if target.status <> 'reserved' then
    return query select 'INVALID_STATE', target.id, target.status,
      target.credit_amount, target.protected_retry, profile_balance,
      target.expires_at, false;
    return;
  end if;

  update public.credit_reservations as reservation
  set
    status = 'settled',
    settled_at = now(),
    settle_idempotency_key = requested_idempotency_key,
    updated_at = now()
  where reservation.id = target.id
  returning * into target;

  return query select 'OK', target.id, target.status, target.credit_amount,
    target.protected_retry, profile_balance, target.expires_at, false;
end;
$$;

create or replace function public.release_export_reservation(
  requested_user_id text,
  requested_reservation_id uuid,
  requested_idempotency_key text
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
  target public.credit_reservations%rowtype;
begin
  select profile.credits_balance
  into profile_balance
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'NOT_FOUND', null::uuid, null::text, null::integer,
      false, null::integer, null::timestamptz, false;
    return;
  end if;

  perform public.release_expired_credit_reservations(requested_user_id);
  select profile.credits_balance into profile_balance
  from public.user_profiles as profile where profile.user_id = requested_user_id;

  if exists (
    select 1 from public.credit_reservations as reservation
    where reservation.release_idempotency_key = requested_idempotency_key
      and reservation.id <> requested_reservation_id
  ) then
    return query select 'IDEMPOTENCY_CONFLICT', null::uuid, null::text,
      null::integer, false, profile_balance, null::timestamptz, false;
    return;
  end if;

  select reservation.* into target
  from public.credit_reservations as reservation
  where reservation.id = requested_reservation_id
    and reservation.user_id = requested_user_id
  for update;

  if not found then
    return query select 'NOT_FOUND', null::uuid, null::text, null::integer,
      false, profile_balance, null::timestamptz, false;
    return;
  end if;

  if target.status = 'released' then
    return query select 'OK', target.id, target.status, target.credit_amount,
      target.protected_retry, profile_balance, target.expires_at, true;
    return;
  end if;

  if target.status <> 'reserved' then
    return query select 'INVALID_STATE', target.id, target.status,
      target.credit_amount, target.protected_retry, profile_balance,
      target.expires_at, false;
    return;
  end if;

  update public.credit_reservations as reservation
  set
    status = 'released',
    released_at = now(),
    release_idempotency_key = requested_idempotency_key,
    updated_at = now()
  where reservation.id = target.id
  returning * into target;

  if target.credit_amount > 0 then
    insert into public.credit_ledger (
      user_id,
      amount,
      action_type,
      description,
      idempotency_key,
      reservation_id,
      project_hash
    ) values (
      requested_user_id,
      target.credit_amount,
      'export_reservation_release',
      'Released export reservation refund',
      'reservation_release:' || target.id::text,
      target.id,
      target.project_hash
    )
    on conflict do nothing;

    if found then
      update public.user_profiles as profile
      set
        credits_balance = profile.credits_balance + target.credit_amount,
        updated_at = now()
      where profile.user_id = requested_user_id
      returning profile.credits_balance into profile_balance;
    end if;
  end if;

  return query select 'OK', target.id, target.status, target.credit_amount,
    target.protected_retry, profile_balance, target.expires_at, false;
end;
$$;

comment on function public.reserve_export_credits(text, text, text, text, text, integer, text, integer, numeric)
  is 'Atomically calculates and reserves server-owned export credit pricing.';
comment on function public.settle_export_reservation(text, uuid, text)
  is 'Idempotently settles an authenticated user export reservation.';
comment on function public.release_export_reservation(text, uuid, text)
  is 'Idempotently releases an authenticated user export reservation and refunds its debit.';

revoke all on function public.release_expired_credit_reservations(text) from public;
revoke all on function public.reserve_export_credits(text, text, text, text, text, integer, text, integer, numeric) from public;
revoke all on function public.settle_export_reservation(text, uuid, text) from public;
revoke all on function public.release_export_reservation(text, uuid, text) from public;
