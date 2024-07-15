const express = require("express");
const mqtt = require('mqtt');
const app = express();
const path = require('path');

app.use(express.static("public"));
app.use(express.json());

// Variable to store the latest sensor data
let latestSensorData = 'data';

// Connect to the MQTT broker
//const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883');
const mqttClient = mqtt.connect('mqtt://broker.emqx.io:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to the "sensor" topic
  mqttClient.subscribe('potensiometer_husni', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "sensor":', err);
    } else {
      console.log('Subscribed to topic "sensor"');
    }
  });
});

// Handle incoming messages from the "sensor" topic
mqttClient.on('message', (topic, message) => {
    if (topic === 'potensiometer_husni') {
      console.log(`Received message from ${topic}: ${message.toString()}`);
      // Store the received data
      latestSensorData = message.toString();
      console.log(latestSensorData);
    }
  });
  
  mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
  });

  // Route to publish a message to an MQTT topic
app.post('/publish', (req, res) => {
    const { topic, message } = req.body;
    console.log(`Received request to publish topic: ${topic}, message: ${message}`);
  
    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.error('Error publishing message:', err);
        res.status(500).send('Error publishing message');
      } else {
        console.log('Message published successfully');
        res.send('Message published successfully');
      }
    });
  });

  // Route to get the latest sensor data
app.get('/sensor-data', (req, res) => {
    res.json({ data: latestSensorData });
  });

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/kalkulator", function (req, res) {
    res.sendFile(path.join(__dirname, "public/kalkulator.html"));
});

app.get("/about", function (req, res) {
    res.sendFile(path.join(__dirname, "public/about.html"));
});

app.get("/auth", function (req, res) {
    res.sendFile(path.join(__dirname, "public/auth.html"));
});

app.get("/mqtt", function (req, res) {
    res.sendFile(path.join(__dirname, "public/mqtt.html"));
});

app.listen("2828", function () {
    console.log("Your website is online.");
});
