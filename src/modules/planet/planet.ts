export type TPlanet = {
  id: string;
  color: string;
  radius: number;
  position: [number, number];
  tick: number;
  selected: boolean;
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
