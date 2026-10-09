import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      // The backend identifies the user from the session cookie sent in the
      // handshake and joins the right room itself; without credentials it
      // drops the socket.
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  // Also covers a socket that is still in its handshake: it would otherwise
  // finish connecting with the session that is being closed.
  socket?.disconnect();
}
