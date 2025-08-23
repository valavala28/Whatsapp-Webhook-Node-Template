const express = require("express");
const bodyParser = require("body-parser");
//const fetch = require("node-fetch"); // Make sure node-fetch is installed

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223"; // Replace with your Phone Number ID
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEB4GqQxEPr8CIwGohC71P1Vk_wiJFGAmIOJzHj9djmWezxabKvjW8weSq1oWhSFWYLw/exec";

// In-memory session tracking
const sessions = {};

// Project Details with dynamic brochure links
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
• 2 & 3 BHK apartments with premium finishes
• Elegant living, dining & kitchen areas
🌐 More info: https://abodegroups.com/projects/mj-lakeview-heights/`,
    brochure: {
      "2BHK": `${APPS_SCRIPT_URL}?project=MJLakeview2BHK&phone=`,
      "3BHK": `${APPS_SCRIPT_URL}?project=MJLakeview3BHK&phone=`,
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

// Send text message
async function sendText(to, text) {
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
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
    const data = await response.json();
    if (!response.ok) console.error("❌ Failed to send message:", data);
    else console.log(`✅ Sent message to ${to}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
}

// Send PDF as document
async function sendDocument(to, pdfLink, filename) {
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          link: pdfLink,
          filename: filename
        }
      }),
    });
    const data = await response.json();
    if (!response.ok) console.error("❌ Failed to send document:", data);
    else console.log(`✅ Sent document to ${to}`);
  } catch (error) {
    console.error("❌ Error sending document:", error);
  }
}

// Fetch secure brochure link from Apps Script
async function getSecureBrochureLink(projectId, unitType, userPhone) {
  try {
    const url = PROJECTS[projectId].brochure[unitType] + encodeURIComponent(userPhone);
    const response = await fetch(url);
    const link = await response.text();
    return link;
  } catch (error) {
    console.error("❌ Error fetching secure brochure link:", error);
    return null;
  }
}

// IST-based greeting
function getGreeting() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  let hourIST = (utcHour + 5 + Math.floor((utcMinute + 30) / 60)) % 24;
  if (hourIST < 12) return "Good morning";
  if (hourIST < 17) return "Good afternoon";
  return "Good evening";
}

// Webhook receiver
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const changes = body.entry?.[0]?.changes?.[0];
  if (!changes?.value?.messages) return res.sendStatus(200);

  const messages = changes.value.messages;
  const contacts = changes.value.contacts;

  for (const msg of messages) {
    const from = msg.from;
    const text = msg.text?.body?.trim() || "";
    const userName = contacts?.[0]?.profile?.name || "there";

    console.log(`📩 Incoming message from ${from} (${userName}): ${text}`);

    if (!sessions[from]) sessions[from] = { step: 1 };
    const step = sessions[from].step;

    if (step === 1) {
      const greeting = getGreeting();
      await sendText(
        from,
        `Hi ${userName}! 👋 ${greeting}!\nWelcome to Abode Constructions.\nHow may I help you today?\n1️⃣ I want to know about projects\n2️⃣ Contact Details\n3️⃣ Download Brochure`
      );
      sessions[from].step = 2;
    } else if (step === 2) {
      const reply = text.toLowerCase();
      if (reply === "1" || reply.includes("project")) {
        await sendText(from, "Please choose a project:\n1️⃣ Abode Aravindam\n2️⃣ MJ Lakeview Heights");
        sessions[from].step = 3;
      } else if (reply === "2" || reply.includes("contact")) {
        await sendText(
          from,
          "📞 Contact Details: +91-8008312211\n📧 Email: abodegroups3@gmail.com\nVisit Website: https://abodegroups.com/\nBook a Site Visit: https://abodegroups.com/contact-us/"
        );
        await sendText(from, "🙏 Thank you for contacting Abode Constructions. Feel free to ask your queries anytime!");
        sessions[from].step = 1;
      } else if (reply === "3" || reply.includes("brochure")) {
        await sendText(from, "📄 Please find the brochures below:");
        const aravindham2BHK = await getSecureBrochureLink("1", "2BHK", from);
        const aravindham3BHK = await getSecureBrochureLink("1", "3BHK", from);
        const mj2BHK = await getSecureBrochureLink("2", "2BHK", from);
        const mj3BHK = await getSecureBrochureLink("2", "3BHK", from);

        await sendDocument(from, aravindham2BHK, "AbodeAravindham_2BHK.pdf");
        await sendDocument(from, aravindham3BHK, "AbodeAravindham_3BHK.pdf");
        await sendDocument(from, mj2BHK, "MJLakeview_2BHK.pdf");
        await sendDocument(from, mj3BHK, "MJLakeview_3BHK.pdf");

        await sendText(from, "🙏 Thank you for contacting Abode Constructions. Feel free to ask your queries anytime!");
        sessions[from].step = 1;
      } else {
        await sendText(from, "❗ Please reply with 1, 2, or 3 only.");
      }
    } else if (step === 3) {
      const reply = text.trim();
      if (reply === "1") {
        await sendText(from, PROJECTS["1"].details);
        await sendDocument(from, await getSecureBrochureLink("1","2BHK",from), "AbodeAravindham_2BHK.pdf");
        await sendDocument(from, await getSecureBrochureLink("1","3BHK",from), "AbodeAravindham_3BHK.pdf");
        sessions[from].step = 1;
      } else if (reply === "2") {
        await sendText(from, PROJECTS["2"].details);
        await sendDocument(from, await getSecureBrochureLink("2","2BHK",from), "MJLakeview_2BHK.pdf");
        await sendDocument(from, await getSecureBrochureLink("2","3BHK",from), "MJLakeview_3BHK.pdf");
        sessions[from].step = 1;
      } else {
        await sendText(from, "❗ Please reply with 1 or 2 to get project details.");
      }
    }
  }

  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => console.log(`✅ Webhook server running on port ${PORT}`));
