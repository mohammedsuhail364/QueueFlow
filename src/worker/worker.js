import { getJob, updateJobStatus } from "../queue/jobQueue.js";
import { client } from "../queue/redisClient.js";
import { processJob } from "./jobProcessor.js";

export const startWorker = async () => {
  while (true) {
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
    try {
      await processJob(job);
      await updateJobStatus(job?.id, "completed");
    } catch (err) {
      console.log("job failed:", err.message);
      await updateJobStatus(job?.id, "failed");
    }
  }
};
