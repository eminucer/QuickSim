import { WireSegmentRenderer } from "./WireSegmentRenderer.js";

export class WireSegment {
    static id = 0;

    constructor(stage, params = {}) {
        this.stage      = stage;
        this.params     = params;
        this.isSelected = false;
        this.cps        = { start: null, end: null };
        this.id         = WireSegment.id++;

        const RendererClass = this.createRendererClass();
        this.renderer = new RendererClass(this);

        if ('points' in this.params) {
            // Wire points pre-supplied (split wire case)
            this.renderer.updatePoints(this.params);
        }
    }

    createRendererClass() { return WireSegmentRenderer; }

    /* ── Connection ── */
    connect(connectionPoint) {
        return this.renderer.connect(connectionPoint);
    }

    connect2(startCP, endCP) {
        this.renderer.connect2(startCP, endCP);
    }

    /* ── Drawing state ── */
    isDrawing() { return this.renderer.isDrawing; }

    start(connectionPoint) { this.renderer.start(connectionPoint); }

    /* ── Selection ── */
    select() {
        this.stage.deselectAll();
        this.isSelected = true;
        this.stage.selectedItems.push(this);
    }

    deSelect() {
        this.isSelected = false;
        this.renderer.unhighlight();
        if (this.renderer.getLayer()) this.renderer.getLayer().batchDraw();
    }

    /* ── Deletion ── */
    delete() {
        // If mid-draw, just cancel (tempWire use-case)
        if (this.renderer.isDrawing) {
            this.renderer.delete(); // preserves static state for next wire
            return;
        }

        // Disconnect both port ends
        if (this.cps.start) {
            if (typeof this.cps.start.removeWire === 'function') {
                this.cps.start.removeWire(this);
            } else {
                this.cps.start.wire        = null;
                this.cps.start.isConnected = false;
            }
        }
        if (this.cps.end) {
            if (typeof this.cps.end.removeWire === 'function') {
                this.cps.end.removeWire(this);
            } else {
                this.cps.end.wire        = null;
                this.cps.end.isConnected = false;
            }
        }
        this.cps = { start: null, end: null };

        // Remove from selectedItems
        const selIdx = this.stage.selectedItems.indexOf(this);
        if (selIdx !== -1) this.stage.selectedItems.splice(selIdx, 1);

        // Destroy Konva renderer (removes from layer)
        this.renderer.fullDelete();
    }

    updateOnDrag(cp) { this.renderer.updateOnDrag(cp); }
}
