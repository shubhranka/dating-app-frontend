import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { WEBSOCKET_URL } from '../utils/constants';
import { Message } from '../types'; // Import your Message type

interface SocketHook {
    socket: Socket | null;
    isConnected: boolean;
    lastMessage: Message | null; // Example: Store last received message
    connectSocket: () => void;
    disconnectSocket: () => void;
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (event: string, data: any) => void;
    // Add listeners for specific events
    addMessageListener: (handler: (message: Message) => void) => void;
    removeMessageListener: (handler: (message: Message) => void) => void;
    // Add listeners for checkpoint reached, vibe check update, etc.
}

// Store listeners outside component to avoid re-adding on re-render
const messageListeners = new Set<(message: Message) => void>();


export const useWebSocket = (): SocketHook => {
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<Message | null>(null);
    const socketRef = useRef<Socket | null>(null);


    const connectSocket = useCallback(() => {
        if (!token || socketRef.current) {
            console.log('WebSocket: Already connected or no token.');
            return;
        }

        console.log('WebSocket: Attempting to connect...');
        const newSocket = io(WEBSOCKET_URL, {
            auth: { token }, // Send token for authentication
            transports: ['websocket'], // Force websocket transport
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('WebSocket: Connected', newSocket.id);
            setIsConnected(true);
            socketRef.current = newSocket; // Store the socket instance

            // --- Add General Listeners ---
            newSocket.on('newMessage', (message: Message) => {
                console.log('WebSocket: newMessage received', message);
                setLastMessage(message);
                // Notify all registered listeners
                messageListeners.forEach(listener => listener(message));
            });

             newSocket.on('checkpointReached', (data: { matchId: string, stage: number }) => {
                console.log('WebSocket: checkpointReached received', data);
                // TODO: Dispatch event or update context based on this
             });

             newSocket.on('vibeCheckUpdate', (data: { matchId: string, outcome: string }) => {
                 console.log('WebSocket: vibeCheckUpdate received', data);
                 // TODO: Dispatch event or update context
             });

            newSocket.on('error', (error: any) => {
                console.error('WebSocket: Error received:', error);
                // Handle specific errors, e.g., auth error
            });
        });

        newSocket.on('disconnect', (reason: string) => {
            console.log('WebSocket: Disconnected', reason);
            setIsConnected(false);
            socketRef.current = null; // Clear the ref on disconnect
            if (reason === 'io server disconnect') {
                // The server intentionally disconnected the socket, e.g., auth failed
                // Handle potential logout or token refresh logic here
            }
            // Reconnection is handled automatically by socket.io-client by default
        });

        newSocket.on('connect_error', (err) => {
            console.error("WebSocket: Connection Error:", err.message);
            setIsConnected(false);
            socketRef.current = null;
        });

    }, [token]);


    const disconnectSocket = useCallback(() => {
        if (socketRef.current) {
            console.log('WebSocket: Disconnecting...');
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
            messageListeners.clear(); // Clear listeners on manual disconnect
        }
    }, []);


    // Connect automatically when token is available
    useEffect(() => {
        if (token) {
            connectSocket();
        } else {
            disconnectSocket(); // Disconnect if token becomes null (logout)
        }
        // Cleanup on unmount
        return () => {
            disconnectSocket();
        };
    }, [token, connectSocket, disconnectSocket]);


    // --- Emitter Functions ---
    const joinRoom = useCallback((roomId: string) => {
        if (socketRef.current && isConnected) {
             console.log(`WebSocket: Emitting joinMatchRoom for ${roomId}`);
             socketRef.current.emit('joinMatchRoom', roomId);
        } else {
             console.warn('WebSocket: Cannot join room, socket not connected.');
        }
    }, [isConnected]);

    const leaveRoom = useCallback((roomId: string) => {
         if (socketRef.current && isConnected) {
             console.log(`WebSocket: Emitting leaveMatchRoom for ${roomId}`);
             socketRef.current.emit('leaveMatchRoom', roomId);
        }
    }, [isConnected]);

    const sendMessage = useCallback((event: string, data: any) => {
         if (socketRef.current && isConnected) {
             console.log(`WebSocket: Emitting ${event}`, data);
             socketRef.current.emit(event, data);
         } else {
             console.warn(`WebSocket: Cannot emit ${event}, socket not connected.`);
         }
    }, [isConnected]);


    // --- Listener Management ---
    const addMessageListener = useCallback((handler: (message: Message) => void) => {
        messageListeners.add(handler);
        console.log('WebSocket: Added message listener. Count:', messageListeners.size);
    }, []);

    const removeMessageListener = useCallback((handler: (message: Message) => void) => {
        messageListeners.delete(handler);
         console.log('WebSocket: Removed message listener. Count:', messageListeners.size);
    }, []);


    return {
        socket: socketRef.current,
        isConnected,
        lastMessage,
        connectSocket,
        disconnectSocket,
        joinRoom,
        leaveRoom,
        sendMessage,
        addMessageListener,
        removeMessageListener,
        // Add other listener management functions
    };
};