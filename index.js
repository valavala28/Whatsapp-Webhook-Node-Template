/*const express = require("express");
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
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZcJsVIaUQ0Fx9dBEHbiN-YUaI4XkU1iLPGfDVrJgKyNkOSN9iMV40aIW6Aolbj4PMxQ/exec";

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

// Utility: Send WhatsApp text (supports optional idempotency key)
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

// Utility: Log interactions
async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      timestamp: new Date().toLocaleString("en-US", { hour12: true, timeZone: "Asia/Kolkata" }),
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action}`);
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

// Reset inactivity timer with thank-you message (fixed to avoid duplicates)
function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };

  const session = sessions[phone];

  // If already thanked for this session, do not set a new timer
  if (session.hasThanked) return;

  // Clear any existing timer
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  // Set new 2-minute timer
  session.timer = setTimeout(async () => {
    // re-check existence and flag to avoid races
    const s = sessions[phone];
    if (!s) return;
    if (s.hasThanked) return;

    // mark as thanked immediately to prevent concurrent timers from sending duplicates
    s.hasThanked = true;

    // create idempotency key from lastMessageId if available
    const idemKey = s.lastMessageId ? `ty-${phone}-${s.lastMessageId}` : `ty-${phone}-${Date.now()}`;

    try {
      await sendText(phone, `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`, {
        idempotencyKey: idemKey,
      });
      console.log(`✅ Sent thank-you message to ${phone}`);
    } catch (err) {
      console.error("❌ Error sending thank-you:", err?.message || err);
    } finally {
      // cleanup
      if (s.timer) {
        clearTimeout(s.timer);
        s.timer = null;
      }
      // delete session so next conversation starts fresh
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
    const text = interpretInput(rawText); // <-- use normalized input everywhere
    const name = contact?.profile?.name || "Customer";

    // Start session
    if (!sessions[from]) {
      // create session with lastMessageId to help idempotency for thank-you
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name);
      await logAction(from, name, "Started Chat");
      return res.sendStatus(200);
    }

    // update lastMessageId for idempotency and reset timer
    sessions[from].lastMessageId = messageId;
    resetTimer(from, name);
    const userSession = sessions[from];

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name);
      return res.sendStatus(200);
    }

    // Menu navigation
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          await sendText(from, `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`);
          userSession.stage = "project_selection";
        } else if (text === "2") {
          await sendText(from, "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com");
        } else if (text === "3") {
          await sendText(
            from,
            `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
              .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
              .join("\n\n")}`
          );
        } else if (text === "4") {
          await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
        }
      } else {
        // reply to any non-menu text with confirmation (and log original rawText)
        await sendText(from, `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`);
        await logAction(from, name, "Custom Query", rawText);
      }
    } else if (userSession.stage === "project_selection") {
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
    } else if (userSession.stage === "project_details") {
      if (text === "1") {
        await sendText(from, "📞 Call us: +91-8008312211");
        delete sessions[from];
      } else if (text === "2") {
        await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
        delete sessions[from];
      } else if (text === "3") {
        const project = PROJECTS[userSession.selectedProject];
        await sendText(from, `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`);
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

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/





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
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZcJsVIaUQ0Fx9dBEHbiN-YUaI4XkU1iLPGfDVrJgKyNkOSN9iMV40aIW6Aolbj4PMxQ/exec";

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

// Sessions and message tracking
const sessions = {};
const processedMessages = new Set();

// Utility: Send WhatsApp text
async function sendText(to, text, opts = {}) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (opts.idempotencyKey) {
      headers["X-Idempotency-Key"] = opts.idempotencyKey;
    }
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

// Utility: Log interactions
async function logAction(phone, name, action, details = "") {
  try {
    if (!GOOGLE_SCRIPT_URL) return;
    await axios.post(GOOGLE_SCRIPT_URL, {
      timestamp: new Date().toLocaleString("en-US", { hour12: true, timeZone: "Asia/Kolkata" }),
      userPhone: phone,
      customerName: name,
      action,
      details,
    });
    console.log(`✅ Logged: ${action}`);
  } catch (error) {
    console.error("❌ Logging failed:", error.response?.data || error.message);
  }
}

// Greeting based on IST
function getGreeting() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// Reset inactivity timer (sends thank-you ONCE)
function resetTimer(phone, name) {
  if (!sessions[phone]) sessions[phone] = { name, hasThanked: false, timer: null, lastMessageId: null };

  const session = sessions[phone];

  if (session.hasThanked) return;

  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  session.timer = setTimeout(async () => {
    if (session.hasThanked) return;

    session.hasThanked = true;

    const idemKey = session.lastMessageId
      ? `ty-${phone}-${session.lastMessageId}`
      : `ty-${phone}-${Date.now()}`;

    await sendText(
      phone,
      `🙏 Thank you ${name} for connecting with Abode Constructions. Have a great day! ✨`,
      { idempotencyKey: idemKey }
    );

    console.log(`✅ Sent thank-you message to ${phone}`);

    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = null;
    }
    delete sessions[phone];
  }, 2 * 60 * 1000);
}

// Send main menu
function sendMainMenu(to, name) {
  sendText(
    to,
    `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`
  );
}

// Normalize input
function interpretInput(input) {
  const t = (input || "").toLowerCase().trim();
  if (["1", "projects", "project", "view projects"].includes(t)) return "1";
  if (["2", "expert", "talk", "call", "talk to expert"].includes(t)) return "2";
  if (["3", "brochure", "pdf", "download", "download brochure"].includes(t)) return "3";
  if (["4", "visit", "site", "book", "book a site visit"].includes(t)) return "4";
  return t;
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
    let text = msg.text?.body?.trim().toLowerCase() || "";
    const name = contact?.profile?.name || "Customer";

    // Start session
    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name);
      await logAction(from, name, "Started Chat");
      return res.sendStatus(200);
    }

    sessions[from].lastMessageId = messageId;

    resetTimer(from, name);
    const userSession = sessions[from];

    text = interpretInput(text);

    if (text === "menu") {
      userSession.stage = "main";
      sendMainMenu(from, name);
      return res.sendStatus(200);
    }

    if (userSession.stage === "main") {
      if (text === "1") {
        await sendText(from, `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}`);
        userSession.stage = "project_selection";
      } else if (text === "2") {
        await sendText(from, "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com");
      } else if (text === "3") {
        await sendText(
          from,
          `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
            .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
            .join("\n\n")}`
        );
      } else if (text === "4") {
        await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
      } else {
        await sendText(from, "❓ Invalid input. Please type a number (1-4) or 'menu'.");
      }
    }

    else if (userSession.stage === "project_selection") {
      if (text === "1" || text === "2") {
        const project = PROJECTS[text];
        await sendText(
          from,
          `${project.details}\n\nWould you like to:\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit`
        );
        userSession.stage = "project_details";
        userSession.selectedProject = text;
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1 or 2.");
      }
    }

    else if (userSession.stage === "project_details") {
      if (text === "2") {
        await sendText(from, "📞 Call us: +91-8008312211");
        delete sessions[from];
      } else if (text === "4") {
        await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
        delete sessions[from];
      } else if (text === "3") {
        const project = PROJECTS[userSession.selectedProject];
        await sendText(
          from,
          `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`
        );
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 2, 3, or 4.");
      }
    }

    await logAction(from, name, "Message", text);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));*/

