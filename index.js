/* 
function getGreeting() {
  const now = new Date();
  let hour = now.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  if (ampm === "AM") return "Good Morning";
  if (hour < 5) return "Good Afternoon";
  if (hour < 9) return "Good Evening";
  return "Good Evening";
}
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwZcJsVIaUQ0Fx9dBEHbiN-YUaI4XkU1iLPGfDVrJgKyNkOSN9iMV40aIW6Aolbj4PMxQ/exec";

// Project details
const PROJECTS = {
  "1": {
    name: "Abode Aravindam – Tellapur",
    details: `🏢 *Abode Aravindam – Tellapur*\n
📌 Project Overview:
Welcome to Abode Aravindam – a premium gated community spanning 5.27 acres. 
This prestigious project offers 567 thoughtfully designed 2 & 3 BHK apartments, blending contemporary luxury with serene living.

🌟 Why Choose Abode Aravindam?
• Spacious layouts with abundant natural light & ventilation
• Prime location near schools, hospitals, shopping & transport hubs

🏡 Exclusive Amenities:
• Private Theatre for immersive entertainment
• Stylish Club House & Banquet Hall for gatherings
• State-of-the-art Gym & Landscaped Walking Trails

🛋 Unit Plans:
• Spacious Layouts – Efficient interiors for seamless movement
• Ample Natural Light & Ventilation – Large windows & open balconies
• Smart Design – Living, dining & kitchen areas for an effortless lifestyle
• Premium Finishes – Elegant fittings & aesthetics

📍 Location: Tellapur
📐 Property Area: 5.27 Acres
🆔 RERA No: P01100005069
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+9 | 567 Flats | 2 & 3 BHK
💰 Starting From: ₹92 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1cet434rju5vZzLfNHoCVZE3cR-dEnQHz/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1gz0E1sooyRDfrDgUv3DhfYffv9vE2IgN/view?usp=sharing",
    },
  },
  "2": {
    name: "MJ Lakeview Heights – Ameenpur",
    details: `🏢 *MJ Lakeview Heights – Ameenpur*\n
📌 Project Overview:
Discover a life where the calm of nature meets city convenience. 
An exclusive gated community beside Pedda Cheruvu Lake.
Thoughtfully designed 2 & 3 BHK residences with abundant natural light, intelligent ventilation & seamless layouts.

🌟 Why Choose MJ Lakeview Heights?
• Serene lake-view location
• Close to top schools, hospitals, shopping & transit routes
• Elegant and spacious homes designed for comfort

🏡 Amenities & Unit Plans:
• First Floor – Banquet hall & guest rooms
• Second Floor – Yoga/meditation area, conference room, indoor games
• 18 Units Per Floor – Balanced community with privacy
• Elegant Clubhouse – Recreation & community bonding

📍 Location: Ameenpur
📐 Property Area: 1.5 Acres
🆔 RERA No: P01100009015
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+10 | 174 Flats | 2 & 3 BHK
💰 Starting From: ₹82 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1t9zfs6fhQaeNtRkrTtBECTLyEw9pNVkW/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing",
    },
  },
};

// Utility: Send WhatsApp text
async function sendText(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      },
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

// Utility: Log user interaction to Google Sheets
async function logAction(phone, name, action, details = "") {
  try {
    await axios.post(GOOGLE_SCRIPT_URL, {
      timestamp: new Date().toLocaleString("en-US", { hour12: true }),
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Action logged: ${action}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.message);
  }
}

// Utility: Get greeting in 12-hour format
function getGreeting() {
  const now = new Date();
  let hour = now.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  if (ampm === "AM") return "Good Morning";
  if (hour < 5) return "Good Afternoon";
  if (hour < 9) return "Good Evening";
  return "Good Evening";
}

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

// Webhook receiver
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Incoming webhook:", JSON.stringify(body, null, 2));

    if (!body.entry || !body.entry[0]?.changes) {
      console.warn("⚠️ Invalid webhook structure");
      return res.sendStatus(200);
    }

    const entry = body.entry[0].changes[0].value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];

    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body?.trim().toLowerCase() || "";
    const name = contact?.profile?.name || "Customer";

    let reply = "";
    let action = "";

    if (/hi|hello|hey/.test(text)) {
      reply = `${getGreeting()} ${name}! ✨\nWelcome to *Abode Constructions*. 🏡\n\nSelect an option 👇\n1️⃣  View Projects\n2️⃣  Talk to Expert\n3️⃣  Download Brochure\n4️⃣  Book a Site Visit`;
      action = "Started Chat";
    } else if (text === "1" || text.includes("project")) {
      reply = `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`;
      action = "Viewed Projects List";
    } else if (text === "2" || text.includes("expert")) {
      reply = `📞 Call: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com`;
      action = "Requested Expert Contact";
    } else if (text === "3" || text.includes("brochure")) {
      reply = `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
        .map(
          ([key, p]) =>
            `${p.name}:\n2BHK: ${p.brochure["2BHK"]}\n3BHK: ${p.brochure["3BHK"]}`
        )
        .join("\n\n")}`;
      action = "Downloaded Brochure";
    } else if (text === "4" || text.includes("visit")) {
      reply = "📅 Book your site visit here: https://abodegroups.com/contact-us/";
      action = "Booked Site Visit";
    } else if (PROJECTS[text]) {
      const p = PROJECTS[text];
      reply = `${p.details}\n\n📄 Brochures:\n2BHK: ${p.brochure["2BHK"]}\n3BHK: ${p.brochure["3BHK"]}`;
      action = `Viewed Project Details: ${p.name}`;
    } else {
      reply = `Sorry, I didn't get that. Please reply with 1, 2, 3, or 4.`;
      action = "Unknown Input";
    }

    await sendText(from, reply);
    await logAction(from, name, action, text);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () =>
  console.log(`✅ Webhook server running on http://localhost:${PORT}`)
);*/


