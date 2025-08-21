import { Device } from "mediasoup-client";
import type { Transport } from "mediasoup-client/types";

export class MediasoupClient {
   private readonly device: Device;
   public sendTransport: Transport | null = null;
   public recvTransport: Transport | null = null;

   private constructor(device: Device) {
      this.device = device;
   }

   public static async initialize(): Promise<MediasoupClient> {
      try {
         const device = await Device.factory();
         return Promise.resolve(new MediasoupClient(device));
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async loadDevice(socket: WebSocket): Promise<void> {
      try {
         socket.sendEvent("REQUEST_ROUTER_RTP_CAPABILITIES", null);
         const { routerRtpCapabilities } = await socket.once("UPDATE_ROUTER_RTP_CAPABILITIES");
         await this.device.load({ routerRtpCapabilities });
         return Promise.resolve();
      } catch (error: any) {
         return Promise.reject();
      }
   }

   public async createSendTransport(socket: WebSocket): Promise<Transport> {
      try {
         socket.sendEvent("CREATE_SEND_TRANSPORT", null);
         const { 
            id, iceCandidates, iceParameters, dtlsParameters
         } = await socket.once("SEND_TRANSPORT_CREATED");
         const sendTransport = this.device.createSendTransport({
            id, iceCandidates, iceParameters, dtlsParameters,
         });
         this.attachListenerToSendTransport(socket, sendTransport);
         this.sendTransport = sendTransport;
         return Promise.resolve(sendTransport);;
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   private attachListenerToSendTransport(socket: WebSocket, sendTransport: Transport) {
      sendTransport.on("connect", async (params, callback, errback) => {
         try {
            socket.sendEvent("CONNECT_SEND_TRANSPORT", {
               transportId: sendTransport.id,
               dtlsParameters: params.dtlsParameters
            });
            await socket.once("SEND_TRANSPORT_CONNECTED");
            callback();
         } catch (error: any) {
            errback(error);
         }
      });
      sendTransport.on("produce", async (data, callback, errback) => {
         try {
            const { appData, kind, rtpParameters } = data;
            socket.sendEvent("CREATE_PRODUCER", { kind, rtpParameters, transportId: sendTransport.id });
            const { producerId } = await socket.once("PRODUCER_CREATED");
            callback({ id: producerId });
         } catch (error: any) {
            errback(error);
         }
      });
   }

   public async createRecvTransport(socket: WebSocket): Promise<Transport> {
      try {
         socket.sendEvent("CREATE_RECV_TRANSPORT", { deviceRtpCapabilities: this.device.rtpCapabilities });
         const { 
            id, iceCandidates, iceParameters, dtlsParameters
         } = await socket.once("RECV_TRANSPORT_CREATED");
         const recvTransport = this.device.createRecvTransport({
            id, iceCandidates, iceParameters, dtlsParameters,
         });
         this.attachListenerToRecvTransport(socket, recvTransport);
         this.recvTransport = recvTransport;
         return Promise.resolve(recvTransport);
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   private attachListenerToRecvTransport(socket: WebSocket, recvTransport: Transport) {
      recvTransport.on("connect", async (params, callback, errback) => {
         try {
            socket.sendEvent("CONNECT_RECV_TRANSPORT", {
               transportId: recvTransport.id,
               dtlsParameters: params.dtlsParameters
            });
            await socket.once("RECV_TRANSPORT_CONNECTED");
            callback();
         } catch (error: any) {
            errback(error);
         }
      });
   }

}