import {
  getJob,
  getRetries,
  incrementRetries,
  pushDelayedJob,
  updateJobStatus,
  incrementCompletedCount,
  incrementFailedCount,
} from "../queue/jobQueue.js";
import { client } from "../queue/redisClient.js";
import { processJob } from "./jobProcessor.js";
let isShuttingDown = false;
export const startWorker = async () => {
  while (!isShuttingDown) {
    const job = await getJob();
    console.log("picked the job", job);
    const lock = await client.set(`lock:job:${job.id}`, "locked", {
      NX: true,
      EX: 30,
    });
    // if not lock before and now lock happens then return ok and NX means Not eXists then make it lock and EX means Expiry
    // already it is locked then it returns null
    if (!lock) {
      console.log("job already being processed, skipping:", job.id);
      continue;
    }
    await updateJobStatus(job?.id, "active");
    console.log("job was in active", job);

    try {
      await processJob(job);
      await updateJobStatus(job?.id, "completed");
      await incrementCompletedCount(job?.id);
      await client.del(`lock:job:${job.id}`);
      console.log("job was complete", job);
    } catch (err) {
      console.log("job failed, retrying...", err.message);
      await client.del(`lock:job:${job.id}`); // release lock
      const retries = await getRetries(job?.id);
      console.log("current retries:", retries);
      if (retries < 3) {
        const delayMs = Math.pow(2, retries) * 1000;
        console.log("pushing to delayed queue, delay:", delayMs);
        // This is the exponential backoff pattern:

        // Retry 0 → wait 2^0 * 1000 = 1 seconds
        // Retry 1 → wait 2^1 * 1000 = 2 seconds
        // Retry 2 → wait 2^2 * 1000 = 4 seconds
        // Retry 3 → wait 2^3 * 1000 = 8 seconds
        await pushDelayedJob(job, delayMs);
        await incrementRetries(job.id);
      } else {
        console.log("job failed:", err.message);
        await updateJobStatus(job?.id, "failed");
        await incrementFailedCount(job?.id);
        await client.lPush("job:dlq", JSON.stringify(job)); // dead letter queue
        console.log("job moved to DLQ:", job.id);
      }
    }
  }
};
process.on("SIGTERM", () => {
  isShuttingDown = true; // tells loop to stop after current job
  console.log("worker shutting down gracefully...");
});
