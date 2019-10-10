import { PixelMap } from './';

type KeyboardPixelMapRow = {
  /**
   * The svg y positions for (most) keys in this row
   */
  svgY: number;
  keys: Array<{
    i: number;
  }>;
};

export type KeyboardPixelMap = {
  svg: string;
  rows: KeyboardPixelMapRow[];
};

export const KEYBOARD_PIXEL_MAPS: { [id: string]: KeyboardPixelMap } = {
  'Razer Ornata Chroma': {
    svg: 'ornata-chroma.svg',
    rows: [
      {
        svgY: 10,
        keys: [
          { i: 1  }, // ESC
          { i: 3  }, // F1
          { i: 4  }, // F2
          { i: 5  }, // F3
          { i: 6  }, // F4
          { i: 7  }, // F5
          { i: 8  }, // F6
          { i: 9  }, // F7
          { i: 10 }, // F8
          { i: 11 }, // F9
          { i: 12 }, // F10
          { i: 13 }, // F11
          { i: 14 }, // F12
          { i: 15 }, // prt Sc
          { i: 16 }, // scr lockk
          { i: 17 }, // pause
        ],
      },
      {
        svgY: 70.910522,
        keys: [
          { i: 1  }, // `
          { i: 2  }, // 1
          { i: 3  }, // 2
          { i: 4  }, // 3
          { i: 5  }, // 4
          { i: 6  }, // 5
          { i: 7  }, // 6
          { i: 8  }, // 7
          { i: 9  }, // 8
          { i: 10 }, // 9
          { i: 11 }, // 0
          { i: 12 }, // -
          { i: 13 }, // =
          { i: 14 }, // backspace
          { i: 15 }, // insert
          { i: 16 }, // home
          { i: 17 }, // page up
          { i: 18 }, // num lock
          { i: 19 }, // /
          { i: 20 }, // *
          { i: 21 }, // -
        ],
      },
      {
        svgY: 117.00507,
        keys: [
          { i: 1  }, // tab
          { i: 2  }, // q
          { i: 3  }, // w
          { i: 4  }, // e
          { i: 5  }, // r
          { i: 6  }, // t
          { i: 7  }, // y
          { i: 8  }, // u
          { i: 9  }, // i
          { i: 10 }, // o
          { i: 11 }, // p
          { i: 12 }, // [
          { i: 13 }, // ]
          { i: 14 }, // \
          { i: 15 }, // delete
          { i: 16 }, // end
          { i: 17 }, // page down
          { i: 18 }, // 7 / home
          { i: 19 }, // 8 / up
          { i: 20 }, // 9 / page up
          { i: 21 }, // +
        ],
      },
      {
        svgY: 163.09955,
        keys: [
          { i: 1  }, // caps lock
          { i: 2  }, // a
          { i: 3  }, // s
          { i: 4  }, // d
          { i: 5  }, // f
          { i: 6  }, // g
          { i: 7  }, // h
          { i: 8  }, // j
          { i: 9  }, // k
          { i: 10 }, // l
          { i: 11 }, // ;
          { i: 12 }, // '
          { i: 14 }, // enter
          { i: 18 }, // 4 / left
          { i: 19 }, // 5
          { i: 20 }, // 6 / right
        ],
      },
      {
        svgY: 209.19406,
        keys: [
          { i: 1  }, // shift
          { i: 3  }, // z
          { i: 4  }, // x
          { i: 5  }, // c
          { i: 6  }, // v
          { i: 7  }, // b
          { i: 8  }, // n
          { i: 9  }, // m
          { i: 10 }, // ,
          { i: 11 }, // .
          { i: 12 }, // /
          { i: 14 }, // shift
          { i: 16 }, // up
          { i: 18 }, // 1 / end
          { i: 19 }, // 2 / down
          { i: 20 }, // 3 / page down
          { i: 21 }, // enter
        ],
      },
      {
        svgY: 255.28857,
        keys: [
          { i: 1  }, // ctrl
          { i: 2  }, // windows
          { i: 3  }, // alt
          { i: 7  }, // space
          { i: 11 }, // alt
          { i: 12 }, // fn
          { i: 13 }, // menu
          { i: 14 }, // ctrl
          { i: 15 }, // left
          { i: 16 }, // down
          { i: 17 }, // right
          { i: 19 }, // 0 / insert
          { i: 20 }, // del
        ],
      },
    ],
  },
};

export const HARDCODED_MAPS: { [id: string]: PixelMap } = {
  'Razer Firefly': {
    rows: [{
      // Height ~ 450, Width ~ 700
      keys: [
        { i: 0,  centreX: 700, centreY: 420 },
        { i: 1,  centreX: 700, centreY: 400 },
        { i: 2,  centreX: 700, centreY: 225 },
        { i: 3,  centreX: 700, centreY: 100 },
        { i: 4,  centreX: 650, centreY:  30 },
        { i: 5,  centreX: 600, centreY:   0 },
        { i: 6,  centreX: 480, centreY:   0 },
        { i: 7,  centreX: 350, centreY:   0 },
        { i: 8,  centreX: 220, centreY:   0 },
        { i: 9,  centreX: 100, centreY:   0 },
        { i: 10, centreX: 50,  centreY:  30 },
        { i: 11, centreX:   0, centreY: 100 },
        { i: 12, centreX:   0, centreY: 225 },
        { i: 13, centreX:   0, centreY: 400 },
        { i: 14, centreX:   0, centreY: 420 },
      ],
    }],
  },
};
