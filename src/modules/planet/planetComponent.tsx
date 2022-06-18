import { Circle, RegularPolygon, Group } from "react-konva";
import { animated, useSpring } from "@react-spring/konva";

import { angleBetweenPlanets, TPlanet } from "./planet";

export const Planet = ({ color, radius, position, selected, id }: TPlanet) => {
  const styles = useSpring({
    from: { rotation: 0 },
    to: {
      rotation: 360,
    },
    config: { duration: 2500 },
    loop: true,
  });

  return (
    <Group id={id} key={id} type="planet">
      <Circle fill={color} radius={radius} x={position[0]} y={position[1]} />
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

export const RouteIndicator = ({
  sourcePlanet,
  targetPlanet,
}: {
  sourcePlanet: TPlanet;
  targetPlanet: TPlanet;
}) => {
  const { degrees, radians } = angleBetweenPlanets({
    sourcePlanet,
    targetPlanet,
  });

  const x = Math.cos(radians) * sourcePlanet.radius + sourcePlanet.position[0];
  const y = // -1 since the y axis increases when you go down
    -1 * Math.sin(radians) * sourcePlanet.radius + sourcePlanet.position[1];

  return (
    <RegularPolygon
      radius={15}
      sides={3}
      x={x}
      y={y}
      fill={sourcePlanet.color}
      opacity={0.9}
      // the 90 is here since konva sees rotations
      // as angles clockwise from the y axis, while regular
      // math sees it as angles counter-clockwise from the x axis
      rotation={90 - degrees}
    />
  );
};
