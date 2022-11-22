import { Continent, Map, Zone } from './types';

type EarthContinents =
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Europe'
  | 'Australia'
  | 'Asia';
type EarthZones =
  | 'Argentina'
  | 'Brazil'
  | 'Peru'
  | 'Venezuela'
  | 'Central America'
  | 'Western US'
  | 'Eastern US'
  | 'Alberta'
  | 'Alaska'
  | 'Northwest Territory'
  | 'Ontario'
  | 'Quebec'
  | 'Greenland'
  | 'Iceland'
  | 'Great Britain'
  | 'Western Europe'
  | 'Southern Europe'
  | 'Northern Europe'
  | 'Scandinavia'
  | 'Ukraine'
  | 'North Africa'
  | 'Egypt'
  | 'East Africa'
  | 'Congo'
  | 'Madagascar'
  | 'South Africa'
  | 'Middle East'
  | 'Afghanistan'
  | 'India'
  | 'Ural'
  | 'Siberia'
  | 'Yakutsk'
  | 'Kamchatka'
  | 'Irkutsk'
  | 'Mongolia'
  | 'Japan'
  | 'China'
  | 'Siam'
  | 'Indonesia'
  | 'New Guinea'
  | 'Western Australia'
  | 'Eastern Australia';

export const Earth: Map<EarthZones, EarthContinents> = {
  name: 'Earth',
  continents: {
    'North America': { name: 'North America', reward: 5, zoneCount: 9 },
    'South America': { name: 'South America', reward: 2, zoneCount: 4 },
    Africa: { name: 'Africa', reward: 3, zoneCount: 6 },
    Europe: { name: 'Europe', reward: 5, zoneCount: 7 },
    Australia: { name: 'Australia', reward: 2, zoneCount: 4 },
    Asia: { name: 'Asia', reward: 7, zoneCount: 12 },
  },
  zones: {
    Argentina: {
      name: 'Argentina',
      reward: 1,
      continent: 'South America',
      neighbours: ['Peru', 'Brazil'],
    },
    Brazil: {
      name: 'Brazil',
      reward: 1,
      continent: 'South America',
      neighbours: ['Venezuela', 'Argentina', 'Peru', 'North Africa'],
    },
    Peru: {
      name: 'Peru',
      reward: 1,
      continent: 'South America',
      neighbours: ['Argentina', 'Venezuela', 'Brazil'],
    },
    Venezuela: {
      name: 'Venezuela',
      reward: 1,
      continent: 'South America',
      neighbours: ['Peru', 'Brazil', 'Central America'],
    },
    'Central America': {
      name: 'Central America',
      reward: 1,
      continent: 'North America',
      neighbours: ['Venezuela', 'Western US', 'Eastern US'],
    },
    'Western US': {
      name: 'Western US',
      reward: 1,
      continent: 'North America',
      neighbours: ['Central America', 'Eastern US', 'Alberta', 'Ontario'],
    },
    'Eastern US': {
      name: 'Eastern US',
      reward: 1,
      continent: 'North America',
      neighbours: ['Central America', 'Western US', 'Quebec', 'Ontario'],
    },
    Quebec: {
      name: 'Quebec',
      reward: 1,
      continent: 'North America',
      neighbours: ['Eastern US', 'Ontario', 'Greenland'],
    },
    Ontario: {
      name: 'Ontario',
      reward: 1,
      continent: 'North America',
      neighbours: [
        'Western US',
        'Eastern US',
        'Quebec',
        'Greenland',
        'Alberta',
        'Northwest Territory',
      ],
    },
    Alberta: {
      name: 'Alberta',
      reward: 1,
      continent: 'North America',
      neighbours: ['Western US', 'Ontario', 'Northwest Territory', 'Alaska'],
    },
    Alaska: {
      name: 'Alaska',
      reward: 1,
      continent: 'North America',
      neighbours: ['Alberta', 'Northwest Territory', 'Kamchatka'],
    },
    'Northwest Territory': {
      name: 'Northwest Territory',
      reward: 1,
      continent: 'North America',
      neighbours: ['Alaska', 'Alberta', 'Ontario', 'Greenland'],
    },
    Greenland: {
      name: 'Greenland',
      reward: 1,
      continent: 'North America',
      neighbours: ['Northwest Territory', 'Iceland', 'Ontario', 'Quebec'],
    },
    Iceland: {
      name: 'Iceland',
      reward: 1,
      continent: 'Europe',
      neighbours: ['Greenland', 'Scandinavia', 'Great Britain'],
    },
    Scandinavia: {
      name: 'Scandinavia',
      reward: 1,
      continent: 'Europe',
      neighbours: ['Iceland', 'Great Britain', 'Northern Europe', 'Ukraine'],
    },
    'Great Britain': {
      name: 'Great Britain',
      reward: 1,
      continent: 'Europe',
      neighbours: [
        'Iceland',
        'Scandinavia',
        'Northern Europe',
        'Western Europe',
      ],
    },
    'Northern Europe': {
      name: 'Northern Europe',
      reward: 1,
      continent: 'Europe',
      neighbours: [
        'Scandinavia',
        'Great Britain',
        'Western Europe',
        'Southern Europe',
        'Ukraine',
      ],
    },
    Ukraine: {
      name: 'Ukraine',
      reward: 1,
      continent: 'Europe',
      neighbours: [
        'Ural',
        'Afghanistan',
        'Middle East',
        'Southern Europe',
        'Northern Europe',
        'Scandinavia',
      ],
    },
    'Southern Europe': {
      name: 'Southern Europe',
      reward: 1,
      continent: 'Europe',
      neighbours: [
        'Middle East',
        'Ukraine',
        'Northern Europe',
        'Western Europe',
        'North Africa',
        'Egypt',
      ],
    },
    'Western Europe': {
      name: 'Western Europe',
      reward: 1,
      continent: 'Europe',
      neighbours: [
        'Great Britain',
        'Northern Europe',
        'Southern Europe',
        'North Africa',
      ],
    },
    'North Africa': {
      name: 'North Africa',
      reward: 1,
      continent: 'Africa',
      neighbours: ['Brazil', 'Western Europe', 'Egypt', 'East Africa', 'Congo'],
    },
    Congo: {
      name: 'Congo',
      reward: 1,
      continent: 'Africa',
      neighbours: ['South Africa', 'East Africa', 'North Africa'],
    },
    'South Africa': {
      name: 'South Africa',
      reward: 1,
      continent: 'Africa',
      neighbours: ['Congo', 'Madagascar', 'East Africa'],
    },
    Madagascar: {
      name: 'Madagascar',
      reward: 1,
      continent: 'Africa',
      neighbours: ['South Africa', 'East Africa'],
    },
    'East Africa': {
      name: 'East Africa',
      reward: 1,
      continent: 'Africa',
      neighbours: [
        'Madagascar',
        'South Africa',
        'Congo',
        'North Africa',
        'Egypt',
        'Middle East',
      ],
    },
    Egypt: {
      name: 'Egypt',
      reward: 1,
      continent: 'Africa',
      neighbours: [
        'North Africa',
        'East Africa',
        'Middle East',
        'Southern Europe',
        'Northern Europe',
      ],
    },
    'Middle East': {
      name: 'Middle East',
      reward: 1,
      continent: 'Asia',
      neighbours: [
        'Egypt',
        'East Africa',
        'Southern Europe',
        'Ukraine',
        'Afghanistan',
        'India',
      ],
    },
    Afghanistan: {
      name: 'Afghanistan',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Ukraine', 'Ural', 'China', 'Middle East', 'India'],
    },
    Ural: {
      name: 'Ural',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Ukraine', 'Afghanistan', 'Siberia', 'China'],
    },
    Siberia: {
      name: 'Siberia',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Ural', 'Yakutsk', 'Irkutsk', 'Mongolia', 'China'],
    },
    Yakutsk: {
      name: 'Yakutsk',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Siberia', 'Kamchatka', 'Irkutsk'],
    },
    Kamchatka: {
      name: 'Kamchatka',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Yakutsk', 'Irkutsk', 'Mongolia', 'Japan'],
    },
    Irkutsk: {
      name: 'Irkutsk',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Siberia', 'Yakutsk', 'Kamchatka', 'Mongolia'],
    },
    Mongolia: {
      name: 'Mongolia',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Siberia', 'Irkutsk', 'Kamchatka', 'Japan', 'China'],
    },
    Japan: {
      name: 'Japan',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Kamchatka', 'Mongolia'],
    },
    China: {
      name: 'China',
      reward: 1,
      continent: 'Asia',
      neighbours: [
        'Mongolia',
        'Siberia',
        'Ural',
        'Afghanistan',
        'India',
        'Siam',
      ],
    },
    India: {
      name: 'India',
      reward: 1,
      continent: 'Asia',
      neighbours: ['Middle East', 'Afghanistan', 'China', 'Siam'],
    },
    Siam: {
      name: 'Siam',
      reward: 1,
      continent: 'Asia',
      neighbours: ['China', 'India', 'Indonesia'],
    },
    Indonesia: {
      name: 'Indonesia',
      reward: 1,
      continent: 'Australia',
      neighbours: ['Siam', 'New Guinea', 'Western Australia'],
    },
    'New Guinea': {
      name: 'New Guinea',
      reward: 1,
      continent: 'Australia',
      neighbours: ['Indonesia', 'Eastern Australia'],
    },
    'Eastern Australia': {
      name: 'Eastern Australia',
      reward: 1,
      continent: 'Australia',
      neighbours: ['Western Australia', 'New Guinea'],
    },
    'Western Australia': {
      name: 'Western Australia',
      reward: 1,
      continent: 'Australia',
      neighbours: ['Eastern Australia', 'Indonesia'],
    },
  },
};
