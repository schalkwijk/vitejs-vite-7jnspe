import { useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import { Html } from "react-konva-utils";

import { useBattlefield } from "./modules/battlefield/battlefield";
import { TPlanet } from "./modules/planet/planet";
import { Planets } from "./modules/planet/planetComponent";

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

        {routes.map(([firstPlanetId, secondPlanetId]) => {
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

        <Planets planets={planets} />
      </Layer>
    </Stage>
  );
};

export default App;
