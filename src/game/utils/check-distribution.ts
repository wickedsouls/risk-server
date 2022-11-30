import { Continent, Zone } from '../types';
import { values } from 'lodash';

export const checkIfDistributionIsCorrect = (
  _continents: { [key: string]: Continent<string> },
  mappedZones: Zone<string, string>[],
) => {
  const continents = values(_continents);
  let correct = true;
  continents.forEach((continent) => {
    const { name, zoneCount } = continent;
    const continentZone = mappedZones.find((zone) => zone.continent === name);
    const playerSameZoneCount = mappedZones.filter(
      (zone) => zone.continent === name && zone.owner === continentZone?.owner,
    );
    if (playerSameZoneCount.length === zoneCount) {
      correct = false;
    }
  });
  return correct;
};
