import { Device } from "mediasoup-client";

export class MediasoupClient {
   private readonly device: Device;

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

}