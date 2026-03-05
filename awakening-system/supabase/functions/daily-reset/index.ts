import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        console.log(`[Daily Reset] Running for ${today}. Checking completions for ${yesterday}.`);

        // 1. Get all active profiles to check streaks
        const { data: profiles, error: pError } = await supabase
            .from("profiles")
            .select("id, current_streak, longest_streak");

        if (pError) throw pError;

        for (const profile of profiles) {
            // Check if user did ANY quest yesterday
            const { count, error: countError } = await supabase
                .from("quest_logs")
                .select("*", { count: "exact", head: true })
                .eq("user_id", profile.id)
                .eq("date", yesterday);

            if (countError) {
                console.error(`Error counting logs for ${profile.id}:`, countError);
                continue;
            }

            // Check if yesterday was a rest day
            const { data: restDay, error: rdError } = await supabase
                .from("daily_progress")
                .select("is_rest_day")
                .eq("user_id", profile.id)
                .eq("date", yesterday)
                .single();

            let newStreak = profile.current_streak;
            if (count && count > 0) {
                // User was active, increment streak
                newStreak += 1;
            } else if (restDay?.is_rest_day) {
                // Rest day, keep streak as is
                console.log(`User ${profile.id} had a Rest Day on ${yesterday}. Streak preserved.`);
            } else {
                // Inactive and no rest day, reset streak
                newStreak = 0;
            }

            const updateData: any = { current_streak: newStreak };
            if (newStreak > profile.longest_streak) {
                updateData.longest_streak = newStreak;
            }

            await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", profile.id);
        }

        // 2. Reset recurring quests
        const { error: resetError } = await supabase
            .from("quests")
            .update({ is_completed: false, last_reset_date: today })
            .eq("is_recurring", true)
            .eq("is_completed", true);

        if (resetError) throw resetError;

        return new Response(JSON.stringify({ success: true, date: today }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("[Daily Reset Error]:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
