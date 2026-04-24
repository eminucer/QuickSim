import { Block } from "./Block.js";
import { DemuxBlockRenderer } from "./DemuxBlockRenderer.js";

export class BlockDemux extends Block {
    constructor(stage, params = {}) {
        const numOutputs = params.numOutputs || 2;
        super(stage, {
            name:        'Demux',
            type:        'routing',
            numOfPorts:  [1, numOutputs],
            size:        { width: 50, height: Math.max(40, numOutputs * 20) },
            color:       '#FEF3C7',
            strokeColor: '#D97706',
            label:       '',
            configurable: false,
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }

    createRendererClass() {
        return DemuxBlockRenderer;
    }
}
