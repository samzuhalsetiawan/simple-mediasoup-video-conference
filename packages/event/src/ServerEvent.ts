import type { DtlsParameters, IceCandidate, IceParameters, RtpCapabilities } from "mediasoup/types";

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
|{ 
   name: "SEND_TRANSPORT_CREATED",
   data: {
      id: string,
      iceParameters: IceParameters,
      iceCandidates: IceCandidate[],
      dtlsParameters: DtlsParameters
   }
}
|{ 
   name: "RECV_TRANSPORT_CREATED",
   data: {
      id: string,
      iceParameters: IceParameters,
      iceCandidates: IceCandidate[],
      dtlsParameters: DtlsParameters
   }
}
|{ 
   name: "SEND_TRANSPORT_CONNECTED",
   data: null
}
|{ 
   name: "RECV_TRANSPORT_CONNECTED",
   data: null
}
|{
   name: "PRODUCER_CREATED",
   data: {
      producerId: string
   }
}