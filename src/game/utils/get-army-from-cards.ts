import { GameCard } from '../types';

export const getArmyFromCards = (cards: GameCard[], incrementCount) => {
  if (cards.length < 3) return undefined;
  const increments = [4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45];
  let army = 0;

  const withJoker = cards.find((v) => v === GameCard.Ace);
  const queens = cards.filter((v) => v === GameCard.Jack);
  const kings = cards.filter((v) => v === GameCard.Queen);
  const aces = cards.filter((v) => v === GameCard.King);
  const differentCards =
    cards.indexOf(GameCard.Jack) !== -1 &&
    cards.indexOf(GameCard.Queen) !== -1 &&
    cards.indexOf(GameCard.King) !== -1;

  const updateCards = (card) => {
    for (let i = 0; i < 3; i++) {
      const idx = cards.findIndex((v) => v === card);
      cards.splice(idx, 1);
    }
  };
  const addArmies = () => {
    army = increments[incrementCount];
    if (!army) army = 45;
    incrementCount++;
  };

  if (withJoker) {
    const idx = cards.findIndex((v) => v === GameCard.Ace);
    cards.splice(idx, 1);
    cards.splice(0, 1);
    cards.splice(0, 1);
    addArmies();
  }
  if (queens.length >= 3) {
    updateCards(1);
    addArmies();
  } else if (kings.length >= 3) {
    updateCards(2);
    addArmies();
  } else if (aces.length >= 3) {
    updateCards(3);
    addArmies();
  } else if (differentCards) {
    addArmies();
    const diffCards = [GameCard.Jack, GameCard.Queen, GameCard.King];
    for (let i = 1; i <= diffCards.length; i++) {
      const idx = cards.findIndex((v) => v === diffCards[i]);
      cards.splice(idx, 1);
    }
  }
  return { cards, army, incrementCount };
};
