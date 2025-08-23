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
// On Node 18+ fetch is global. If you are on older Node, uncomment next line and install:
// const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-AyqeNJqTaWWQUrOlGoN42vt4wFon9WugZlQUHgjdX5Hl0Hk_XqZH1sV_CZHPSpKw/exec";

// Sessions
const sessions = {};

// Project display names
const PROJECTS = {
  "1": { name: "Abode Aravindam – Tellapur" },
  "2": { name: "MJ Lakeview Heights – Ameenpur" },
};

// Mapping to the Apps Script FILE_MAP keys
const PROJECT_KEYS = {
  "1": { "2BHK": "AbodeAravindham2BHK", "3BHK": "AbodeAravindham3BHK" },
  "2": { "2BHK": "MJLakeview2BHK",      "3BHK": "MJLakeview3BHK" }
};

app.use(bodyParser.json());

// Root
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

// Webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "Abode@14";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) res.status(200).send(challenge);
  else res.sendStatus(403);
});

// WhatsApp helpers
async function sendText(to, text) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  const data = await res.json();
  if (!res.ok) console.error("❌ Failed to send text:", data);
  else console.log(`✅ Sent text to ${to}`);
}

async function sendDocument(to, pdfLink, filename) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: pdfLink, filename }
    }),
  });
  const data = await res.json();
  if (!res.ok) console.error("❌ Failed to send document:", data);
  else console.log(`✅ Sent document to ${to}`);
}

async function getSecureBrochureLink(projectId, unitType, phone, username) {
  try {
    const projectKey = PROJECT_KEYS[projectId]?.[unitType];
    if (!projectKey) throw new Error(`Unknown project/unit: ${projectId} ${unitType}`);

    const url = `${APPS_SCRIPT_URL}?project=${encodeURIComponent(projectKey)}&phone=${encodeURIComponent(phone)}&username=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    const link = await res.text();

    if (!link.startsWith("http")) {
      throw new Error(`Apps Script returned non-URL: ${link}`);
    }
    return link;
  } catch (err) {
    console.error("❌ Error fetching secure brochure link:", err);
    return null;
  }
}

// Greeting (IST)
function getGreeting() {
  const now = new Date();
  const hourIST = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  if (hourIST < 12) return "Good morning";
  if (hourIST < 17) return "Good afternoon";
  return "Good evening";
}

// Webhook (messages)
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const val = body.entry?.[0]?.changes?.[0]?.value;
  const messages = val?.messages;
  const contacts = val?.contacts;
  if (!messages) return res.sendStatus(200);

  for (const msg of messages) {
    const from = msg.from;
    const userName = contacts?.[0]?.profile?.name || "User";
    const text = msg.text?.body?.trim() || "";

    console.log(`📩 Message from ${from} (${userName}): ${text}`);

    if (!sessions[from]) sessions[from] = { step: 1 };
    const step = sessions[from].step;

    if (step === 1) {
      await sendText(from,
        `Hi ${userName}! 👋 ${getGreeting()}!\nWelcome to Abode Constructions.\n` +
        `1️⃣ Projects\n2️⃣ Contact\n3️⃣ Brochures`
      );
      sessions[from].step = 2;

    } else if (step === 2) {
      const t = text.toLowerCase();
      if (t === "1" || t.includes("project")) {
        await sendText(from, "Please choose a project:\n1️⃣ Abode Aravindam\n2️⃣ MJ Lakeview Heights");
        sessions[from].step = 3;

      } else if (t === "2" || t.includes("contact")) {
        await sendText(from, "📞 +91-8008312211\n📧 abodegroups3@gmail.com\n🌐 https://abodegroups.com/");
        sessions[from].step = 1;

      } else if (t === "3" || t.includes("brochure")) {
        await sendText(from, "📄 Sending brochures...");
        for (const pid of ["1", "2"]) {
          for (const type of ["2BHK", "3BHK"]) {
            const link = await getSecureBrochureLink(pid, type, from, userName);
            if (link) {
              const fname = `${PROJECTS[pid].name.replace(/ – .*$/, "").replace(/\s+/g, "")}_${type}.pdf`;
              await sendDocument(from, link, fname);
            }
          }
        }
        sessions[from].step = 1;

      } else {
        await sendText(from, "❗ Reply with 1, 2, or 3 only.");
      }

    } else if (step === 3) {
      if (text === "1") {
        await sendText(from, PROJECTS["1"].name);
        for (const type of ["2BHK", "3BHK"]) {
          const link = await getSecureBrochureLink("1", type, from, userName);
          if (link) await sendDocument(from, link, `AbodeAravindham_${type}.pdf`);
        }
        sessions[from].step = 1;

      } else if (text === "2") {
        await sendText(from, PROJECTS["2"].name);
        for (const type of ["2BHK", "3BHK"]) {
          const link = await getSecureBrochureLink("2", type, from, userName);
          if (link) await sendDocument(from, link, `MJLakeview_${type}.pdf`);
        }
        sessions[from].step = 1;

      } else {
        await sendText(from, "❗ Reply with 1 or 2 to select a project.");
      }
    }
  }

  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => console.log(`✅ WhatsApp Webhook running on port ${PORT}`));
