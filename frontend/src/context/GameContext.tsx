import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
<<<<<<< Updated upstream
import { Player, GamePhase, GameSettings, ChatMessage, Vote, GameMode } from '../types';
=======
import { Player, Role, GamePhase, GameSettings, ChatMessage, Vote, GameMode } from '../types';
>>>>>>> Stashed changes
import { getRandomName, getRandomPhrase, getRandomDefense } from '../utils/mockData';
import { createRoom, joinRoom, getRoomState, startGame as apiStartGame } from '../api/client';

interface GameContextProps {
  phase: GamePhase;
  players: Player[];
  humanCount: number;
  maxHumans: number;
  mainPlayerId: string;
  chat: ChatMessage[];
  dayCount: number;
  settings: GameSettings;
  timer: number;
  eliminatedPlayer: Player | null;
  winner: 'mafia' | 'villagers' | null;
  turingStats: any;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  setSettings: (s: GameSettings) => void;
  initializeGame: (mode: GameMode, totalPlayers: number, settings: any) => void;
  startLobby: (playerName: string, settings?: any) => Promise<void>;
  joinLobby: (roomCode: string, playerName: string) => Promise<void>;
  startGameFromLobby: () => Promise<void>;
  nextPhase: () => void;
  submitNightAction: (targetId: string) => void;
  submitVote: (targetId: string) => void;
  addChatMessage: (text: string, isSystem?: boolean, senderId?: string) => void;
  submitTuringTest: (guesses: Record<string, boolean>) => void;
  myPlayer: Player | undefined;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

const MAIN_USER_ID = 'user-1';
const DAY_PHASE_DURATION = 20; // Fast for prototype
const VOTING_PHASE_DURATION = 15;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    totalPlayers: 6, mode: 'mixed', roles: { mafia: 1, detective: 1, doctor: 0 }
  });
  const [dayCount, setDayCount] = useState(1);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [timer, setTimer] = useState(0);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [winner, setWinner] = useState<'mafia' | 'villagers' | null>(null);
  
  const [nightActions, setNightActions] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<Vote[]>([]);
  const [turingStats, setTuringStats] = useState<any>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [humanCount, setHumanCount] = useState(0);
  const [maxHumans, setMaxHumans] = useState(5);
  
  const timerRef = useRef<number | null>(null);
  const botChatRef = useRef<number | null>(null);
  const pollingRef = useRef<number | null>(null);

  const myPlayer = players.find(p => p.id === MAIN_USER_ID);

  const addChatMessage = (text: string, isSystem = false, senderId = 'system') => {
    setChat(prev => [...prev, { id: Math.random().toString(36).substring(7), text, isSystem, senderId, timestamp: Date.now() }]);
  };

  const initializeGame = (mode: GameMode, totalPlayers: number, roleSettings: any) => {
    setSettings({ totalPlayers, mode, roles: roleSettings });
    setPhase('lobby');
    setDayCount(1);
    
    const newPlayers: Player[] = [];
    const usedNames: string[] = [];
    
    if (mode !== 'ai_only') {
      newPlayers.push({
        id: MAIN_USER_ID, name: 'Вы', role: 'villager', isAI: false, isAlive: true, avatarId: 1
      });
    }

    const botsToCreate = mode === 'ai_only' ? totalPlayers : totalPlayers - 1;
    for (let i = 0; i < botsToCreate; i++) {
      const name = getRandomName(usedNames) || `Бот ${i}`;
      usedNames.push(name);
      newPlayers.push({
        id: `bot-${i}`, name, role: 'villager', isAI: true, isAlive: true, avatarId: (i % 5) + 2
      });
    }
    setPlayers(newPlayers);
    addChatMessage(`Лобби создано. Ожидание игроков...`, true);
  };

  const startNight = () => {
    setPhase('night');
    setNightActions({});
    addChatMessage(`Наступает ночь ${dayCount}. Город засыпает.`, true);
    
    const aliveBots = players.filter(p => p.isAlive && p.isAI);
    const botActions: Record<string, string> = {};
    const aliveTargets = players.filter(p => p.isAlive);
    
    aliveBots.forEach(bot => {
      if (['mafia', 'doctor', 'detective'].includes(bot.role)) {
        let targetPool = aliveTargets;
        if (bot.role === 'mafia') targetPool = aliveTargets.filter(p => p.role !== 'mafia');
        if (targetPool.length > 0) {
<<<<<<< Updated upstream
           botActions[bot.role] = targetPool[Math.floor(Math.random() * targetPool.length)]!.id;
=======
           botActions[bot.role] = targetPool[Math.floor(Math.random() * targetPool.length)].id;
>>>>>>> Stashed changes
        }
      }
    });

    const activeRoles = ['mafia', 'doctor', 'detective'];
    const needsUserAction = myPlayer?.isAlive && activeRoles.includes(myPlayer.role);
    
    setNightActions(botActions);

    if (!needsUserAction) {
      setTimeout(() => resolveNight(botActions), 4000); // 4 second night if user has no action
    }
  };

  const submitNightAction = (targetId: string) => {
    if (!myPlayer) return;
    const finalActions = { ...nightActions, [myPlayer.role]: targetId };
    setNightActions(finalActions);
    resolveNight(finalActions);
  };

  const resolveNight = (actions: Record<string, string>) => {
    let killedId = actions['mafia'];
    const healedId = actions['doctor'];
    const checkedId = actions['detective'];

    if (killedId === healedId) killedId = undefined;

    const newPlayers = players.map(p => p.id === killedId ? { ...p, isAlive: false } : p);
    setPlayers(newPlayers);
    
    if (killedId) {
      const p = players.find(p => p.id === killedId);
      setEliminatedPlayer(p || null);
      addChatMessage(`Утром город узнал страшную новость. Убит ${p?.name}.`, true);
    } else {
      setEliminatedPlayer(null);
      addChatMessage(`Ночь прошла спокойно. Никто не пострадал.`, true);
    }

    if (checkedId && myPlayer?.role === 'detective' && myPlayer?.isAlive) {
      const cp = players.find(p => p.id === checkedId);
      if (cp) addChatMessage(`(Комиссар) Вы узнали, что ${cp.name} — ${cp.role === 'mafia' ? 'Мафия' : 'Мирный житель'}.`, true);
    }

    setTimeout(() => {
      if (!checkWin(newPlayers)) startDay(newPlayers);
    }, 4000);
  };

  const startDay = (currentPlayers: Player[]) => {
    setPhase('day');
    setTimer(DAY_PHASE_DURATION);
    addChatMessage(`День ${dayCount}. Начинается обсуждение.`, true);

    const aliveBots = currentPlayers.filter(p => p.isAlive && p.isAI);
    if (aliveBots.length > 0) {
      botChatRef.current = setInterval(() => {
        if (Math.random() > 0.4) {
<<<<<<< Updated upstream
          const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)]!;
=======
          const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
>>>>>>> Stashed changes
          const targetPool = currentPlayers.filter(p => p.isAlive && p.id !== bot.id);
          const target = targetPool[Math.floor(Math.random() * targetPool.length)];
          if (target) {
            addChatMessage(Math.random() > 0.8 ? getRandomDefense() : getRandomPhrase(target.name), false, bot.id);
          }
        }
      }, 4000);
    }

    let t = DAY_PHASE_DURATION;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimer(t);
      if (t <= 0) {
        clearInterval(timerRef.current!);
        clearInterval(botChatRef.current!);
        startVoting(currentPlayers);
      }
    }, 1000);
  };

  const startVoting = (currentPlayers: Player[]) => {
    setPhase('voting');
    setTimer(VOTING_PHASE_DURATION);
    setVotes([]);
    addChatMessage('Голосование началось! У вас 15 секунд.', true);

    const aliveBots = currentPlayers.filter(p => p.isAlive && p.isAI);
    const aliveTargets = currentPlayers.filter(p => p.isAlive);
    
    // Bots vote after 5 seconds
    setTimeout(() => {
      const botVotes = aliveBots.map(bot => {
<<<<<<< Updated upstream
         const t = aliveTargets[Math.floor(Math.random() * aliveTargets.length)]!;
=======
         const t = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
>>>>>>> Stashed changes
         return { voterId: bot.id, targetId: t.id };
      });
      setVotes(prev => {
         // keep user vote if exists
         const userVote = prev.find(v => v.voterId === MAIN_USER_ID);
         return userVote ? [...botVotes, userVote] : botVotes;
      });
    }, 5000);

    let t = VOTING_PHASE_DURATION;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimer(t);
      if (t <= 0) {
        clearInterval(timerRef.current!);
        resolveVoting(); // need a stable ref or functional state update inside resolveVoting
      }
    }, 1000);
  };

  const submitVote = (targetId: string) => {
    if (!myPlayer || !myPlayer.isAlive) return;
    setVotes(prev => {
      const filtered = prev.filter(v => v.voterId !== myPlayer.id);
      return [...filtered, { voterId: myPlayer.id, targetId }];
    });
  };

  const resolveVoting = () => {
    setVotes(currentVotes => {
      const voteCounts: Record<string, number> = {};
      currentVotes.forEach(v => {
        voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
      });

      let maxVotes = 0;
      let eliminatedIds: string[] = [];
      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) { maxVotes = count; eliminatedIds = [id]; }
        else if (count === maxVotes) { eliminatedIds.push(id); }
      });

      let nextPlayers = players;
      setPlayers(prev => {
         let newArr = prev;
         if (eliminatedIds.length === 1) {
            newArr = prev.map(p => p.id === eliminatedIds[0] ? { ...p, isAlive: false } : p);
         }
         nextPlayers = newArr;
         return newArr;
      });

      if (eliminatedIds.length === 1) {
        const id = eliminatedIds[0];
        const p = players.find(p => p.id === id); // rely on closure players for name mapping
        setEliminatedPlayer(p || null);
        addChatMessage(`По итогам голосования город покидает ${p?.name}.`, true);
      } else {
        setEliminatedPlayer(null);
        addChatMessage(`Голоса разделились. Никто не покидает город.`, true);
      }

      setPhase('elimination');
      
      setTimeout(() => {
        if (!checkWin(nextPlayers)) {
          setDayCount(d => d + 1);
          startNight();
        }
      }, 5000);

      return currentVotes;
    });
  };

  const checkWin = (currentPlayers: Player[]) => {
    const aliveMafia = currentPlayers.filter(p => p.isAlive && p.role === 'mafia').length;
    const aliveVillagers = currentPlayers.filter(p => p.isAlive && p.role !== 'mafia').length;

    if (aliveMafia === 0) {
      setWinner('villagers');
      setPhase('game_over');
      return true;
    } else if (aliveMafia >= aliveVillagers) {
      setWinner('mafia');
      setPhase('game_over');
      return true;
    }
    return false;
  };

  const submitTuringTest = (guesses: Record<string, boolean>) => {
    let correct = 0;
    let total = 0;
    players.forEach(p => {
      if (p.id !== MAIN_USER_ID) {
        total++;
        if (guesses[p.id] === p.isAI) correct++;
      }
    });
    setTuringStats({ correct, total, guesses });
    setPhase('stats');
  };

  const nextPhase = () => {
    if (phase === 'reveal') startNight();
    // other manual transitions can go here if needed
  };

  // API интеграция
  const startLobby = async (playerName: string, settings?: any) => {
    try {
      const response = await createRoom({
        player_name: playerName,
        mode: (settings?.mode?.toLowerCase() as 'humans_only' | 'mixed' | 'ai_only') || 'mixed',
        ai_count: settings?.aiCount || 2,
        max_players: settings?.totalPlayers || 8
      });
      setRoomCode(response.room_code);
      setPlayerId(response.player_id);
      setIsHost(true);
      setPhase('lobby');
      // Начинаем polling
      startPolling(response.room_code);
      addChatMessage(`Лобби создано. Код комнаты: ${response.room_code}`, true);
    } catch (error) {
      console.error('Ошибка создания лобби:', error);
      addChatMessage('Не удалось создать лобби', true);
    }
  };

  const joinLobby = async (roomCode: string, playerName: string) => {
    try {
      const response = await joinRoom({
        room_code: roomCode,
        player_name: playerName
      });
      setRoomCode(roomCode);
      setPlayerId(response.player_id);
      setIsHost(false);
      setPhase('lobby');
      // Начинаем polling
      startPolling(roomCode);
      addChatMessage(`Вы присоединились к лобби ${roomCode}`, true);
    } catch (error) {
      console.error('Ошибка присоединения к лобби:', error);
      addChatMessage('Не удалось присоединиться к лобби', true);
    }
  };

  const startGameFromLobby = async () => {
    if (!roomCode || !playerId) {
      addChatMessage('Не удалось начать игру: отсутствует код комнаты или ID игрока', true);
      return;
    }
    try {
      await apiStartGame(roomCode, playerId);
      // После успешного старта игра переходит в фазу reveal (или night) через polling
      addChatMessage('Игра началась!', true);
    } catch (error) {
      console.error('Ошибка старта игры:', error);
      addChatMessage('Не удалось начать игру', true);
    }
  };

  // Polling для обновления состояния лобби
  const startPolling = (roomCode: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const fetchState = async () => {
      try {
        const state = await getRoomState(roomCode);
        // Обновляем список игроков
        const newPlayers: Player[] = state.players.map((p: any) => ({
          id: p.player_id,
          name: p.name,
          role: p.role || 'villager',
          isAI: p.is_ai ?? false,
          isAlive: p.is_alive,
          avatarId: 1 // временно
        }));
        setPlayers(newPlayers);
        // Вычисляем количество людей (не ботов)
        const humanCount = newPlayers.filter(p => !p.isAI).length;
        setHumanCount(humanCount);
        // Максимальное количество людей (пока используем totalPlayers из настроек)
        const maxHumans = settings.totalPlayers;
        setMaxHumans(maxHumans);
        // Если фаза изменилась (например, началась игра), обновляем phase
        if (state.phase !== phase) {
          // Увеличиваем счетчик дня при переходе от ночи к дню
          if (phase === 'night' && state.phase === 'day') {
            setDayCount(prev => prev + 1);
          }
          setPhase(state.phase as GamePhase);
        }
      } catch (error) {
        console.error('Ошибка polling:', error);
      }
    };
    fetchState(); // сразу запросить
    pollingRef.current = setInterval(fetchState, 5000); // каждые 5 секунд
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botChatRef.current) clearInterval(botChatRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <GameContext.Provider value={{
      phase, players, humanCount, maxHumans, mainPlayerId: MAIN_USER_ID, chat, dayCount, settings, timer,
      eliminatedPlayer, winner, turingStats, myPlayer,
      roomCode, playerId, isHost,
      setSettings, initializeGame, startLobby, joinLobby, startGameFromLobby, nextPhase,
      submitNightAction, submitVote, addChatMessage, submitTuringTest
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within Provider");
  return context;
<<<<<<< Updated upstream
};
=======
};
>>>>>>> Stashed changes
