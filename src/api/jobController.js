import { randomUUID } from "crypto";
import { getStatus, pushJob } from "../queue/jobQueue.js";
import { client } from "../queue/redisClient.js";
export const createJob = async (req, res) => {
  const payload = req.body;
  const priority = payload.priority;
  const id = randomUUID();
  const jobData = {
    id,
    status: "pending",
    retries: "0",
    payload,
    createdAt: new Date(),
  };
  await updateJobStatus(id, "pending");
  await pushJob(jobData, priority);
  return res.status(201).json({
    success: true,
    id,
  });
};
export const getJobStatus = async (req, res) => {
  const { id } = req.params;
  const job = await getStatus(id);
  console.log(job);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: `there is no jb with this ${id}`,
    });
  }
  return res.status(200).json({
    success: true,
    job,
  });
};
export const getJobStats = async (req, res) => {
  const high = await client.lLen("job:queue:high");
  const low = await client.lLen("job:queue:low");
  const dlq = await client.lLen("job:dlq");
  const completed = await client.get("completed:count");
  const failed = await client.get("failed:count");

  return res.status(200).json({
    pending: high + low,
    completed: parseInt(completed) || 0,
    failed: parseInt(failed) || 0,
    dlq,
  });
};