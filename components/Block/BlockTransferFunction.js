import { Block } from "./Block.js";

export class BlockTransferFunction extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'TransferFunction',
            type:        'dynamic',
            numOfPorts:  [1, 1],
            size:        { width: 48, height: 40 },
            color:       '#FEF9C3',
            strokeColor: '#A16207',
            label:       'H(s)',
            fontSize:    13,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }
}
