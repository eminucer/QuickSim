import { Block } from "./Block.js";
import { SignalIconRenderer } from "./SignalIconRenderer.js";

export class BlockSinusoidal extends Block {
    static signalShape = 'sine';

    constructor(stage, params = {}) {
        super(stage, {
            name:        'Sinusoidal',
            type:        'source',
            numOfPorts:  [0, 1],
            size:        { width: 72, height: 48 },
            color:       '#EDE9FE',
            strokeColor: '#6D28D9',
            label:       '',
            initMovePos: params.pos || { x: 0, y: 0 },
        });
    }

    createRendererClass() { return SignalIconRenderer; }
}
