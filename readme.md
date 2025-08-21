# Simple Web Video Conference using Mediasoup 🍲
Simple real-time video converence web based app created using [mediasoup](https://mediasoup.org/) library. This app using SFU (Selective Forwarding Unit) topology.

This app just for educational purpose only and not production ready app.

## Installation
Clone the repository and install it using [PNPM](https://pnpm.io/)
```bash
   pnpm install
```
Mediasoup needs to build worker binary in local host otherwise you cant spawn Worker instance. PNPM by default blocking this behavior, so approve it by run
```bash
   pnpm approve-builds
```
and then select mediasoup script and you're good to go.
## Run the app
By simply run
```bash
   pnpm run dev
```
it will run frontend and backend development server together in pararel.

The server run in port 3000, you can open the web in http://localhost:1234/ (Parsel default development server) and then click "start app" button.

## Screenshot
[![Screenshot-from-2025-08-21-21-33-47-edited.png](https://i.postimg.cc/pdDy5Nkb/Screenshot-from-2025-08-21-21-33-47-edited.png)](https://postimg.cc/5H2fDRZn)

## How do i make it?
You can read my [medium](https://medium.com/@samzuhalsetiawan/membuat-web-based-real-time-video-conference-app-menggunakan-mediasoup-library-a60011da43f8) article.

## License
Do whatever you like