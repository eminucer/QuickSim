import { WireSegment } from './WireSegment.js';

/**
 * A branch point placed on an existing wire.
 *
 * The original wire is left untouched.  The Junction is an independent node
 * with a draggable world position that can accept any number of wires.
 *
 * UX:
 *   • Right-click a wire   → snaps a Junction dot to the nearest point.
 *   • Click junction        → select it (Delete key removes it).
 *   • Click again (selected)→ start a new branch wire from it.
 *   • Click junction (while drawing wire) → finish the wire here.
 *   • Drag junction         → move it; all attached wires re-route live.
 *   • Right-click junction  → context menu: Delete branch point.
 */
export class Junction {
    constructor(stageObj, worldPos) {
        this.stage        = stageObj;
        this.params       = { type: 'cp' };   // 'cp' lets it accept any port type
        this.owner        = null;             // not owned by a block
        this.isConnected  = false;            // always accepts more connections
        this.wires        = [];               // every wire attached here
        this.wire         = null;             // last wire (ConnectionPoint compat)
        this._pos         = { x: worldPos.x, y: worldPos.y };
        this._dragMoved   = false;
        this._deleting    = false;            // re-entry guard for deletion cascades
        this._branchWire  = null;             // the wire that caused this junction to be created
        this.renderer     = this._buildRenderer();
    }

    /* ── Visual ─────────────────────────────── */

    _buildRenderer() {
        const dot = new Konva.Circle({
            x:              this._pos.x,
            y:              this._pos.y,
            radius:         6,
            fill:           '#1e293b',
            stroke:         '#94a3b8',
            strokeWidth:    1.5,
            listening:      true,
            draggable:      true,
            hitStrokeWidth: 10,
        });

        dot.on('mouseover', () => {
            if (!this._isSelected()) dot.fill('#3B82F6');
            dot.radius(8);
            document.body.style.cursor = 'move';
            dot.getLayer()?.batchDraw();
        });
        dot.on('mouseout', () => {
            if (!this._isSelected()) dot.fill('#1e293b');
            dot.radius(this._isSelected() ? 7 : 6);
            document.body.style.cursor = 'default';
            dot.getLayer()?.batchDraw();
        });

        // Track whether the pointer moved during this press so we can
        // suppress the click handler after a drag.
        dot.on('dragstart', () => { this._dragMoved = false; });
        dot.on('dragmove',  () => {
            this._dragMoved = true;
            this._pos.x = dot.x();
            this._pos.y = dot.y();
            this.wires.forEach(w => w?.updateOnDrag(this));
            this.stage.wireLayer?.batchDraw();
        });
        // Reset after drag so the next click isn't mistakenly suppressed.
        // Konva already suppresses `click` during a drag, so resetting here
        // is safe — the click handler only fires for genuine clicks.
        dot.on('dragend', () => { this._dragMoved = false; });

        // click fires only when the pointer didn't drag (Konva suppresses it
        // after a real drag), so it's safe to use for select / wire actions.
        dot.on('click', e => {
            e.cancelBubble = true;
            if (this._dragMoved) { this._dragMoved = false; return; }
            this._onClick();
        });

        dot.on('contextmenu', e => {
            e.evt.preventDefault();
            e.cancelBubble = true;
            document.dispatchEvent(new CustomEvent('junction-contextmenu', {
                detail: { junction: this, x: e.evt.clientX, y: e.evt.clientY },
            }));
        });

        return dot;
    }

    /* ── Interaction ────────────────────────── */

    _isSelected() {
        return this.stage.selectedItems.includes(this);
    }

    _onClick() {
        const stg = this.stage;
        const tw  = stg?.tempWire;
        if (!tw) return;

        if (tw.isDrawing()) {
            tw.delete();
            const newWire = new WireSegment(stg);
            stg.add(newWire);
            newWire.connect(this);
            return;
        }

        if (this._isSelected()) {
            stg.deselectAll();
            tw.start(this);
        } else {
            stg.deselectAll();
            stg.selectedItems.push(this);
            this.renderer.fill('#3B82F6');
            this.renderer.stroke('#3B82F6');
            this.renderer.radius(7);
            this.renderer.getLayer()?.batchDraw();
        }
    }

    /* ── ConnectionPoint interface ───────────── */

    getPositions() {
        return { x: this._pos.x, y: this._pos.y };
    }

    /** Accept any number of wires — does NOT set isConnected. */
    assignWire(wire) {
        if (!this.wires.includes(wire)) this.wires.push(wire);
        this.wire = wire;
    }

