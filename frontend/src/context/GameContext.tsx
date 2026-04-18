import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, Role, GamePhase, GameSettings, ChatMessage, Vote, GameMode } from '../types';
import { getRandomName, getRandomPhrase, getRandomDefense } from '../utils/mockData';

interface GameContextProps {
  phase: GamePhase;
  players: Player[];
  mainPlayerId: string;
  chat: ChatMessage[];
  dayCount: number;
  settings: GameSettings;
  timer: number;
  eliminatedPlayer: Player | null;
  winner: 'mafia' | 'villagers' | null;
  turingStats: any;
  setSettings: (s: GameSettings) => void;
  initializeGame: (mode: GameMode, totalPlayers: number, settings: any) => void;
  startGameFromLobby: () => void;
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
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botChatRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const name = getRandomName(usedNames);
      usedNames.push(name);
      newPlayers.push({
        id: `bot-${i}`, name, role: 'villager', isAI: true, isAlive: true, avatarId: (i % 5) + 2
      });
    }
    setPlayers(newPlayers);
    addChatMessage(`Лобби создано. Ожидание игроков...`, true);
  };

  const startGameFromLobby = () => {
    const roles: Role[] = [];
    for (let i = 0; i < settings.roles.mafia; i++) roles.push('mafia');
    for (let i = 0; i < settings.roles.detective; i++) roles.push('detective');
    for (let i = 0; i < settings.roles.doctor; i++) roles.push('doctor');
    
    while (roles.length < players.length) roles.push('villager');
    roles.sort(() => Math.random() - 0.5);

    setPlayers(players.map((p, i) => ({ ...p, role: roles[i] })));
    setPhase('reveal');
    setChat([]);
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
           botActions[bot.role] = targetPool[Math.floor(Math.random() * targetPool.length)].id;
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
          const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
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
         const t = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
         return { voterId: bot.id, targetId: t?.id };
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botChatRef.current) clearInterval(botChatRef.current);
    };
  }, []);

  return (
    <GameContext.Provider value={{
      phase, players, mainPlayerId: MAIN_USER_ID, chat, dayCount, settings, timer,
      eliminatedPlayer, winner, turingStats, myPlayer,
      setSettings, initializeGame, startGameFromLobby, nextPhase,
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
};
