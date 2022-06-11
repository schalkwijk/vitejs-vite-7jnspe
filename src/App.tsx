import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Stage, Layer, Circle } from 'react-konva';
import { Html } from 'react-konva-utils';

type TPlanet = {
  id: string;
  color: string;
  radius: number;
  position: [number, number];
};

type PositionAndRadius = Pick<TPlanet, 'position' | 'radius'>;
type Position = TPlanet['position'];

const Planet = ({ color, radius, position }: TPlanet) => {
  return (
    <Circle fill={color} radius={radius} x={position[0]} y={position[1]} />
  );
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const atArmsLength = (
  positionAndRadius: PositionAndRadius,
  planets: Array<TPlanet>,
  arm: number
) => {
  const distance = (positionA: Position, positionB: Position) => {
    return Math.sqrt(
      Math.pow(positionA[0] - positionB[0], 2) +
        Math.pow(positionA[1] - positionB[1], 2)
    );
  };
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
  const colors = ['#7FDBFF', '#39CCCC', '#FF851B', '#FFFFFF'];
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

const App = () => {
  const width = window.innerWidth - 100;
  const height = window.innerHeight - 100;
  const regeneratePlanets = () =>
    generatePlanets({ count: 15, box: [width, height] });
  const [planets, setPlanets] = useState(regeneratePlanets());

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Html>
          <button
            style={{ position: 'absolute', left: 10, top: -30 }}
            onClick={() => setPlanets(regeneratePlanets())}
          >
            Refresh
          </button>
        </Html>
        {planets.map((planet) => {
          return <Planet key={planet.id} {...planet} />;
        })}
      </Layer>
    </Stage>
  );
};

export default App;
