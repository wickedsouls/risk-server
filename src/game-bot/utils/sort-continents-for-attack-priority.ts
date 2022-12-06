import { Map } from '../../game/types';
import _ from 'lodash';

export interface SortedContinentsForAttack {
  continent: string;
  entryPoints: number;
  myZones: string[];
  zoneCount: number;
  zonesNeededToTakeContinent: number;
}

export const sortContinentsForAttack = (
  map: Map<string, string>,
  playerId: string,
): SortedContinentsForAttack[] => {
  const zones = _.values(map.zones);
  const continents = _.values(map.continents);
  return continents
    .map((c) => {
      const zonesForContinent = _.values(zones)
        .filter(
          (zone) =>
            zone.owner === playerId && zone.continent === c.name && !c.owner,
        )
        .map((zone) => zone.name);
      return {
        continent: c.name,
        entryPoints: c.entryPoints.length,
        myZones: zonesForContinent,
        zoneCount: c.zoneCount,
        zonesNeededToTakeContinent: c.zoneCount - zonesForContinent.length,
      };
    })
    .filter(
      (report) =>
        report.myZones.length > 0 && report.zonesNeededToTakeContinent !== 0,
    )
    .sort((a, b) => {
      if (a.zonesNeededToTakeContinent > b.zonesNeededToTakeContinent) {
        return 1;
      } else if (a.zonesNeededToTakeContinent < b.zonesNeededToTakeContinent) {
        return -1;
      }
      return a.entryPoints > b.entryPoints ? 1 : -1;
    });
};
