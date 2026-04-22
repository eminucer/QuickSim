import { Block } from "./Block.js";

export class BlockMultiply extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Multiply',
            type:        'operator',
            numOfPorts:  [2, 1],
            size:        { width: 40, height: 40 },
            color:       '#DCFCE7',
            strokeColor: '#15803D',
            label:       '×',
            fontSize:    24,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
