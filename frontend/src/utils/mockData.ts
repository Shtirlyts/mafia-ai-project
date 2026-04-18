export const MOCK_NAMES = [
  'Алексей', 'Мария', 'Иван', 'Елена', 'Дмитрий', 'Ольга', 'Сергей', 'Анна',
  'Павел', 'Наталья', 'Михаил', 'Татьяна', 'Андрей', 'Екатерина', 'Николай', 'Дарья'
];

export const MAFIA_PHRASES = [
  "Я думаю, это {target}. Слишком тихо сидит.",
  "Народ, давайте голосовать против {target}, он точно мафия.",
  "Я мирный, клянусь! Мне кажется, мафия - это {target}.",
  "Слушайте, а почему {target} так странно себя ведет?",
  "{target} всю игру отмалчивается, подозрительно.",
  "Точно не я. Может {target}?",
  "Мне не нравится, как {target} голосует.",
  "Я считаю, что мафия кто-то из тех, кто голосовал против меня вчера.",
  "Не знаю... {target} кажется очень нервным."
];

export const DEFENSE_PHRASES = [
  "Вы что, с ума сошли? Я мирный житель!",
  "Это ошибка, я не мафия!",
  "Если вы меня сольете, то потеряете город.",
  "Ребята, я честный человек. Ищите среди других.",
  "Да вы посмотрите на {target}, он же явно вас обманывает!"
];

export const getRandomName = (excludeNames: string[]) => {
  const available = MOCK_NAMES.filter(n => !excludeNames.includes(n));
  if (available.length === 0) return MOCK_NAMES[0];
  return available[Math.floor(Math.random() * available.length)];
};

export const getRandomPhrase = (targetName: string) => {
  const phrase = MAFIA_PHRASES[Math.floor(Math.random() * MAFIA_PHRASES.length)]!;
  return phrase.replace('{target}', targetName);
};

export const getRandomDefense = () => {
  return DEFENSE_PHRASES[Math.floor(Math.random() * DEFENSE_PHRASES.length)]!;
};
