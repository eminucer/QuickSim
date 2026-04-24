import { Block } from "./Block.js";

export class BlockAtan extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Atan',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'tan⁻¹',
            fontSize:    11,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
