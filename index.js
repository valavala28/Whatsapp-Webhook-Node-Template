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
};*/
const express = require("express");
const bodyParser = require("body-parser");
//const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwZcJsVIaUQ0Fx9dBEHbiN-YUaI4XkU1iLPGfDVrJgKyNkOSN9iMV40aIW6Aolbj4PMxQ/exec";

// In-memory session tracker
const sessions = {};

// Projects details
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

// Send WhatsApp message
async function sendText(to, text) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
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
      }
    );
    const data = await response.json();
    if (!response.ok) console.error("❌ Send failed:", data);
    else console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
}

// Log user action to Google Sheets
async function logUserAction(userPhone, customerName, action, details) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString(),
        userPhone,
        customerName,
        action,
        details,
      }),
    });
  } catch (error) {
    console.error("❌ Logging failed:", error);
  }
}

// Get 12-hour format greeting
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

// Webhook receiver
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "whatsapp_business_account") {
    const changes = body.entry?.[0]?.changes?.[0];
    if (changes?.value?.messages) {
      const messages = changes.value.messages;
      const contacts = changes.value.contacts;

      for (const msg of messages) {
        const from = msg.from;
        const text = msg.text?.body?.trim() || "";
        const userName = contacts?.[0]?.profile?.name || "there";

        if (!sessions[from]) sessions[from] = { step: 1 };
        const step = sessions[from].step;

        if (step === 1) {
          await sendText(
            from,
            `Hey ${userName}! ✨\n${getGreeting()} 👋\nWelcome to *Abode Constructions*. 🏡\n\nSelect an option below 👇\n1️⃣ View Our Projects\n2️⃣ Talk to an Expert 🧑‍💼\n3️⃣ Download Brochure 📩\n4️⃣ Book a Site Visit 📅`
          );
          await logUserAction(from, userName, "Started Chat", "");
          sessions[from].step = 2;
        } else if (step === 2) {
          if (text === "1") {
            await sendText(
              from,
              "Available Projects:\n1️⃣ Abode Aravindam\n2️⃣ MJ Lakeview Heights"
            );
            await logUserAction(from, userName, "Viewed Projects List", "");
            sessions[from].step = 3;
          } else if (text === "2") {
            await sendText(
              from,
              "📞 Call: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com\n📅 Book Site Visit: https://abodegroups.com/contact-us/"
            );
            await logUserAction(from, userName, "Requested Expert Contact", "");
            await sendText(
              from,
              "🙏 Thank you for contacting Abode Constructions!"
            );
            sessions[from].step = 1;
          } else if (text === "3") {
            await sendText(
              from,
              `Download Brochures:\nAbode Aravindam 2BHK: ${PROJECTS["1"].brochure["2BHK"]}\nAbode Aravindam 3BHK: ${PROJECTS["1"].brochure["3BHK"]}\nMJ Lakeview 2BHK: ${PROJECTS["2"].brochure["2BHK"]}\nMJ Lakeview 3BHK: ${PROJECTS["2"].brochure["3BHK"]}`
            );
            await logUserAction(from, userName, "Downloaded Brochure", "All");
            await sendText(
              from,
              "🙏 Thank you for contacting Abode Constructions!"
            );
            sessions[from].step = 1;
          } else if (text === "4") {
            await sendText(
              from,
              "📅 Book a Site Visit here: https://abodegroups.com/contact-us/"
            );
            await logUserAction(from, userName, "Booked Site Visit", "");
            await sendText(
              from,
              "🙏 Thank you for contacting Abode Constructions!"
            );
            sessions[from].step = 1;
          } else {
            await sendText(from, "❗ Please reply with 1, 2, 3, or 4 only.");
          }
        } else if (step === 3) {
          if (text === "1") {
            await sendText(
              from,
              `${PROJECTS["1"].details}\n📄 Brochures:\n2BHK: ${PROJECTS["1"].brochure["2BHK"]}\n3BHK: ${PROJECTS["1"].brochure["3BHK"]}`
            );
            await logUserAction(
              from,
              userName,
              "Viewed Project Details",
              "Abode Aravindam"
            );
          } else if (text === "2") {
            await sendText(
              from,
              `${PROJECTS["2"].details}\n📄 Brochures:\n2BHK: ${PROJECTS["2"].brochure["2BHK"]}\n3BHK: ${PROJECTS["2"].brochure["3BHK"]}`
            );
            await logUserAction(
              from,
              userName,
              "Viewed Project Details",
              "MJ Lakeview Heights"
            );
          } else {
            await sendText(from, "❗ Reply with 1 or 2 for project details.");
          }
          await sendText(
            from,
            "🙏 Thank you for contacting Abode Constructions!"
          );
          sessions[from].step = 1;
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () =>
  console.log(`✅ Webhook server running on http://localhost:${PORT}`)
);
