import { Block } from "./Block.js";

export class BlockLog10 extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Log10',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'log₁₀',
            fontSize:    12,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
