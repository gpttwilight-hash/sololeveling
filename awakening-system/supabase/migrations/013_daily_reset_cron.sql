-- Enable pg_cron extension (available on all Supabase projects)
create extension if not exists pg_cron;

-- Schedule daily reset of recurring quests at midnight UTC every day.
-- This runs inside the database — no Edge Function needed.
select cron.schedule(
  'daily-quest-reset',   -- job name (unique)
  '0 0 * * *',           -- every day at 00:00 UTC
  $$
    update quests
    set
      is_completed    = false,
      last_reset_date = current_date
    where
      type            = 'daily'
      and is_recurring = true
      and is_completed = true
      and (last_reset_date is null or last_reset_date < current_date);
  $$
);

-- Schedule streak recalculation at 00:05 UTC (5 min after quest reset)
select cron.schedule(
  'daily-streak-update',
  '5 0 * * *',
  $$
    -- For each user: check if they completed any quest yesterday
    -- and update current_streak accordingly
    with yesterday_activity as (
      select
        p.id                                          as user_id,
        p.current_streak,
        p.longest_streak,
        coalesce(ql.did_quest, false)                 as was_active,
        coalesce(dp.is_rest_day, false)               as is_rest_day
      from profiles p
      left join (
        select user_id, true as did_quest
        from quest_logs
        where date = current_date - interval '1 day'
        group by user_id
      ) ql on ql.user_id = p.id
      left join daily_progress dp
        on dp.user_id = p.id
        and dp.date   = current_date - interval '1 day'
    ),
    new_streaks as (
      select
        user_id,
        longest_streak,
        case
          when was_active  then current_streak + 1
          when is_rest_day then current_streak
          else 0
        end as new_streak
      from yesterday_activity
    )
    update profiles p
    set
      current_streak = ns.new_streak,
      longest_streak = greatest(p.longest_streak, ns.new_streak)
    from new_streaks ns
    where p.id = ns.user_id;
  $$
);
