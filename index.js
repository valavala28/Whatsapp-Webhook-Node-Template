const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKwi4iXPptEb3uJuOcybGf41_zYu69VqPmDYNh8qi1RyMJfv2isgxaZfHh788Cfka78g/exec";

// Project data
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
      "2BHK": "https://bit.ly/3JBumIL",
      "3BHK": "https://bit.ly/4fUZxL0",
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
      "2BHK": "https://bit.ly/4lMCkMg",
      "3BHK": "https://bit.ly/45TCVWN",
    },
  },
};

// Session and message tracking
const sessions = {};
const processedMessages = new Set();

// Utility: Normalize input
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
}

// Utility: Send WhatsApp text
async function sendText(to, text, opts = {}) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

    await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

// Utility: Log interactions to Google Sheet
async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action} - ${details}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message);
  }
}

// Utility: Greeting based on IST
function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// Reset inactivity timer with thank-you message
function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };

  const session = sessions[phone];

  if (session.hasThanked) return;

  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s) return;
    if (s.hasThanked) return;

    s.hasThanked = true;
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;

    try {
      await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
        idempotencyKey: idemKey,
      });
      console.log(`✅ Sent thank-you message to ${phone}`);
    } catch (err) {
      console.error("❌ Error sending thank-you:", err?.message || err);
    } finally {
      if (s.timer) clearTimeout(s.timer);
      delete sessions[phone];
    }
  }, 2 * 60 * 1000);
}

// Send main menu
function sendMainMenu(to, name) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`
  );
}

// Routes
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

// Webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "Abode@14";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Webhook handler
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];

    if (!msg) return res.sendStatus(200);

    const messageId = msg.id;
    if (processedMessages.has(messageId)) {
      console.log(`⚠️ Duplicate message ignored: ${messageId}`);
      return res.sendStatus(200);
    }
    processedMessages.add(messageId);

    const from = msg.from;
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);
    const name = contact?.profile?.name || "Customer";

    // Start session
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name);
      await logAction(from, name, "Started Chat");
      return res.sendStatus(200);
    }

    // Update lastMessageId and reset timer
    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name);
      return res.sendStatus(200);
    }

    // Main Menu
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(from, `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`);
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed");
        } else if (text === "2") {
          await sendText(from, "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com");
          await logAction(from, name, "Talked to Expert", "User requested expert contact");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`
          );
          await logAction(from, name, "Downloaded Brochure", "All project brochures sent");
        } else if (text === "4") {
          await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
          await logAction(from, name, "Booked Site Visit", "Site visit link shared");
        }
      } else {
        await sendText(from, `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`);
        await logAction(from, name, "Custom Query", rawText);
      }
    }
    // Project selection stage
    else if (userSession.stage === "project_selection") {
      if (["1", "2"].includes(text)) {
        const project = PROJECTS[text];
        await sendText(
          from,
          `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`
        );
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.");
      }
    }
    // Project details stage
    else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211");
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`);
        delete sessions[from];
      } else if (text === "2") {
        await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`);
        delete sessions[from];
      } else if (text === "3") {
        await sendText(from, `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`);
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}, Brochure sent`);
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.");
      }
    }

    await logAction(from, name, "Message", rawText);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));



/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔑 WhatsApp Cloud API credentials from .env
const PHONE_ID = process.env.PHONE_ID;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// 🗄️ DB connection (from .env)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "whatsapp_inbox",
});

// Project data (same as yours)
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
      "2BHK": "https://bit.ly/3JBumIL",
      "3BHK": "https://bit.ly/4fUZxL0",
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
      "2BHK": "https://bit.ly/4lMCkMg",
      "3BHK": "https://bit.ly/45TCVWN",
    },
  },
};

// Session tracking
const sessions = {};

// --------- UTILITIES ----------
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
}

async function sendText(to, text, opts = {}, conversationId = null) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );

    console.log(`✅ Message sent to ${to}`);

    // Save outbound message in DB
    if (conversationId) {
      const waMessageId = response.data?.messages?.[0]?.id || null;
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'outbound', 'text', ?, NOW())`,
        [conversationId, waMessageId, text]
      );
    }
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action} - ${details}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message);
  }
}

