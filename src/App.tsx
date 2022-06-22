import { useRef } from "react";
import { Stage, Layer, Line, RegularPolygon } from "react-konva";
import { Html } from "react-konva-utils";

import { useBattlefield } from "./modules/battlefield/battlefield";
import { planetColor, TPlanet } from "./modules/planet/planet";
import { Planets } from "./modules/planet/planetComponent";
import { Routes } from "./modules/routes/routeComponent";

const App = () => {
  const width = window.innerWidth - 100;
  const height = window.innerHeight - 100;
  const stage = useRef(null);

  const [battlefield, triggerEvent] = useBattlefield({
    planetCount: 10,
    box: [width, height],
  });

  const regenerateBattlefield = () => triggerEvent("reset");

  const { planets, edges, routes, mouse, players, fleets } =
    battlefield.context;

  const gradientCreator = (planetA: TPlanet, planetB: TPlanet) => {
    const gradient: any =
      stage.current &&
      (stage.current as any).bufferCanvas._canvas
        .getContext("2d")
        // gradients are scoped globally since we're pulling the context off the total canvas
        .createLinearGradient(...[...planetA.position, ...planetB.position]);

    if (gradient) {
      gradient.addColorStop(0.0, planetColor({ planet: planetA, players }));
      gradient.addColorStop(1.0, planetColor({ planet: planetB, players }));
    }

    return gradient;
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stage}
      onMouseDown={({ target }: { target: any }) => {
        if (target?.parent) {
          mouse.send("mouseDown", { target: target.parent.attrs });
        }
      }}
      onMouseUp={({ target }) => {
        if (target?.parent) {
          mouse.send("mouseUp", { target: target.parent.attrs });
        }
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

        {edges.map(([firstPlanetId, secondPlanetId]) => {
          const firstPlanet = planets.find(
            (candidate) => candidate.id === firstPlanetId
          );

          const secondPlanet = planets.find(
            (candidate) => candidate.id === secondPlanetId
          );

          return (
            <Line
              key={`line-${firstPlanet!.id + secondPlanet!.id}`}
              points={[...firstPlanet!.position, ...secondPlanet!.position]}
              strokeWidth={2}
              stroke={gradientCreator(firstPlanet!, secondPlanet!)}
            />
          );
        })}

        <Planets planets={planets} players={players} />
        <Routes planets={planets} routes={routes} players={players} />
        {fleets.length > 0 &&
          fleets.map((fleet) => {
            return (
              <RegularPolygon
                rotation={fleet.angle}
                key={fleet.id}
                sides={3}
                x={fleet.position[0]}
                y={fleet.position[1]}
                radius={7}
                fill={fleet.color}
              />
            );
          })}
      </Layer>
    </Stage>
  );
};

export default App;
