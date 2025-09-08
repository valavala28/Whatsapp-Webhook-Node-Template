/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WhatsApp Cloud API credentials
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPYTTbCZCrJMVNBirLficTg0dCVtrJvFFnjuyVsxLCbMG5iNZAnFa5IRbiXo011rMOYc7BjyFW2wZAU3G0ZCf5pGaQe1oQdnfZC9P7ZAofdN9Kmpmko8ehthbuB8D9aGiSSK3Ii6V2HGXeC2Ia7Q4yZAQnj2ILie70mJhFhScyAWg63xHCXdMtmB9wZDZD";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKwi4iXPptEb3uJuOcybGf41_zYu69VqPmDYNh8qi1RyMJfv2isgxaZfHh788Cfka78g/exec";

/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Cloud API credentials
const PHONE_ID = process.env.PHONE_ID; // e.g. "1234567890"
const TOKEN = process.env.WHATSAPP_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// In-memory sessions
const sessions = {};

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


// Send plain WhatsApp message
async function sendText(to, message) {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    console.log("✅ Sent message:", message);
    return res.data.messages[0].id;
  } catch (err) {
    console.error("❌ Error sending message:", err.response?.data || err.message);
    return "";
  }
}

// Log actions into Google Sheet
async function logAction(phone, name, action, details = "", messageId = "", stage = "") {
  try {
    const timestamp = new Date().toISOString();
    await axios.post(GOOGLE_SCRIPT_URL, {
      Timestamp: timestamp,
      UserPhone: phone,
      CustomerName: name,
      Action: action,
      Details: details,
      MessageId: messageId,
      Stage: stage,
    });
    console.log("✅ Logged action:", { phone, action, stage });
  } catch (err) {
    console.error("❌ Failed to log action:", err.message);
  }
}

// Example project data
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

📍 Location: Tellapur  ( Abode Aravindam  https://maps.app.goo.gl/X7zC73xRM1SDnXuh8?g_st=aw )
📐 Property Area: 5.27 Acres
🆔 RERA No: P01100005069
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+9 | 567 Flats | 2 & 3 BHK
💰 Starting From: ₹92 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1KybOwrMM5-jmx-sJY3b-ij6SuqsG_-OU/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1KybOwrMM5-jmx-sJY3b-ij6SuqsG_-OU/view?usp=sharing",
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

📍 Location: Ameenpur ( MJ LAKE VIEW HEIGHTS https://share.google/oh3T5yEoGSl0ymT7R )
📐 Property Area: 1.5 Acres
🆔 RERA No: P01100009015
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+10 | 174 Flats | 2 & 3 BHK
💰 Starting From: ₹82 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing",
      "3BHK": "https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing",
    },
  },
   "3": {
    name: "MJ Lakeview  – Ameenpur",
      details: `📍 Location: Ameenpur ( MJ LAKE VIEW HEIGHTS https://share.google/oh3T5yEoGSl0ymT7R )`,
      brochure: {
      "2BHK": "https://drive.google.com/file/d/1mjh4WBYZN75NQNtL8zNRvALu_6rC8myb/view?usp=drivesdk",
      "3BHK": "https://drive.google.com/file/d/1mjh4WBYZN75NQNtL8zNRvALu_6rC8myb/view?usp=drivesdk",
    },
    },
};