function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };
  const session = sessions[phone];
  if (session.hasThanked) return;
  if (session.timer) clearTimeout(session.timer);

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s || s.hasThanked) return;

    s.hasThanked = true;
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;

    await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
      idempotencyKey: idemKey,
    });
    console.log(`✅ Sent thank-you message to ${phone}`);
    delete sessions[phone];
  }, 2 * 60 * 1000);
}

function sendMainMenu(to, name, conversationId) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`,
    {},
    conversationId
  );
}

// --------- ROUTES ----------
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "Abode@14"; // must match your Meta App setting
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// -------- Main webhook --------
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];

    if (!msg) return res.sendStatus(200);

    const messageId = msg.id;
    const from = msg.from;
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);
    const name = contact?.profile?.name || "Customer";
    const waTimestamp = new Date(msg.timestamp * 1000);

    // -------- DB Conversation --------
    let [conv] = await db.query(
      `SELECT id FROM conversations WHERE customer_number = ? AND channel = 'whatsapp' LIMIT 1`,
      [from]
    );
    let conversationId;
    if (!conv.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (customer_number, customer_name, channel, last_message_at) 
         VALUES (?, ?, 'whatsapp', ?)`,
        [from, name, waTimestamp]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conv[0].id;
      await db.query(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [waTimestamp, conversationId]);
    }

    // -------- Save inbound message (dedupe via DB UNIQUE KEY) --------
    try {
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'inbound', 'text', ?, FROM_UNIXTIME(?))`,
        [conversationId, messageId, rawText, msg.timestamp]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log("⚠️ Duplicate message ignored:", messageId);
      } else {
        console.error("❌ DB insert error:", err);
      }
      return res.sendStatus(200);
    }

    // -------- Your Existing Flow --------
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name, conversationId);
      await logAction(from, name, "Started Chat");
      return res.sendStatus(200);
    }

    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name, conversationId);
      return res.sendStatus(200);
    }

    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(
            from,
            `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`,
            {},
            conversationId
          );
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed");
        } else if (text === "2") {
          await sendText(
            from,
            "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com",
            {},
            conversationId
          );
          await logAction(from, name, "Talked to Expert", "User requested expert contact");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`,
            {},
            conversationId
          );
          await logAction(from, name, "Downloaded Brochure", "All project brochures sent");
        } else if (text === "4") {
          await sendText(
            from,
            "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
            {},
            conversationId
          );
          await logAction(from, name, "Booked Site Visit", "Site visit link shared");
        }
      } else {
        await sendText(
          from,
          `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`,
          {},
          conversationId
        );
        await logAction(from, name, "Custom Query", rawText);
      }
    } else if (userSession.stage === "project_selection") {
      if (["1", "2"].includes(text)) {
        const project = PROJECTS[text];
        await sendText(
          from,
          `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`,
          {},
          conversationId
        );
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.", {}, conversationId);
      }
    } else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211", {}, conversationId);
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`);
        delete sessions[from];
      } else if (text === "2") {
        await sendText(
          from,
          "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
          {},
          conversationId
        );
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`);
        delete sessions[from];
      } else if (text === "3") {
        await sendText(
          from,
          `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`,
          {},
          conversationId
        );
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}, Brochure sent`);
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.", {}, conversationId);
      }
    }

    await logAction(from, name, "Message", rawText);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/



/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔑 WhatsApp Cloud API credentials from .env
const PHONE_ID = process.env.PHONE_ID;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// 🗄️ DB connection (from .env)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "whatsapp_inbox",
});

// ---------------- PROJECTS DATA (unchanged) ----------------
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
      "2BHK": "https://bit.ly/3JBumIL",
      "3BHK": "https://bit.ly/4fUZxL0",
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
      "2BHK": "https://bit.ly/4lMCkMg",
      "3BHK": "https://bit.ly/45TCVWN",
    },
  },
};

// Session tracking
const sessions = {};

// ---------------- UTILITIES ----------------
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
}

async function sendText(to, text, opts = {}, conversationId = null) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );

    console.log(`✅ Message sent to ${to}`);

    // Save outbound message in DB
    if (conversationId) {
      const waMessageId = response.data?.messages?.[0]?.id || null;
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'outbound', 'text', ?, NOW())`,
        [conversationId, waMessageId, text]
      );
    }
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action} - ${details}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message);
  }
}

function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };
  const session = sessions[phone];
  if (session.hasThanked) return;
  if (session.timer) clearTimeout(session.timer);

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s || s.hasThanked) return;

    s.hasThanked = true;
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;

    await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
      idempotencyKey: idemKey,
    });
    console.log(`✅ Sent thank-you message to ${phone}`);
    delete sessions[phone];
  }, 2 * 60 * 1000);
}

