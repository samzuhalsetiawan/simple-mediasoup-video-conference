import mediasoup from "mediasoup";
import type { Worker, Router, RtpCapabilities, WebRtcTransport, DtlsParameters, MediaKind, RtpParameters, Producer, Consumer } from "mediasoup/types";
import type { RecvTransportAppData, RouterAppData, SendTransportAppData, WorkerAppData } from "./MediasoupAppData.ts";
import { Configuration } from "./MediasoupServerConfiguration.ts";
import { WebSocket } from "ws";

export class MediasoupServer {
   private readonly worker: Worker<WorkerAppData>;
   private readonly router: Router<RouterAppData>;
   public readonly rtpCapabilities: RtpCapabilities;

   private constructor(worker: Worker<WorkerAppData>, router: Router<RouterAppData>) {
      this.worker = worker;
      this.router = router;
      this.rtpCapabilities = router.rtpCapabilities;
   }

   public static async initialize(): Promise<MediasoupServer> {
      try {
         const worker = await mediasoup.createWorker<WorkerAppData>(Configuration.worker);
         const router = await worker.createRouter<RouterAppData>(Configuration.router);
         const routers = worker.appData.routers;
         routers.push(router);
         router.on("workerclose", () => {
            routers.splice(routers.indexOf(router), 1);
         });
         return Promise.resolve(new MediasoupServer(worker, router));
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async createSendTransport(socket: WebSocket): Promise<WebRtcTransport> {
      try {
         const transportOptions = Configuration.getTransportOptions<SendTransportAppData>({
            socket, producers: []
         });
         const sendTransport = await this.router.createWebRtcTransport(transportOptions);
         const sendTransports = this.router.appData.sendTransports;
         sendTransports.push(sendTransport);
         sendTransport.on("routerclose", () => {
            sendTransports.splice(sendTransports.indexOf(sendTransport), 1);
         });
         return Promise.resolve(sendTransport);
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async connectSendTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
      try {
         const sendTransport = this.router.appData.sendTransports.find(transport => transport.id === transportId);
         if (!sendTransport) throw new Error("Send Transport Not Found");
         await sendTransport.connect({ dtlsParameters });
         return Promise.resolve();
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async createRecvTransport(socket: WebSocket, deviceRtpCapabilities: RtpCapabilities): Promise<WebRtcTransport> {
      try {
         const transportOptions = Configuration.getTransportOptions<RecvTransportAppData>({
            socket, deviceRtpCapabilities, consumers: []
         });
         const recvTransport = await this.router.createWebRtcTransport(transportOptions);
         const recvTransports = this.router.appData.recvTransports;
         recvTransports.push(recvTransport);
         recvTransport.on("routerclose", () => {
            recvTransports.splice(recvTransports.indexOf(recvTransport), 1);
         });
         return Promise.resolve(recvTransport);
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async connectRecvTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
      try {
         const recvTransport = this.router.appData.recvTransports.find(transport => transport.id === transportId);
         if (!recvTransport) throw new Error("Recv Transport Not Found");
         await recvTransport.connect({ dtlsParameters });
         return Promise.resolve();
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async createProducer(transportId: string, kind: MediaKind, rtpParameters: RtpParameters): Promise<Producer> {
      try {
         const sendTransport = this.router.appData.sendTransports.find(transport => transport.id === transportId);
         if (!sendTransport) throw new Error("Send Transport Not Found");
         const producer = await sendTransport.produce({ kind, rtpParameters });
         const producers = sendTransport.appData.producers;
         producers.push(producer);
         producer.on("transportclose", () => { producers.splice(producers.indexOf(producer), 1) });
         return Promise.resolve(producer);
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public onProducerProduce(socket: WebSocket, producerId: string) {
      this.router.appData.recvTransports.forEach(async recvTransport => {
         if (recvTransport.appData.socket === socket) return;
         const deviceRtpCapabilities = recvTransport.appData.deviceRtpCapabilities;
         await this.createConsumer(recvTransport, producerId, deviceRtpCapabilities);
      });
   }

   private async createConsumer(
      recvTransport: WebRtcTransport<RecvTransportAppData>,
      producerId: string,
      deviceRtpCapabilities: RtpCapabilities
   ): Promise<Consumer | null> {
      try {
         const canConsume = this.router.canConsume({ producerId, rtpCapabilities: deviceRtpCapabilities });
         if (!canConsume) return Promise.resolve(null);
         const consumer = await recvTransport.consume({
            producerId,
            rtpCapabilities: recvTransport.appData.deviceRtpCapabilities,
            paused: true
         });
         const consumers = recvTransport.appData.consumers;
         consumers.push(consumer);
         consumer.on("transportclose", () => {
            if (consumers.indexOf(consumer) === -1) return;
            consumers.splice(consumers.indexOf(consumer), 1);
         });
         consumer.on("producerclose", () => {
            if (consumers.indexOf(consumer) === -1) return;
            consumers.splice(consumers.indexOf(consumer), 1);
         });
         const producerSocketId = this.router.appData.sendTransports
            .find(transport => transport.appData.producers.some(producer => producer.id === producerId))
            ?.appData.socket.id;
         if (!producerSocketId) return Promise.reject(new Error("Producer Socket ID Not Found"));
         recvTransport.appData.socket.sendEvent("CREATE_CONSUMER", {
            socketId: producerSocketId,
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters
         });
         return Promise.resolve(consumer);
      } catch (error: any) {
         return Promise.reject(error);
      }
   }

   public async resumeConsumer(socket: WebSocket, consumerId: string) {
      const recvTransport = this.router.appData.recvTransports
         .filter(transport => transport.appData.socket === socket)[0];
      if (!recvTransport) return;
      const consumer = recvTransport.appData.consumers.find(consumer => consumer.id === consumerId);
      if (!consumer) return;
      await consumer.resume()
   }

   public onRequestUpdateConsumer(socket: WebSocket) {
      const recvTransport = this.router.appData.recvTransports.find(transport => transport.appData.socket === socket);
      if (!recvTransport) return;
      this.router.appData.sendTransports
         .filter(transport => transport.appData.socket !== socket)
         .forEach(sendTransport => {
            sendTransport.appData.producers.forEach(async producer => {
               if (producer.closed) return;
               await this.createConsumer(
                  recvTransport,
                  producer.id,
                  recvTransport.appData.deviceRtpCapabilities
               );
            });
         });
   }

   public onSocketDisconnect(socket: WebSocket) {
      this.router.appData.sendTransports
         .filter(sendTransport => sendTransport.appData.socket === socket)
         .forEach(sendTransport => sendTransport.close());
      this.router.appData.recvTransports
         .filter(recvTransport => recvTransport.appData.socket === socket)
         .forEach(recvTransport => recvTransport.close());
   }
}

