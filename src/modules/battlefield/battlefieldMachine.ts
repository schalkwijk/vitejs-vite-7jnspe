import _ from "lodash";
import { createMachine, assign, spawn, send } from "xstate";
import { pure, choose, sendParent } from "xstate/lib/actions";

import { planetColor, TPlanet } from "../planet/planet";
import { createPlanetMachine } from "../planet/planetMachine";
import { generateBattlefield } from "./battlefield";
import { TPosition } from "../util";

export type TBox = [number, number];
export type TPlayer = { color: string; id: string };
export type TFleet = {
  color: string;
  sourcePlanetId: TPlanet["id"];
  targetPlanetId: TPlanet["id"];
  size: number;
  position: TPosition;
};
export type TBattlefield = {
  planets: Array<TPlanet & { machine: any }>; // TODO: fix any
  edges: Array<[TPlanet["id"], TPlanet["id"]]>;
  routes: Record<TPlanet["id"], Set<TPlanet["id"]>>;
  box: TBox;
  planetCount: number;
  tick: number;
  players: Array<TPlayer>;
  fleets: Array<TFleet>;
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
        cond: (context, { sourcePlanetId }) => {
          const sourcePlanet = context.planets.find(
            (planet) => planet.id === sourcePlanetId
          );
          return context.players[0].id === sourcePlanet?.capturedBy;
        },
        actions: choose([
          {
            cond: (context, { sourcePlanetId, targetPlanetId }) =>
              !context.routes[sourcePlanetId]?.has(targetPlanetId),
            actions: assign({
              routes: (context, { sourcePlanetId, targetPlanetId }) => {
                const newRoutes = { ...context.routes };

                if (!newRoutes[sourcePlanetId]) {
                  newRoutes[sourcePlanetId] = new Set();
                }
                newRoutes[sourcePlanetId].add(targetPlanetId);

                return newRoutes;
              },
            }),
          },
          {
            actions: assign({
              routes: (context, { sourcePlanetId, targetPlanetId }) => {
                const newRoutes = { ...context.routes };
                newRoutes[sourcePlanetId]?.delete(targetPlanetId);
                return newRoutes;
              },
            }),
          },
        ]),
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
      "planet.produce": {
        actions: assign({
          fleets: (
            { players, routes, fleets, planets },
            { planetId, fleetSize }
          ) => {
            const planetRoutes = [...(routes[planetId] || [])];
            const sourcePlanet = planets.find(
              (planet) => planet.id === planetId
            )!;

            const newFleets: Array<TFleet> = planetRoutes.map(
              (targetPlanetId) => {
                return {
                  sourcePlanetId: planetId,
                  targetPlanetId,
                  color: planetColor({ planet: sourcePlanet, players }),
                  size: fleetSize / planetRoutes.length,
                  position: sourcePlanet.position,
                };
              }
            );

            return [...fleets, ...newFleets];
          },
        }),
      },
    },
  });
};
