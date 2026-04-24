import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class SinusoidalBlockRenderer extends DefaultBlockRenderer {
    render() {
        const W = this.width, H = this.height;

        this.block = new Konva.Rect({
            x:            0,
            y:            0,
            width:        W,
            height:       H,
            fill:         this.color,
            stroke:       this.strokeColor,
            strokeWidth:  2,
            cornerRadius: 5,
        });
        this.add(this.block);

        this.label = null;
        this._drawSine();
    }

    _drawSine() {
        if (this._sine) { this._sine.destroy(); this._sine = null; }

        const W = this.width, H = this.height;
        const padX = 10, padY = 8;
        const cy   = H / 2;
        const amp  = cy - padY;
        const steps = 64;
        const pts  = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            pts.push(
                padX + t * (W - 2 * padX),
                cy - amp * Math.sin(2 * Math.PI * t),
            );
        }

        this._sine = new Konva.Line({
            points:      pts,
            stroke:      this.strokeColor,
            strokeWidth: 2,
            lineCap:     'round',
            lineJoin:    'round',
            listening:   false,
        });
        this.add(this._sine);
    }

    resize(newH) {
        this.height = newH;
        this.owner.size.height = newH;
        this.block.height(newH);
        this._drawSine();
        if (this.getLayer()) this.getLayer().batchDraw();
    }
}
