import { UUID } from "@ab/contracts";
import crypto from "crypto";
import { prisma } from "../src/lib/db";
import { pregenerateSilenceChunks } from "../src/services/audio/generation";

// Helper to compute affirmations hash (consistent with API logic)
function computeAffirmationsHash(affirmations: readonly string[]): string {
    return crypto.createHash("sha256").update(affirmations.join("|")).digest("hex");
}

// Helper to flatten session structure from JSON (opener, beginner_ramp, core, closing)
function flattenAffirmations(session: {
    opener: string[];
    beginner_ramp: [string, string][];
    core: [string, string][];
    closing: string[];
}): string[] {
    const affirmations: string[] = [];
    
    // Add opener
    affirmations.push(...session.opener);
    
    // Add beginner_ramp (each pair becomes two affirmations)
    for (const [a, b] of session.beginner_ramp) {
        affirmations.push(a, b);
    }
    
    // Add core (each pair becomes two affirmations)
    for (const [a, b] of session.core) {
        affirmations.push(a, b);
    }
    
    // Add closing
    affirmations.push(...session.closing);
    
    return affirmations;
}

const CATALOG_SESSIONS = [
    {
        title: "Morning Affirmations",
        id: "1c261e4b-7009-482a-928e-5b1b46700c99", // Fixed UUID
        affirmations: [
            "I am ready to seize the day.",
            "Today is full of opportunity.",
            "I am confident and calm.",
        ],
        voiceId: "alloy",
        goalTag: "morning",
    },
    {
        title: "Sleep & Relax",
        id: "5b53366c-48e8-4672-a420-9430c4436577", // Fixed UUID
        affirmations: [
            "I am letting go of the day.",
            "My mind is at peace.",
            "I sleep deeply and soundly.",
        ],
        voiceId: "shimmer",
        goalTag: "sleep",
    },
    {
        title: "Focus Boost",
        id: "9e5c6020-0063-41ec-b8f4-604719b48f61", // Fixed UUID
        affirmations: [
            "I am sharp and focused.",
            "Distractions fall away.",
            "I accomplish my goals with ease.",
        ],
        voiceId: "onyx",
        goalTag: "focus",
    },
    // Beginner Affirmations - First Four Sessions
    {
        title: "EASE IN (NO-PRESSURE AFFIRMATIONS)",
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Fixed UUID
        affirmations: flattenAffirmations({
            opener: [
                "You do not need to believe every word.",
                "Let this be practice, not proof.",
                "If something feels too big, soften it and keep going."
            ],
            beginner_ramp: [
                ["Right now, I am allowed to be exactly where I am.", "I can start from here without judging myself."],
                ["I can take this one breath at a time.", "I can take this one moment at a time."],
                ["It is true that this feels hard sometimes.", "It is also true that I can care for myself inside it."],
                ["I do not need perfection to make progress.", "I only need a next step."],
                ["I can be honest about how I feel.", "I can be kind to myself while I feel it."]
            ],
            core: [
                ["I am practicing a new way of speaking to myself.", "I am learning language that helps me heal."],
                ["I can hold doubt and still keep going.", "I can feel unsure and still move forward."],
                ["I am building trust with myself slowly.", "I am rebuilding self-trust one small choice at a time."],
                ["I can handle uncomfortable feelings without panicking.", "I can let feelings rise and fall without fighting them."],
                ["I am learning what I need.", "I am getting better at listening to myself."],
                ["I can make space for my emotions.", "I can give my emotions room without letting them run my life."],
                ["I am allowed to be a work in progress.", "Growth looks messy sometimes, and that is normal."],
                ["I can be patient with my timeline.", "I can stay with the process."],
                ["I am learning to let go of old patterns.", "I am practicing new patterns that support me."],
                ["When I slip, I can return.", "When I drift, I can come back."],
                ["I can choose one supportive thought right now.", "I can choose one helpful angle right now."],
                ["My effort counts even when it is small.", "Small effort still changes my life."],
                ["I am practicing self-respect.", "I am practicing self-respect in real time."],
                ["I can treat myself like someone I care about.", "I can talk to myself with warmth and fairness."],
                ["I do not have to earn kindness.", "I can give myself kindness now."]
            ],
            closing: [
                "I am here, and I am trying.",
                "That is enough for today."
            ]
        }),
        voiceId: "shimmer", // Gentle, supportive voice
        goalTag: "beginner",
    },
    {
        title: "CALM DOWN FAST (BODY-FIRST RESET)",
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", // Fixed UUID
        affirmations: flattenAffirmations({
            opener: [
                "Find one comfortable position.",
                "Let your exhale be longer than your inhale.",
                "Nothing to solve right now. Only settle."
            ],
            beginner_ramp: [
                ["Inhale gently. Exhale slowly.", "I can slow my breathing on purpose."],
                ["I am safe in this moment.", "In this moment, I am okay."],
                ["My body can soften.", "I can invite my body to relax."],
                ["I can unclench my jaw.", "I can drop my shoulders."],
                ["I can feel the surface beneath me.", "I can let my body be supported."]
            ],
            core: [
                ["I can name what I feel without feeding it.", "I can notice anxiety without becoming it."],
                ["My thoughts are not commands.", "My thoughts are just thoughts."],
                ["I can return to my breath.", "I can come back to the present."],
                ["I can release what I cannot control.", "I can focus on what I can influence."],
                ["I can let this wave pass.", "I can ride this out."],
                ["It is okay to feel nervous.", "I can feel nervous and still be safe."],
                ["I can create space inside my chest.", "I can breathe into more room."],
                ["My exhale can be a signal of safety.", "Each slow exhale tells my body to settle."],
                ["I can relax my hands.", "I can loosen my grip."],
                ["I can soften my belly.", "I can let my breathing be easy."],
                ["I do not need to fix everything right now.", "I only need to take care of this moment."],
                ["I can choose a calmer pace.", "I can move slowly and still be effective."],
                ["I can allow quiet.", "I can allow stillness."],
                ["I can trust my body to recover.", "My nervous system can return to balance."]
            ],
            closing: [
                "I am calmer than I was.",
                "I can keep this calm with me."
            ]
        }),
        voiceId: "alloy", // Calm, steady voice
        goalTag: "anxiety",
    },
    {
        title: "HARD DAY, STRONG ME (RESILIENCE UNDER PRESSURE)",
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012", // Fixed UUID
        affirmations: flattenAffirmations({
            opener: [
                "This is a hard day. That does not mean I am failing.",
                "Stress is a signal, not a verdict.",
                "I can meet today with strength."
            ],
            beginner_ramp: [
                ["My body is gearing up to help me.", "This energy can work for me."],
                ["I can feel activated and still think clearly.", "I can be stressed and still be capable."],
                ["I can take one steady breath and continue.", "I can reset in ten seconds and continue."],
                ["I can do hard things.", "I have done hard things before."]
            ],
            core: [
                ["I focus on what I can control.", "I release the rest."],
                ["I can take the next right step.", "I can take the next practical step."],
                ["I can handle discomfort without quitting.", "I can stay in it without collapsing."],
                ["I am resourceful under pressure.", "I find a way forward."],
                ["I can ask for help when I need it.", "I can use support without shame."],
                ["I can face what is in front of me.", "I can meet this directly."],
                ["I can tolerate uncertainty.", "I can keep moving without full certainty."],
                ["I can learn in real time.", "I can adapt quickly."],
                ["A mistake is information, not identity.", "I can correct and continue."],
                ["I can respond instead of react.", "I can choose my response."],
                ["I can keep my standards without punishing myself.", "I can aim high with self-respect."],
                ["I can be brave for one minute.", "I can be brave for one next step."],
                ["I can do the task, not the story.", "I can focus on actions, not spirals."],
                ["I trust myself to figure it out.", "I trust myself to handle what comes."],
                ["I can finish strong without burning out.", "I can be steady and finish."]
            ],
            closing: [
                "I showed up today.",
                "That is strength."
            ]
        }),
        voiceId: "onyx", // Strong, confident voice
        goalTag: "resilience",
    },
    {
        title: "DO THE NEXT RIGHT THING (MOMENTUM + FOLLOW-THROUGH)",
        id: "d4e5f6a7-b8c9-0123-defa-234567890123", // Fixed UUID
        affirmations: flattenAffirmations({
            opener: [
                "I do not need a huge breakthrough.",
                "I need one clear next step.",
                "Small moves build a strong life."
            ],
            beginner_ramp: [
                ["I remember what matters to me.", "I act from what matters to me."],
                ["I can choose one tiny action.", "I can choose one doable action."],
                ["I can start before I feel ready.", "I can start while I feel uncertain."],
                ["When it is time, I begin.", "When it is time, I take the first step."]
            ],
            core: [
                ["If I feel resistance, I will do two minutes.", "If I feel stuck, I will do the smallest version."],
                ["If I feel overwhelmed, I will pick one task.", "If I feel overwhelmed, I will simplify."],
                ["I keep promises to myself.", "I build trust by following through."],
                ["I can do this without motivation.", "I can do this with simple discipline."],
                ["I show up even when it is not perfect.", "I show up and adjust as I go."],
                ["I make decisions that my future self respects.", "I choose what helps me tomorrow."],
                ["I can do one step, then another.", "Progress is stacked steps."],
                ["I finish what I start, one piece at a time.", "I complete the next piece."],
                ["I can return when I drift.", "I can restart without shame."],
                ["My consistency is more important than my intensity.", "Small consistent effort beats big bursts."],
                ["I am the kind of person who keeps going.", "I am the kind of person who returns."],
                ["I plan for friction, not fantasy.", "I make plans that work on real days."],
                ["I can choose the next right thing.", "I can do the next right thing now."],
                ["I am proud of steady effort.", "I respect myself for showing up."]
            ],
            closing: [
                "I did something today.",
                "That counts, and I will build on it."
            ]
        }),
        voiceId: "alloy", // Clear, motivating voice
        goalTag: "productivity",
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
            
            // V3 Compliance: Compute real hash, enforce pace="slow", remove durationSec/affirmationSpacingMs
            const affirmationsHash = computeAffirmationsHash([...s.affirmations]);
            
            await prisma.session.create({
                data: {
                    id: s.id,
                    title: s.title,
                    source: "catalog",
                    ownerUserId: null,
                    durationSec: null, // V3: Infinite sessions (no fixed duration)
                    voiceId: s.voiceId,
                    pace: "slow", // V3: pace is always "slow"
                    affirmationSpacingMs: null, // V3: Fixed internally, not user-controlled
                    goalTag: s.goalTag,
                    affirmationsHash, // Real computed hash
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
