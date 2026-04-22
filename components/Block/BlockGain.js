import { Block } from "./Block.js";
import { GainBlockRenderer } from "./GainBlockRenderer.js";

export class BlockGain extends Block {
    constructor(stage, params = {}) {
        super(stage, {
            name:        'Gain',
            type:        'operator',
            numOfPorts:  [1, 1],
            size:        { width: 60, height: 56 },
            color:       '#EFF6FF',
            strokeColor: '#1D4ED8',
            label:       'K',
            fontSize:    20,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }

    createRendererClass() { return GainBlockRenderer; }
}
