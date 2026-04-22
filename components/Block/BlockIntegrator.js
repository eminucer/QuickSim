import { Block } from "./Block.js";

export class BlockIntegrator extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Integrator',
            type:        'operator',
            numOfPorts:  [1, 1],
            size:        { width: 34, height: 48 },
            color:       '#FEF9C3',
            strokeColor: '#A16207',
            label:       '∫',
            fontSize:    28,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
