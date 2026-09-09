alter table public.credit_purchases enable row level security;
revoke all on table public.credit_purchases from public;

create or replace function public.apply_polar_purchase_paid(
  requested_event_id text,
  requested_order_id text,
  requested_checkout_id text,
  requested_user_id text,
  requested_product_id text,
  requested_credits integer,
  requested_amount integer,
  requested_currency text,
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
  purchase public.credit_purchases%rowtype;
  mutation record;
begin
  select history.*
  into purchase
  from public.credit_purchases as history
  where history.checkout_id = requested_checkout_id
    and history.user_id = requested_user_id
    and history.product_id = requested_product_id
    and history.credits = requested_credits
  for update;

  if not found then
    return query select 'PURCHASE_NOT_FOUND', null::integer, null::integer, 0;
    return;
  end if;

  select *
  into mutation
  from public.apply_polar_order_paid(
    requested_event_id,
    requested_order_id,
    requested_user_id,
    requested_product_id,
    requested_credits,
    requested_payload,
    requested_occurred_at
  );

  if mutation.result_code in ('APPLIED', 'DUPLICATE') then
    update public.credit_purchases as history
    set
      order_id = coalesce(history.order_id, requested_order_id),
      amount = coalesce(history.amount, requested_amount),
      currency = coalesce(history.currency, lower(requested_currency)),
      status = case
        when history.status in ('partially_refunded', 'refunded') then history.status
        else 'paid'
      end,
      paid_at = coalesce(history.paid_at, requested_occurred_at, now()),
      updated_at = now()
    where history.id = purchase.id;
  end if;

  return query select
    mutation.result_code,
    mutation.balance,
    mutation.debt,
    mutation.applied_credits;
end;
$$;

create or replace function public.apply_polar_purchase_refund(
  requested_event_id text,
  requested_order_id text,
  requested_user_id text,
  requested_refunded_amount integer,
  requested_refunded_total integer,
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
  purchase public.credit_purchases%rowtype;
  mutation record;
begin
  select history.*
  into purchase
  from public.credit_purchases as history
  where history.order_id = requested_order_id
    and history.user_id = requested_user_id
  for update;

  if not found then
    return query select 'PURCHASE_NOT_FOUND', null::integer, null::integer, 0;
    return;
  end if;

  select *
  into mutation
  from public.apply_polar_order_refund(
    requested_event_id,
    requested_order_id,
    requested_user_id,
    requested_refunded_amount,
    requested_order_net_amount,
    requested_payload,
    requested_occurred_at
  );

  if mutation.result_code in ('APPLIED', 'DUPLICATE') then
    update public.credit_purchases as history
    set
      refunded_amount = greatest(history.refunded_amount, requested_refunded_total),
      removed_credits = least(
        history.credits,
        history.removed_credits + mutation.removed_credits
      ),
      status = case
        when requested_refunded_amount >= requested_order_net_amount then 'refunded'
        else 'partially_refunded'
      end,
      refunded_at = coalesce(requested_occurred_at, now()),
      updated_at = now()
    where history.id = purchase.id;
  end if;

  return query select
    mutation.result_code,
    mutation.balance,
    mutation.debt,
    mutation.removed_credits;
end;
$$;

create or replace function public.apply_polar_checkout_status(
  requested_event_id text,
  requested_checkout_id text,
  requested_status text,
  requested_payload jsonb,
  requested_occurred_at timestamptz
)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  inserted_events integer;
  changed_rows integer;
begin
  if requested_status not in ('failed', 'expired') then
    return 'IGNORED';
  end if;

  if not exists (
    select 1 from public.credit_purchases as history
    where history.checkout_id = requested_checkout_id
  ) then
    return 'PURCHASE_NOT_FOUND';
  end if;

  insert into public.processed_webhook_events (
    provider,
    provider_event_id,
    event_type,
    payload,
    occurred_at
  ) values (
    'polar',
    requested_event_id,
    'checkout.' || requested_status,
    requested_payload,
    requested_occurred_at
  )
  on conflict do nothing;

  get diagnostics inserted_events = row_count;
  if inserted_events = 0 then
    return 'DUPLICATE';
  end if;

  update public.credit_purchases as history
  set status = requested_status, updated_at = now()
  where history.checkout_id = requested_checkout_id
    and history.status = 'pending';

  get diagnostics changed_rows = row_count;
  if changed_rows = 0 then
    return 'IGNORED';
  end if;
  return 'APPLIED';
end;
$$;

comment on function public.apply_polar_purchase_paid(text, text, text, text, text, integer, integer, text, jsonb, timestamptz)
  is 'Grants a verified Polar purchase and transitions its checkout history to paid.';
comment on function public.apply_polar_purchase_refund(text, text, text, integer, integer, integer, jsonb, timestamptz)
  is 'Applies a cumulative refund and transitions its purchase history status.';
comment on function public.apply_polar_checkout_status(text, text, text, jsonb, timestamptz)
  is 'Transitions a pending Polar checkout to failed or expired exactly once.';

revoke all on function public.apply_polar_purchase_paid(text, text, text, text, text, integer, integer, text, jsonb, timestamptz) from public;
revoke all on function public.apply_polar_purchase_refund(text, text, text, integer, integer, integer, jsonb, timestamptz) from public;
revoke all on function public.apply_polar_checkout_status(text, text, text, jsonb, timestamptz) from public;