// Webhook (POST)
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!entry) return res.sendStatus(200);

    const from = entry.from;
    const name = entry.profile?.name || "Customer";
    const rawText = entry.text?.body?.trim() || "";
    const text = rawText.toLowerCase();
    const messageId = entry.id;

    if (!sessions[from]) sessions[from] = { stage: "main" };
    const userSession = sessions[from];

    // Start flow
    if (text === "hi" || text === "hello" || text === "menu") {
      const msg = `${getGreeting()} ${name}! ✨\nWelcome to Abode Constructions.🏡\n\nSelect an option 👇\n1️⃣ View Projects\n2️⃣ Talk to Expert\n3️⃣ Download Brochure\n4️⃣ Book a Site Visit\n\nPlease reply with 1, 2, 3, or 4`;
      const id = await sendText(from, msg);
      userSession.stage = "main";
      await logAction(from, name, "Start Flow", "Main menu sent", id, "main");
      return res.sendStatus(200);
    }

    // Main Menu
    if (userSession.stage === "main") {
      if (["1", "2", "3", "4"].includes(text)) {
        if (text === "1") {
          const msg = `Available Projects:\n1️⃣ ${PROJECTS["1"].name}\n2️⃣ ${PROJECTS["2"].name}\n3️⃣ ${PROJECTS["3"].name}`;
          const id = await sendText(from, msg);
          userSession.stage = "project_selection";
          await logAction(from, name, "Viewed Projects", "List of projects displayed", id, "project_selection");
        } else if (text === "2") {
          const id = await sendText(from, "📞 Call us: +91-8008312211\n📧 Email: abodegroups3@gmail.com\n🌐 Website: https://abodegroups.com");
          await logAction(from, name, "Talked to Expert", "Expert contact shared", id, "main");
        } else if (text === "3") {
          const msg = `📄 Brochure Links:\n\n${Object.entries(PROJECTS)
            .map(([_, p]) => `${p.name}:\n\n2BHK\n${p.brochure["2BHK"]}\n\n3BHK\n${p.brochure["3BHK"]}`)
            .join("\n\n")}`;
          const id = await sendText(from, msg);
          await logAction(from, name, "Downloaded Brochure", "All brochures sent", id, "main");
        } else if (text === "4") {
          const id = await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
          await logAction(from, name, "Booked Site Visit", "Site visit link shared", id, "main");
        }
      } else {
        const id = await sendText(from, `✅ Hi ${name}, we received your query: "${rawText}". Our team will get back to you shortly!`);
        await logAction(from, name, "Custom Query", rawText, id, "main");
      }
    }

    // Project Selection
    else if (userSession.stage === "project_selection") {
      if (["1", "2", "3"].includes(text)) {
        const project = PROJECTS[text];
        const msg = `${project.details}\n\nWould you like to:\n1️⃣ Talk to Expert\n2️⃣ Book a Site Visit\n3️⃣ Download Brochure`;
        const id = await sendText(from, msg);
        userSession.stage = "project_details";
        userSession.selectedProject = text;
        await logAction(from, name, "Viewed Project Details", project.name, id, "project_details");
      } else {
        await sendText(from, "❌ Invalid option. Please reply with 1, 2, or 3.");
      }
    }

    // Project Details
    else if (userSession.stage === "project_details") {
      const project = PROJECTS[userSession.selectedProject];
      if (text === "1") {
        const id = await sendText(from, "📞 Call us: +91-8008312211");
        await logAction(from, name, "Talked to Expert", `Expert contact for ${project.name}`, id, "project_details");
        delete sessions[from];
      } else if (text === "2") {
        const id = await sendText(from, "🗓 Book your site visit here: https://abodegroups.com/contact-us/");
        await logAction(from, name, "Booked Site Visit", `Site visit for ${project.name}`, id, "project_details");
        delete sessions[from];
      } else if (text === "3") {
        const msg = `📄 Brochure Links:\n\n2BHK\n${project.brochure["2BHK"]}\n\n3BHK\n${project.brochure["3BHK"]}`;
        const id = await sendText(from, msg);
        await logAction(from, name, "Downloaded Brochure", `Project: ${project.name}`, id, "project_details");
        delete sessions[from];
      } else {
        await sendText(from, "❌ Invalid choice. Please reply with 1, 2, or 3.");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

// Test endpoint (manual send)
app.get("/send", async (req, res) => {
  const { phone, message } = req.query;
  if (!phone || !message) return res.status(400).send("Missing phone or message");
  const id = await sendText(phone, message);
  res.send(`✅ Message sent with id: ${id}`);
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));*/


//Main code
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WhatsApp Cloud API credentials (hardcoded as requested)
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPYTTbCZCrJMVNBirLficTg0dCVtrJvFFnjuyVsxLCbMG5iNZAnFa5IRbiXo011rMOYc7BjyFW2wZAU3G0ZCf5pGaQe1oQdnfZC9P7ZAofdN9Kmpmko8ehthbuB8D9aGiSSK3Ii6V2HGXeC2Ia7Q4yZAQnj2ILie70mJhFhScyAWg63xHCXdMtmB9wZDZD";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKwi4iXPptEb3uJuOcybGf41_zYu69VqPmDYNh8qi1RyMJfv2isgxaZfHh788Cfka78g/exec";

// -------------------- Send Template proactively --------------------
async function sendTemplate(to, name = "Customer") {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };

    await axios.post(
      `https://graph.facebook.com/v23.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "initial_template", // approved template
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: name }],
            },
          ],
        },
      },
      { headers }
    );

    console.log(`✅ Template sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send template:", err.response?.data || err.message);
  }
}

// Trigger proactive template sending
app.get("/send", async (req, res) => {
  const { phone, name } = req.query;

  if (!phone) {
    return res
      .status(400)
      .send("❌ Phone number is required. Example: /send?phone=918897019101&name=Rajeswari");
  }

  await sendTemplate(phone, name || "Customer");
  res.send(`✅ Template sent to ${phone}`);
});

// -------------------- EXISTING FLOW BELOW --------------------

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

📍 Location: Tellapur  ( Abode Aravindam  https://maps.app.goo.gl/X7zC73xRM1SDnXuh8?g_st=aw )
📐 Property Area: 5.27 Acres
🆔 RERA No: P01100005069
🏘 Property Type: Premium Gated Community
🏢 Floors & Units: G+9 | 567 Flats | 2 & 3 BHK
💰 Starting From: ₹92 Lakhs Onwards`,
    brochure: {
      "2BHK": "https://bit.ly/3I4xOLr",
      "3BHK": "https://bit.ly/3I4xOLr",
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

📍 Location: Ameenpur ( MJ LAKE VIEW HEIGHTS https://share.google/oh3T5yEoGSl0ymT7R )
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
      `https://graph.facebook.com/v23.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers }
    );
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

/*Utility: Log interactions to Google Sheet
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
}*/

// Log actions into Google Sheet
async function logAction(phone, name, action, details = "", messageId = "", stage = "") {
  try {
    const timestamp = new Date().toISOString();
    await axios.post(GOOGLE_SCRIPT_URL, {
      Timestamp: timestamp,
      UserPhone: phone,
      CustomerName: name,
      Action: action,
      Details: details,
      MessageId: messageId,
      Stage: stage,
    });
    console.log("✅ Logged action:", { phone, action, stage });
  } catch (err) {
    console.error("❌ Failed to log action:", err.message);
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

  if (session.timer) clearTimeout(session.timer);

  session.timer = setTimeout(async () => {
    const s = sessions[phone];
    if (!s || s.hasThanked) return;

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
    const name = contact?.profile?.name || "Customer";

    // ✅ Handle button clicks from template
    const buttonPayload = msg.button?.payload || msg.interactive?.button_reply?.id;
    if (buttonPayload) {
      console.log("🔘 Button clicked:", buttonPayload);
      if (buttonPayload.toLowerCase().includes("site")) {
        await sendText(from, "🗓 Thanks for booking a site visit! Our team will contact you soon.");
        await logAction(from, name, "Booked Site Visit", "Clicked template button");
      } else if (buttonPayload.toLowerCase().includes("visit")) {
        await sendText(from, "🌐 Thanks for visiting our website!");
        await logAction(from, name, "Visited Website", "Clicked template button");
      } else if (buttonPayload.toLowerCase().includes("call")) {
        await sendText(from, "📞 Please call us at +91-8008312211 for assistance.");
        await logAction(from, name, "Clicked Call Button", "Template button call");
      }
      return res.sendStatus(200);
    }

    // ✅ Handle text messages (existing flow)
    const rawText = msg.text?.body?.trim() || "";
    const text = interpretInput(rawText);

    if (!sessions[from]) {
      sessions[from] = { name, stage: "main", hasThanked: false, timer: null, lastMessageId: messageId };
      sendMainMenu(from, name);
      await logAction(from, name, "Started Chat");
      return res.sendStatus(200);
    }

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

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
