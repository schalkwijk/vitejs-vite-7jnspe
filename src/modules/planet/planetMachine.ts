import { createMachine, assign, sendParent, send } from "xstate";
import { pure, choose } from "xstate/lib/actions";

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
            impact: {
              actions: [
                assign({
                  toughness: (context, event) => {
                    return Math.max(context.toughness - event.fleet.size, 0);
                  },
                }),
                choose([
                  {
                    cond: ({ toughness }) => toughness <= 0,
                    actions: send((_context, event) => {
                      return {
                        type: "captured",
                        capturedBy: event.fleet.playerId,
                      };
                    }),
                  },
                ]),
                "commit",
              ],
            },
            captured: {
              actions: [
                assign({
                  capturedBy: (_context, event) => event.capturedBy,
                }),
                "commit",
              ],
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
                  const shouldProduce = context.tick % 150 === 0;
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
