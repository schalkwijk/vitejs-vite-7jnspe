import { useRef, useState } from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import { Html } from 'react-konva-utils';
import { Spring, animated } from '@react-spring/konva';

import { generateBattlefield } from './services/battlefield';
import { TPlanet } from './services/planet';

const Planet = ({
  color,
  radius,
  position,
  selected,
  onClick,
}: TPlanet & { selected: boolean; onClick: () => void }) => {
  return (
    <>
      <Circle
        fill={color}
        radius={radius}
        x={position[0]}
        y={position[1]}
        onClick={onClick}
      />
      {selected && (
        <Spring
          from={{ rotation: 0 }}
          to={{
            rotation: 360,
          }}
          config={{ duration: 2500 }}
          loop={true}
        >
          {(props) => {
            return (
              <animated.Circle
                stroke={color}
                strokeWidth={2}
                radius={radius + 4}
                x={position[0]}
                y={position[1]}
                dash={[10]}
                {...props}
              />
            );
          }}
        </Spring>
      )}
    </>
  );
};

const App = () => {
  const width = window.innerWidth - 100;
  const height = window.innerHeight - 100;
  const stage = useRef(null);
  const regenerateBattlefield = () =>
    generateBattlefield({ planetCount: 15, box: [width, height] });

  const [{ planets, routes }, setBattlefield] = useState(
    regenerateBattlefield()
  );

  const [selectedPlanetId, setSelectedPlanetId] = useState<null | string>(null);

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

        {planets.map((planet) => {
          return (
            <Planet
              key={planet.id}
              {...planet}
              onClick={() => setSelectedPlanetId(planet.id)}
              selected={planet.id === selectedPlanetId}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default App;
