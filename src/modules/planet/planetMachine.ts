import { createMachine, assign, sendParent } from "xstate";
import { pure } from "xstate/lib/actions";

import { TPlanet } from "./planet";

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet>(
    {
      context: {
        ...planet,
        tick: 0,
        selected: false,
      },
      initial: planet.capturedBy ? "running" : "dormant",
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
                pure((context) => {
                  const shouldProduce = context.tick % 2 === 0;
                  if (shouldProduce) {
                    return sendParent({
                      type: "planet.produce",
                      planetId: context.id,
                      fleetSize: context.radius,
                    });
                  } else {
                    return [];
                  }
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
              selected: (context) => !context.selected,
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
