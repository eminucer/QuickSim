import { Block } from "./Block.js";

export class BlockFunction extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Function',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'f(x)',
            fontSize:    14,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
