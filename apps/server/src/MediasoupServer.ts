import mediasoup from "mediasoup";
import type { Worker, Router, RtpCapabilities, WebRtcTransport, DtlsParameters } from "mediasoup/types";
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
}

