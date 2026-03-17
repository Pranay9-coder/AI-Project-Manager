type WSEventHandler = (data: any) => void;

export const WSEvent = {
  NEW_INVITATION: 'NEW_INVITATION',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  INVITATION_REJECTED: 'INVITATION_REJECTED',
  NEW_TASK_ASSIGNED: 'NEW_TASK_ASSIGNED',
  TASK_STATUS_UPDATED: 'TASK_STATUS_UPDATED',
  CONNECTION_ACK: 'CONNECTION_ACK',
  GITHUB_PR_CREATED: 'GITHUB_PR_CREATED',
  AI_CODE_REVIEW_COMPLETED: 'AI_CODE_REVIEW_COMPLETED',
  PROJECT_RISK_ALERT: 'PROJECT_RISK_ALERT',
} as const;

export type WSEvent = typeof WSEvent[keyof typeof WSEvent];

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<WSEventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    this.doConnect();
  }

  private doConnect() {
    if (!this.token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?token=${this.token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data);
        const handlers = this.listeners.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      } catch (err) {
        // Ignore malformed
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected, reconnecting in 3s...');
      this.reconnectTimer = setTimeout(() => this.doConnect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
  }

  on(event: WSEvent, handler: WSEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: WSEvent, handler: WSEventHandler) {
    this.listeners.get(event)?.delete(handler);
  }
}

export const wsService = new WebSocketService();
