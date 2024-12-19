const express = require("express");
const mqtt = require('mqtt');
const app = express();
const path = require ('path');
const crypto = require('crypto');
const elliptic = require('elliptic');

app.use(express.static("public"));
app.use(express.json());

let latestTemperature = '0';
let latestHumidity = '0';

const privateKey = Buffer.from([
  0x77, 0x07, 0x6d, 0x0a, 0x73, 0x18, 0xa5, 0x7d,
  0x3c, 0x16, 0xc1, 0x72, 0x51, 0xb2, 0x66, 0x45,
  0xdf, 0x4c, 0x2f, 0x87, 0xeb, 0xc0, 0x99, 0x2a,
  0xb1, 0x77, 0xfb, 0xa5, 0x1d, 0xb9, 0x2c, 0x2a
]);

const publicKey = Buffer.from([
  0x04, // Uncompressed point indicator
  0xa8, 0x86, 0x52, 0xf8, 0x0c, 0x01, 0xcc, 0x32,
  0x21, 0x45, 0x87, 0xbb, 0x31, 0xb3, 0x14, 0xf6,
  0x28, 0xfa, 0x5d, 0x5a, 0x9f, 0x1a, 0x13, 0xd7, 
  0xac, 0x52, 0xaf, 0xb7, 0xa8, 0x94, 0xd3, 0x57,
  0x39, 0xa2, 0xa5, 0xc6, 0x31, 0x63, 0x7b, 0xe2,
  0x76, 0xf5, 0xa3, 0x69, 0x95, 0x7f, 0xdc, 0xbb,
  0x6b, 0x89, 0x53, 0x14, 0xd4, 0x23, 0x67, 0xe8,
  0x19, 0x9d, 0x26, 0x9d, 0xb1, 0x3f, 0x8e, 0x74
]);

const ec = new elliptic.ec('p256');

const keyPair = ec.keyFromPrivate(privateKey);
const sharedKeyPoint = keyPair.derive(ec.keyFromPublic(publicKey).getPublic());
const sharedKey = Buffer.from(sharedKeyPoint.toArray('be', 32)); // Convert to Buffer
console.log("Shared Key:", sharedKey);

function decryptData(encryptedBase64) {
  const encryptedData = Buffer.from(encryptedBase64, "base64");

  // Split the data to extract the ciphertext and the authentication tag
  const nonce = encryptedData.slice(0, 12); // First 12 bytes are the nonce
  const ciphertext = encryptedData.slice(12, encryptedData.length - 16); // Everything except last 16 bytes and first 12 bytes
  const tag = encryptedData.slice(encryptedData.length - 16); // Last 16 bytes are the tag

    if (tag.length !== 16) {
      console.error("Tag autentikasi yang diterima tidak valid (panjang tag: " + tag.length + " byte).");
      return null;
    };

        const decipher = crypto.createDecipheriv("chacha20-poly1305", sharedKey, nonce);
        decipher.setAuthTag(tag);

 try {
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf-8");
  } catch (err) {
    console.error("Decryption failed", err);
    return null;
  }
}

const mqttClient = mqtt.connect("mqtt://test.cloud.shiftr.io", {
  username: "test",
  password:"testsecret",
connectTimeout: 5000,
});

mqttClient.on(`connect`, () => {
  console.log(`Connected to MQTT broker`);
  
  mqttClient.subscribe('dht11/temperature', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "dht11/temperature":', err);
    } else {
      console.log('Subscribed to topic "dht11/temperature"');
    }
  });

  mqttClient.subscribe('dht11/humidity', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "dht11/humidity":', err);
    } else {
      console.log('Subscribed to topic "dht11/humidity"');
    }
  });
});

mqttClient.on("message", (topic, message) => {
  if (topic === "dht11/temperature") {
    const encryptedTempBase64 = message.toString();
    const decryptedTemp = decryptData(encryptedTempBase64);
    console.log("Decrypted Temperature:", decryptedTemp);
    latestTemperature = decryptedTemp; 
  } else if (topic === "dht11/humidity") {
    const encryptedHumidityBase64 = message.toString();
    const decryptedHumidity = decryptData(encryptedHumidityBase64);
    console.log("Decrypted Humidity:", decryptedHumidity);
    latestHumidity = decryptedHumidity; 
  }
});

mqttClient.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

app.post("/publish", (req, res) => {
  const { topic, message } = req.body;
  console.log(`Received request to publish topic: ${topic}, message: ${message}`);

  mqttClient.publish(topic, message, (err) => {
    if (err) {
      console.error("Error publishing message:", err);
      res.status(500).send("Error publishing message");
    } else {
      console.log("Message published successfully");
      res.send("Message published successfully");
    }
  });
});

app.get("/sensor-data", (req, res) => {
  res.json({
    temperature: latestTemperature,
    humidity: latestHumidity,
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});

app.get("/ESP", (req, res) => {
  res.sendFile(path.join(__dirname, "public/ESP.html"));
});

const PORT = process.env.PORT || 2828;
app.listen(PORT, () => {
  console.log(`Your website is online on port ${PORT}.`);
});