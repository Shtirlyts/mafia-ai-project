// Используем тот же базовый URL, что и в client.ts
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'http://localhost:8000';

export type WSMessageType =
  | 'chat' 
  | 'phase_change' 
  | 'state_update' 
  | 'night_chat' 
  | 'vote' 
  | 'night_action' 
  | 'ping' 
  | 'get_state';

export interface WSBaseMessage {
  type: WSMessageType;
}

export interface WSChatMessage extends WSBaseMessage {
  type: 'chat';
  sender_id: string;
  sender_name: string;
  text: string;
  phase: string;
  timestamp?: string;
}

export interface WSPhaseChangeMessage extends WSBaseMessage {
  type: 'phase_change';
  phase: string;
  duration: number;
}

export interface WSStateUpdateMessage extends WSBaseMessage {
  type: 'state_update';
  data: {
    phase: string;
    players: Array<{
      player_id: string;
      name: string;
      role: string;
      is_ai: boolean;
      is_alive: boolean;
      avatar_id?: number;
    }>;
    winner: string | null;
    eliminated_player: string | null;
    vote_results: Record<string, number>;
    day_chat: Array<{
      sender_id: string;
      sender_name: string;
      text: string;
      timestamp: string;
    }>;
    night_chat: Array<{
      sender_id: string;
      sender_name: string;
      text: string;
      timestamp: string;
    }>;
  };
}

export type IncomingWSMessage = 
  | WSChatMessage 
  | WSPhaseChangeMessage 
  | WSStateUpdateMessage;

export interface OutgoingWSChatMessage {
  type: 'chat';
  text: string;
}

export interface OutgoingWSVoteMessage {
  type: 'vote';
  target_id: string;
}

export interface OutgoingWSNightActionMessage {
  type: 'night_action';
  action: 'kill' | 'check' | 'save';
  target_id: string;
}

export type OutgoingWSMessage = 
  | OutgoingWSChatMessage 
  | OutgoingWSVoteMessage 
  | OutgoingWSNightActionMessage;

export type WSMessageHandler = (message: IncomingWSMessage) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: WSMessageHandler[] = [];
  private roomCode: string = '';
  private clientId: string = '';

  constructor() {
    // Автоматическое переподключение при закрытии
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.disconnect());
    }
  }

  connect(roomCode: string, clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roomCode = roomCode;
      this.clientId = clientId;

      // Определяем WebSocket URL
      const baseUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
      const wsUrl = `${baseUrl}/ws/${roomCode}/${clientId}`;
      
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.attemptReconnect();
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
  }

  send(message: OutgoingWSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  addMessageHandler(handler: WSMessageHandler): void {
    this.handlers.push(handler);
  }

  removeMessageHandler(handler: WSMessageHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  private handleMessage(data: any): void {
    // Валидация типа сообщения
    if (!data.type) {
      console.warn('Received message without type:', data);
      return;
    }

    const message = data as IncomingWSMessage;
    this.handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.roomCode && this.clientId) {
        this.connect(this.roomCode, this.clientId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Синглтон экземпляр для использования во всем приложении
export const gameWebSocket = new GameWebSocket();