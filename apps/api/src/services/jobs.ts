import { Job } from "@prisma/client";
import { prisma } from "../lib/db";

export async function createJob(type: string, payload: any): Promise<Job> {
    return prisma.job.create({
        data: {
            type,
            status: "pending",
            payload: JSON.stringify(payload),
        },
    });
}

export async function getJob(id: string): Promise<Job | null> {
    return prisma.job.findUnique({ where: { id } });
}

export async function updateJobStatus(
    id: string,
    status: "pending" | "processing" | "completed" | "failed",
    result?: any,
    error?: string
) {
    await prisma.job.update({
        where: { id },
        data: {
            status,
            result: result ? JSON.stringify(result) : undefined,
            error,
        },
    });
}

// Simple in-memory "worker" trigger for MVP
// In production, this would be a separate process listening to a queue
export async function triggerJobProcessing(
    jobId: string,
    processor: (payload: any) => Promise<any>
) {
    // Fire and forget (don't await this in the API handler)
    (async () => {
        try {
            await updateJobStatus(jobId, "processing");
            const job = await getJob(jobId);
            if (!job) return;

            const payload = JSON.parse(job.payload);
            const result = await processor(payload);
            await updateJobStatus(jobId, "completed", result);
        } catch (e: any) {
            console.error(`Job ${jobId} failed:`, e);
            await updateJobStatus(jobId, "failed", undefined, e.message || String(e));
        }
    })();
}

// Job processor registry - maps job types to their processors
const jobProcessors: Record<string, (payload: any) => Promise<any>> = {};

export function registerJobProcessor(type: string, processor: (payload: any) => Promise<any>) {
    jobProcessors[type] = processor;
}

// Process a single job
async function processJob(job: Job): Promise<void> {
    const processor = jobProcessors[job.type];
    if (!processor) {
        console.error(`[Jobs] No processor registered for job type: ${job.type}`);
        await updateJobStatus(job.id, "failed", undefined, `No processor for type: ${job.type}`);
        return;
    }

    try {
        await updateJobStatus(job.id, "processing");
        const payload = JSON.parse(job.payload);
        const result = await processor(payload);
        await updateJobStatus(job.id, "completed", result);
        console.log(`[Jobs] ✅ Job ${job.id} (${job.type}) completed`);
    } catch (e: any) {
        console.error(`[Jobs] ❌ Job ${job.id} (${job.type}) failed:`, e);
        await updateJobStatus(job.id, "failed", undefined, e.message || String(e));
    }
}

// Reclaim stale jobs that were marked "processing" but the server restarted
async function reclaimStaleJobs(): Promise<void> {
    // Jobs that have been "processing" for more than 5 minutes are considered stale
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    const staleJobs = await prisma.job.findMany({
        where: {
            status: "processing",
            updatedAt: { lt: staleThreshold }
        }
    });

    if (staleJobs.length > 0) {
        console.log(`[Jobs] Reclaiming ${staleJobs.length} stale jobs`);
        for (const job of staleJobs) {
            await updateJobStatus(job.id, "pending");
        }
    }
}

// Polling worker loop - picks up pending jobs and processes them
let workerInterval: ReturnType<typeof setInterval> | null = null;
let isProcessing = false; // Prevent concurrent processing

export async function startJobWorker(intervalMs: number = 2000): Promise<void> {
    if (workerInterval) {
        console.log("[Jobs] Worker already running");
        return;
    }

    console.log(`[Jobs] Starting worker (polling every ${intervalMs}ms)`);
    
    // Reclaim stale jobs on startup
    await reclaimStaleJobs();

    workerInterval = setInterval(async () => {
        if (isProcessing) {
            return; // Skip if already processing
        }

        try {
            isProcessing = true;

            // Reclaim stale jobs periodically (every 10 iterations = ~20 seconds)
            if (Math.random() < 0.1) {
                await reclaimStaleJobs();
            }

            // Find next pending job
            const pendingJob = await prisma.job.findFirst({
                where: { status: "pending" },
                orderBy: { createdAt: "asc" }
            });

            if (pendingJob) {
                console.log(`[Jobs] Processing job ${pendingJob.id} (${pendingJob.type})`);
                await processJob(pendingJob);
            }
        } catch (error) {
            console.error("[Jobs] Worker error:", error);
        } finally {
            isProcessing = false;
        }
    }, intervalMs);
}

export function stopJobWorker(): void {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        console.log("[Jobs] Worker stopped");
    }
}
