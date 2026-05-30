import express from "express";
import { createJob, getJobStats, getJobStatus } from "./jobController.js";
import cors from "cors";

const app = express();
const port = 3000;
app.use(cors({ origin: "http://localhost:5173" })); 
app.use(express.json());
app.post("/jobs", createJob);
app.get("/jobs/stats", getJobStats);
app.get("/jobs/:id", getJobStatus);
export const connectServer = () =>
  app.listen(port, () => {
    console.log("Server is running at the port :", port);
  });
