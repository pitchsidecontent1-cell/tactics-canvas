// Shared geometry type, kept in its own module so the lazily-loaded animation
// data does not have to import anything from App.tsx (which would defeat the
// point of splitting it out).

/** A point on the pitch, in percentages: x 0-100 left to right, y 0-100 from
 *  the opponent's goal line to your own. */
export type Position = {
  x: number;
  y: number;
};
