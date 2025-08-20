import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

const server = new Server();
const webSocketServer = new WebSocketServer({ server, path: "/ws" });

webSocketServer.on("connection", (socket: WebSocket) => {
   socket.onmessage = (message) => console.log(message.data);
});

server.listen(3000, () => {
   console.log("Server is running...");
});