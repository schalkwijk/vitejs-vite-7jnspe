import { createMachine, assign, sendParent } from "xstate";

import { TPlanet } from "./planet";

type TEvents = {
  type: "tick";
};

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet & { tick: number }, TEvents>(
    {
      context: {
        ...planet,
        tick: 0,
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
