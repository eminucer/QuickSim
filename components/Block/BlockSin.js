import { Block } from "./Block.js";

export class BlockSin extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Sin',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'sin',
            fontSize:    14,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
