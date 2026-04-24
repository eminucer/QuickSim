import { Block } from "./Block.js";

export class BlockHPF extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'HPF',
            type:        'dynamic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#FEF9C3',
            strokeColor: '#A16207',
            label:       'HPF',
            fontSize:    14,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
