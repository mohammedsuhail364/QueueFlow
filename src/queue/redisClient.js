import {createClient} from 'redis';
export const client=createClient();
client.on("error",(err)=>{
    console.log("error in redis connection",err);
})