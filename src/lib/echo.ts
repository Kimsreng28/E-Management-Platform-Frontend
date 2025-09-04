import Echo from "laravel-echo";
import Pusher from "pusher-js";

// In lib/echo.ts
let echoInstance: Echo<any> | null = null;

const initializeEcho = (token: string) => {
  if (typeof window === "undefined") return null;

  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  (window as any).Pusher = Pusher;

  console.log("Initializing new Echo instance");

  const echo = new Echo({
    broadcaster: "pusher",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    cluster: "mt1",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: Function) => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Authorization successful for channel:", channel.name);
            callback(false, data);
          })
          .catch((error) => {
            console.error("Authorization error:", error);
            callback(true, error);
          });
      },
    }),
  });

  // Store instance globally for cleanup
  (window as any).echoInstance = echo;
  return echo;
};

// Add a cleanup function
export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    console.log("Echo disconnected");
  }
};

export default initializeEcho;
