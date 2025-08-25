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
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

// WhatsApp Cloud API
const PHONE_ID = "749224044936223";
const TOKEN = "EAARCCltZBVSgBPJQYNQUkuVrUfVt0rjtNIaZBNVO7C24ZC5b5RO4DJKQOVZC5NWSeiknzZBrDec88QkAYYji7ypvDBgL1GDw3E39upO2TbuW8IfGx94VuH7bJpFKngdyJOjexp6SN6wYEM0Ah6MOERatzhjeth0sHeo8GneT6kyXyaPyHZA94Exe9NKVJZBIisrxAZDZD";

// Google Sheet
const SHEET_ID = '1pZrYjEY16A66s9ZQzFcJVoj4-IVP_CctAK3e8ZlQ6y8';
const SHEET_NAME = 'PDF_SECURITY';

// Greeting based on time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Day";
}

// Log user actions to Google Sheet
async function appendToSheet(data) {
  try {
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is missing");
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [data] },
    });
  } catch (err) {
    console.error('Error appending to sheet:', err.message);
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to, text: { body: message } },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.error('Error sending WhatsApp message:', err.message);
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];

    if (!msg) return res.sendStatus(200); // no messages

    const from = msg.from;
    const name = msg.profile?.name || 'Customer';
    const body = msg.text?.body?.trim().toLowerCase() || '';
    const greeting = getGreeting();
    let reply = '';

    // Initial Greeting for any message
    if (!msg._replied) {
      reply = `Hey ${name}! ✨\nGood ${greeting} 🌞\nWelcome to *Abode Constructions* 🏡\n\nSelect an option below 👇\n1️⃣ View Our Projects\n2️⃣ Talk to an Expert 🧑‍💼\n3️⃣ Download Brochure 📩\n4️⃣ Book a Site Visit 📅`;
      await appendToSheet([new Date(), from, name, 'Started Chat', body]);
      await sendWhatsAppMessage(from, reply);
      return res.sendStatus(200);
    }

    // View Projects
    if (body === '1') {
      reply = `Here are our projects:\n\n1️⃣ *Abode Aravindam* - Tellapur\n2️⃣ *MJ Lakeview Heights* - Ameenpur\n\nReply with the project number to know more.`;
      await appendToSheet([new Date(), from, name, 'Viewed Projects List', '']);
    }
    // Abode Aravindam Details
    else if (body === '1.1' || body.includes('aravindam')) {
      reply = `🏡 *Abode Aravindam* - Tellapur\n- Location: Tellapur\n- Area: 5.27 Acres\n- RERA No: P01100005069\n- Floors & Units: G+9 | 2 & 3 BHK | 567 Flats\n- Starting From: ₹92 Lakhs Onwards\n✨ Highlights:\n- Spacious layouts, natural light & ventilation\n- Private Theatre, Clubhouse, Banquet Hall, Gym, Landscaped Trails\n- Premium finishes & thoughtful interiors\n📄 Download Brochure: https://drive.google.com/file/d/1cet434rju5vZzLfNHoCVZE3cR-dEnQHz/view?usp=sharing`;
      await appendToSheet([new Date(), from, name, 'Viewed Project Details', 'Abode Aravindam']);
    }
    // MJ Lakeview Heights Details
    else if (body === '1.2' || body.includes('lakeview')) {
      reply = `🌊 *MJ Lakeview Heights* - Ameenpur\n- Location: Ameenpur\n- Area: 1.5 Acres\n- RERA No: P01100009015\n- Floors & Units: G+10 | 2 & 3 BHK | 174 Flats\n- Starting From: ₹82 Lakhs Onwards\n🏡 Highlights:\n- Lake-side gated community\n- Spacious, naturally lit 2 & 3 BHK apartments\n- Clubhouse, Indoor Games, Yoga & Meditation\n- 18 units per floor for privacy and balance\n- Close to schools, hospitals, shopping, and transit\n📄 Download Brochure: https://drive.google.com/file/d/1t9zfs6fhQaeNtRkrTtBECTLyEw9pNVkW/view?usp=sharing`;
      await appendToSheet([new Date(), from, name, 'Viewed Project Details', 'MJ Lakeview Heights']);
    }
    // Talk to Expert
    else if (body === '2') {
      reply = `📞 Talk to an Expert:\n- Call: +91-9876543210\n- Website: https://abodeprojects.com\n- Email: sales@abode.com`;
      await appendToSheet([new Date(), from, name, 'Requested Expert Contact', '']);
    }
    // Download Brochure (All)
    else if (body === '3') {
      reply = `Here are the brochures 📩\n- Abode Aravindam 2BHK: https://drive.google.com/file/d/1cet434rju5vZzLfNHoCVZE3cR-dEnQHz/view?usp=sharing\n- Abode Aravindam 3BHK: https://drive.google.com/file/d/1gz0E1sooyRDfrDgUv3DhfYffv9vE2IgN/view?usp=sharing\n- MJ Lakeview 2BHK: https://drive.google.com/file/d/1t9zfs6fhQaeNtRkrTtBECTLyEw9pNVkW/view?usp=sharing\n- MJ Lakeview 3BHK: https://drive.google.com/file/d/1DNNA8rz4mODKmSCQ4sxrySAa04WSa3qb/view?usp=sharing`;
      await appendToSheet([new Date(), from, name, 'Downloaded Brochure', 'All']);
    }
    // Book Site Visit
    else if (body === '4') {
      reply = `📅 Book a site visit now: https://abodegroups.com/contact-us/`;
      await appendToSheet([new Date(), from, name, 'Requested Site Visit', '']);
    }
    // Unknown
    else {
      reply = `❗ Sorry, I didn't understand that. Please reply with the option number (1, 2, 3, or 4).`;
      await appendToSheet([new Date(), from, name, 'Unknown Input', body]);
    }

    await sendWhatsAppMessage(from, reply);
    await sendWhatsAppMessage(from, "🙏 Thank you for interacting with Abode Constructions. We'll get back to you if needed!");
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(500);
  }
});

// Use PORT from Render or default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));

