import { TBattlefield } from "../battlefield/battlefieldMachine";

export type TPlanet = {
  id: string;
  capturedBy: null | string;
  radius: number;
  position: [number, number];
  tick: number;
  selected: boolean;
  toughness: number;
};

export type TRoute = {
  destination: TPlanet["id"];
};

export type PositionAndRadius = Pick<TPlanet, "position" | "radius">;
export type Position = TPlanet["position"];

export const angleBetweenPlanets = ({
  sourcePlanet,
  targetPlanet,
}: {
  sourcePlanet: TPlanet;
  targetPlanet: TPlanet;
}) => {
  const x1 = sourcePlanet.position[0];
  const y1 = sourcePlanet.position[1];
  const x2 = targetPlanet.position[0];
  const y2 = targetPlanet.position[1];
  const radians = Math.atan2(y1 - y2, x2 - x1);
  const degrees = radians * (180 / Math.PI);

  return { radians, degrees };
};

export const planetColor = ({
  planet,
  players,
}: {
  planet: TPlanet;
  players: TBattlefield["players"];
}) => {
  return planet.capturedBy
    ? players.find((player) => player.id === planet.capturedBy)!.color
    : "#808080";
};

export const findPlanet = (
  planets: Array<TPlanet>,
  planetId: TPlanet["id"]
) => {
  return planets.find((planet) => planet.id === planetId)!;
};

export const edgeOfPlanet = ({
  planet,
  radians,
}: {
  planet: TPlanet;
  radians: number;
}) => {
  const x = Math.cos(radians) * planet.radius + planet.position[0];
  const y = -1 * Math.sin(radians) * planet.radius + planet.position[1]; // -1 since the y axis increases when you go down

  return { x, y };
};
