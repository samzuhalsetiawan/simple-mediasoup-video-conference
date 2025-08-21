import type { ClientEvent, ClientEventData, ClientEventName, ServerEvent, ServerEventData, ServerEventName } from "@mediasoup-tutorial/event";

declare global {
   interface WebSocket {
      id: string;
      sendEvent<T extends ClientEventName>(name: T, data: ClientEventData<T>): void;
      once<T extends ServerEventName>(name: T): Promise<ServerEventData<T>>;
   }
}

WebSocket.prototype.sendEvent = function<T extends ClientEventName>(name: T, data: ClientEventData<T>) {
   const event = { name, data } as ClientEvent
   this.send(JSON.stringify(event));
   console.log(name);
}

WebSocket.prototype.once = function<T extends ServerEventName>(name: T): Promise<ServerEventData<T>> {
   return new Promise((resolve, reject) => {
      try {
         const listener = (message: MessageEvent) => {
            const event = JSON.parse(message.data) as ServerEvent
            const data: any = event.data;
            if (event.name === name) {
               resolve(data);
               this.removeEventListener("message", listener);
            }
         }
         this.addEventListener("message", listener);
      } catch (error: any) {
         reject(error);
      }
   });
}