export type ClientEventName = Pick<ClientEvent, "name">["name"];
export type ClientEventData<K extends ClientEventName> = Pick<Extract<ClientEvent, { name: K }>, "data">["data"];
export type ClientEvent =
|{ 
   name: "REQUEST_ROUTER_RTP_CAPABILITIES",
   data: null
}