function sendMainMenu(to, name, conversationId) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`,
    {},
    conversationId
  );
}

// ---------------- ROUTES ----------------
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

// ✅ Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ✅ Main webhook handler
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // <-- always ACK first to avoid retries

  try {
    const body = req.body;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];
    if (!msg) return;

    const messageId = msg.id;
    const from = msg.from;
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);
    const name = contact?.profile?.name || "Customer";
    const waTimestamp = new Date(msg.timestamp * 1000);

    // Conversation handling
    let [conv] = await db.query(
      `SELECT id FROM conversations WHERE customer_number = ? AND channel = 'whatsapp' LIMIT 1`,
      [from]
    );
    let conversationId;
    if (!conv.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (customer_number, customer_name, channel, last_message_at) 
         VALUES (?, ?, 'whatsapp', ?)`,
        [from, name, waTimestamp]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conv[0].id;
      await db.query(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [waTimestamp, conversationId]);
    }

    // Save inbound message (dedupe-safe)
    try {
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'inbound', 'text', ?, FROM_UNIXTIME(?))`,
        [conversationId, messageId, rawText, msg.timestamp]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log("⚠️ Duplicate message ignored:", messageId);
      } else {
        console.error("❌ DB insert error:", err);
      }
      return;
    }

    // ---------------- YOUR FLOW (unchanged) ----------------
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name, conversationId);
      await logAction(from, name, "Started Chat");
      return;
    }

    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name, conversationId);
      return;
    }

    // main menu flow
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(
            from,
            `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`,
            {},
            conversationId
          );
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed");
        } else if (text === "2") {
          await sendText(
            from,
            "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com",
            {},
            conversationId
          );
          await logAction(from, name, "Talked to Expert", "User requested expert contact");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`,
            {},
            conversationId
          );
          await logAction(from, name, "Downloaded Brochure", "All project brochures sent");
        } else if (text === "4") {
          await sendText(
            from,
            "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
            {},
            conversationId
          );
          await logAction(from, name, "Booked Site Visit", "Site visit link shared");
        }
      } else {
        await sendText(
          from,
          `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`,
          {},
          conversationId
        );
        await logAction(from, name, "Custom Query", rawText);
      }
    }

    // project details flow
    else if (userSession.stage === "project_selection") {
      if (["1", "2"].includes(text)) {
        const project = PROJECTS[text];
        await sendText(
          from,
          `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`,
          {},
          conversationId
        );
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.", {}, conversationId);
      }
    } else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211", {}, conversationId);
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`);
        delete sessions[from];
      } else if (text === "2") {
        await sendText(
          from,
          "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
          {},
          conversationId
        );
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`);
        delete sessions[from];
      } else if (text === "3") {
        await sendText(
          from,
          `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`,
          {},
          conversationId
        );
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}, Brochure sent`);
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.", {}, conversationId);
      }
    }

    await logAction(from, name, "Message", rawText);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/


/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔑 WhatsApp Cloud API credentials
const PHONE_ID = process.env.PHONE_ID;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// 🗄️ MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "whatsapp_inbox",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------------- PROJECTS DATA ----------------
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
      "2BHK": "https://bit.ly/3JBumIL",
      "3BHK": "https://bit.ly/4fUZxL0",
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
      "2BHK": "https://bit.ly/4lMCkMg",
      "3BHK": "https://bit.ly/45TCVWN",
    },
  },
};

// ---------------- SESSION TRACKING ----------------
const sessions = {};

// ---------------- UTILITIES ----------------
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
}

async function sendText(to, text, opts = {}, conversationId = null) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );

    console.log(`✅ Message sent to ${to}`);

    // Save outbound message
    if (conversationId) {
      const waMessageId = response.data?.messages?.[0]?.id || null;
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'outbound', 'text', ?, NOW())`,
        [conversationId, waMessageId, text]
      );
    }
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action} - ${details}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message);
  }
}

function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };
  const session = sessions[phone];
  if (session.hasThanked) return;
  if (session.timer) clearTimeout(session.timer);

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s || s.hasThanked) return;

    s.hasThanked = true;
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;

    await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
      idempotencyKey: idemKey,
    });
    console.log(`✅ Sent thank-you message to ${phone}`);
    delete sessions[phone];
  }, 2 * 60 * 1000);
}

