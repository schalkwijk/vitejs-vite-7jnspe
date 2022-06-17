import { Circle, Text, Group } from "react-konva";
import { animated, useSpring } from "@react-spring/konva";

import { TPlanet } from "./planet";

export const Planet = ({
  color,
  radius,
  position,
  selected,
  onClick,
  tick,
}: TPlanet & { onClick: () => void }) => {
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
        align="center"
        text={tick.toString()}
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
