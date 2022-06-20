import { createMachine, assign, sendParent } from "xstate";

import { TPlanet } from "./planet";

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet>(
    {
      context: {
        ...planet,
        tick: 0,
        selected: false,
      },
      initial: "dormant",
      states: {
        dormant: {
          on: {
            captured: {
              actions: assign({
                capturedBy: (_context, event) => event.capturedBy,
              }),
              target: "running",
            },
          },
        },
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
