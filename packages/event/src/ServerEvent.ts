import type { RtpCapabilities } from "mediasoup/types";

export type ServerEventName = Pick<ServerEvent, "name">["name"];
export type ServerEventData<K extends ServerEventName> = Pick<Extract<ServerEvent, { name: K }>, "data">["data"];
export type ServerEvent =
{
   name: "UPDATE_SOCKET_ID",
   data: {
      socketId: string
   }
}
|{ 
   name: "NEW_SOCKET_JOINED",
   data: {
      socketId: string
   }
}
|{ 
   name: "SOCKET_LEFT",
   data: {
      socketId: string
   }
}
|{ 
   name: "UPDATE_ROUTER_RTP_CAPABILITIES",
   data: {
      routerRtpCapabilities: RtpCapabilities
   }
}