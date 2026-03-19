import { Profile } from "@/types/game";

/**
 * Checks if a user has an active premium (Monarch) subscription.
 */
export function isPremium(profile: Profile | null): boolean {
    if (!profile) return false;

    // Monarch tier with an active status grants premium features
    return (
        profile.subscription_tier === "monarch" &&
        profile.subscription_status === "active"
    );
}

/**
 * Returns the current subscription tier label.
 */
export function getSubscriptionLabel(profile: Profile | null): string {
    if (!profile || profile.subscription_tier === "hunter") {
        return "Охотник (Free)";
    }
    return "Монарх (Premium)";
}
