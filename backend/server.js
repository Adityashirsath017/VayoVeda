const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

// DEBUG: Check if keys are loaded
console.log("---- ENVIRONMENT DEBUG ----");
console.log("Twilio Account SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ Loaded" : "❌ Missing");
console.log("Twilio Auth Token:", process.env.TWILIO_AUTH_TOKEN ? "✅ Loaded" : "❌ Missing");
console.log("Gemini API Key:", process.env.GEMINI_API_KEY ? `✅ Loaded (${process.env.GEMINI_API_KEY.length} chars)` : "❌ Missing");
console.log("---------------------------");

if (!process.env.GEMINI_API_KEY) {
  console.error("🚨 CRITICAL ERROR: GEMINI_API_KEY is missing from .env file");
}

// Twilio Client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Gemini Client
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Only initialize if key exists to prevent immediate crash
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// System Instruction for Healthcare/VayoMitra context
const SYSTEM_INSTRUCTION = `
You are a helpful AI assistant for the "Vayoveda" application, designed for elderly care.
Your role is to assist users with healthcare-related queries, elder care advice, and questions about the Vayoveda app features (SOS, Reminders, Health Monitoring).

STRICT RULES:
1. ONLY answer questions related to:
   - Healthcare and Medical advice (general wellness, not specific diagnosis).
   - Elderly care and safety.
   - Vayoveda app features and navigation.
   - Healthy living, diet, and exercise for seniors.
2. If a user asks about anything else (e.g., politics, coding, movies, general knowledge unrelated to health), you MUST politely decline.
   - Example Refusal: "I am sorry, but I can only assist with healthcare and Vayoveda-related queries."
3. Keep answers concise, empathetic, and easy to understand for elderly users.
4. If asked about your name, you MUST reply that your name is "Vayoveda".
`;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).send({ success: false, error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.send({ success: true, reply: text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).send({ success: false, error: "Failed to generate response." });
  }
});

app.post("/send-sms", async (req, res) => {
  try {
    await client.messages.create({
      body: req.body.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.RECEIVER_PHONE_NUMBER,
    });
    res.send({ success: true, message: "SMS sent successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

app.post("/make-call", async (req, res) => {
  try {
    await client.calls.create({
      twiml: `<Response>
                <Say loop="3">Help me! I am in an emergency. Caretaker, Konark Solitaire Ambivili ,Kalyan</Say>
              </Response>`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.RECEIVER_PHONE_NUMBER,
    });
    res.send({ success: true, message: "Emergency call placed successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

const schedule = require('node-schedule');
const moment = require('moment');

app.post("/schedule-sms", async (req, res) => {
  try {
    const { task, time, date, to } = req.body;

    if (!task || !time || !date) {
      return res.status(400).send({ success: false, error: "Missing task, time, or date" });
    }

    // Use the 'to' phone number if provided, otherwise fallback to env variable
    const recipientPhone = to || process.env.RECEIVER_PHONE_NUMBER;
    if (!recipientPhone) {
      return res.status(400).send({ success: false, error: "No recipient phone number available" });
    }

    // Parse date and time: "2026-02-11" + "08:00 AM" -> Date object
    const dateTimeString = `${date} ${time}`;
    const scheduleDate = moment(dateTimeString, "YYYY-MM-DD hh:mm A").toDate();

    // Allow up to 1 minute in the past (to handle slight timing differences)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    if (scheduleDate < oneMinuteAgo) {
      return res.status(400).send({ success: false, error: "Scheduled time is in the past" });
    }

    console.log(`Scheduling SMS for: "${task}" at ${scheduleDate} to ${recipientPhone}`);

    // Schedule the job
    schedule.scheduleJob(scheduleDate, async function () {
      try {
        console.log(`Sending Scheduled SMS for task: ${task}`);
        await client.messages.create({
          body: `⏰ REMINDER: It's time for "${task}". Please attend to it now.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipientPhone,
        });
        console.log("Scheduled SMS sent successfully!");
      } catch (err) {
        console.error("Error sending scheduled SMS:", err);
      }
    });

    res.send({ success: true, message: `Reminder scheduled for ${time} on ${date}` });

  } catch (error) {
    console.error("Scheduling Error:", error);
    res.status(500).send({ success: false, error: "Failed to schedule reminder." });
  }
});

app.listen(5000, "0.0.0.0", () => console.log(`✅ Server running on port 5000 and bound to all network interfaces (0.0.0.0)`));