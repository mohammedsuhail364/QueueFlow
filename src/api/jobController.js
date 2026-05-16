import { randomUUID } from "crypto";
import { getStatus, pushJob } from "../queue/jobQueue.js";
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
