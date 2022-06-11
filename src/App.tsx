import { useRef, useState } from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import { Html } from 'react-konva-utils';

import { generateBattlefield } from './services/battlefield';
import { TPlanet } from './services/planet';

const Planet = ({ color, radius, position }: TPlanet) => {
  return (
    <Circle fill={color} radius={radius} x={position[0]} y={position[1]} />
  );
};

const App = () => {
  const width = window.innerWidth - 100;
  const height = window.innerHeight - 100;
  const stage = useRef(null);
  const regenerateBattlefield = () =>
    generateBattlefield({ planetCount: 5, box: [width, height] });

  const [{ planets, routes }, setBattlefield] = useState(
    regenerateBattlefield()
  );

  const gradientCreator = (planetA: TPlanet, planetB: TPlanet) => {
    const gradient: any =
      stage.current &&
      (stage.current as any).bufferCanvas._canvas
        .getContext('2d')
        // gradients are scoped globally since we're pulling the context off the total canvas
        .createLinearGradient(...[...planetA.position, ...planetB.position]);

    if (gradient) {
      gradient.addColorStop(0.0, planetA.color);
      gradient.addColorStop(1.0, planetB.color);
    }

    return gradient;
  };

  return (
    <Stage width={width} height={height} ref={stage}>
      <Layer>
        <Html>
          <button
            style={{ position: 'absolute', left: 10, top: -30 }}
            onClick={() => setBattlefield(regenerateBattlefield())}
          >
            Refresh
          </button>
        </Html>
        {planets.map((planet) => {
          return <Planet key={planet.id} {...planet} />;
        })}

        {Object.entries(routes).flatMap(([planetId, otherPlanetIds]) => {
          const planet = planets.find((candidate) => candidate.id === planetId);
          return otherPlanetIds.map((otherPlanetId) => {
            const otherPlanet = planets.find(
              (candidate) => candidate.id === otherPlanetId
            );

            return (
              <Line
                key={planet!.id + otherPlanet!.id}
                points={[...planet!.position, ...otherPlanet!.position]}
                strokeWidth={2}
                stroke={gradientCreator(planet!, otherPlanet!)}
              />
            );
          });
        })}
      </Layer>
    </Stage>
  );
};

export default App;
