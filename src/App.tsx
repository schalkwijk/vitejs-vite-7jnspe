import { useRef, useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import { Html } from 'react-konva-utils';
import { animated, useSpring } from '@react-spring/konva';

import { useBattlefield, TPlanet } from './services/battlefield';

const RouteStart = ({
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
  const theta = Math.atan2(y1 - y2, x2 - x1);

  const finalX =
    Math.cos(theta) * sourcePlanet.radius + sourcePlanet.position[0];
  const finalY = // -1 since the y axis increases when you go down
    -1 * Math.sin(theta) * sourcePlanet.radius + sourcePlanet.position[1];

  const motion = useSpring({
    from: { x: finalX, y: finalY, radius: sourcePlanet.radius },
    to: {
      x: targetPlanet.position[0],
      y: targetPlanet.position[1],
      radius: targetPlanet.radius,
    },
    config: { duration: 2500 },
  });

  return (
    <animated.RegularPolygon
      sides={3}
      fill={sourcePlanet.color}
      {...motion}
      opacity={0.7}
      // need to convert from radians to degrees
      // also, the 90 is here since konva sees rotations
      // as angles clockwise from the y axis, while regular
      // math sees it as angles counter-clockwise from the x axis
      rotation={90 - theta * (180 / Math.PI)}
    />
  );
};

const Planet = ({
  color,
  radius,
  position,
  selected,
  onClick,
}: TPlanet & { selected: boolean; onClick: () => void }) => {
  const [locked, setLocked] = useState(false);
  const styles = useSpring({
    from: { rotation: 0 },
    to: {
      rotation: 360,
    },
    config: { duration: 2500 },
    loop: true,
  });
  return (
    <Group onClick={onClick}>
      <Circle fill={color} radius={radius} x={position[0]} y={position[1]} />
      <Text
        x={position[0] - radius - 1}
        y={position[1] - radius}
        text={radius.toString()}
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
      />
      {selected && (
        <animated.Circle
          stroke={color}
          strokeWidth={2}
          radius={radius + 4}
          x={position[0]}
          y={position[1]}
          dash={[10]}
          {...styles}
        />
      )}
    </Group>
  );
};

const App = () => {
  const width = window.innerWidth - 100;
  const height = window.innerHeight - 100;
  const stage = useRef(null);

  const [battlefield, triggerEvent] = useBattlefield({
    planetCount: 10,
    box: [width, height],
  });

  const regenerateBattlefield = () => triggerEvent('reset');

  const planets = battlefield.context.planets;
  const routes = battlefield.context.routes;

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
            onClick={() => regenerateBattlefield()}
          >
            Refresh
          </button>
        </Html>

        {routes.map(([firstPlanetId, secondPlanetId]) => {
          const firstPlanet = planets.find(
            (candidate) => candidate.id === firstPlanetId
          );

          const secondPlanet = planets.find(
            (candidate) => candidate.id === secondPlanetId
          );

          return (
            <>
              <Line
                key={`line-${firstPlanet!.id + secondPlanet!.id}`}
                points={[...firstPlanet!.position, ...secondPlanet!.position]}
                strokeWidth={2}
                stroke={gradientCreator(firstPlanet!, secondPlanet!)}
              />
              <RouteStart
                key={`route-${firstPlanet!.id + secondPlanet!.id}`}
                sourcePlanet={firstPlanet!}
                targetPlanet={secondPlanet!}
                tick={battlefield.context.tick}
              />
            </>
          );
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
