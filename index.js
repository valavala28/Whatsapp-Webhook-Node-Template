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
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Apps Script Web App URL (POST endpoint)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx-AyqeNJqTaWWQUrOlGoN42vt4wFon9WugZlQUHgjdX5Hl0Hk_XqZH1sV_CZHPSpKw/exec";

// In-memory session storage
const sessions = {};

// Project info
const PROJECTS = {
  "1": { name: "Abode Aravindam – Tellapur" },
  "2": { name: "MJ Lakeview Heights – Ameenpur" },
};

// Mapping project IDs for API
const PROJECT_KEYS = {
  "1": { "2BHK": "AbodeAravindham2BHK", "3BHK": "AbodeAravindham3BHK" },
  "2": { "2BHK": "MJLakeview2BHK", "3BHK": "MJLakeview3BHK" },
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

// Send WhatsApp text message
async function sendText(to, text) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    console.error("❌ Failed to send text:", await res.json());
  }
}

// Send WhatsApp document
async function sendDocument(to, pdfLink, filename) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: pdfLink, filename },
    }),
  });
  if (!res.ok) {
    console.error("❌ Failed to send document:", await res.json());
  }
}

// Log user action to Google Sheets
async function logUserAction(phone, username, actionType, projectKey = "", pdfId = "", expiryDate = "") {
  try {
    const payload = {
      phoneNumber: phone,
      username,
      projectName: projectKey,
      actionType,
      pdfId,
      expiryDate,
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log(`✅ Logged ${actionType} for ${phone}:`, result);
  } catch (err) {
    console.error(`❌ Failed to log action ${actionType} for ${phone}:`, err);
  }
}

// Fetch secure brochure link
async function getSecureBrochureLink(projectId, unitType, phone, username) {
  try {
    const projectKey = PROJECT_KEYS[projectId]?.[unitType];
    if (!projectKey) throw new Error(`Unknown project/unit: ${projectId} ${unitType}`);

    // Log action first
    await logUserAction(phone, username, "Brochures", projectKey);

    // Generate download link (GET)
    const url = `${APPS_SCRIPT_URL}?project=${encodeURIComponent(projectKey)}&phone=${encodeURIComponent(
      phone
    )}&username=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    const link = await res.text();

    if (!link.startsWith("http")) throw new Error(`Invalid link: ${link}`);
    return link;
  } catch (err) {
    console.error("❌ Error fetching secure brochure link:", err);
    return null;
  }
}

// Greeting based on IST
function getGreeting() {
  const now = new Date();
  const hourIST = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  if (hourIST < 12) return "Good morning";
  if (hourIST < 17) return "Good afternoon";
  return "Good evening";
}

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
  const contacts = body.entry?.[0]?.changes?.[0]?.value?.contacts;
  if (!messages) return res.sendStatus(200);

  for (const msg of messages) {
    const from = msg.from;
    const userName = contacts?.[0]?.profile?.name || "User";
    const text = msg.text?.body?.trim() || "";

    console.log(`📩 Message from ${from} (${userName}): ${text}`);

    if (!sessions[from]) sessions[from] = { step: 1 };
    const step = sessions[from].step;

    // Step 1: Initial greeting
    if (step === 1) {
      await sendText(
        from,
        `Hi ${userName}! 👋 ${getGreeting()}!\nWelcome to Abode Constructions.\n` +
          `1️⃣ Projects\n2️⃣ Contact\n3️⃣ Brochures`
      );
      sessions[from].step = 2;

    // Step 2: User selects an option
    } else if (step === 2) {
      const t = text.toLowerCase();

      if (t === "1" || t.includes("project")) {
        await logUserAction(from, userName, "Projects");
        await sendText(from, "Please choose a project:\n1️⃣ Abode Aravindam\n2️⃣ MJ Lakeview Heights");
        sessions[from].step = 3;

      } else if (t === "2" || t.includes("contact")) {
        await logUserAction(from, userName, "Contact");
        await sendText(
          from,
          "📞 +91-8008312211\n📧 abodegroups3@gmail.com\n🌐 https://abodegroups.com/"
        );
        sessions[from].step = 1;

      } else if (t === "3" || t.includes("brochure")) {
        await logUserAction(from, userName, "Brochures");
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

    // Step 3: User selects a project
    } else if (step === 3) {
      if (text === "1") {
        await logUserAction(from, userName, "Projects", "AbodeAravindham2BHK");
        await sendText(from, PROJECTS["1"].name);
        for (const type of ["2BHK", "3BHK"]) {
          const link = await getSecureBrochureLink("1", type, from, userName);
          if (link) await sendDocument(from, link, `AbodeAravindham_${type}.pdf`);
        }
        sessions[from].step = 1;

      } else if (text === "2") {
        await logUserAction(from, userName, "Projects", "MJLakeview2BHK");
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
