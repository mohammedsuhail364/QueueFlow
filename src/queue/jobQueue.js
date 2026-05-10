import { client } from "./redisClient.js";

const QUEUE_NAME = "job:queue";

export const pushJob = async (jobData) => {
  // Redis stores everything as strings. Objects, arrays, numbers — all must be converted to string before storing.
  await client.lPush(QUEUE_NAME, JSON.stringify(jobData));
};

export const getJob = async () => {
  // The 0 is the timeout in seconds — how long to wait if the queue is empty
  const result = await client.brPop(QUEUE_NAME, 0);
  //   key is the queue name ("job:queue"), element is the actual job string. Think of it like — brPop tells you which list it popped from and what it popped.
  return JSON.parse(result.element);
};
