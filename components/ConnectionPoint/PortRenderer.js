import { ConnectionPointRenderer } from "./ConnectionPointRenderer.js";

export class PortRenderer extends ConnectionPointRenderer {
    constructor(owner, params) {
        super(owner, params);
        this.arrowSize = 12;
    }

    _createShapeFunction() { return this.createArrowShape.bind(this); }

    createArrowShape() {
        const blockH = this.parentGroup.block.height();
        const num    = Math.max(1, this.params.numOfPorts || 1);
        const idx    = Math.max(0, Math.min(this.params.idx || 0, num - 1));
        const slot   = blockH / num;
        const yPos   = slot * idx + slot / 2;
        const s      = this.arrowSize;
        const isInput = this.params.type === 'input';
        const xPos   = isInput
            ? 0
            : this.parentGroup.block.width() + s / 2;

        this._arrow = new Konva.Shape({
            x:           xPos,
            y:           yPos,
            stroke:      '#475569',
            strokeWidth: 2,
            draggable:   false,
            listening:   true,
            _isPort:     true,
            sceneFunc:   (ctx, shape) => this._drawArrow(ctx, shape),
        });

        // Mark so block click handler can ignore it
        this._arrow._isPort = true;

        // Stop mouse events from bubbling to the block group
        this._arrow.on('mousedown touchstart', e => { e.cancelBubble = true; });
        this._arrow.on('click',                e => { e.cancelBubble = true; });

        return this._arrow;
    }

    _drawArrow(ctx, shape) {
        const s = this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-s / 2, -s / 2);
        ctx.moveTo(0, 0);
        ctx.lineTo(-s / 2,  s / 2);
        ctx.strokeShape(shape);
    }

    /* Full override — parent _onHover uses Circle-specific methods */
    _onHover(isHovering) {
        if (this._arrow) {
            this._arrow.stroke(isHovering ? '#3B82F6' : '#475569');
            this._arrow.strokeWidth(isHovering ? 2.5 : 2);
        }
        document.body.style.cursor = isHovering ? 'crosshair' : 'default';
        if (this.getLayer()) this.getLayer().batchDraw();
    }
}
