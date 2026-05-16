import express from "express";
import { createJob, getJobStatus } from "./jobController.js";

const app = express();
const port = 3000;
app.use(express.json());
app.post("/jobs", createJob);
app.get("/jobs/:id",getJobStatus)
export const connectServer = () =>
  app.listen(port, () => {
    console.log("Server is running at the port :", port);
  });
