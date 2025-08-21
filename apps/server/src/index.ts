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
      case "CREATE_SEND_TRANSPORT":
         onCreateSendTransport(socket, event.data);
         break;
      case "CONNECT_SEND_TRANSPORT":
         onConnectSendTransport(socket, event.data);
         break;
      case "CREATE_RECV_TRANSPORT":
         onCreateRecvTransport(socket, event.data);
         break;
      case "CONNECT_RECV_TRANSPORT":
         onConnectRecvTransport(socket, event.data);
         break;
      case "CREATE_PRODUCER":
         onCreateProducer(socket, event.data);
         break;
      case "PRODUCER_PRODUCE":
         onProducerProduce(socket, event.data);
         break;
   }
}

const onRequestRouterRtpCapabilities = (
   socket: WebSocket,
   data: ClientEventData<"REQUEST_ROUTER_RTP_CAPABILITIES">
) => {
   socket.sendEvent("UPDATE_ROUTER_RTP_CAPABILITIES", { routerRtpCapabilities: mediasoupServer.rtpCapabilities });
}

const onCreateSendTransport = async (
   socket: WebSocket,
   data: ClientEventData<"CREATE_SEND_TRANSPORT">
) => {
   const sendTransport = await mediasoupServer.createSendTransport(socket);
   socket.sendEvent("SEND_TRANSPORT_CREATED", {
      id: sendTransport.id,
      iceParameters: sendTransport.iceParameters,
      iceCandidates: sendTransport.iceCandidates,
      dtlsParameters: sendTransport.dtlsParameters
   });
}

const onConnectSendTransport = async (
   socket: WebSocket,
   data: ClientEventData<"CONNECT_SEND_TRANSPORT">
) => {
   await mediasoupServer.connectSendTransport(data.transportId, data.dtlsParameters);
   socket.sendEvent("SEND_TRANSPORT_CONNECTED", null);
}

const onCreateRecvTransport = async (
   socket: WebSocket,
   data: ClientEventData<"CREATE_RECV_TRANSPORT">
) => {
   const recvTransport = await mediasoupServer.createRecvTransport(socket, data.deviceRtpCapabilities);
   socket.sendEvent("RECV_TRANSPORT_CREATED", {
      id: recvTransport.id,
      iceParameters: recvTransport.iceParameters,
      iceCandidates: recvTransport.iceCandidates,
      dtlsParameters: recvTransport.dtlsParameters
   });
}

const onConnectRecvTransport = async (
   socket: WebSocket,
   data: ClientEventData<"CONNECT_RECV_TRANSPORT">
) => {
   await mediasoupServer.connectRecvTransport(data.transportId, data.dtlsParameters);
   socket.sendEvent("RECV_TRANSPORT_CONNECTED", null);
}

const onCreateProducer = async (
   socket: WebSocket,
   data: ClientEventData<"CREATE_PRODUCER">
) => {
   const { transportId, kind, rtpParameters } = data
   const producer = await mediasoupServer.createProducer(transportId, kind, rtpParameters);
   socket.sendEvent("PRODUCER_CREATED", { producerId: producer.id });
}

const onProducerProduce = (
   socket: WebSocket,
   data: ClientEventData<"PRODUCER_PRODUCE">
) => {
   mediasoupServer.onProducerProduce(socket, data.producerId);
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