function sendMainMenu(to, name, conversationId) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`,
    {},
    conversationId
  );
}

// ---------------- ROUTES ----------------
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Main webhook
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // ACK immediately to avoid retries

  try {
    const body = req.body;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];
    if (!msg) return;

    const messageId = msg.id;
    const from = msg.from;
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);
    const name = contact?.profile?.name || "Customer";
    const waTimestamp = new Date(msg.timestamp * 1000);

    // ---------------- DB: Conversations ----------------
    let [conv] = await db.query(
      `SELECT id FROM conversations WHERE customer_number = ? AND channel = 'whatsapp' LIMIT 1`,
      [from]
    );
    let conversationId;
    if (!conv.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (customer_number, customer_name, channel, last_message_at) 
         VALUES (?, ?, 'whatsapp', ?)`,
        [from, name, waTimestamp]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conv[0].id;
      await db.query(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [waTimestamp, conversationId]);
    }

    // ---------------- DB: Messages (dedupe-safe) ----------------
    try {
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'inbound', 'text', ?, FROM_UNIXTIME(?))`,
        [conversationId, messageId, rawText, msg.timestamp]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log("⚠️ Duplicate message ignored:", messageId);
      } else {
        console.error("❌ DB insert error:", err);
      }
      return;
    }

    // ---------------- SESSION FLOW ----------------
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name, conversationId);
      await logAction(from, name, "Started Chat");
      return;
    }

    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name, conversationId);
      return;
    }

    // --- Main menu ---
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(
            from,
            `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`,
            {},
            conversationId
          );
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed");
        } else if (text === "2") {
          await sendText(
            from,
            "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com",
            {},
            conversationId
          );
          await logAction(from, name, "Talked to Expert", "User requested expert contact");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n2BHK\n${p.brochure["2BHK"]}\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`,
            {},
            conversationId
          );
          await logAction(from, name, "Downloaded Brochure", "All project brochures sent");
        } else if (text === "4") {
          await sendText(
            from,
            "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
            {},
            conversationId
          );
          await logAction(from, name, "Booked Site Visit", "Site visit link shared");
        }
      } else {
        await sendText(
          from,
          `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`,
          {},
          conversationId
        );
        await logAction(from, name, "Custom Query", rawText);
      }
    }

    // --- Project selection ---
    else if (userSession.stage === "project_selection") {
      if (["1", "2"].includes(text)) {
        const project = PROJECTS[text];
        await sendText(
          from,
          `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`,
          {},
          conversationId
        );
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.", {}, conversationId);
      }
    }

    // --- Project details ---
    else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211", {}, conversationId);
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`);
        delete sessions[from];
      } else if (text === "2") {
        await sendText(
          from,
          "🗓 Book your site visit here: https://abodegroups.com/contact-us/",
          {},
          conversationId
        );
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`);
        delete sessions[from];
      } else if (text === "3") {
        await sendText(
          from,
          `📄 Brochure Links:\n2BHK\n${project.brochure["2BHK"]}\n3BHK\n${project.brochure["3BHK"]}`,
          {},
          conversationId
        );
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}, Brochure sent`);
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.", {}, conversationId);
      }
    }

    await logAction(from, name, "Message", rawText);

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/





/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔑 WhatsApp Cloud API credentials
const PHONE_ID = process.env.PHONE_ID;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// 🗄️ MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "whatsapp_inbox",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------------- PROJECTS DATA ----------------
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
      "2BHK": "https://bit.ly/3JBumIL",
      "3BHK": "https://bit.ly/4fUZxL0",
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
      "2BHK": "https://bit.ly/4lMCkMg",
      "3BHK": "https://bit.ly/45TCVWN",
    },
  },
};

// ---------------- SESSION TRACKING ----------------
const sessions = {};

// ---------------- UTILITIES ----------------
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
}

async function sendText(to, text, opts = {}, conversationId = null) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );

    console.log(`✅ Message sent to ${to}`);

    if (conversationId) {
      const waMessageId = response.data?.messages?.[0]?.id || null;
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'outbound', 'text', ?, NOW())`,
        [conversationId, waMessageId, text]
      );
    }
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message || error);
  }
}

async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action} - ${details}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message || error);
  }
}

