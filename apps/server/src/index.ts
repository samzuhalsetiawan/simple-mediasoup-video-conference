import "./utils/extentions.ts";
import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidV4 } from "uuid";
import type { ClientEvent, ClientEventData } from "@mediasoup-tutorial/event";
import { MediasoupServer } from "./MediasoupServer.ts";

const server = new Server();
const webSocketServer = new WebSocketServer({ server, path: "/ws" });
const mediasoupServer = await MediasoupServer.initialize();

webSocketServer.on("connection", (socket: WebSocket) => {
   onSocketConnected(socket);
   socket.onmessage = message => onMessage(socket, message.data);
   socket.onclose = () => onSocketDisconnected(socket);
});

const onSocketConnected = (socket: WebSocket) => {
   socket.id = uuidV4();
   socket.sendEvent("UPDATE_SOCKET_ID", { socketId: socket.id });
   webSocketServer.clients.forEach(client => {
      if (client !== socket) {
         client.sendEvent("NEW_SOCKET_JOINED", { socketId: socket.id });
         socket.sendEvent("NEW_SOCKET_JOINED", { socketId: client.id });
      }
   });
   console.log(`[Socket Connected] ${socket.id}`);
}

const onMessage = (socket: WebSocket, message: any) => {
   const event = JSON.parse(message) as ClientEvent;
   console.log(`[Receive Event] ${event.name}`);
   switch (event.name) {
      case "REQUEST_ROUTER_RTP_CAPABILITIES":
         onRequestRouterRtpCapabilities(socket, event.data);
         break;
   }
}

const onRequestRouterRtpCapabilities = (
   socket: WebSocket,
   data: ClientEventData<"REQUEST_ROUTER_RTP_CAPABILITIES">
) => {
   socket.sendEvent("UPDATE_ROUTER_RTP_CAPABILITIES", { routerRtpCapabilities: mediasoupServer.rtpCapabilities });
}

const onSocketDisconnected = (socket: WebSocket) => {
   webSocketServer.clients.forEach(client => {
      if (client === socket) return;
      client.sendEvent("SOCKET_LEFT", { socketId: socket.id });
   });
   console.log(`[Socket Disconnected] ${socket.id}`);
}

server.listen(3000, () => {
   console.log("Server is running...");
});