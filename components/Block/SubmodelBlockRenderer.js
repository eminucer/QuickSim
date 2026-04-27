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
        this._iconLines = [];
        const ox = this.width  - 14;
        const oy = this.height - 13;
        for (let i = 0; i < 3; i++) {
            const line = new Konva.Line({
                points:      [ox, oy + i * 3.5, ox + 9, oy + i * 3.5],
                stroke:      '#15803D',
                strokeWidth: 1.5,
                opacity:     0.4 + i * 0.2,
                listening:   false,
            });
            this._iconLines.push(line);
            this.add(line);
        }
    }

    resize(newH) {
        super.resize(newH);
        if (!this._iconLines) return;
        const oy = newH - 13;
        this._iconLines.forEach((line, i) => {
            line.points([this.width - 14, oy + i * 3.5, this.width - 14 + 9, oy + i * 3.5]);
        });
    }
}
