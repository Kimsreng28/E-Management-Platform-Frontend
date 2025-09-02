import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Echo: Echo<any>;
    Pusher: typeof Pusher;
  }
}

if (typeof window !== "undefined" && !window.Echo) {
  window.Pusher = Pusher;

  window.Echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "127.0.0.1",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  });
}

export default window.Echo;
