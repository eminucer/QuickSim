import { Block } from "./Block.js";

export class BlockExp extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Exp',
            type:        'algebraic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       'eˣ',
            fontSize:    18,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
