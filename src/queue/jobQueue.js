import { client } from "./redisClient.js";

const HIGH_QUEUE = "job:queue:high";
const LOW_QUEUE = "job:queue:low";
const DELAYED_QUEUE_NAME = "job:delayed";
export const pushJob = async (jobData, priority) => {
  const queueName =
    priority === "high" ? HIGH_QUEUE : LOW_QUEUE;
  // Redis stores everything as strings. Objects, arrays, numbers — all must be converted to string before storing.
  await client.lPush(queueName, JSON.stringify(jobData));
};

export const getJob = async () => {
  // The 0 is the timeout in seconds — how long to wait if the queue is empty
  const result = await client.brPop(["job:queue:high", "job:queue:low"], 0);
  //   key is the queue name ("job:queue"), element is the actual job string. Think of it like — brPop tells you which list it popped from and what it popped.
  return JSON.parse(result.element);
};

export const updateJobStatus = async (id, status) => {
  await client.hSet(`job:${id}`, "status", status);
};
export const getStatus = async (id) => {
  return await client.hGetAll(`job:${id}`, "status");
};

export const incrementRetries = async (id) => {
  await client.hIncrBy(`job:${id}`, "retries", 1);
};

export const getRetries = async (id) => {
  const retries = await client.hGet(`job:${id}`, "retries");
  return parseInt(retries) || 0;
};

export const pushDelayedJob = async (job, delayMs) => {
  const executedAt = Date.now() + delayMs;
  console.log(
    "pushing to delayed queue, executeAt:",
    executedAt,
    "delay:",
    delayMs,
  );

  await client.zAdd(DELAYED_QUEUE_NAME, {
    score: executedAt,
    value: JSON.stringify(job),
  });
};
export const incrementCompletedCount=async (id) => {
  await client.incr("completed:count")
}
export const incrementFailedCount=async()=>{
  await client.incr("failed:count")
}