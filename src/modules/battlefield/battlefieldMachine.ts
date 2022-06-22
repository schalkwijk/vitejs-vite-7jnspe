import _ from "lodash";
import { createMachine, assign, spawn, send } from "xstate";
import { pure, choose, sendParent } from "xstate/lib/actions";
import { v4 as uuid } from "uuid";

import {
  angleBetweenPlanets,
  edgeOfPlanet,
  findPlanet,
  planetColor,
  TPlanet,
} from "../planet/planet";
import { createPlanetMachine } from "../planet/planetMachine";
import { generateBattlefield } from "./battlefield";
import { distance, TPosition } from "../util";

export type TBox = [number, number];
export type TPlayer = { color: string; id: string };
export type TFleet = {
  id: string;
  color: string;
  sourcePlanetId: TPlanet["id"];
  targetPlanetId: TPlanet["id"];
  size: number;
  position: TPosition;
  dx: number;
  dy: number;
  angle: number;
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

const TICK = 2.5;

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
            }, 10);

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
              assign({
                fleets: ({ fleets, planets }) => {
                  const newFleets = fleets
                    .map((fleet) => {
                      const newPosition = [
                        fleet.position[0] + fleet.dx,
                        fleet.position[1] + fleet.dy,
                      ] as TPosition;
                      return { ...fleet, position: newPosition };
                    })
                    .filter(({ position, targetPlanetId }) => {
                      const planet = findPlanet(planets, targetPlanetId);
                      const distanceBetweenPlanetAndFleet = distance(
                        { position },
                        planet
                      );
                      return distanceBetweenPlanetAndFleet > planet.radius + 7; // TODO: don't use magic number here (this is the fleet radius when drawn)
                    });

                  return newFleets;
                },
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
            const sourcePlanet = findPlanet(planets, planetId);

            const newFleets: Array<TFleet> = planetRoutes.map(
              (targetPlanetId) => {
                const targetPlanet = findPlanet(planets, targetPlanetId);
                const distanceBetweenPlanetAndFleet = distance(
                  sourcePlanet,
                  targetPlanet
                );
                const { radians, degrees } = angleBetweenPlanets({
                  sourcePlanet,
                  targetPlanet,
                });
                const { x, y } = edgeOfPlanet({
                  planet: sourcePlanet,
                  radians,
                });

                return {
                  sourcePlanetId: planetId,
                  targetPlanetId,
                  color: planetColor({ planet: sourcePlanet, players }),
                  size: Math.round(fleetSize / planetRoutes.length),
                  position: [x, y],
                  dx:
                    (targetPlanet.position[0] - x) /
                    distanceBetweenPlanetAndFleet /
                    TICK,
                  dy:
                    (targetPlanet.position[1] - y) /
                    distanceBetweenPlanetAndFleet /
                    TICK,
                  angle: 90 - degrees,
                  id: uuid(),
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
