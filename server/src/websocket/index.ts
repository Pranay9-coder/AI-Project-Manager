import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// WebSocket event types
export enum WSEvent {
  NEW_INVITATION = 'NEW_INVITATION',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
  INVITATION_REJECTED = 'INVITATION_REJECTED',
  NEW_TASK_ASSIGNED = 'NEW_TASK_ASSIGNED',
  TASK_STATUS_UPDATED = 'TASK_STATUS_UPDATED',
  CONNECTION_ACK = 'CONNECTION_ACK',
}

interface WSMessage {
  event: WSEvent;
  data: any;
}

// Map userId → WebSocket connection
const userSockets = new Map<string, WebSocket>();

let wss: WebSocketServer;

/**
 * Initialize WebSocket server alongside Express HTTP server
 */
export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    let userId: string | null = null;

    // Authenticate via query param token
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Authentication required');
        return;
      }

      const decoded = jwt.verify(token, config.supabase.jwtSecret) as {
        sub: string;
      };
      userId = decoded.sub;

      // Register user socket
      userSockets.set(userId, ws);

      // Send ACK
      ws.send(
        JSON.stringify({
          event: WSEvent.CONNECTION_ACK,
          data: { message: 'Connected to WebSocket', userId },
        })
      );

      console.log(`🔌 WS connected: ${userId} (total: ${userSockets.size})`);
    } catch (err) {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Handle messages from client (for future use)
    ws.on('message', (message: string) => {
      try {
        const parsed: WSMessage = JSON.parse(message.toString());
        console.log(`📨 WS message from ${userId}:`, parsed.event);
      } catch (err) {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (userId) {
        userSockets.delete(userId);
        console.log(`🔌 WS disconnected: ${userId} (total: ${userSockets.size})`);
      }
    });

    ws.on('error', (error) => {
      console.error(`WS error for ${userId}:`, error.message);
      if (userId) {
        userSockets.delete(userId);
      }
    });
  });

  console.log('🔌 WebSocket server initialized on /ws');
  return wss;
}

/**
 * Send event to a specific user
 */
export function sendToUser(userId: string, event: WSEvent, data: any): boolean {
  const socket = userSockets.get(userId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }));
    return true;
  }
  return false;
}

/**
 * Send event to multiple users
 */
export function sendToUsers(
  userIds: string[],
  event: WSEvent,
  data: any
): void {
  for (const userId of userIds) {
    sendToUser(userId, event, data);
  }
}

/**
 * Broadcast to all connected users
 */
export function broadcast(event: WSEvent, data: any): void {
  const message = JSON.stringify({ event, data });
  userSockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}

/**
 * Get connected user count
 */
export function getConnectedUsers(): number {
  return userSockets.size;
}
