const mqtt = require('mqtt');
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('albagom-v2/sync/store_1060/auth', (err) => {
    if (!err) {
      console.log('Subscribed to auth topic');
    }
  });
  
  // Timeout after 5 seconds
  setTimeout(() => {
    console.log('Timeout. Exiting...');
    client.end();
  }, 5000);
});

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}:`, message.toString());
});
