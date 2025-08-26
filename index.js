/* Project details and brochure mapping
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
• Premium finishes for modern comfort
🌐 More info: https://abodegroups.com/projects/aravindam/`,
    brochure: {
      "2BHK": `${APPS_SCRIPT_URL}?project=AbodeAravindham2BHK&phone=`,
      "3BHK": `${APPS_SCRIPT_URL}?project=AbodeAravindham3BHK&phone=`,
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
• Elegant living, dining & kitchen areas
🌐 More info: https://abodegroups.com/projects/mj-lakeview-heights/`,
    brochure: {
      "2BHK": `${APPS_SCRIPT_URL}?project=MJLakeview2BHK&phone=`,
      "3BHK": `${APPS_SCRIPT_URL}?project=MJLakeview3BHK&phone=`,
    },
  },
};
function getGreeting() {
  const now = new Date();
  let hour = now.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  if (ampm === "AM") return "Good Morning";
  if (hour < 5) return "Good Afternoon";
  if (hour < 9) return "Good Evening";
  return "Good Evening";
}*/

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
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
);
