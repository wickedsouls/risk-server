import { ZonesObject } from '../../game/types';
import { cloneDeep, values } from 'lodash';

export const getMyZones = (_zones: ZonesObject, botId: string) => {
  const zones = values(_zones).filter((zone) => {
    return zone.owner === botId;
  });
  return cloneDeep(zones);
};
