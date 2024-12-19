const crypto = require('crypto');
const elliptic = require('elliptic');
const mqtt = require('mqtt');
const express = require("express");
const app = express();
const path = require ('path');

app.use(express.static("public"));
app.use(express.json());

// Variable to store the latest sensor data
let latestVoltage = '0';
let latestCurrent = '0';
let latestFrequency = '0';
let latestPower = '0';
let latestEnergy = '0';
let latestPF = '0';

// Ganti dengan privateKey Anda
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

// Create an elliptic curve instance for secp256r1
const ec = new elliptic.ec('p256');

// Fungsi untuk menghasilkan shared key
const keyPair = ec.keyFromPrivate(privateKey);
const sharedKeyPoint = keyPair.derive(ec.keyFromPublic(publicKey).getPublic());
const sharedKey = Buffer.from(sharedKeyPoint.toArray('be', 32)); // Convert to Buffer

console.log("Shared Key:", Array.from(sharedKey).map(byte => byte.toString(16).padStart(2, '0')).join(' '));

// Fungsi untuk mendekripsi data
function decryptData(encryptedBase64) {
  // Base64 decode the encrypted data
  const encryptedData = Buffer.from(encryptedBase64, "base64");

  // Split the data to extract the nonce, ciphertext, and authentication tag
  const nonce = encryptedData.slice(0, 12); // Ambil 12 byte pertama sebagai nonce
  const ciphertext = encryptedData.slice(12, encryptedData.length - 16); // Ambil ciphertext
  const tag = encryptedData.slice(encryptedData.length - 16); // Ambil 16 byte terakhir sebagai tag

    // Log nonce dan tag
    console.log("Nonce:", nonce.toString('hex'));
    console.log("Tag:", tag.toString('hex'));

  // Pastikan panjang tag autentikasi adalah 16 byte
    if (tag.length !== 16) {
      console.error("Tag autentikasi yang diterima tidak valid (panjang tag: " + tag.length + " byte).");
      return null;
    }

        // Membuat dekripsi dengan ChaCha20-Poly1305
        const decipher = crypto.createDecipheriv("chacha20-poly1305", sharedKey, nonce);
        decipher.setAuthTag(tag);

 try {
    // Decrypt the data
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Convert the decrypted data to a string
    return decrypted.toString("utf-8");
  } catch (err) {
    console.error("Decryption failed", err);
    return null;
  }
}

// Connect to the MQTT broker
const mqttClient = mqtt.connect("mqtt://yossifebriyana.cloud.shiftr.io", {
  username: "yossifebriyana",
  password:"tokenrahasiayossi",
connectTimeout: 5000, // Timeout koneksi (5 detik)
});

mqttClient.on(`connect`, () => {
  console.log(`Connected to MQTT broker`);
  
  mqttClient.subscribe('SEM/VAC', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/VAC":', err);
    } else {
      console.log('Subscribed to topic "SEM/VAC"');
    }
  });

  mqttClient.subscribe('SEM/IAC', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/IAC":', err);
    } else {
      console.log('Subscribed to topic "SEM/IAC"');
    }
  });

  mqttClient.subscribe('SEM/Freq', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/Freq":', err);
    } else {
      console.log('Subscribed to topic "SEM/Freq"');
    }
  });

  mqttClient.subscribe('SEM/PAC', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/PAC":', err);
    } else {
      console.log('Subscribed to topic "SEM/PAC"');
    }
  });

  mqttClient.subscribe('SEM/Energy', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/Energy":', err);
    } else {
      console.log('Subscribed to topic "SEM/Energy"');
    }
  });

  mqttClient.subscribe('SEM/PF', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "SEM/PF":', err);
    } else {
      console.log('Subscribed to topic "SEM/PF"');
    }
  });

});

mqttClient.on("message", (topic, message) => {
  if (topic === "SEM/VAC") {
    const encryptedVoltageBase64 = message.toString();
    const decryptedVoltage = decryptData(encryptedVoltageBase64);
    console.log("Decrypted Voltage:", decryptedVoltage);
    latestVoltage = decryptedVoltage; 
  } else if (topic === "SEM/IAC") {
    const encryptedCurrentBase64 = message.toString();
    const decryptedCurrent = decryptData(encryptedCurrentBase64);
    console.log("Decrypted Current:", decryptedCurrent);
    latestCurrent = decryptedCurrent; 
  } else if (topic === "SEM/Freq") {
   const encryptedFrequencyBase64 = message.toString();
   const decryptedFrequency = decryptData(encryptedFrequencyBase64);
   console.log("Decrypted Frequency:", decryptedFrequency);
   latestFrequency = decryptedFrequency; 
  } else if (topic === "SEM/PAC") {
    const encryptedPowerBase64 = message.toString();
    const decryptedPower = decryptData(encryptedPowerBase64);
    console.log("Decrypted Power:", decryptedPower);
    latestPower = decryptedPower; 
  } else if (topic === "SEM/Energy") {
    const encryptedEnergyBase64 = message.toString();
    const decryptedEnergy = decryptData(encryptedEnergyBase64);
    console.log("Decrypted Energy:", decryptedEnergy);
    latestEnergy = decryptedEnergy; 
  } else if (topic === "SEM/PF") {
    const encryptedPFBase64 = message.toString();
    const decryptedPF = decryptData(encryptedPFBase64);
    console.log("Decrypted Power Factor:", decryptedPF);
    latestPF = decryptedPF; 
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

// Route to get the latest sensor data
app.get("/sensor-data", (req, res) => {
  res.json({
    voltage: latestVoltage,
    current: latestCurrent,
    frequency: latestFrequency,
    power: latestPower,
    energy: latestEnergy,
    powerfactor: latestPF,
  });
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});

app.get("/SEM", (req, res) => {
  res.sendFile(path.join(__dirname, "public/SEM.html"));
});

const PORT = process.env.PORT || 2828;
app.listen(PORT, () => {
  console.log(`Your website is online on port ${PORT}.`);
});