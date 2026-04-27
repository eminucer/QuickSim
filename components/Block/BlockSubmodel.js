import { Block } from "./Block.js";
import { SubmodelBlockRenderer } from "./SubmodelBlockRenderer.js";

export class BlockSubmodel extends Block {
    constructor(stage, params = {}) {
        const numIn  = params.numInputs  ?? 0;
        const numOut = params.numOutputs ?? 0;
        const height = Math.max(60, Math.max(numIn, numOut, 1) * 24 + 16);
        super(stage, {
            name:         params.name    ?? 'Submodel',
            type:         'submodel',
            numOfPorts:   [numIn, numOut],
            size:         { width: 90, height },
            color:        '#F0FDF4',
            strokeColor:  '#15803D',
            label:        params.label   ?? 'Sub',
            configurable: false,
            initMovePos:  params.pos     ?? { x: 0, y: 0 },
        });
        this.internalData = params.internalData ?? null;
    }

    _computeHeight(numInputs, numOutputs) {
        return Math.max(60, Math.max(numInputs, numOutputs, 1) * 24 + 16);
    }

    createRendererClass() { return SubmodelBlockRenderer; }

    delete() {
        document.dispatchEvent(new CustomEvent('submodel-destroyed', {
            detail: { id: this.id }
        }));
        super.delete();
    }
}
