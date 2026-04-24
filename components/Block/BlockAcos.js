import { Block } from "./Block.js";

export class BlockAcos extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Acos',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'cos⁻¹',
            fontSize:    11,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
