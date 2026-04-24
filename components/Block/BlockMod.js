import { Block } from "./Block.js";

export class BlockMod extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Mod',
            type:        'algebraic',
            numOfPorts:  [2, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'mod',
            fontSize:    13,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
