import { Block } from "./Block.js";

export class BlockAdd extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Add',
            type:        'operator',
            numOfPorts:  [2, 1],
            size:        { width: 40, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       '+',
            fontSize:    26,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
