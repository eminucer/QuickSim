import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

// Normalized shape point arrays — computed once at module load, reused by every instance.
// Each entry is a flat [nx0, ny0, nx1, ny1, ...] array where
//   nx ∈ [0,1] → x within the drawable area (left→right)
//   ny ∈ [0,1] → y within the drawable area (top→bottom in canvas coords)

const _sinePoints = (() => {
    const pts = [], N = 64;
    for (let i = 0; i <= N; i++) {
        const t = i / N;
        pts.push(t, 0.5 - 0.5 * Math.sin(2 * Math.PI * t));
    }
    return pts;
})();

const SHAPES = Object.freeze({
    sine: _sinePoints,

    // Single period: center → peak → trough → center
    triangle: [
        0.08, 0.50,
        0.29, 0.10,
        0.71, 0.90,
        0.92, 0.50,
    ],

    // Narrow pulse on a flat baseline
    pulse: [
        0.08, 0.80,
        0.40, 0.80,
        0.40, 0.12,
        0.60, 0.12,
        0.60, 0.80,
        0.92, 0.80,
    ],

    // Two full cycles, 50 % duty cycle
    square: [
        0.08, 0.22,
        0.29, 0.22,
        0.29, 0.78,
        0.50, 0.78,
        0.50, 0.22,
        0.71, 0.22,
        0.71, 0.78,
        0.92, 0.78,
    ],

    // Three full cycles — denser to suggest a digital clock signal
    clock: [
        0.08, 0.78,
        0.22, 0.78,
        0.22, 0.22,
        0.36, 0.22,
        0.36, 0.78,
        0.50, 0.78,
        0.50, 0.22,
        0.64, 0.22,
        0.64, 0.78,
        0.78, 0.78,
        0.78, 0.22,
        0.92, 0.22,
    ],

    // Ramp up then instant drop — 1.5 cycles, ends at peak
    sawtooth: [
        0.08, 0.82,
        0.50, 0.18,
        0.50, 0.82,
        0.92, 0.18,
    ],

    // Flat baseline with diagonal ramp up from one point
    ramp: [0.10, 0.78,  0.28, 0.78,  0.88, 0.18],

    // Flat low, vertical jump, flat high
    step: [0.10, 0.70,  0.42, 0.70,  0.42, 0.20,  0.90, 0.20],
});

export class SignalIconRenderer extends DefaultBlockRenderer {
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
        this._drawIcon();
    }

    _drawIcon() {
        if (this._icon) { this._icon.destroy(); this._icon = null; }

        const shape    = this.owner.constructor.signalShape;
        const normPts  = SHAPES[shape];
        if (!normPts) return;

        const W = this.width, H = this.height;
        const padX   = 10, padY = 8;
        const scaleX = W - 2 * padX;
        const scaleY = H - 2 * padY;

        const pts = [];
        for (let i = 0; i < normPts.length; i += 2) {
            pts.push(
                padX + normPts[i]     * scaleX,
                padY + normPts[i + 1] * scaleY,
            );
        }

        this._icon = new Konva.Line({
            points:      pts,
            stroke:      this.strokeColor,
            strokeWidth: 2,
            lineCap:     'round',
            lineJoin:    'round',
            listening:   false,
        });
        this.add(this._icon);
    }

    resize(newH) {
        this.height = newH;
        this.owner.size.height = newH;
        this.block.height(newH);
        this._drawIcon();
        if (this.getLayer()) this.getLayer().batchDraw();
    }
}
