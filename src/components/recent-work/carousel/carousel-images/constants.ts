export const SLIDE_VARIANTS = {
  initial: {y: -400, opacity: 0},
  animate: {y: 0, opacity: 1},
  exit: {y: 900, opacity: 0},
}

export const FLOAT_VARIANTS = {
  initial: {y: 0, rotateZ: 0},
  animate: {
    y: [0, -24, 14, 2, 0],
    rotateZ: [0, 1, -1, 0.5, 0],
  },
}
