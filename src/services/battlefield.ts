import { generatePlanets } from './planet';

export const generateBattlefield = ({
  box,
  planetCount,
}: {
  box: [number, number];
  planetCount: number;
}) => {
  const planets = generatePlanets({ count: planetCount, box });

  const routes = planets.reduce((routes, planet) => {
    const otherPlanetIds = planets
      .filter((otherPlanet) => otherPlanet.id != planet.id)
      .map((otherPlanet) => otherPlanet.id);

    routes[planet.id] = otherPlanetIds;
    return routes;
  }, {} as Record<string, Array<string>>);

  return {
    planets,
    routes,
  };
};
