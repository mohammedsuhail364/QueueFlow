import { client } from "./src/queue/redisClient.js";
import { startWorker } from "./src/worker/worker.js";

const start = async () => {
  await client.connect();
  console.log("worker redis connected");
  startWorker();
};

start();