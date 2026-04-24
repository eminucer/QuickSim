import { Block } from "./Block.js";

export class BlockODE extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'ODE',
            type:        'dynamic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#FEF9C3',
            strokeColor: '#A16207',
            label:       'ODE',
            fontSize:    14,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
