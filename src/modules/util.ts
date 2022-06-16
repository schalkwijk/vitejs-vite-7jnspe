import { Position } from "./services/planet";

export const distance = (positionA: Position, positionB: Position) => {
  return Math.sqrt(
    Math.pow(positionA[0] - positionB[0], 2) +
      Math.pow(positionA[1] - positionB[1], 2)
  );
};

export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
