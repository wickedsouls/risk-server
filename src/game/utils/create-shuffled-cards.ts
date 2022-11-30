import { GameCard } from '../types';
import { shuffle } from 'lodash';

export const createShuffledCards = () => {
  const gameCards = [];
  new Array(14).fill(null).forEach((_, i) => {
    gameCards.push(GameCard.Jack);
    gameCards.push(GameCard.Queen);
    gameCards.push(GameCard.King);
    if (i <= 1) gameCards.push(GameCard.Ace);
  });
  return shuffle(gameCards);
};
