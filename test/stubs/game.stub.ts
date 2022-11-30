import { CreateGameDto, Player } from '../../src/game/types';
import { Earth } from '../../src/game/maps';

export const playerStub = (player: Partial<Player> = {}): Player => ({
  id: player.id || '1',
  username: player.username || 'player',
});

export const gameStub = (
  options: Partial<CreateGameDto> = {},
): CreateGameDto => ({
  isPrivate: options.isPrivate || false,
  password: options.password,
  maxPlayers: options.maxPlayers || 6,
  minPlayers: options.minPlayers || 2,
  map: Earth,
});
