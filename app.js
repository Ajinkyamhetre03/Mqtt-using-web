// app.js
const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

const mqttBroker = 'mqtt://dev.coppercloud.in';
const topic = 'ajnkyamhetre';
const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT Broker');
    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error(`Subscription error: ${err.message}`);
        } else {
            console.log(`Subscribed to topic: ${topic}`);
        }
    });
});

mqttClient.on('message', (receivedTopic, message) => {
    if (receivedTopic === topic) {
        const msg = message.toString();
        console.log(`Received message from topic ${topic}: ${msg}`);
        io.emit('mqttMessage', msg);
    }
});

mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error);
});

app.get('/', (req, res) => {
    res.render('index', { topic });
});

io.on('connection', (socket) => {
    console.log('A user connected via Socket.IO');
    socket.on('sendMessage', (message) => {
        console.log(`Sending message to MQTT: ${message}`);
        mqttClient.publish(topic, message, (err) => {
            if (err) {
                console.error(`Error sending message to MQTT: ${err.message}`);
            } else {
                console.log(`Message sent to topic ${topic}: ${message}`);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
