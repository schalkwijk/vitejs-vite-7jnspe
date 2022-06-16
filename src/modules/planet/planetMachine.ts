import { createMachine, assign, sendParent } from "xstate";

import { TPlanet } from "./planet";

type TEvents = {
  type: "tick" | "select";
};

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet, TEvents>(
    {
      context: {
        ...planet,
        tick: 0,
        selected: false,
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
          },
        },
      },
      on: {
        select: {
          actions: [
            assign({
              selected: (_context) => true,
            }),
            "select",
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
        select: sendParent((context) => {
          return {
            type: "planet.select",
            planet: context,
          };
        }),
      },
    }
  );
};
