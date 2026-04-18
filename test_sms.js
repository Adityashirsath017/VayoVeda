require("dotenv").config();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = process.env.RECEIVER_PHONE_NUMBER;

console.log("--- Twilio Test ---");
console.log(`Account SID: ${accountSid}`);
console.log(`From (Twilio): ${fromNumber}`);
console.log(`To (Verified): ${toNumber}`);

client.messages
    .create({
        body: "This is a test message from VayoMitra debugging script.",
        from: fromNumber,
        to: toNumber,
    })
    .then((message) => console.log(`✅ Success! SID: ${message.sid}`))
    .catch((error) => {
        console.error("❌ Error:");
        console.error(`  Code: ${error.code}`);
        console.error(`  Message: ${error.message}`);
        console.error(`  More Info: ${error.moreInfo}`);
    });
