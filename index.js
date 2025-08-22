// index.js
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // Make sure it's v2 if using require()

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223"; // Replace with your Phone Number ID
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD"; // Replace with your permanent access token

// Project details mapping (short, user-friendly)
const PROJECTS = {
  "1": `🏢 *Abode Aravindam* – Tellapur
📏 5.27 acres | 567 2 & 3 BHK apartments

✨ Why Choose Us?
• Spacious, airy layouts with natural light
• Prime location near schools, hospitals & shopping
• Lifestyle amenities: Private Theatre, Club House, Gym, Walking Trails

🏠 Unit Plans
• Thoughtfully designed 2 & 3 BHK apartments
• Large windows & open balconies for bright, airy homes
• Smart layouts: living, dining & kitchen areas optimized
• Premium finishes for modern luxury & comfort

🌐 More info: https://abodegroups.com/projects/aravindam/`,

  "2": `🏢 *MJ Lakeview Heights* – Ameenpur
📍 Beside Pedda Cheruvu Lake | 2 & 3 BHK | G+10 Floors | 174 Flats
💰 Starting From: ₹82L onwards

✨ Why Choose Us?
• Lake-facing views & abundant natural light
• Smart layouts: living, dining & kitchen optimized
• Prime location near schools, hospitals & shopping
• Lifestyle amenities: Clubhouse, Banquet Hall, Indoor Games, Yoga/Meditation spaces

🌐 More info: https://abodegroups.com/projects/mj-lakeview-heights/`
};

// Middleware
app.use(bodyParser.json());

// Root Route
app.get("/", (req, res) => {
  res.send("✅ WhatsApp Webhook is live");
});

// Webhook Verification (GET)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "Abode@14"; // Must match token in Meta config
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Send text message via WhatsApp Cloud API
async function sendText(to, text) {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    });
    console.log(`✅ Sent message to ${to}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
}

// Webhook Receiver (POST)
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const changes = body.entry?.[0]?.changes?.[0];

    // Handle incoming messages
    if (changes?.value?.messages) {
      const messages = changes.value.messages;
      for (const msg of messages) {
        const from = msg.from;
        console.log("📩 Incoming message:");
        console.log(`From: ${from}`);
        console.log(`Type: ${msg.type}`);

        if (msg.type === "text") {
          // Normalize user reply
          const reply = msg.text.body.trim();

          // Check for valid project number
          if (PROJECTS[reply]) {
            await sendText(from, PROJECTS[reply]);
          } else {
            await sendText(from, "❗ Please reply with 1 or 2 only to get project details.");
          }
        }
      }
    }

    // Handle message status updates
    if (changes?.value?.statuses) {
      const statuses = changes.value.statuses;
      for (const status of statuses) {
        console.log("📬 Message status update:");
        console.log(`ID: ${status.id}`);
        console.log(`Status: ${status.status}`); // sent, delivered, read, failed
        console.log(`To: ${status.recipient_id}`);
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Webhook server running on port ${PORT}`);
});
