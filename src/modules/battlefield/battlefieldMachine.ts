import { createMachine, assign, spawn, send } from "xstate";
import { pure, choose, sendParent, log } from "xstate/lib/actions";

import { TPlanet } from "../planet/planet";
import { createPlanetMachine } from "../planet/planetMachine";
import { generateBattlefield } from "./battlefield";

export type TBox = [number, number];
export type TBattlefield = {
  planets: Array<TPlanet & { machine: any }>; // TODO: fix any
  routes: Array<[TPlanet["id"], TPlanet["id"]]>;
  box: TBox;
  planetCount: number;
  tick: number;
};

type TMouse = { activePlanetId: string | null };

const createMouseMachine = () => {
  return createMachine<TMouse>(
    {
      context: { activePlanetId: null },
      initial: "idle",
      states: {
        idle: {
          on: {
            mouseDown: {
              target: "waitingOnMouseUp",
              actions: choose([
                {
                  cond: "isPlanetTarget",
                  actions: assign({
                    activePlanetId: (_, event: any) => event.target.id,
                  }),
                }, // TODO: remove any
              ]),
            },
          },
        },
        waitingOnMouseUp: {
          on: {
            mouseUp: {
              target: "idle",
              actions: choose([
                {
                  cond: "activePlanetIsSameAsTargetPlanet",
                  actions: sendParent((_, event: any) => ({
                    // TODO: remove any
                    type: "planet.clicked",
                    planetId: event.target.id,
                  })),
                },
                {
                  cond: "activePlanetIsDifferentThanTargetPlanet",
                  actions: sendParent((context, event: any) => ({
                    // TODO: remove any
                    type: "planet.linked",
                    sourcePlanetId: context.activePlanetId,
                    targetPlanetId: event.target.id,
                  })),
                },
              ]),
            },
          },
        },
      },
    },
    {
      guards: {
        activePlanetIsSameAsTargetPlanet: (context, event) => {
          return (
            event.target?.type === "planet" &&
            context.activePlanetId === event.target.id
          );
        },
        activePlanetIsDifferentThanTargetPlanet: (context, event) => {
          return (
            event.target?.type === "planet" &&
            context.activePlanetId !== event.target.id
          );
        },
        isPlanetTarget: (_context, event) => {
          return event.target?.type === "planet";
        },
      },
    }
  );
};

export const createBattlefieldMachine = (battlefield: TBattlefield) => {
  return createMachine<TBattlefield & { mouse: any }>({
    context: { ...battlefield, mouse: null },
    initial: "running",
    states: {
      running: {
        entry: assign({
          mouse: (_context) => {
            return spawn(createMouseMachine(), "mouse");
          },
          planets: ({ planets }) =>
            planets.map((planet) => ({
              ...planet,
              machine: spawn(
                createPlanetMachine(planet),
                `planet-${planet.id}`
              ),
            })),
        }),
        invoke: {
          src: (_context) => (send) => {
            const interval = setInterval(() => {
              send("tick");
            }, 1000);

            return () => {
              clearInterval(interval);
            };
          },
        },
        on: {
          tick: {
            actions: [
              assign((context) => {
                return { tick: context.tick + 1 };
              }),
              pure((context) => {
                return context.planets.map((planet) => {
                  return send({ type: "tick" }, { to: planet.machine });
                });
              }),
            ],
          },
        },
      },
    },
    on: {
      reset: {
        actions: assign((context) => {
          return {
            ...generateBattlefield(context), // TODO: fix circular dependency?
          };
        }),
        target: ".running",
        internal: false,
      },
      "planet.linked": {
        actions: log(),
      },
      "planet.clicked": {
        actions: pure((context, event) => {
          return context.planets.map((planet) => {
            return planet.id === event.planetId
              ? send({ type: "select" }, { to: planet.machine })
              : send({ type: "deselect" }, { to: planet.machine });
          });
        }),
      },
      "planet.commit": {
        actions: assign({
          planets: (context, event) => {
            return context.planets.map((planet) => {
              return planet.id === event.planet.id
                ? { ...planet, ...event.planet }
                : planet;
            });
          },
        }),
      },
    },
  });
};
