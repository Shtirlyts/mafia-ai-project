const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface CreateRoomRequest {
    player_name: string;
    mode?: 'humans_only' | 'mixed' | 'ai_only';
    max_players?: number;
    ai_count?: number | null;
    mafia_count?: number;
    detective?: boolean;
    doctor?: boolean;
    night_duration_seconds?: number;
    day_duration_seconds?: number;
    voting_duration_seconds?: number;
}

export interface CreateRoomResponse {
    room_code: string;
    player_id: string;
}

export interface JoinRoomRequest {
    room_code: string;
    player_name: string;
}

export interface JoinRoomResponse {
    player_id: string;
    room_state: RoomStateResponse;
}

export interface RoomStateResponse {
    phase: string;
    players: PlayerSchema[];
    winner: string | null;
}

export interface PlayerSchema {
    player_id: string;
    name: string;
    is_alive: boolean;
    role?: string | null;
    is_ai?: boolean | null;
}

export async function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create room: ${error}`);
    }
    return await response.json();
}

export async function joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to join room: ${error}`);
    }
    return await response.json();
}

export async function getRoomState(roomCode: string): Promise<RoomStateResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/room/${roomCode}/state`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get room state: ${error}`);
    }
    return await response.json();
}

export async function startGame(roomCode: string, playerId: string): Promise<{ status: string; phase: string }> {
    const response = await fetch(`${API_BASE_URL}/v1/room/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to start game: ${error}`);
    }
    return await response.json();
}