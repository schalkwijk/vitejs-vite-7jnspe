import { orderBy } from 'lodash';

import { distance } from '../util';
import { generatePlanets } from './planet';

export const generateBattlefield = ({
  box,
  planetCount,
}: {
  box: [number, number];
  planetCount: number;
}) => {
  const planets = generatePlanets({ count: planetCount, box });

  const routes: Record<string, Array<string>> = {};
  let [firstPlanet, ...outOfNetwork] = planets;
  const inNetwork = [firstPlanet];

  while (outOfNetwork.length) {
    const distances = inNetwork.flatMap((inNetworkPlanet) => {
      return outOfNetwork.map((outOfNextworkPlanet) => {
        return {
          distance: distance(
            inNetworkPlanet.position,
            outOfNextworkPlanet.position
          ),
          route: [inNetworkPlanet.id, outOfNextworkPlanet.id],
        };
      });
    });

    const closest = orderBy(distances, 'distance', 'asc')[0]!;

    outOfNetwork = outOfNetwork.filter(
      (outOfNetworkPlanet) => outOfNetworkPlanet.id !== closest.route[1]
    );

    inNetwork.push(planets.find((planet) => planet.id === closest.route[1])!);

    routes[closest.route[0]] = [
      ...(routes[closest.route[0]!] ?? []),
      closest.route[1],
    ];
  }

  return {
    planets,
    routes,
  };
};
