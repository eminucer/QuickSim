import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class SubmodelBlockRenderer extends DefaultBlockRenderer {
    constructor(owner) {
        super(owner);
        // Fire submodel-open on double-click (parent's handler returns early for non-configurable)
        this.on('dblclick', e => {
            e.evt.preventDefault();
            document.dispatchEvent(new CustomEvent('submodel-open', {
                detail: { block: this.owner }
            }));
        });
    }

    render() {
        super.render();
        // Small stacked-lines icon in the bottom-right corner
        const ox = this.width  - 14;
        const oy = this.height - 13;
        for (let i = 0; i < 3; i++) {
            this.add(new Konva.Line({
                points:      [ox, oy + i * 3.5, ox + 9, oy + i * 3.5],
                stroke:      '#15803D',
                strokeWidth: 1.5,
                opacity:     0.4 + i * 0.2,
                listening:   false,
            }));
        }
    }
}
