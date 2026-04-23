import { Block } from "./Block.js";
import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class BlockOutport extends Block {
    constructor(stage, params = {}) {
        const M = params.numInputs ?? 1;
        super(stage, {
            name:         'Outport',
            type:         'outport',
            numOfPorts:   [M, 0],
            size:         { width: 70, height: Math.max(40, M * 20) },
            color:        '#F1F5F9',
            strokeColor:  '#64748B',
            label:        params.label ?? 'Out',
            fontSize:     13,
            configurable: true,
            initMovePos:  params.pos ?? { x: 0, y: 0 },
        });
        this.parentSubmodelBlock = null;
    }

    createRendererClass() { return DefaultBlockRenderer; }

    delete() {
        if (this.parentSubmodelBlock) {
            document.dispatchEvent(new CustomEvent('outport-deleted', {
                detail: { submodelBlock: this.parentSubmodelBlock }
            }));
        }
        super.delete();
    }
}
