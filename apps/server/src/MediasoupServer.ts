import mediasoup from "mediasoup";
import type { Worker, Router, RtpCapabilities } from "mediasoup/types";
import type { RouterAppData, WorkerAppData } from "./MediasoupAppData.ts";
import { Configuration } from "./MediasoupServerConfiguration.ts";

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
}

