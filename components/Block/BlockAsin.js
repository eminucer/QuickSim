import { Block } from "./Block.js";

export class BlockAsin extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Asin',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'sin⁻¹',
            fontSize:    11,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
