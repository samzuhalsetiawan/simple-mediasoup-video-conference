import { WebSocket } from "ws";
import type { ServerEvent, ServerEventData, ServerEventName } from "@mediasoup-tutorial/event";

declare module "ws" {
   interface WebSocket {
      id: string;
      sendEvent<T extends ServerEventName>(name: T, data: ServerEventData<T>): void;
   }
}

WebSocket.prototype.sendEvent = function<T extends ServerEventName>(name: T, data: ServerEventData<T>) {
   const event = { name, data } as ServerEvent;
   this.send(JSON.stringify(event));
   console.log(`[Sending Event] ${name}`);
}