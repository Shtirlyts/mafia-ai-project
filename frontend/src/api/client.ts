<<<<<<< Updated upstream
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
=======
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? 'http://localhost:8000';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    const response = await fetch(`${API_BASE_URL}/v1/room/create`, {
=======
    const response = await fetch(`${API_BASE_URL}/api/v1/room/create`, {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const response = await fetch(`${API_BASE_URL}/v1/room/join`, {
=======
    const response = await fetch(`${API_BASE_URL}/api/v1/room/join`, {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const response = await fetch(`${API_BASE_URL}/v1/room/${roomCode}/state`);
=======
    const response = await fetch(`${API_BASE_URL}/api/v1/room/${roomCode}/state`);
>>>>>>> Stashed changes
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get room state: ${error}`);
    }
    return await response.json();
}

export async function startGame(roomCode: string, playerId: string): Promise<{ status: string; phase: string }> {
<<<<<<< Updated upstream
    const response = await fetch(`${API_BASE_URL}/v1/room/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
=======
    const url = new URL(`${API_BASE_URL}/api/v1/room/${roomCode}/start`);
    url.searchParams.set('player_id', playerId);
    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
>>>>>>> Stashed changes
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to start game: ${error}`);
    }
    return await response.json();
}