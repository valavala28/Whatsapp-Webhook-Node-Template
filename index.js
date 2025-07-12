const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Root Route
app.get("/", (req, res) => {
  res.send("WhatsApp Webhook is live");
});

// Webhook Verification (GET)
app.get("/webhook", (req, res) => {
  const verify_token = "Abode@14"; // 🔁 Match this with Meta config

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verify_token) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook Receiver (POST)
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const changes = body.entry?.[0]?.changes?.[0];

    if (changes?.value?.messages) {
      const messages = changes.value.messages;
      messages.forEach((msg) => {
        console.log("📩 Incoming message:");
        console.log(`From: ${msg.from}`);
        console.log(`Type: ${msg.type}`);
        if (msg.text) {
          console.log(`Message: ${msg.text.body}`);
        }
      });
    }

    if (changes?.value?.statuses) {
      const statuses = changes.value.statuses;
      statuses.forEach((status) => {
        console.log("📬 Message status update:");
        console.log(`ID: ${status.id}`);
        console.log(`Status: ${status.status}`); // sent, delivered, read, failed
        console.log(`To: ${status.recipient_id}`);
      });
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Webhook server running on port ${PORT}`);
});
