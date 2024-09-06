const WebSocket = require('ws');
const { PeerServer } = require('peer');
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Use environment variable for port or default to 8080
const PORT = process.env.PORT || 8080;
const PEER_PORT = process.env.PEER_PORT || 9000;

// Enable CORS for Express server
app.use(cors({
  origin: 'https://streaming-frontend-h0ky.onrender.com', // Replace with your frontend domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });
const peers = {};

wss.on('connection', ws => {
  console.log('New connection');

  ws.on('message', message => {
    const data = JSON.parse(message);
    const { type, peerId, targetPeerId } = data;

    if (type === 'register') {
      peers[peerId] = ws;
      console.log(`Peer ${peerId} registered`);
    }

    if (type === 'call') {
      const targetPeer = peers[targetPeerId];
      if (targetPeer) {
        targetPeer.send(JSON.stringify({ type: 'call', peerId }));
      }
    }

    if (type === 'answer') {
      const targetPeer = peers[targetPeerId];
      if (targetPeer) {
        targetPeer.send(JSON.stringify({ type: 'answer', peerId }));
      }
    }

    if (type === 'disconnect') {
      delete peers[peerId];
      console.log(`Peer ${peerId} disconnected`);
    }
  });

  ws.on('close', () => {
    for (const [peerId, client] of Object.entries(peers)) {
      if (client === ws) {
        delete peers[peerId];
        console.log(`Peer ${peerId} disconnected`);
        break;
      }
    }
  });
});

console.log(`Signaling server running on ws://localhost:${PORT}`);

// Create PeerJS server
const peerServer = PeerServer({
  port: PEER_PORT,
  path: '/',
  cors: {
    origin: 'https://streaming-frontend-h0ky.onrender.com',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }
});

console.log(`PeerJS server running on ws://localhost:${PEER_PORT}`);
