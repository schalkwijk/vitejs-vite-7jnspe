import { Circle, Text, Group } from "react-konva";
import { animated, useSpring } from "@react-spring/konva";

import { planetColor, TPlanet } from "./planet";
import { TBattlefield } from "../battlefield/battlefieldMachine";

export const Planet = ({
  planet,
  players,
}: {
  planet: TPlanet;
  players: TBattlefield["players"];
}) => {
  const styles = useSpring({
    from: { rotation: 0 },
    to: {
      rotation: 360,
    },
    config: { duration: 2500 },
    loop: true,
  });

  const { id, radius, position, selected } = planet;
  const color = planetColor({ planet, players });
  const fontSize = 15;

  return (
    <Group id={id} type="planet">
      <Circle fill={color} radius={radius} x={position[0]} y={position[1]} />
      <Text
        fontSize={fontSize}
        fill={"#FFFFFF"}
        text={radius.toString()}
        x={position[0] - fontSize / 2 - 2}
        y={position[1] - fontSize / 2}
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

export const Planets = ({
  planets,
  players,
}: Pick<TBattlefield, "planets" | "players">) => {
  return (
    <>
      {planets.map((planet) => {
        return <Planet planet={planet} players={players} key={planet.id} />;
      })}
    </>
  );
};
