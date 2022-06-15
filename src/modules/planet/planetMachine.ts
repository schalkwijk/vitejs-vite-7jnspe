import { createMachine, assign } from 'xstate';

import { TPlanet } from './planet';

type TEvents = {
  type: 'tick';
};

export const createPlanetMachine = (planet: TPlanet) => {
  return createMachine<TPlanet & { tick: number }, TEvents>({
    context: {
      ...planet,
      tick: 0,
    },
    initial: 'running',
    states: {
      running: {
        on: {
          tick: {
            actions: assign((context) => {
              return { tick: context.tick + 1 };
            }),
          },
        },
      },
    },
  });
};
