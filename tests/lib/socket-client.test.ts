/**
 * What: Unit tests for the notifications socket client.
 * Why: The backend authenticates the socket with the session cookie sent in
 *      the handshake and joins the user's room by itself. The client must send
 *      credentials, must not announce an identity of its own, and must be able
 *      to drop a connection that has not finished its handshake yet.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { ioMock, fakeSocket } = vi.hoisted(() => {
  const fakeSocket = {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
  };
  return { fakeSocket, ioMock: vi.fn(() => fakeSocket) };
});

vi.mock("socket.io-client", () => ({ io: ioMock }));

async function loadSocketClient() {
  // The module keeps the socket in a module-level singleton.
  vi.resetModules();
  return import("@/lib/socket-client");
}

describe("socket-client", () => {
  beforeEach(() => {
    ioMock.mockClear();
    Object.values(fakeSocket).forEach((value) => {
      if (typeof value === "function") (value as ReturnType<typeof vi.fn>).mockClear();
    });
    fakeSocket.connected = false;
  });

  it("creates one manually connected client that sends the session cookie", async () => {
    const { getSocket } = await loadSocketClient();

    getSocket();
    getSocket();

    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(ioMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ autoConnect: false, withCredentials: true }),
    );
  });

  it("connects without announcing a user id", async () => {
    const { connectSocket } = await loadSocketClient();

    connectSocket();

    expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
    expect(fakeSocket.emit).not.toHaveBeenCalled();
    expect(fakeSocket.once).not.toHaveBeenCalled();
  });

  it("does not reconnect a socket that is already connected", async () => {
    const { connectSocket } = await loadSocketClient();
    fakeSocket.connected = true;

    connectSocket();

    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });

  it("disconnects a socket whose handshake has not finished", async () => {
    const { connectSocket, disconnectSocket } = await loadSocketClient();
    connectSocket();
    fakeSocket.connected = false;

    disconnectSocket();

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("does not create a socket just to disconnect it", async () => {
    const { disconnectSocket } = await loadSocketClient();

    disconnectSocket();

    expect(ioMock).not.toHaveBeenCalled();
  });
});
