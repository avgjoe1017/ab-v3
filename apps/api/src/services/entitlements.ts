import { prisma } from "../lib/db";
import { type EntitlementV3 } from "@ab/contracts";

const FREE_TIER_LIMITS = {
    dailyGenerations: 2,
    maxSessionLengthSec: Number.MAX_SAFE_INTEGER, // Infinite for V3 Loop
};

export async function getEntitlement(userId: string | null): Promise<EntitlementV3> {
    // Mock Logic: Everyone is "Free" for now
    // In future, check User table for "pro" flag or Stripe subscription

    let remainingFreeGenerationsToday = FREE_TIER_LIMITS.dailyGenerations;

    if (userId) {
        // Count sessions created by this user since midnight UTC
        const midnight = new Date();
        midnight.setUTCHours(0, 0, 0, 0);

        const count = await prisma.session.count({
            where: {
                ownerUserId: userId,
                createdAt: { gte: midnight }
            }
        });

        remainingFreeGenerationsToday = Math.max(0, FREE_TIER_LIMITS.dailyGenerations - count);
    }

    return {
        plan: "free",
        status: "active",
        source: "internal",
        limits: {
            dailyGenerations: FREE_TIER_LIMITS.dailyGenerations,
            maxSessionLengthSec: FREE_TIER_LIMITS.maxSessionLengthSec,
            offlineDownloads: false, // Free tier cannot download (mock)
        },
        canCreateSession: remainingFreeGenerationsToday > 0,
        canGenerateAudio: remainingFreeGenerationsToday > 0,
        remainingFreeGenerationsToday,
        maxSessionLengthSecEffective: FREE_TIER_LIMITS.maxSessionLengthSec,
    };
}
