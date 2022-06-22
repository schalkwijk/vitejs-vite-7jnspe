import { RegularPolygon } from "react-konva";

import { TBattlefield } from "../battlefield/battlefieldMachine";
import { angleBetweenPlanets, planetColor, TPlanet } from "../planet/planet";

export const RouteIndicator = ({
  sourcePlanet,
  targetPlanet,
  players,
}: {
  sourcePlanet: TPlanet;
  targetPlanet: TPlanet;
  players: TBattlefield["players"];
}) => {
  const { degrees, radians } = angleBetweenPlanets({
    sourcePlanet,
    targetPlanet,
  });

  const x = Math.cos(radians) * sourcePlanet.radius + sourcePlanet.position[0];
  const y = // -1 since the y axis increases when you go down
    -1 * Math.sin(radians) * sourcePlanet.radius + sourcePlanet.position[1];
  const color = planetColor({ planet: sourcePlanet, players });

  return (
    <RegularPolygon
      radius={sourcePlanet.radius / 2}
      sides={3}
      x={x}
      y={y}
      fill={color}
      opacity={0.9}
      // the 90 is here since konva sees rotations
      // as angles clockwise from the y axis, while regular
      // math sees it as angles counter-clockwise from the x axis
      rotation={90 - degrees}
    />
  );
};

export const Routes = ({
  routes,
  planets,
  players,
}: Pick<TBattlefield, "routes" | "planets" | "players">) => {
  const findPlanet = (targetId: TPlanet["id"]) => {
    return planets.find((planet) => planet.id === targetId);
  };

  const planetToPlanet = Object.entries(routes).flatMap(
    ([sourcePlanetId, targetPlanetIds]) => {
      const sourcePlanet = findPlanet(sourcePlanetId);
      return [...targetPlanetIds].map((targetPlanetId) => {
        return [sourcePlanet, findPlanet(targetPlanetId)] as [TPlanet, TPlanet];
      });
    }
  );

  return (
    <>
      {planetToPlanet.map(([sourcePlanet, targetPlanet]) => {
        const key = `${sourcePlanet.id}-${targetPlanet.id}`;
        return (
          <RouteIndicator
            sourcePlanet={sourcePlanet}
            targetPlanet={targetPlanet}
            players={players}
            key={key}
          />
        );
      })}
    </>
  );
};
