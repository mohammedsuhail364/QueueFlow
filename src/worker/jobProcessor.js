export const processJob = async (job) => {
  const type = job?.payload?.type;
  if (type == "send_email") {
    console.log("send mail is run");
  } else if (type == "send_sms") {
    console.log("send sms is run");
  } else if (type == "generate_invoice") {
    console.log("generate invoice is run");
  } else if (type == "resize_image") {
    console.log("resize image is run");
  } else {
    console.log("unknown job type:", type);
  }
};
