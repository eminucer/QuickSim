import { Block } from "./Block.js";

export class BlockSinusoidal extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Sinusoidal',
            type:        'source',
            numOfPorts:  [0, 1],
            size:        { width: 72, height: 38 },
            color:       '#EDE9FE',
            strokeColor: '#6D28D9',
            label:       'sin',
            fontSize:    17,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
