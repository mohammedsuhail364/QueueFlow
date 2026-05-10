import express from "express";
import { createJob } from "./jobController.js";

const app = express();
const port = 3000;
app.use(express.json());
app.post("/jobs", createJob);

export const connectServer = () =>
  app.listen(port, () => {
    console.log("Server is running at the port :", port);
  });
