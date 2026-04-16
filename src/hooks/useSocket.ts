import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket(): Socket {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return socketRef.current;
}
