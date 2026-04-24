import { Block } from "./Block.js";
import { MuxBlockRenderer } from "./MuxBlockRenderer.js";

export class BlockMux extends Block {
    constructor(stage, params = {}) {
        const numInputs = params.numInputs || 2;
        super(stage, {
            name:        'Mux',
            type:        'routing',
            numOfPorts:  [numInputs, 1],
            size:        { width: 50, height: Math.max(40, numInputs * 20) },
            color:       '#EDE9FE',
            strokeColor: '#6D28D9',
            label:       '',
            configurable: false,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }

    createRendererClass() {
        return MuxBlockRenderer;
    }
}
