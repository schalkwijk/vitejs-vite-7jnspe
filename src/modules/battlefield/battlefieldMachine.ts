import { createMachine, assign, spawn, send } from "xstate";
import { pure } from "xstate/lib/actions";

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

export const createBattlefieldMachine = (battlefield: TBattlefield) => {
  return createMachine<TBattlefield>({
    context: battlefield,
    initial: "running",
    states: {
      running: {
        entry: assign({
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
