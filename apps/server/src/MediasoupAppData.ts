import type { Router, RtpCapabilities, WebRtcTransport, Producer, Consumer } from "mediasoup/types";
import { WebSocket } from "ws";

export type WorkerAppData = {
   routers: Router<RouterAppData>[];
}

export type RouterAppData = {
   sendTransports: WebRtcTransport<SendTransportAppData>[];
   recvTransports: WebRtcTransport<RecvTransportAppData>[];
}

export type TransportAppData = {
   socket: WebSocket;
}

export type SendTransportAppData = {
   producers: Producer[];
} & TransportAppData

export type RecvTransportAppData = {
   deviceRtpCapabilities: RtpCapabilities;
   consumers: Consumer[];
} & TransportAppData