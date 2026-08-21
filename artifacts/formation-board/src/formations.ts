// The shape library. Kept in its own module because both the tactics board
// and the match game pick from the same list, and the game must not have to
// import App.tsx to get at it.

export type Formation = {
  name: string;
  subtitle: string;
  shape: number[];
};

export const FORMATIONS: Formation[] = [
  { name: '4-4-2', subtitle: 'Balanced classic', shape: [4, 4, 2] },
  { name: '4-3-3', subtitle: 'Width + pressure', shape: [4, 3, 3] },
  { name: '4-2-3-1', subtitle: 'Control the middle', shape: [4, 2, 3, 1] },
  { name: '4-1-4-1', subtitle: 'Compact block', shape: [4, 1, 4, 1] },
  { name: '4-4-1-1', subtitle: 'Second striker link', shape: [4, 4, 1, 1] },
  { name: '4-5-1', subtitle: 'Midfield overload', shape: [4, 5, 1] },
  { name: '4-2-2-2', subtitle: 'Box midfield', shape: [4, 2, 2, 2] },
  { name: '4-3-1-2', subtitle: 'Narrow diamond', shape: [4, 3, 1, 2] },
  { name: '4-3-2-1', subtitle: 'Christmas tree', shape: [4, 3, 2, 1] },
  { name: '4-3-3 Attack', subtitle: 'Aggressive front three', shape: [4, 3, 3] },
  { name: '3-4-3', subtitle: 'High and wide', shape: [3, 4, 3] },
  { name: '3-4-1-2', subtitle: 'Playmaker behind two', shape: [3, 4, 1, 2] },
  { name: '3-4-2-1', subtitle: 'Two between lines', shape: [3, 4, 2, 1] },
  { name: '3-5-2', subtitle: 'Extra central body', shape: [3, 5, 2] },
  { name: '3-1-4-2', subtitle: 'Single pivot', shape: [3, 1, 4, 2] },
  { name: '5-3-2', subtitle: 'Wing-back security', shape: [5, 3, 2] },
  { name: '5-4-1', subtitle: 'Deep and patient', shape: [5, 4, 1] },
  { name: '5-2-3', subtitle: 'Counter-punch', shape: [5, 2, 3] },
  { name: '5-3-1-1', subtitle: 'Low-block diamond', shape: [5, 3, 1, 1] },
  { name: '4-2-4', subtitle: 'Full send', shape: [4, 2, 4] },
  { name: '4-1-2-1-2', subtitle: 'Midfield diamond', shape: [4, 1, 2, 1, 2] },
  { name: '4-2-1-3', subtitle: 'Three-lane attack', shape: [4, 2, 1, 3] },
  { name: '4-4-2 Diamond', subtitle: 'Narrow midfield', shape: [4, 4, 2] },
  { name: '3-4-3 Diamond', subtitle: 'Diamond behind a front three', shape: [3, 4, 3] },
  { name: '3-2-4-1', subtitle: 'Modern build-up', shape: [3, 2, 4, 1] },
  { name: '4-1-3-2', subtitle: 'Anchor and three', shape: [4, 1, 3, 2] },
  { name: '5-2-1-2', subtitle: 'Wing-back diamond', shape: [5, 2, 1, 2] },
  { name: '3-3-3-1', subtitle: 'Three lines of three', shape: [3, 3, 3, 1] },
  { name: '3-5-1-1', subtitle: 'Deep block, two up', shape: [3, 5, 1, 1] },
];
