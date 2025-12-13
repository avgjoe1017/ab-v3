import { UUID } from "@ab/contracts";
import { prisma } from "../src/lib/db";
import { pregenerateSilenceChunks } from "../src/services/audio/generation";

const CATALOG_SESSIONS = [
    {
        title: "Morning Affirmations",
        id: "1c261e4b-7009-482a-928e-5b1b46700c99", // Fixed UUID
        affirmations: [
            "I am ready to seize the day.",
            "Today is full of opportunity.",
            "I am confident and calm.",
        ],
        durationSec: 300,
        voiceId: "alloy",
        pace: "normal",
        affirmationSpacingMs: 1000,
        goalTag: "morning",
        affirmationsHash: "placeholder_hash_morning",
    },
    {
        title: "Sleep & Relax",
        id: "5b53366c-48e8-4672-a420-9430c4436577", // Fixed UUID
        affirmations: [
            "I am letting go of the day.",
            "My mind is at peace.",
            "I sleep deeply and soundly.",
        ],
        durationSec: 600,
        voiceId: "shimmer",
        pace: "slow",
        affirmationSpacingMs: 2000,
        goalTag: "sleep",
        affirmationsHash: "placeholder_hash_sleep",
    },
    {
        title: "Focus Boost",
        id: "9e5c6020-0063-41ec-b8f4-604719b48f61", // Fixed UUID
        affirmations: [
            "I am sharp and focused.",
            "Distractions fall away.",
            "I accomplish my goals with ease.",
        ],
        durationSec: 300,
        voiceId: "onyx",
        pace: "fast",
        affirmationSpacingMs: 500,
        goalTag: "focus",
        affirmationsHash: "placeholder_hash_focus",
    },
] as const;

async function main() {
    console.log("🌱 Starting seed process...");

    // V3 Compliance: Pre-generate silence chunks first
    await pregenerateSilenceChunks();

    console.log("🌱 Seeding catalog sessions...");

    for (const s of CATALOG_SESSIONS) {
        const existing = await prisma.session.findUnique({ where: { id: s.id } });
        if (!existing) {
            console.log(`Creating: ${s.title}`);
            await prisma.session.create({
                data: {
                    id: s.id,
                    title: s.title,
                    source: "catalog",
                    ownerUserId: null,
                    durationSec: s.durationSec,
                    voiceId: s.voiceId,
                    pace: s.pace,
                    affirmationSpacingMs: s.affirmationSpacingMs,
                    goalTag: s.goalTag,
                    affirmationsHash: s.affirmationsHash,
                    // Create SessionAffirmations for completeness
                    affirmations: {
                        create: s.affirmations.map((text, idx) => ({
                            idx,
                            text,
                        })),
                    },
                },
            });
        } else {
            console.log(`Skipping (exists): ${s.title}`);
        }
    }

    console.log("✅ Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
