import { Block } from "./Block.js";

export class BlockConstant extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Constant',
            type:        'source',
            numOfPorts:  [0, 1],
            size:        { width: 40, height: 40 },
            color:       '#EDE9FE',
            strokeColor: '#6D28D9',
            label:       'C',
            fontSize:    22,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