function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };
  const session = sessions[phone];
  if (session.hasThanked) return;
  if (session.timer) clearTimeout(session.timer);

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s || s.hasThanked) return;

    s.hasThanked = true;
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;
    await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
      idempotencyKey: idemKey,
    });
    console.log(`✅ Sent thank-you message to ${phone}`);
    delete sessions[phone];
  }, 2 * 60 * 1000);
}

function sendMainMenu(to, name, conversationId) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`,
    {},
    conversationId
  );
}

// ---------------- ROUTES ----------------
app.get("/", (req, res) => res.send("✅ WhatsApp Webhook is live"));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Main webhook handler
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // ACK immediately

  try {
    const body = req.body;

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];

    if (!msg) {
      console.log("⚠️ No message found in webhook payload:", JSON.stringify(body));
      return;
    }

    if (!msg.text?.body) {
      console.log("⚠️ Non-text message received, skipping:", msg.type || "unknown");
      return;
    }

    const messageId = msg.id;
    const from = msg.from;
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);
    const name = contact?.profile?.name || "Customer";
    const waTimestamp = new Date(msg.timestamp * 1000);

    // ---------------- DB: Conversations ----------------
    let [conv] = await db.query(
      `SELECT id FROM conversations WHERE customer_number = ? AND channel = 'whatsapp' LIMIT 1`,
      [from]
    );
    let conversationId;
    if (!conv.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (customer_number, customer_name, channel, last_message_at) 
         VALUES (?, ?, 'whatsapp', ?)`,
        [from, name, waTimestamp]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conv[0].id;
      await db.query(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [waTimestamp, conversationId]);
    }

    // ---------------- DB: Messages (dedupe-safe) ----------------
    try {
      await db.query(
        `INSERT INTO messages (conversation_id, wa_message_id, direction, msg_type, text_body, wa_timestamp) 
         VALUES (?, ?, 'inbound', 'text', ?, FROM_UNIXTIME(?))`,
        [conversationId, messageId, rawText, msg.timestamp]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log("⚠️ Duplicate message ignored:", messageId);
      } else {
        console.error("❌ DB insert error:", err);
      }
      return;
    }

    // ---------------- SESSION FLOW ----------------
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name, conversationId);
      await logAction(from, name, "Started Chat");
      return;
    }

    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name, conversationId);
      return;
    }

    // --- Main menu flow ---
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(from, `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`, {}, conversationId);
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed");
        } else if (text === "2") {
          await sendText(from, "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com", {}, conversationId);
          await logAction(from, name, "Talked to Expert", "User requested expert contact");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n2BHK\n${p.brochure["2BHK"]}\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`,
            {},
            conversationId
          );
          await logAction(from, name, "Downloaded Brochure", "All project brochures sent");
        } else if (text === "4") {
          await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/", {}, conversationId);
          await logAction(from, name, "Booked Site Visit", "Site visit link shared");
        }
      } else {
        await sendText(from, `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`, {}, conversationId);
        await logAction(from, name, "Custom Query", rawText);
      }
    }

    // --- Project selection ---
    else if (userSession.stage === "project_selection") {
      if (["1", "2"].includes(text)) {
        const project = PROJECTS[text];
        await sendText(from, `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`, {}, conversationId);
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.", {}, conversationId);
      }
    }

    // --- Project details ---
    else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211", {}, conversationId);
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`);
        delete sessions[from];
      } else if (text === "2") {
        await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/", {}, conversationId);
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`);
        delete sessions[from];
      } else if (text === "3") {
        await sendText(from, `📄 Brochure Links:\n2BHK\n${project.brochure["2BHK"]}\n3BHK\n${project.brochure["3BHK"]}`, {}, conversationId);
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}, Brochure sent`);
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.", {}, conversationId);
      }
    }

    await logAction(from, name, "Message", rawText);

  } catch (err) {
    console.error("❌ Webhook error:", err); // full error for debugging
  }
});

// ---------------- DEBUG ROUTES ----------------

// ✅ List all conversations
app.get("/debug/conversations", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM conversations ORDER BY last_message_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ✅ List messages for a given conversation_id
app.get("/debug/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ Joined endpoint: conversations + messages
app.get("/debug/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const [[conv]] = await db.query("SELECT * FROM conversations WHERE id = ?", [conversationId]);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const [msgs] = await db.query(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );

    res.json({ conversation: conv, messages: msgs });
  } catch (err) {
    console.error("❌ Error fetching conversation:", err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});


app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/


