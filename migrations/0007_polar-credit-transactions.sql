create or replace function public.apply_polar_order_paid(
  requested_event_id text,
  requested_order_id text,
  requested_user_id text,
  requested_product_id text,
  requested_credits integer,
  requested_payload jsonb,
  requested_occurred_at timestamptz
)
returns table (
  result_code text,
  balance integer,
  debt integer,
  applied_credits integer
)
language plpgsql
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  profile_balance integer;
  profile_debt integer;
  debt_payment integer;
  inserted_events integer;
begin
  if requested_event_id is null or btrim(requested_event_id) = ''
    or requested_order_id is null or btrim(requested_order_id) = ''
    or requested_user_id is null or btrim(requested_user_id) = ''
    or requested_product_id is null or btrim(requested_product_id) = ''
    or requested_credits <= 0
  then
    return query select 'INVALID_REQUEST', null::integer, null::integer, 0;
    return;
  end if;

  select profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'PROFILE_NOT_FOUND', null::integer, null::integer, 0;
    return;
  end if;

  if exists (
    select 1
    from public.credit_ledger as ledger
    where ledger.provider = 'polar'
      and ledger.provider_order_id = requested_order_id
      and ledger.action_type = 'pack_purchase'
  ) then
    return query select 'DUPLICATE', profile_balance, profile_debt, 0;
    return;
  end if;

  insert into public.processed_webhook_events (
    provider,
    provider_event_id,
    provider_order_id,
    event_type,
    payload,
    occurred_at
  ) values (
    'polar',
    requested_event_id,
    requested_order_id,
    'order.paid',
    requested_payload,
    requested_occurred_at
  )
  on conflict do nothing;

  get diagnostics inserted_events = row_count;
  if inserted_events = 0 then
    return query select 'DUPLICATE', profile_balance, profile_debt, 0;
    return;
  end if;

  debt_payment := least(profile_debt, requested_credits);

  insert into public.credit_ledger (
    user_id,
    amount,
    action_type,
    description,
    idempotency_key,
    provider,
    provider_event_id,
    provider_order_id,
    metadata
  ) values (
    requested_user_id,
    requested_credits,
    'pack_purchase',
    'Polar credit pack purchase',
    'polar_order_paid:' || requested_order_id,
    'polar',
    requested_event_id,
    requested_order_id,
    jsonb_build_object(
      'productId', requested_product_id,
      'debtCleared', debt_payment
    )
  );

  update public.user_profiles as profile
  set
    credits_balance = profile.credits_balance + requested_credits - debt_payment,
    credits_debt = profile.credits_debt - debt_payment,
    updated_at = now()
  where profile.user_id = requested_user_id
  returning profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt;

  return query select 'APPLIED', profile_balance, profile_debt, requested_credits;
end;
$$;

create or replace function public.apply_polar_order_refund(
  requested_event_id text,
  requested_order_id text,
  requested_user_id text,
  requested_refunded_amount integer,
  requested_order_net_amount integer,
  requested_payload jsonb,
  requested_occurred_at timestamptz
)
returns table (
  result_code text,
  balance integer,
  debt integer,
  removed_credits integer
)
language plpgsql
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  purchase public.credit_ledger%rowtype;
  profile_balance integer;
  profile_debt integer;
  original_credits integer;
  previously_removed integer;
  target_removed integer;
  removal_delta integer;
  balance_payment integer;
  inserted_events integer;
begin
  if requested_event_id is null or btrim(requested_event_id) = ''
    or requested_order_id is null or btrim(requested_order_id) = ''
    or requested_user_id is null or btrim(requested_user_id) = ''
    or requested_refunded_amount <= 0
    or requested_order_net_amount <= 0
  then
    return query select 'INVALID_REQUEST', null::integer, null::integer, 0;
    return;
  end if;

  select ledger.*
  into purchase
  from public.credit_ledger as ledger
  where ledger.provider = 'polar'
    and ledger.provider_order_id = requested_order_id
    and ledger.action_type = 'pack_purchase'
    and ledger.user_id = requested_user_id;

  if not found then
    return query select 'PURCHASE_NOT_FOUND', null::integer, null::integer, 0;
    return;
  end if;

  select profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt
  from public.user_profiles as profile
  where profile.user_id = requested_user_id
  for update;

  if not found then
    return query select 'PROFILE_NOT_FOUND', null::integer, null::integer, 0;
    return;
  end if;

  insert into public.processed_webhook_events (
    provider,
    provider_event_id,
    provider_order_id,
    event_type,
    payload,
    occurred_at
  ) values (
    'polar',
    requested_event_id,
    requested_order_id,
    'order.refunded',
    requested_payload,
    requested_occurred_at
  )
  on conflict do nothing;

  get diagnostics inserted_events = row_count;
  if inserted_events = 0 then
    return query select 'DUPLICATE', profile_balance, profile_debt, 0;
    return;
  end if;

  original_credits := purchase.amount;
  target_removed := case
    when requested_refunded_amount >= requested_order_net_amount then original_credits
    else floor(
      original_credits::numeric * requested_refunded_amount::numeric
      / requested_order_net_amount::numeric
    )::integer
  end;
  target_removed := greatest(0, least(original_credits, target_removed));

  select coalesce(-sum(ledger.amount), 0)::integer
  into previously_removed
  from public.credit_ledger as ledger
  where ledger.provider = 'polar'
    and ledger.provider_order_id = requested_order_id
    and ledger.action_type = 'pack_refund';

  removal_delta := greatest(0, target_removed - previously_removed);
  if removal_delta = 0 then
    return query select 'DUPLICATE', profile_balance, profile_debt, 0;
    return;
  end if;

  balance_payment := least(profile_balance, removal_delta);

  insert into public.credit_ledger (
    user_id,
    amount,
    action_type,
    description,
    idempotency_key,
    provider,
    provider_event_id,
    provider_order_id,
    metadata
  ) values (
    requested_user_id,
    -removal_delta,
    'pack_refund',
    'Polar credit pack refund',
    'polar_order_refund:' || requested_order_id || ':' || target_removed::text,
    'polar',
    requested_event_id,
    requested_order_id,
    jsonb_build_object(
      'refundedAmount', requested_refunded_amount,
      'orderNetAmount', requested_order_net_amount,
      'targetRemovedCredits', target_removed
    )
  );

  update public.user_profiles as profile
  set
    credits_balance = profile.credits_balance - balance_payment,
    credits_debt = profile.credits_debt + removal_delta - balance_payment,
    updated_at = now()
  where profile.user_id = requested_user_id
  returning profile.credits_balance, profile.credits_debt
  into profile_balance, profile_debt;

  return query select 'APPLIED', profile_balance, profile_debt, removal_delta;
end;
$$;

comment on function public.apply_polar_order_paid(text, text, text, text, integer, jsonb, timestamptz)
  is 'Applies a verified Polar one-time product order exactly once.';
comment on function public.apply_polar_order_refund(text, text, text, integer, integer, jsonb, timestamptz)
  is 'Removes credits for the cumulative verified refund amount and records debt when needed.';

revoke all on function public.apply_polar_order_paid(text, text, text, text, integer, jsonb, timestamptz) from public;
revoke all on function public.apply_polar_order_refund(text, text, text, integer, integer, jsonb, timestamptz) from public;
