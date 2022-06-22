import { useMachine } from "@xstate/react";
import { orderBy } from "lodash";
import { useMemo } from "react";
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

  const edges: TBattlefield["edges"] = [];
  let [firstPlanet, ...outOfNetwork] = planets;
  const inNetwork = [firstPlanet];

  while (outOfNetwork.length) {
    const distances = inNetwork.flatMap((inNetworkPlanet) => {
      return outOfNetwork.map((outOfNextworkPlanet) => {
        return {
          distance: distance(inNetworkPlanet, outOfNextworkPlanet),
          route: [inNetworkPlanet.id, outOfNextworkPlanet.id],
        };
      });
    });

    const closest = orderBy(distances, "distance", "asc")[0]!;

    outOfNetwork = outOfNetwork.filter(
      (outOfNetworkPlanet) => outOfNetworkPlanet.id !== closest.route[1]
    );

    inNetwork.push(planets.find((planet) => planet.id === closest.route[1])!);

    edges.push([closest.route[0], closest.route[1]]);
  }

  const players = [
    { color: "#7FDBFF", id: uuid() },
    { color: "#39CCCC", id: uuid() },
  ];

  planets[0].capturedBy = players[0].id;
  planets[planetCount - 1].capturedBy = players[1].id;

  return {
    edges,
    planets: planets as any,
    box,
    players,
    planetCount,
    tick: 0,
    fleets: [],
    routes: {},
  };
};

export const useBattlefield = (
  options: Parameters<typeof generateBattlefield>[0]
) => {
  const machine = useMemo(() => {
    return createBattlefieldMachine(generateBattlefield(options));
  }, [1]);

  return useMachine(machine);
};

const atArmsLength = (
  positionAndRadius: PositionAndRadius,
  planets: Array<TPlanet>,
  arm: number
) => {
  return !planets.some((planet) => {
    const { radius, position } = positionAndRadius;
    return distance({ position }, planet) < radius + planet.radius + arm;
  });
};

const generatePlanets = ({
  count,
  box,
}: {
  count: number;
  box: [number, number];
}): Array<TPlanet> => {
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
      id: uuid(),
      tick: 0,
      selected: false,
      capturedBy: null,
      ...positionAndRadius,
    });
  }

  return planets;
};
