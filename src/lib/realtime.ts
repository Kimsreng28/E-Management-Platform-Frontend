// lib/realtime.ts
import Pusher from "pusher-js";

export const pusher = new Pusher("basekey", {
  cluster: "mt1", // optional if using Reverb locally
  wsHost: "127.0.0.1",
  wsPort: 8080,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
  authEndpoint: "http://localhost:3001/broadcasting/auth",
});
