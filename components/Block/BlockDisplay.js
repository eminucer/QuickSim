import { Block } from "./Block.js";

export class BlockDisplay extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Display',
            type:        'sink',
            numOfPorts:  [1, 0],
            size:        { width: 72, height: 38 },
            color:       '#FFF7ED',
            strokeColor: '#C2410C',
            label:       'disp',
            fontSize:    15,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
