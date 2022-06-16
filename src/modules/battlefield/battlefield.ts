import { useMachine } from "@xstate/react";
import { orderBy } from "lodash";

import { v4 as uuid } from "uuid";
import { distance, getRandomInt } from "../util";
import { PositionAndRadius, TPlanet } from "../planet/planet";
import {
  TBox,
  TBattlefield,
  createBattlefieldMachine,
} from "./battlefieldMachine";

export const generateBattlefield = ({
  planetCount,
  box,
}: {
  box: TBox;
  planetCount: number;
}): TBattlefield => {
  const planets = generatePlanets({ count: planetCount, box });

  const routes: TBattlefield["routes"] = [];
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

    const closest = orderBy(distances, "distance", "asc")[0]!;

    outOfNetwork = outOfNetwork.filter(
      (outOfNetworkPlanet) => outOfNetworkPlanet.id !== closest.route[1]
    );

    inNetwork.push(planets.find((planet) => planet.id === closest.route[1])!);

    routes.push([closest.route[0], closest.route[1]]);
  }

  return { routes, planets: planets as any, box, planetCount, tick: 0 };
};

export const useBattlefield = (
  options: Parameters<typeof generateBattlefield>[0]
) => {
  return useMachine(createBattlefieldMachine(generateBattlefield(options)));
};

const atArmsLength = (
  positionAndRadius: PositionAndRadius,
  planets: Array<TPlanet>,
  arm: number
) => {
  return !planets.some((planet) => {
    const { radius, position } = positionAndRadius;
    return distance(position, planet.position) < radius + planet.radius + arm;
  });
};

const generatePlanets = ({
  count,
  box,
}: {
  count: number;
  box: [number, number];
}): Array<TPlanet> => {
  const colors = ["#7FDBFF", "#39CCCC", "#FF851B", "#FFFFFF"];
  const planets: Array<TPlanet> = [];

  const getPositionAndRadius = (): PositionAndRadius => {
    const radius = getRandomInt(10, 30);
    const x = getRandomInt(radius, box[0] - radius);
    const y = getRandomInt(radius, box[1] - radius);
    return { position: [x, y], radius };
  };

  for (let i = 0; i < count; i++) {
    let positionAndRadius = getPositionAndRadius();
    while (!atArmsLength(positionAndRadius, planets, 50)) {
      positionAndRadius = getPositionAndRadius();
    }

    planets.push({
      color: colors[getRandomInt(0, 3)],
      id: uuid(),
      ...positionAndRadius,
    });
  }
  return planets;
};
