import { client } from "./redisClient.js";
const DELAYED_QUEUE_NAME = "job:delayed";
const HIGH_QUEUE = "job:queue:high";
const LOW_QUEUE = "job:queue:low";
export const startSchedular = async () => {
  console.log("scheduler started");
  setInterval(async () => {
    // console.log("checking delayed queue...");
    const jobs = await client.zRangeByScore(
      DELAYED_QUEUE_NAME,
      "-inf",
      Date.now(),
    );
    console.log(jobs);

    if (jobs) {
      for (const jobString of jobs) {
        const job = JSON.parse(jobString);
        const priority = job.payload?.priority;
        const queueName = priority === "high" ? HIGH_QUEUE : LOW_QUEUE;
        await client.zRem(DELAYED_QUEUE_NAME, jobString);
        await client.lPush(queueName, jobString);
      }
    }
  }, 1000);
};
