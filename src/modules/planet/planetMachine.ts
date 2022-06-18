import { log } from "xstate/lib/actions";
import { createMachine, assign, sendParent } from "xstate";

import { TPlanet } from "./planet";

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet>(
    {
      context: {
        ...planet,
        tick: 0,
        selected: false,
        routes: [],
      },
      initial: "running",
      states: {
        running: {
          on: {
            tick: {
              actions: [
                assign((context) => {
                  return { tick: context.tick + 1 };
                }),
                "commit",
              ],
            },
            "establish-route": {
              actions: [
                assign((context, event) => {
                  return {
                    routes: [
                      ...context.routes,
                      { destination: event.destination },
                    ],
                  };
                }),
                "commit",
                log(),
              ],
            },
          },
        },
      },
      on: {
        select: {
          actions: [
            assign({
              selected: (_context) => true,
            }),
            "commit",
          ],
        },
        deselect: {
          actions: [
            assign({
              selected: (_context) => false,
            }),
            "commit",
          ],
        },
      },
    },
    {
      actions: {
        commit: sendParent((context) => {
          return {
            type: "planet.commit",
            planet: context,
          };
        }),
      },
    }
  );
};
