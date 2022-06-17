import { Fragment, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import { Html } from "react-konva-utils";
import { animated, useSpring } from "@react-spring/konva";

import { useBattlefield } from "./modules/battlefield/battlefield";
import { angleBetweenPlanets, TPlanet } from "./modules/planet/planet";
import { Planet } from "./modules/planet/planetComponent";

const RouteStart = ({
  sourcePlanet,
  targetPlanet,
}: {
  sourcePlanet: TPlanet;
  targetPlanet: TPlanet;
}) => {
  const { radians, degrees } = angleBetweenPlanets({
    sourcePlanet,
    targetPlanet,
  });
  const finalX =
    Math.cos(radians) * sourcePlanet.radius + sourcePlanet.position[0];
  const finalY = // -1 since the y axis increases when you go down
    -1 * Math.sin(radians) * sourcePlanet.radius + sourcePlanet.position[1];

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
      // also, the 90 is here since konva sees rotations
      // as angles clockwise from the y axis, while regular
      // math sees it as angles counter-clockwise from the x axis
      rotation={90 - degrees}
    />
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

  const regenerateBattlefield = () => triggerEvent("reset");

  const planets = battlefield.context.planets;
  const routes = battlefield.context.routes;
  const mouse = battlefield.context.mouse;

  const gradientCreator = (planetA: TPlanet, planetB: TPlanet) => {
    const gradient: any =
      stage.current &&
      (stage.current as any).bufferCanvas._canvas
        .getContext("2d")
        // gradients are scoped globally since we're pulling the context off the total canvas
        .createLinearGradient(...[...planetA.position, ...planetB.position]);

    if (gradient) {
      gradient.addColorStop(0.0, planetA.color);
      gradient.addColorStop(1.0, planetB.color);
    }

    return gradient;
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stage}
      draggable={true}
      onDragStart={(target) => {
        (stage.current as any).stopDrag();
      }}
      onMouseUp={({ target }) => {
        console.log({ target });
        mouse.send("click", { target: (target as any).parent.attrs });
      }}
    >
      <Layer>
        <Html>
          <button
            style={{ position: "absolute", left: 10, top: -30 }}
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
            <Fragment key={`line-${firstPlanet!.id + secondPlanet!.id}`}>
              <Line
                points={[...firstPlanet!.position, ...secondPlanet!.position]}
                strokeWidth={2}
                stroke={gradientCreator(firstPlanet!, secondPlanet!)}
              />
              <RouteStart
                sourcePlanet={firstPlanet!}
                targetPlanet={secondPlanet!}
              />
            </Fragment>
          );
        })}

        {planets.map((planet) => {
          return <Planet key={planet.id} {...planet} />;
        })}
      </Layer>
    </Stage>
  );
};

export default App;
