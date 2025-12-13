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
    status: "processing" | "completed" | "failed",
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
