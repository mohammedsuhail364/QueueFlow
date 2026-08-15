import {createClient} from 'redis';
export const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
client.on("error",(err)=>{
    console.log("error in redis connection",err);
})