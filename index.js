const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // Ensure node-fetch v2 is installed for CommonJS

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223"; // Replace with your Phone Number ID
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// In-memory session tracking
const sessions = {};

// Project Details with Drive links
const PROJECTS = {
  "1": {
    name: "Abode Aravindam – Tellapur",
    details: `🏢 *Abode Aravindam* – Tellapur
📏 5.27 acres | 567 2 & 3 BHK apartments
✨ Why Choose Us?
• Spacious, airy layouts with natural light
• Prime location near schools, hospitals & shopping
• Lifestyle amenities: Private Theatre, Club House, Gym, Walking Trails
🏠 Unit Plans
• Thoughtfully designed 2 & 3 BHK apartments
• Large windows & open balconies
• Smart layouts for living, dining & kitchen
• Premium finishes for modern comfort
🌐 More info: https://abodegroups.com/projects/aravindam/`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1cet434rju5vZzLfNHoCVZE3cR-dEnQHz/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1gz0E1sooyRDfrDgUv3DhfYffv9vE2IgN/view?usp=sharing",
    },
  },
  "2": {
    name: "MJ Lakeview Heights – Ameenpur",
    details: `🏢 *MJ Lakeview Heights* – Ameenpur
📏 1.5 Acres | 174 2 & 3 BHK Flats
✨ Why Choose Us?
• Serene lake-view location
• Thoughtfully designed 2 & 3 BHK homes
• Close to schools, hospitals & shopping
• Smart layouts with natural light & ventilation
🏠 Unit Plans
• 2 & 3 BHK apartments with premium finishes
• Elegant living, dining & kitchen areas
🌐 More info: https://abodegroups.com/projects/mj-lakeview-heights/`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1t9zfs6fhQaeNtRkrTtBECTLyEw9pNVkW/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing",
    },
  },
};

// Middleware
app.use(bodyParser.json());

// Root route
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

// Webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "Abode@14";
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

// Send text message function
async function sendText(to, text) {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    console.log(`✅ Sent message to ${to}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
}

// Determine greeting based on time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Webhook receiver
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const changes = body.entry?.[0]?.changes?.[0];

    if (changes?.value?.messages) {
      const messages = changes.value.messages;
      const contacts = changes.value.contacts; // Capture user contact info for name

      for (const msg of messages) {
        const from = msg.from;
        const text = msg.text?.body?.trim() || "";
        const userName = contacts?.[0]?.profile?.name || "there"; // Get user name safely

        console.log("📩 Incoming message:");
        console.log(`From: ${from}`);
        console.log(`Message: ${text}`);
        console.log(`User Name: ${userName}`);

        // Initialize session if new
        if (!sessions[from]) {
          sessions[from] = { step: 1 };
        }

        const step = sessions[from].step;

        // Step 1: Send greeting
        if (step === 1) {
          const greeting = getGreeting();
          const greetingMsg = `Hi ${userName}! 👋 ${greeting}!\nHow may I help you?\n1️⃣ I want to know about projects\n2️⃣ Contact Sales\n3️⃣ Download Brochure`;
          await sendText(from, greetingMsg);
          sessions[from].step = 2;
        }

        // Step 2: Handle menu options
        else if (step === 2) {
          const reply = text.toLowerCase();

          if (reply === "1" || reply.includes("project")) {
            await sendText(from, "Please choose a project:\n1️⃣ Abode Aravindam\n2️⃣ MJ Lakeview Heights");
            sessions[from].step = 3;
          } else if (reply === "2" || reply.includes("contact")) {
            await sendText(from, "📞 Contact Sales: +91-8008312211\n📧 Email: abodegroups3@gmail.com");
            sessions[from].step = 2;
          } else if (reply === "3" || reply.includes("brochure")) {
            await sendText(
              from,
              `📄 Download brochures:\nAbode Aravindam 2BHK: ${PROJECTS["1"].brochure["2BHK"]}\nAbode Aravindam 3BHK: ${PROJECTS["1"].brochure["3BHK"]}\nMJ Lakeview 2BHK: ${PROJECTS["2"].brochure["2BHK"]}\nMJ Lakeview 3BHK: ${PROJECTS["2"].brochure["3BHK"]}`
            );
            sessions[from].step = 2;
          } else {
            await sendText(from, "❗ Please reply with 1, 2, or 3 only.");
          }
        }

        // Step 3: Handle project details
        else if (step === 3) {
          const reply = text.trim();
          if (reply === "1") {
            await sendText(
              from,
              `${PROJECTS["1"].details}\n📄 Brochures:\n2BHK: ${PROJECTS["1"].brochure["2BHK"]}\n3BHK: ${PROJECTS["1"].brochure["3BHK"]}`
            );
          } else if (reply === "2") {
            await sendText(
              from,
              `${PROJECTS["2"].details}\n📄 Brochures:\n2BHK: ${PROJECTS["2"].brochure["2BHK"]}\n3BHK: ${PROJECTS["2"].brochure["3BHK"]}`
            );
          } else {
            await sendText(from, "❗ Please reply with 1 or 2 to get project details.");
          }
          sessions[from].step = 2; // Return to main menu
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Start server
app.listen(PORT, () => console.log(`✅ Webhook server running on port ${PORT}`));

