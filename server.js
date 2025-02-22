import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc';
import * as wsjsonrpc from 'vscode-ws-jsonrpc/server';
const { toSocket } = wsjsonrpc;

const PORT = 3000;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  console.log("Client connected.");

  // Wrap the WebSocket into a Node.js stream.
  const socketStream = toSocket(socket);

  // Spawn the language server process (Pyright in this example).
  const lsProcess = spawn('pyright-langserver', ['--stdio']);
  console.log("Spawned pyright-langserver with PID:", lsProcess.pid);

  // Create a JSON-RPC connection between the language server's stdio and the socket stream.
  const connection = createMessageConnection(
    new StreamMessageReader(lsProcess.stdout),
    new StreamMessageWriter(lsProcess.stdin)
  );

  // Forward messages from the socket to the language server.
  socketStream.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString());
      connection.sendNotification(message);
    } catch (e) {
      console.error("Error parsing message from client:", e);
    }
  });

  // Cleanup when the client disconnects.
  socketStream.on('close', () => {
    console.log("Client disconnected.");
    connection.dispose();
    lsProcess.kill();
  });

  connection.listen();
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
