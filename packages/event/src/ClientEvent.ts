import type { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/types";

export type ClientEventName = Pick<ClientEvent, "name">["name"];
export type ClientEventData<K extends ClientEventName> = Pick<Extract<ClientEvent, { name: K }>, "data">["data"];
export type ClientEvent =
|{ 
   name: "REQUEST_ROUTER_RTP_CAPABILITIES",
   data: null
}
|{ 
   name: "CREATE_SEND_TRANSPORT",
   data: null
}
|{ 
   name: "CREATE_RECV_TRANSPORT",
   data: {
      deviceRtpCapabilities: RtpCapabilities
   }
}
|{ 
   name: "CONNECT_SEND_TRANSPORT",
   data: { 
      transportId: string,
      dtlsParameters: DtlsParameters
   }
}
|{ 
   name: "CONNECT_RECV_TRANSPORT",
   data: { 
      transportId: string,
      dtlsParameters: DtlsParameters
   }
}
|{ 
   name: "CREATE_PRODUCER",
   data: { 
      transportId: string,
      kind: MediaKind,
      rtpParameters: RtpParameters
   }
}
|{
   name: "PRODUCER_PRODUCE",
   data: {
      producerId: string
   }
}