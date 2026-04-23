import { WireSegment } from "../Wire/WireSegment.js";

export class ConnectionPointRenderer extends Konva.Group {
    constructor(owner, params = {}) {
        super({ draggable: false });
        this.params      = params;
        this.parentGroup = owner.owner.renderer;
        this.owner       = owner;
        this.pos         = params.pos;
        this.stage       = this.owner.stage;
        this.cp          = null;
    }

    _bindEvents() {
        this.cp.on('mouseover', () => this._onHover(true));
        this.cp.on('mouseout',  () => this._onHover(false));
        this.cp.on('mousedown', e => {
            e.cancelBubble = true;
            // Disable block drag for this click so Konva's DnD doesn't remove
            // the pointermove handler we register in tempWire.start().
            this.parentGroup.draggable(false);
            window.addEventListener('mouseup', () => {
                this.parentGroup.draggable(true);
            }, { once: true });
            this._onPointerDown();
        });
        this.cp.on('click', e => {
            e.cancelBubble = true; // prevent block click-select
        });

        // Enlarge hit area for easier clicking
        this.cp.hitFunc((ctx, shape) => {
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillShape(shape);
        });
    }

    render() {
        this.cp = this._createShapeFunction()();
        this.add(this.cp);
        this._bindEvents();
    }

    _createShapeFunction() { return this._createCP.bind(this); }

    getPositions() {
        // getAbsolutePosition() includes the stage scale+pan, giving screen/canvas
        // pixel coords.  We need world coords (layer-local space) so that wire
        // Konva.Line.points — which live in layer space — are consistent.
        const abs   = this.cp.getAbsolutePosition();
        const ks    = this.stage && this.stage.stage; // Konva.Stage
        if (!ks || !ks.scaleX) return abs;
        const scale = ks.scaleX();
        const pos   = ks.position();
        return {
            x: (abs.x - pos.x) / scale,
            y: (abs.y - pos.y) / scale,
        };
    }

    _createCP() {
        let x, y;
        if ('pos' in this.params) {
            x = this.pos.x;
            y = this.pos.y;
        } else {
            x = 0;
            y = this.parentGroup.block.height() / 2;
        }
        const cp = new Konva.Circle({
            x, y,
            radius:      5,
            fill:        '#475569',
            stroke:      '#1e293b',
            strokeWidth: 1.5,
        });
        return cp;
    }

    _onHover(isHovering) {
        if (isHovering) {
            document.body.style.cursor = 'crosshair';
            this.cp.fill('#3B82F6');
            this.cp.stroke('#1D4ED8');
            this.cp.radius(7);
            this.cp.shadowColor('#3B82F6');
            this.cp.shadowBlur(8);
            this.cp.shadowOpacity(0.6);
        } else {
            document.body.style.cursor = 'default';
            this.cp.fill('#475569');
            this.cp.stroke('#1e293b');
            this.cp.radius(5);
            this.cp.shadowBlur(0);
            this.cp.shadowOpacity(0);
        }
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    _onPointerDown() {
        const stg = this.stage;
        const tw  = stg?.tempWire;
        if (!tw) return;

        if (this.owner.isConnected) {
            if (tw.isDrawing()) tw.renderer.cancelDraw();
            return;
        }

        if (tw.isDrawing()) {
            tw.delete();
            const newWire = new WireSegment(stg);
            stg.add(newWire);
            newWire.connect(this.owner);
        } else {
            tw.start(this.owner);
        }
    }
}