import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "your_verify_token_here";
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZcJsVIaUQ0Fx9dBEHbiN-YUaI4XkU1iLPGfDVrJgKyNkOSN9iMV40aIW6Aolbj4PMxQ/exec";

// Project information
// Project details
const PROJECTS = {
  "1": {
    name: "Abode Aravindam – Tellapur",
    details: `🏢 *Abode Aravindam – Tellapur*\n
📌 Project Overview:
Welcome to Abode Aravindam – a premium gated community spanning 5.27 acres. 
This prestigious project offers 567 thoughtfully designed 2 & 3 BHK apartments, blending contemporary luxury with serene living.

🌟 Why Choose Abode Aravindam?
• Spacious layouts with abundant natural light & ventilation
• Prime location near schools, hospitals, shopping & transport hubs

🏡 Exclusive Amenities:
• Private Theatre for immersive entertainment
• Stylish Club House & Banquet Hall for gatherings
• State-of-the-art Gym & Landscaped Walking Trails

🛋 Unit Plans:
• Spacious Layouts – Efficient interiors for seamless movement
• Ample Natural Light & Ventilation – Large windows & open balconies
• Smart Design – Living, dining & kitchen areas for an effortless lifestyle
• Premium Finishes – Elegant fittings & aesthetics

📍 Location: Tellapur
📐 Property Area: 5.27 Acres
🆔 RERA No: P01100005069
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+9 | 567 Flats | 2 & 3 BHK
💰 Starting From: ₹92 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1cet434rju5vZzLfNHoCVZE3cR-dEnQHz/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1gz0E1sooyRDfrDgUv3DhfYffv9vE2IgN/view?usp=sharing",
    },
  },
  "2": {
    name: "MJ Lakeview Heights – Ameenpur",
    details: `🏢 *MJ Lakeview Heights – Ameenpur*\n
📌 Project Overview:
Discover a life where the calm of nature meets city convenience. 
An exclusive gated community beside Pedda Cheruvu Lake.
Thoughtfully designed 2 & 3 BHK residences with abundant natural light, intelligent ventilation & seamless layouts.

🌟 Why Choose MJ Lakeview Heights?
• Serene lake-view location
• Close to top schools, hospitals, shopping & transit routes
• Elegant and spacious homes designed for comfort

🏡 Amenities & Unit Plans:
• First Floor – Banquet hall & guest rooms
• Second Floor – Yoga/meditation area, conference room, indoor games
• 18 Units Per Floor – Balanced community with privacy
• Elegant Clubhouse – Recreation & community bonding

📍 Location: Ameenpur
📐 Property Area: 1.5 Acres
🆔 RERA No: P01100009015
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+10 | 174 Flats | 2 & 3 BHK
💰 Starting From: ₹82 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1t9zfs6fhQaeNtRkrTtBECTLyEw9pNVkW/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing",
    },
  },
};

// In-memory user session state
const userStates = {};

// Verify webhook with WhatsApp
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Verification failed.");
  }
});

// Utility: Get greeting in 12-hour format
function getGreeting() {
  const now = new Date();
  let hour = now.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  if (ampm === "AM") return "Good Morning";
  if (hour < 5) return "Good Afternoon";
  if (hour < 9) return "Good Evening";
  return "Good Evening";
}

// Handle incoming messages
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const userMessage = message.text?.body?.trim()?.toLowerCase();

      if (!userStates[from] || !userStates[from].active) {
        userStates[from] = { active: true };
        await sendMessage(
          from,
          `👋 Hi ${getGreeting()} ${name}! Welcome to *Abode Constructions*.\nType:\n1️⃣ View Project Details\n2️⃣ Pricing Info\n3️⃣ Booking Process\n4️⃣ Contact Us\n\nType 'stop' anytime to end.`
        );
      } else if (userMessage === "stop") {
        userStates[from].active = false;
        await sendMessage(from, "🙏 Thank you for connecting with Abode Projects. Have a great day!");
      } else {
        await handleUserMessage(from, userMessage);
      }

      // Log interaction to Google Apps Script
      await logToGoogleSheets(from, userMessage);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

// Process user messages
async function handleUserMessage(user, msg) {
  if (PROJECTS[msg]) {
    await sendMessage(user, PROJECTS[msg].details);
  } else if (msg.includes("project")) {
    await sendMessage(user, "📂 Type 1 or 2 to view details of available projects.");
  } else if (msg.includes("price")) {
    await sendMessage(user, "💰 Price range:\n• Abode Aravindam: ₹92L+\n• MJ Lakeview Heights: ₹82L+");
  } else if (msg.includes("book")) {
    await sendMessage(user, "📝 Booking process: Provide your details and pay the token to reserve your flat.");
  } else if (msg.includes("contact")) {
    await sendMessage(user, "📞 Contact our sales expert: +91-9876543210");
  } else {
    await sendMessage(user, "❓ Sorry, I didn't understand that. Type a number (1-4) or keyword like 'price' or 'contact'.");
  }
}

// Send message using WhatsApp API
async function sendMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log(`📤 Sent to ${to}: ${message}`);
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

// Log user interaction to Google Sheets
async function logToGoogleSheets(user, message) {
  try {
    await axios.post(GOOGLE_SCRIPT_URL, { user, message });
    console.log(`📝 Logged: ${user} - ${message}`);
  } catch (err) {
    console.error("❌ Failed to log to Google Sheets:", err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
