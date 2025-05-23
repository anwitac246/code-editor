import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc';
import * as wsjsonrpc from 'vscode-ws-jsonrpc/server';
const { toSocket } = wsjsonrpc;

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  console.log("Client connected.");

  const socketStream = toSocket(socket);

  const lsProcess = spawn('pyright-langserver', ['--stdio']);
  console.log("Spawned pyright-langserver with PID:", lsProcess.pid);

  const connection = createMessageConnection(
    new StreamMessageReader(lsProcess.stdout),
    new StreamMessageWriter(lsProcess.stdin)
  );
  socketStream.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString());
      connection.sendNotification(message);
    } catch (e) {
      console.error("Error parsing message from client:", e);
    }
  });

  socketStream.on('close', () => {
    console.log("Client disconnected.");
    connection.dispose();
    lsProcess.kill();
  });

  connection.listen();
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
