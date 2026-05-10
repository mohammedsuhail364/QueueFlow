import { randomUUID } from "crypto";
import { pushJob } from "../queue/jobQueue.js";
export const createJob = async (req, res) => {
  const payload = req.body;
  const id = randomUUID();
  const jobData = {
    id,
    status: "pending",
    payload,
    createdAt: new Date(),
  };
  await pushJob(jobData);
  return res.status(201).json({
    success: true,
    data: id,
  });
};