    /**
     * Called when a block on the OTHER end of one of our wires is dragged.
     * Re-route all wires attached to this junction so the whole fan stays tidy.
     */
    updateWiresOnDrag() {
        this.wires.forEach(w => w?.updateOnDrag(this));
    }

    /** Called when a wire is deleted so it removes itself from our list. */
    removeWire(wire) {
        if (this._deleting) return; // deletion cascade in progress — don't recurse
        const idx = this.wires.indexOf(wire);
        if (idx >= 0) this.wires.splice(idx, 1);
        if (this.wire === wire) this.wire = this.wires[this.wires.length - 1] ?? null;

        // Auto-cleanup: once only 2 wires remain, the junction is a pure
        // passthrough — merge those two wires and delete it.
        if (this.wires.length === 2) {
            this._mergeAndDelete();
        } else if (this.wires.length === 0) {
            this._destroySelf();
        }
    }

    /**
     * Merge the two remaining wires into one and destroy this junction.
     * Only called when wires.length has just dropped to 2.
     */
    _mergeAndDelete() {
        if (this._deleting) return;
        this._deleting = true;

        const [wire1, wire2] = this.wires;
        // The "other" endpoint is whichever side isn't the junction itself
        const cp1 = wire1.cps.start === this ? wire1.cps.end : wire1.cps.start;
        const cp2 = wire2.cps.start === this ? wire2.cps.end : wire2.cps.start;

        if (!cp1 || !cp2) { this._destroySelf(); return; }

        // Don't merge incompatible port types (e.g. input↔input)
        const t1 = cp1.params?.type, t2 = cp2.params?.type;
        if ((t1 === 'input'  && t2 === 'input') ||
            (t1 === 'output' && t2 === 'output')) {
            this._destroySelf();
            return;
        }

        // Compute merged geometry BEFORE destroying anything
        const cp1Pos = cp1.getPositions(), cp2Pos = cp2.getPositions();
        const points = wire1.renderer._getWirePoints(cp1Pos, cp2Pos, cp1, cp2);
        const attrs  = { stroke: '#334155', strokeWidth: 2, dash: [], lineCap: 'round', lineJoin: 'round' };

        // Disconnect wire1 from cp1 (junction end is already handled by _deleting guard)
        if (typeof cp1.removeWire === 'function') cp1.removeWire(wire1);
        else { cp1.wire = null; cp1.isConnected = false; }
        wire1.cps.start = null; wire1.cps.end = null;
        const si1 = this.stage.selectedItems.indexOf(wire1);
        if (si1 !== -1) this.stage.selectedItems.splice(si1, 1);
        wire1.renderer.fullDelete();

        // Disconnect wire2 from cp2
        if (typeof cp2.removeWire === 'function') cp2.removeWire(wire2);
        else { cp2.wire = null; cp2.isConnected = false; }
        wire2.cps.start = null; wire2.cps.end = null;
        const si2 = this.stage.selectedItems.indexOf(wire2);
        if (si2 !== -1) this.stage.selectedItems.splice(si2, 1);
        wire2.renderer.fullDelete();

        this.wires = [];
        this.wire  = null;

        // Create the merged wire and connect it
        const mergedWire = new WireSegment(this.stage, { points, attributes: attrs });
        this.stage.add(mergedWire);
        mergedWire.connect2(cp1, cp2);

        this._destroySelf();
    }

    /** Remove the junction's Konva node and stage reference without touching wires. */
    _destroySelf() {
        this.renderer?.destroy();
        this.renderer = null;
        const idx = this.stage.junctions?.indexOf(this);
        if (idx >= 0) this.stage.junctions.splice(idx, 1);
        this.stage.wireLayer?.batchDraw();
    }

    deSelect() {
        this.renderer?.fill('#1e293b');
        this.renderer?.stroke('#94a3b8');
        this.renderer?.strokeWidth(1.5);
        this.renderer?.radius(6);
        this.renderer?.getLayer()?.batchDraw();
    }

    /* ── Deletion ────────────────────────────── */

    delete() {
        if (this._deleting) return;
        this._deleting = true;

        // Delete all connected wires; the _deleting guard prevents removeWire
        // callbacks from triggering re-entrant cleanup.
        [...this.wires].forEach(w => w?.delete?.());
        this.wires = [];
        this.wire  = null;

        this._destroySelf();
    }
}
