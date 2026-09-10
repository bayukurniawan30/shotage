-- Keep the database RPC validation aligned with the client and API limit.
-- Rebuilding from pg_get_functiondef preserves the existing reservation logic
-- while changing the accepted paid video duration from >0–30 to 1–60 seconds.
do $$
declare
  function_name regprocedure;
  previous_definition text;
  updated_definition text;
begin
  foreach function_name in array array[
    'public.reserve_export_credits(text,text,text,text,text,integer,text,integer,numeric)'::regprocedure,
    'public.reserve_unlimited_export(text,text,text,text,text,integer,text,integer,numeric)'::regprocedure
  ]
  loop
    select pg_get_functiondef(function_name) into previous_definition;
    updated_definition := regexp_replace(
      previous_definition,
      'requested_video_duration_seconds[[:space:]]*>[[:space:]]*(\(30\)|30)(::numeric)?',
      'requested_video_duration_seconds > 60',
      'g'
    );

    if updated_definition = previous_definition then
      raise exception 'Could not find the 30-second duration guard in %', function_name;
    end if;

    previous_definition := updated_definition;
    updated_definition := regexp_replace(
      previous_definition,
      'requested_video_duration_seconds[[:space:]]*<=[[:space:]]*(\(0\)|0)(::numeric)?',
      'requested_video_duration_seconds < 1',
      'g'
    );

    if updated_definition = previous_definition then
      raise exception 'Could not find the minimum duration guard in %', function_name;
    end if;

    execute updated_definition;
  end loop;
end;
$$;
