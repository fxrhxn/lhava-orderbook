const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocket.Server({ server });

function getRandomPrice(base) {
  return (base + (Math.random() - 0.5) * 50).toFixed(2);
}

function getDummyOrderbook() {
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: getRandomPrice(34500 - i * 10),
    quantity: (Math.random() * 2).toFixed(2),
  }));
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: getRandomPrice(34550 + i * 10),
    quantity: (Math.random() * 2).toFixed(2),
  }));
  return { bids, asks };
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  const intervalId = setInterval(() => {
    ws.send(JSON.stringify(getDummyOrderbook()));
  }, 2000);

  ws.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected');
  });
});
