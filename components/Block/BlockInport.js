import { Block } from "./Block.js";
import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class BlockInport extends Block {
    constructor(stage, params = {}) {
        const N = params.numOutputs ?? 1;
        super(stage, {
            name:         'Inport',
            type:         'inport',
            numOfPorts:   [0, N],
            size:         { width: 70, height: Math.max(40, N * 20) },
            color:        '#F1F5F9',
            strokeColor:  '#64748B',
            label:        params.label ?? 'In',
            fontSize:     13,
            configurable: true,
            initMovePos:  params.pos ?? { x: 0, y: 0 },
        });
        this.parentSubmodelBlock = null;
    }

    createRendererClass() { return DefaultBlockRenderer; }

    delete() {
        if (this.parentSubmodelBlock) {
            document.dispatchEvent(new CustomEvent('inport-deleted', {
                detail: { submodelBlock: this.parentSubmodelBlock }
            }));
        }
        super.delete();
    }
}
