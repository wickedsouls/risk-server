import { Zone } from '../../game/types';
import _ from 'lodash';

export const getEnemyZones = (
  zones: { [key: string]: Zone<string, string> },
  botId: string,
) => {
  return _.cloneDeep(_.values(zones)).filter((zone) => {
    return zone.owner !== botId;
  });
};
