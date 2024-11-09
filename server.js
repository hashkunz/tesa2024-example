// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const cors = require('cors');  // เพิ่มการ import cors
const { connectMQTT } = require('./mqtt');  // ตรวจสอบให้แน่ใจว่า import ถูกต้อง

const app = express();
const port = 3000;

// ใช้ body-parser สำหรับรับข้อมูล JSON
app.use(bodyParser.json());

// ใช้ cors middleware เพื่ออนุญาตให้คำขอจากโดเมนอื่น ๆ เข้ามาได้
app.use(cors()); // เพิ่มบรรทัดนี้

// เชื่อมต่อกับ MongoDB
const uri = 'mongodb://mongodb:27017/tesadb';
const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Connection error:', err);
  });

const db = client.db();
const temperatureCollection = db.collection('temperatures');

// API รับข้อมูลที่ส่งเข้ามา
app.post('/data/temperatures', async (req, res) => {
  try {
    // ตรวจสอบค่าที่ส่งมา
    let { temperature, humidity, timestamp } = req.body;

    if (temperature == null || humidity == null) {
      return res.status(400).send('Temperature and humidity are required');
    }

    // แปลงค่าให้เป็นตัวเลข
    temperature = parseFloat(temperature);
    humidity = parseFloat(humidity);
    timestamp = timestamp || new Date();

    // ตรวจสอบว่าข้อมูลที่ได้เป็นตัวเลข
    if (isNaN(temperature) || isNaN(humidity)) {
      return res.status(400).send('Temperature and humidity must be valid numbers');
    }

    const newTemperature = { temperature, humidity, timestamp };

    // บันทึกข้อมูลลง MongoDB
    await temperatureCollection.insertOne(newTemperature);
    
    res.status(201).send('Temperature data saved');
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Internal Server Error');
  }
});

// API สำหรับดึงข้อมูลทั้งหมดใน Collection temperatures
app.get('/slist', async (req, res) => {
  try {
    // ดึงข้อมูลจาก MongoDB
    const data = await temperatureCollection.find().toArray();

    // แปลงข้อมูลให้เป็น JSON และจัดรูปแบบตามต้องการ
    // ตรวจสอบให้แน่ใจว่า fields เช่น temperature, humidity เป็นตัวเลข
    const formattedData = data.map(item => ({
      temperature: parseFloat(item.temperature),
      humidity: parseFloat(item.humidity),
      timestamp: item.timestamp
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }
});

// เริ่มต้นเซิร์ฟเวอร์และเชื่อมต่อกับ MQTT
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectMQTT();  // เรียกใช้ฟังก์ชันเชื่อมต่อกับ MQTT
});
