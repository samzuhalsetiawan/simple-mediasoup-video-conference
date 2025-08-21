import type { RouterOptions, WebRtcTransportOptions, WorkerSettings } from "mediasoup/types";
import type { RouterAppData, TransportAppData, WorkerAppData } from "./MediasoupAppData.ts";

export const Configuration = {
   worker: {
      logLevel: "debug",
      logTags: [
         "info", "ice", "dtls", "rtp", "srtp", "rtcp", "rtx", "bwe", "score", "simulcast", "svc", "sctp", "message"
      ],
      appData: {
         routers: []
      }
   } as WorkerSettings<WorkerAppData>,
   router: {
      mediaCodecs: [
         {
            kind        : "audio",
            mimeType    : "audio/opus",
            clockRate   : 48000,
            channels    : 2
         },
         {
            kind       : "video",
            mimeType   : "video/H264",
            clockRate  : 90000,
            parameters :
            {
               "packetization-mode"      : 1,
               "profile-level-id"        : "42e01f",
               "level-asymmetry-allowed" : 1
            }
         }
      ],
      appData: {
         sendTransports: [],
         recvTransports: []
      }
   } as RouterOptions<RouterAppData>,
   getTransportOptions: <T extends TransportAppData>(appData: T): WebRtcTransportOptions<T> => {
      return {
         listenInfos: [
            {
               ip: "192.168.100.4",
               announcedAddress: undefined,
               protocol: "udp",
               portRange: {
                  min: 3100,
                  max: 3200
               }
            }
         ],
         enableSctp: false,
         appData
      }
   }
}