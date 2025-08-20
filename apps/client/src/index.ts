async function main() {
   const socket = new WebSocket("http://localhost:3000/ws");
   socket.onopen = () => {
      socket.send("Socket Connected");
      console.log("Socket Connected");
   }
}

document.getElementById("btn-start-app")?.addEventListener("click", () => {
   document.querySelector<HTMLDivElement>(".overlay")!!.style.display = "none";
   main();
});