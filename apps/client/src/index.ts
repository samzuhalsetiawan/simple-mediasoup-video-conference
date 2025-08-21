import type { ServerEvent, ServerEventData } from "@mediasoup-tutorial/event";
import type { Participant } from "./Participant";
import "./utils/extentions.ts";
import { MediasoupClient } from "./MediasoupClient.ts";

async function main() {
   const buttonShareCamera = document.querySelector("#btn-share-camera") as HTMLButtonElement;
   const buttonShareScreen = document.querySelector("#btn-share-screen") as HTMLButtonElement;
   const videoLocalVideo = document.querySelector(".local-video") as HTMLVideoElement;

   const socket = new WebSocket("http://localhost:3000/ws");
   const participants: Participant[] = [];
   const mediasoupClient = await MediasoupClient.initialize();

   socket.onopen = async () => {
      console.log(`[Socket Connected]`);
      await mediasoupClient.loadDevice(socket);
      await mediasoupClient.createSendTransport(socket);
      await mediasoupClient.createRecvTransport(socket);
   }

   socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as ServerEvent
      console.log(`[Receive Event] ${event.name}`);
      switch (event.name) {
         case "UPDATE_SOCKET_ID":
            onUpdateSocketId(socket, event.data);
         break;
         case "NEW_SOCKET_JOINED":
            onNewSocketJoined(socket, event.data);
         break;
         case "SOCKET_LEFT":
            onSocketLeft(socket, event.data);
         break;
      }
   }

   const onUpdateSocketId = (socket: WebSocket, data: ServerEventData<"UPDATE_SOCKET_ID">) => {
      document.querySelector(".local-container .display-name")!!.innerHTML = data.socketId
      socket.id = data.socketId;
   }

   const onNewSocketJoined = (socket: WebSocket, data: ServerEventData<"NEW_SOCKET_JOINED">) => {
      participants.push({ 
         socketId: data.socketId,
         mediaStream: new MediaStream()
      });
      showRemoteVideo(data.socketId);
   }

   const onSocketLeft = (socket: WebSocket, data: ServerEventData<"SOCKET_LEFT">) => {
      const participant = participants.find(p => p.socketId === data.socketId);
      if (!participant) return;
      participants.splice(participants.indexOf(participant), 1);
   }

   const showRemoteVideo = (id: string) => {
      const participant = participants.find(p => p.socketId === id);
      if (!participant) return;
      const divRemoteContainer = document.querySelector(".remote-container") as HTMLDivElement;
      const divVideoContainer = document.createElement("div") as HTMLDivElement;
      const spanDisplayName = document.createElement("span") as HTMLHeadingElement;
      const videoRemoteVideo = document.createElement("video") as HTMLVideoElement;
      divVideoContainer.classList.add("video-container");
      spanDisplayName.classList.add("display-name");
      spanDisplayName.innerText = id;
      videoRemoteVideo.classList.add("remote-video");
      videoRemoteVideo.autoplay = true;
      videoRemoteVideo.srcObject = participant.mediaStream;
      divVideoContainer.appendChild(spanDisplayName);
      divVideoContainer.appendChild(videoRemoteVideo);
      divRemoteContainer.appendChild(divVideoContainer);
   }

   const sendStream = async (stream: MediaStream) => {
      if (!mediasoupClient.sendTransport) return;
      const [ videoTrack ] = stream.getVideoTracks();
      const [ audioTrack ] = stream.getAudioTracks();
      if (videoTrack) {
         const videoProducer = await mediasoupClient.sendTransport.produce({ track: videoTrack });
         socket.sendEvent("PRODUCER_PRODUCE", { producerId: videoProducer.id });
      }
      if (audioTrack) {
         const audioProducer = await mediasoupClient.sendTransport.produce({ track: audioTrack });
         socket.sendEvent("PRODUCER_PRODUCE", { producerId: audioProducer.id });
      }
   }

   buttonShareCamera.addEventListener("click", async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await sendStream(stream);
      videoLocalVideo.srcObject = stream;
   });

   buttonShareScreen.addEventListener("click", async () => {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      await sendStream(stream);
      videoLocalVideo.srcObject = stream;
   });

}

document.getElementById("btn-start-app")?.addEventListener("click", () => {
   document.querySelector<HTMLDivElement>(".overlay")!!.style.display = "none";
   main();
});