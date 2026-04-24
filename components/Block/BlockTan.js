import { Block } from "./Block.js";

export class BlockTan extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Tan',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'tan',
            fontSize:    14,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
