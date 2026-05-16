import { client } from "./src/queue/redisClient.js";
import { connectServer } from "./src/api/server.js";

const startServer = async () => {
  await client.connect();
  console.log("redis is connected");
  connectServer();

};



startServer();
