export type TPlanet = {
  id: string;
  color: string;
  radius: number;
  position: [number, number];
};

export type PositionAndRadius = Pick<TPlanet, 'position' | 'radius'>;
export type Position = TPlanet['position'];
