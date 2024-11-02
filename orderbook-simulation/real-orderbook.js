const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Vertex WebSocket URL and configurations
const vertexWsUrl = 'wss://gateway.prod.vertexprotocol.com/v1/subscribe';
let vertexWs;

// Orderbook object to store the latest bids and asks
const orderbook = { bids: [], asks: [] };

// Define scaling factors for price and quantity
const PRICE_SCALING_FACTOR = 1e18;
const QUANTITY_SCALING_FACTOR = 1e18;

// Function to merge incoming orders with the current orderbook
function mergeOrders(existingOrders, newOrders) {
  const orderMap = new Map();

  // Add all existing orders to the map
  existingOrders.forEach(order => {
    orderMap.set(order.price, order.quantity);
  });

  // Update the map with new orders (remove if quantity is zero)
  newOrders.forEach(order => {
    if (order.quantity > 0) {
      orderMap.set(order.price, order.quantity);
    } else {
      orderMap.delete(order.price);
    }
  });

  // Convert the map back to a sorted array
  return Array.from(orderMap.entries())
    .map(([price, quantity]) => ({ price, quantity }))
    .sort((a, b) => b.price - a.price); // Sort bids in descending order, asks in ascending
}

// Establish and manage the Vertex WebSocket connection
function connectToVertex() {
  vertexWs = new WebSocket(vertexWsUrl);

  vertexWs.on('open', () => {
    console.log('Connected to Vertex WebSocket');
    // Subscribe to BTC orderbook (product_id: 2)
    vertexWs.send(JSON.stringify({
      method: 'subscribe',
      stream: {
        type: 'book_depth',
        product_id: 2,
      },
      id: 1 // Optional ID for message tracking
    }));
  });

  vertexWs.on('message', (data) => {
   
    const orderbookUpdate = handleVertexData(data);
    if (orderbookUpdate) {
      updateOrderbook(orderbookUpdate);
      broadcastOrderbook(orderbook);
    }
  });

  vertexWs.on('close', () => {
    console.log('Disconnected from Vertex WebSocket, attempting to reconnect...');
    setTimeout(connectToVertex, 5000); // Retry connection after 5 seconds
  });

  vertexWs.on('error', (error) => {
    console.error('WebSocket error:', error);
    vertexWs.close();
  });
}

// Parse incoming messages and extract relevant orderbook updates
function handleVertexData(data) {
  let message;
  try {
    message = JSON.parse(data);
  } catch (error) {
    console.error('Received non-JSON data:', data);
    return null;
  }

  if (message.type === 'book_depth' && message.product_id === 2) {
    return {
      bids: message.bids.map(bid => ({ price: bid[0], quantity: bid[1] })),
      asks: message.asks.map(ask => ({ price: ask[0], quantity: ask[1] }))
    };
  }
  return null;
}

// Update the orderbook with incoming bids and asks
function updateOrderbook({ bids, asks }) {
  orderbook.bids = mergeOrders(orderbook.bids, bids.map(b => ({
    price: (b.price / PRICE_SCALING_FACTOR).toFixed(2),       // Convert and round price
    quantity: (b.quantity / QUANTITY_SCALING_FACTOR).toFixed(2) // Convert and round quantity
  })));

  orderbook.asks = mergeOrders(orderbook.asks, asks.map(a => ({
    price: (a.price / PRICE_SCALING_FACTOR).toFixed(2),       // Convert and round price
    quantity: (a.quantity / QUANTITY_SCALING_FACTOR).toFixed(2) // Convert and round quantity
  })));
}

// Send the latest orderbook to all connected clients
function broadcastOrderbook(orderbook) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(orderbook));
    }
  });
}

// Set up WebSocket server to serve clients with live orderbook data
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify(orderbook)); // Send initial orderbook state

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the Vertex WebSocket connection
connectToVertex();
