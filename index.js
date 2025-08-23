const express = require("express");
const bodyParser = require("body-parser");
//const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223"; // Replace with your Phone Number ID
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URLs
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEB4GqQxEPr8CIwGohC71P1Vk_wiJFGAmIOJzHj9djmWezxabKvjW8weSq1oWhSFWYLw/exec";
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/YOUR-SHEET-WEBHOOK-ID/exec"; // <-- Replace with script to log user details

// In-memory sessions
const sessions = {};

// Project details and brochure mapping
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

// Send WhatsApp text
async function sendText(to, text) {
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
}

// Send WhatsApp PDF
async function sendDocument(to, pdfLink, filename) {
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
      document: { link: pdfLink, filename: filename },
    }),
  });
  const data = await response.json();
  if (!response.ok) console.error("❌ Failed to send document:", data);
  else console.log(`✅ Sent document to ${to}`);
}

// Fetch secure link
async function getSecureBrochureLink(projectId, unitType, userPhone) {
  try {
    const url = PROJECTS[projectId].brochure[unitType] + encodeURIComponent(userPhone);
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error("❌ Error fetching brochure link:", error);
    return null;
  }
}

// Add user to Google Sheet
async function logUserToSheet(phone, username) {
  try {
    await fetch(`${SHEET_WEBHOOK_URL}?phone=${encodeURIComponent(phone)}&username=${encodeURIComponent(username)}`);
    console.log(`📄 User logged: ${phone} - ${username}`);
  } catch (error) {
    console.error("❌ Error logging user:", error);
  }
}

// IST greeting
function getGreeting() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const hourIST = (utcHour + 5 + Math.floor((utcMinute + 30) / 60)) % 24;
  if (hourIST < 12) return "Good morning";
  if (hourIST < 17) return "Good afternoon";
  return "Good evening";
}

// Webhook receiver
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const change = body.entry?.[0]?.changes?.[0];
  if (!change?.value?.messages) return res.sendStatus(200);

  const messages = change.value.messages;
  const contacts = change.value.contacts;

  for (const msg of messages) {
    const from = msg.from;
    const userName = contacts?.[0]?.profile?.name || "User";
    const text = msg.text?.body?.trim() || "";

    console.log(`📩 Message from ${from} (${userName}): ${text}`);

    // Log user details to Google Sheets
    await logUserToSheet(from, userName);

    if (!sessions[from]) sessions[from] = { step: 1 };
    const step = sessions[from].step;

    if (step === 1) {
      const greeting = getGreeting();
      await sendText(
        from,
        `Hi ${userName}! 👋 ${greeting}!\nWelcome to Abode Constructions.\nHow may I help you today?\n1️⃣ Know about projects\n2️⃣ Contact details\n3️⃣ Download brochures`
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
          "📞 +91-8008312211\n📧 abodegroups3@gmail.com\n🌐 https://abodegroups.com/\nBook a visit: https://abodegroups.com/contact-us/"
        );
        sessions[from].step = 1;
      } else if (reply === "3" || reply.includes("brochure")) {
        await sendText(from, "📄 Downloading brochures...");
        for (const projectId of ["1", "2"]) {
          for (const type of ["2BHK", "3BHK"]) {
            const link = await getSecureBrochureLink(projectId, type, from);
            await sendDocument(from, link, `${PROJECTS[projectId].name}_${type}.pdf`);
          }
        }
        sessions[from].step = 1;
      } else {
        await sendText(from, "❗ Please reply with 1, 2, or 3 only.");
      }
    } else if (step === 3) {
      if (text === "1") {
        await sendText(from, PROJECTS["1"].details);
        await sendDocument(from, await getSecureBrochureLink("1", "2BHK", from), "AbodeAravindham_2BHK.pdf");
        await sendDocument(from, await getSecureBrochureLink("1", "3BHK", from), "AbodeAravindham_3BHK.pdf");
        sessions[from].step = 1;
      } else if (text === "2") {
        await sendText(from, PROJECTS["2"].details);
        await sendDocument(from, await getSecureBrochureLink("2", "2BHK", from), "MJLakeview_2BHK.pdf");
        await sendDocument(from, await getSecureBrochureLink("2", "3BHK", from), "MJLakeview_3BHK.pdf");
        sessions[from].step = 1;
      } else {
        await sendText(from, "❗ Reply with 1 or 2 to get project details.");
      }
    }
  }

  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => console.log(`✅ Webhook server running on port ${PORT}`));
