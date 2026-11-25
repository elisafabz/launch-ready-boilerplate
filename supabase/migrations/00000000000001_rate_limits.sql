-- Rate limiting infrastructure for Edge Functions (see functions/_shared/rate-limit.ts).
-- Runs via `supabase db reset` / `supabase db push` BEFORE seed.sql.
--
-- Security model:
--   * RLS enabled with ZERO policies (deny-by-default): only service_role
--     (Edge Functions) may read/write. Never add anon/authenticated policies.
--   * check_rate_limit() is SECURITY INVOKER and EXECUTE is revoked from
--     anon/authenticated, so it is not reachable via PostgREST /rest/v1/rpc.
--   * search_path is pinned (Supabase lint 0011); all objects are schema-qualified.
--   * key length is capped so a caller can never grow rows with arbitrary input.
--   * Expired windows are swept probabilistically inside the function (about
--     1 % of calls), so the table stays bounded without depending on pg_cron.
--     Optional: schedule `select public.cleanup_rate_limits()` via pg_cron instead.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 1,
  constraint rate_limits_key_length check (length(key) <= 256)
);
alter table public.rate_limits enable row level security;
-- No RLS policies: only service_role (Edge Functions) can read/write.

-- Index for the cleanup sweep.
create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

-- Deletes windows that expired at least `p_older_than` ago.
create or replace function public.cleanup_rate_limits(
  p_older_than interval default interval '1 day'
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits
  where window_start < now() - p_older_than;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Atomic rate-limit check (upsert prevents race conditions).
-- Returns the request count inside the current window for p_key.
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_window interval := make_interval(secs => p_window_seconds);
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case
      when public.rate_limits.window_start + v_window < now()
      then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start + v_window < now()
      then now()
      else public.rate_limits.window_start
    end
  returning count into v_count;

  -- Probabilistic sweep: keeps the table bounded without pg_cron.
  if random() < 0.01 then
    perform public.cleanup_rate_limits(greatest(v_window * 2, interval '1 hour'));
  end if;

  return v_count;
end;
$$;

-- Not callable through PostgREST by anon/authenticated. service_role keeps
-- EXECUTE via its default grants and bypasses RLS on the table.
revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.cleanup_rate_limits(interval)
  from public, anon, authenticated;
