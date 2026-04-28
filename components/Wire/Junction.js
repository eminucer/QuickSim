import { WireSegment } from './WireSegment.js';

/**
 * A branch point attached to a parent wire path.
 *
 * Topology
 * ────────
 * A junction owns two "through" sub-wires (`_throughWires`) — together they
 * form the conceptual single parent wire that the junction was placed on.
 * All other wires attached to the junction are "branch" wires.
 *
 * Invariants
 * ──────────
 *   • The junction always lies on a segment of the parent path.
 *   • `_wireOrientation` matches the orientation ('h' / 'v') of that segment.
 *   • Through wires exit the junction along the parent orientation.
 *   • Branch wires exit perpendicular to the parent orientation.
 *
 * Block movement
 * ──────────────
 * When a block on the far end of a through wire moves, we re-route the entire
 * conceptual parent path as ONE wire (start far port → end far port), then
 * place the junction at the SPLIT POINT — the natural tap point of the
 * branches on that new path (centroid of branch-source projections).  This
 * is the Simulink anchor-point semantics: the junction stays put unless the
 * block geometry actually shifts where the branches would naturally meet
 * the parent.  Branch and through wires are then re-routed from there.
 *
 * User drag
 * ─────────
 * Dragging is purely a transient visualization — on release the junction
 * snaps back to its split point regardless of where the cursor was.  A
 * junction has no independent position; it is anchored to the geometry.
 */
export class Junction {
    constructor(stageObj, worldPos, wireOrientation = null) {
        this.stage             = stageObj;
        this.params            = { type: 'cp' };   // 'cp' lets it accept any port type
        this.owner             = null;             // not owned by a block
        this.isConnected       = false;            // always accepts more connections
        this.wires             = [];               // every wire attached here
        this._throughWires     = [];               // the 2 sub-wires forming the parent path
        this.wire              = null;             // last wire (ConnectionPoint compat)
        this._pos              = { x: worldPos.x, y: worldPos.y };
        this._dragMoved        = false;
        this._deleting         = false;            // re-entry guard for deletion cascades
        this._reflowing        = false;            // re-entry guard for parent-path reflow
        this._branchWire       = null;             // the wire that caused this junction to be created
        this._wireOrientation  = wireOrientation;  // 'h' or 'v' — orientation of parent segment at J
        this.renderer          = this._buildRenderer();
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

        dot.on('dragstart', () => { this._dragMoved = false; });
        dot.on('dragmove',  () => {
            this._dragMoved = true;
            // Free-follow the cursor mid-drag (snapping the dot here would fight
            // Konva's internal drag-offset).  Route every wire from the current
            // free position so the user sees live feedback; we'll snap onto the
            // parent path at dragend.
            this._pos.x = dot.x();
            this._pos.y = dot.y();
            this._routeWiresFromCurrentPosition();
            this.stage.wireLayer?.batchDraw();
        });
        dot.on('dragend', () => {
            this._dragMoved = false;
            // Snap the junction back onto the parent path and re-split so the
            // through-wires are clean and the junction's invariant holds again.
            this._resplitParentAtJunction();
            this._updateBranchWires();
            this.stage.wireLayer?.batchDraw();
        });

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

    /** Accept any number of wires. */
    assignWire(wire) {
        if (!this.wires.includes(wire)) this.wires.push(wire);
        this.wire = wire;
    }

    /**
     * Mark the two sub-wires that form this junction's parent path.
     * Called once at junction creation time, and again whenever a sub-wire is
     * replaced (e.g. nested junction split).
     */
    setThroughWires(w1, w2) {
        this._throughWires = [w1, w2].filter(Boolean);
    }

    /** True if `wire` is one of this junction's through (parent-path) wires. */
    isThroughWire(wire) {
        return this._throughWires.includes(wire);
    }

    /**
     * Promote `wire` to a through-wire role.  Used after a nested split or a
     * merge inside the parent path, where a freshly-created sub-wire inherits
     * the role of the wire it replaced.
     */
    adoptThroughWire(wire) {
        if (!wire) return;
        if (!this._throughWires.includes(wire)) this._throughWires.push(wire);
        // Cap at 2; the one that's also still in this.wires takes precedence
        if (this._throughWires.length > 2) {
            this._throughWires = this._throughWires.filter(w => this.wires.includes(w)).slice(-2);
        }
    }

    /**
     * Remove a wire from this junction's list WITHOUT triggering any auto-cleanup.
     */
    detachWire(wire) {
        const idx = this.wires.indexOf(wire);
        if (idx >= 0) this.wires.splice(idx, 1);
        const ti = this._throughWires.indexOf(wire);
        if (ti >= 0) this._throughWires.splice(ti, 1);
        if (this.wire === wire) this.wire = this.wires[this.wires.length - 1] ?? null;
    }

    /** Re-route every wire after a structural change. */
    updateWiresOnDrag() {
        this.wires.forEach(w => w?.updateOnDrag(this));
    }

    /** Called when a wire is deleted so it removes itself from our list. */
    removeWire(wire) {
        if (this._deleting) return;
        const idx = this.wires.indexOf(wire);
        if (idx >= 0) this.wires.splice(idx, 1);
        const ti = this._throughWires.indexOf(wire);
        if (ti >= 0) this._throughWires.splice(ti, 1);
        if (this.wire === wire) this.wire = this.wires[this.wires.length - 1] ?? null;

        // Auto-cleanup: passthrough junction (only the two through-wires left
        // and no branches) → merge them back into a single wire.
        if (this.wires.length === 2 && this._throughWires.length === 2) {
            this._mergeAndDelete();
        } else if (this.wires.length === 0) {
            this._destroySelf();
        }
    }

    /* ═══════════════════════════════════════
       PARENT-PATH RE-FLOW
    ═══════════════════════════════════════ */

    /**
     * Re-route the conceptual parent wire (farCP1 → farCP2) as a single path,
     * place the junction at the SPLIT POINT (where branches naturally tap the
     * new path), re-split into the two through-wires, and refresh branches.
     * Returns true on success.
     *
     * Called when a far-end port of a through-wire moves.  The junction's
     * world position is treated as derived geometry — it tracks the natural
     * tap point, not the user-drag history — so a block move that does not
     * change where the branches meet the parent leaves the junction in place.
     */
    reflowParentPath() {
        if (this._reflowing || this._deleting) return false;
        this._reflowing = true;
        try {
            return this._snapToSplitPoint(/* updateBranches */ true);
        } finally {
            this._reflowing = false;
        }
    }

    /**
     * Lighter version of reflowParentPath used when the user drags the junction.
     * Same logic — junction snaps to the geometric split point — so a drag
     * that doesn't move the branch source(s) returns the junction to where it
     * was before the drag started.
     */
    _resplitParentAtJunction() {
        this._snapToSplitPoint(/* updateBranches */ false);
    }

    /**
     * Core routine: re-route the parent path far→far as a single wire, project
     * the branch sources onto it to find the split point, place the junction
     * there, and split the path into the two through-wires.  When
     * `updateBranches` is true, also re-route branch wires from the new
     * junction position (only when the junction actually moved).
     */
    _snapToSplitPoint(updateBranches) {
        if (this._throughWires.length !== 2) return false;

        const [w1, w2] = this._throughWires;
        const farCP1 = this._farEndOf(w1);
        const farCP2 = this._farEndOf(w2);
        if (!farCP1 || !farCP2) return false;

        const sample = w1.renderer ?? w2.renderer;
        if (!sample) return false;

        const startPos = farCP1.getPositions();
        const endPos   = farCP2.getPositions();
        const flat     = sample._getWirePoints(startPos, endPos, farCP1, farCP2);
        const pts      = this._toPointObjects(flat);
        if (pts.length < 2) return false;

        // The junction sits at the natural tap of the branches on the parent
        // path.  With no branches we have nothing to anchor to, so fall back
        // to the junction's current position (it'll merge away shortly).
        const target = this._branchTargetPos() ?? this._pos;
        const proj   = this._projectOntoPath(pts, target);
        if (!proj) return false;

        const oldX = this._pos.x, oldY = this._pos.y;
        this._pos.x = proj.point.x;
        this._pos.y = proj.point.y;
        this.renderer?.x(proj.point.x);
        this.renderer?.y(proj.point.y);

        const a = pts[proj.segIdx], b = pts[proj.segIdx + 1];
        const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
        this._wireOrientation = dx >= dy ? 'h' : 'v';

        this._applyPathSplit(pts, proj, w1, w2, farCP1, farCP2);

        if (updateBranches) {
            const moved = Math.abs(this._pos.x - oldX) > 0.5
                       || Math.abs(this._pos.y - oldY) > 0.5;
            if (moved) this._updateBranchWires();
        }
        return true;
    }

    /**
     * Aggregate target for split-point projection: the centroid of every
     * branch wire's far-end position.  Returns null when there are no
     * branches to anchor to.
     */
    _branchTargetPos() {
        let sx = 0, sy = 0, n = 0;
        for (const wire of this.wires) {
            if (this._throughWires.includes(wire)) continue;
            const far = this._farEndOf(wire);
            if (!far) continue;
            const p = far.getPositions();
            sx += p.x; sy += p.y; n++;
        }
        return n > 0 ? { x: sx / n, y: sy / n } : null;
    }

    /** Slide branch wires from the junction's new position. */
    _updateBranchWires() {
        this.wires.forEach(w => {
            if (this._throughWires.includes(w)) return;
            // Branch wires never preserve user-locked geometry across a junction
            // move — the branch source is, by definition, moving.
            if (w?.renderer) w.renderer._userPts = null;
            w?.updateOnDrag(this);
        });
    }

    /**
     * Live-route every attached wire (through and branch) from the junction's
     * current `_pos`, without invoking the parent-path reflow.  Used during the
     * user's free-drag of the junction dot, where we want immediate visual
     * feedback while Konva still owns the cursor.
     */
    _routeWiresFromCurrentPosition() {
        this.wires.forEach(wire => {
            const r = wire?.renderer;
            if (!r || !wire.cps?.start || !wire.cps?.end) return;
            r._userPts = null;
            const startPos = wire.cps.start.getPositions();
            const endPos   = wire.cps.end.getPositions();
            const points   = r._getWirePoints(startPos, endPos, wire.cps.start, wire.cps.end);
            r._pts = r._toPointObjects(points);
            if (r.wire) r.wire.points(points);
        });
    }

    /** Refresh `_wireOrientation` from the current through-wire geometry. */
    _refreshOrientationFromParent() {
        const seg = this._segmentContainingJunction();
        if (!seg) return;
        const dx = Math.abs(seg.b.x - seg.a.x), dy = Math.abs(seg.b.y - seg.a.y);
        this._wireOrientation = dx >= dy ? 'h' : 'v';
    }

    /**
     * Find the segment of the union-of-through-wires path that the junction is
     * currently on (by closest projection).  Returns { a, b } or null.
     */
    _segmentContainingJunction() {
        const pts = this._collectParentPathPoints();
        if (!pts || pts.length < 2) return null;
        const proj = this._projectOntoPath(pts, this._pos);
        if (!proj) return null;
        return { a: pts[proj.segIdx], b: pts[proj.segIdx + 1] };
    }

    /**
     * Snap an arbitrary world position to the closest point on the parent path.
     * Returns the projected point or null when no parent path exists.
     */
    _snapToParentPath(worldPos) {
        const pts = this._collectParentPathPoints();
        if (!pts || pts.length < 2) return null;
        const proj = this._projectOntoPath(pts, worldPos);
        return proj?.point ?? null;
    }

    /**
     * Build the full parent path point list by stitching the two through-wires'
     * current points together at the junction.  Returns null if not stitchable.
     */
    _collectParentPathPoints() {
        if (this._throughWires.length !== 2) return null;
        const [w1, w2] = this._throughWires;
        const p1 = w1?.renderer?._pts;
        const p2 = w2?.renderer?._pts;
        if (!p1 || !p2 || p1.length < 2 || p2.length < 2) return null;

        const EPS = 0.5;
        const isAtJ = pt => Math.abs(pt.x - this._pos.x) < EPS && Math.abs(pt.y - this._pos.y) < EPS;

        // Reverse each wire so it ENDS at the junction
        const a = isAtJ(p1[p1.length - 1]) ? p1
                : isAtJ(p1[0])              ? [...p1].reverse()
                : null;
        // And the other STARTS at the junction
        const b = isAtJ(p2[0])              ? p2
                : isAtJ(p2[p2.length - 1])  ? [...p2].reverse()
                : null;
        if (!a || !b) return null;

        // Concatenate: a[...j], j, b[j...]  (skip duplicate junction point)
        return [...a.slice(0, -1), ...b];
    }

    /**
     * Project `pos` onto a path (array of {x,y}).  Returns
     *   { point: {x,y}, segIdx, t }
     * where segIdx is the segment index and t is the parametric position along it.
     */
    _projectOntoPath(pts, pos) {
        let best = null;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            const abx = b.x - a.x, aby = b.y - a.y;
            const len2 = abx * abx + aby * aby;
            if (len2 === 0) continue;
            let t = ((pos.x - a.x) * abx + (pos.y - a.y) * aby) / len2;
            t = Math.max(0, Math.min(1, t));
            const px = a.x + t * abx, py = a.y + t * aby;
            const d2 = (px - pos.x) ** 2 + (py - pos.y) ** 2;
            if (!best || d2 < best.d2) best = { d2, point: { x: px, y: py }, segIdx: i, t };
        }
        return best;
    }

    /**
     * Split `pts` at the projection point and assign the two halves to the
     * through-wires, oriented so each wire's existing start/end CPs are honored.
     */
    _applyPathSplit(pts, proj, w1, w2, farCP1, farCP2) {
        const j = proj.point;
        const firstHalf  = [...pts.slice(0, proj.segIdx + 1), j];
        const secondHalf = [j, ...pts.slice(proj.segIdx + 1)];
        // Drop a degenerate split point if it duplicates a neighbour
        const cleanFirst  = this._dropDuplicate(firstHalf);
        const cleanSecond = this._dropDuplicate(secondHalf);
        const flatFirst   = this._toFlatPoints(cleanFirst);
        const flatSecond  = this._toFlatPoints(cleanSecond);

        // Match each half to the correct through-wire.  farCP1 is w1's far end;
        // if w1.cps.start === farCP1, then w1 reads start→junction = firstHalf.
        const assignWire = (wire, farCP, halfFlat) => {
            const r = wire.renderer;
            if (!r) return;
            r._userPts = null; // freshly routed — no manual override survives
            const points = wire.cps.start === farCP ? halfFlat : this._reverseFlatPoints(halfFlat);
            r._pts = this._toPointObjects(points);
            if (r.wire) r.wire.points(points);
        };
        assignWire(w1, farCP1, flatFirst);
        assignWire(w2, farCP2, flatSecond);
    }

    _farEndOf(wire) {
        if (!wire?.cps) return null;
        return wire.cps.start === this ? wire.cps.end : wire.cps.start;
    }

    _toPointObjects(flat) {
        const pts = [];
        for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] });
        return pts;
    }
    _toFlatPoints(pts) { return pts.flatMap(p => [p.x, p.y]); }
    _reverseFlatPoints(flat) {
        const out = new Array(flat.length);
        for (let i = 0; i < flat.length; i += 2) {
            out[flat.length - 2 - i]     = flat[i];
            out[flat.length - 2 - i + 1] = flat[i + 1];
        }
        return out;
    }
    _dropDuplicate(pts) {
        if (pts.length < 2) return pts;
        const out = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            const p = out[out.length - 1], c = pts[i];
            if (Math.abs(p.x - c.x) > 0.5 || Math.abs(p.y - c.y) > 0.5) out.push(c);
        }
        return out;
    }

    /**
     * Merge the two remaining wires into one and destroy this junction.
     * Only called when wires.length has just dropped to 2.
     */
    _mergeAndDelete() {
        if (this._deleting) return;
        this._deleting = true;

        const [wire1, wire2] = this.wires;
        const cp1 = this._farEndOf(wire1);
        const cp2 = this._farEndOf(wire2);

        if (!cp1 || !cp2) { this._destroySelf(); return; }

        const t1 = cp1.params?.type, t2 = cp2.params?.type;
        if ((t1 === 'input'  && t2 === 'input') ||
            (t1 === 'output' && t2 === 'output')) {
            this._destroySelf();
            return;
        }

        const cp1Pos = cp1.getPositions(), cp2Pos = cp2.getPositions();
        const points = wire1.renderer._getWirePoints(cp1Pos, cp2Pos, cp1, cp2);
        const attrs  = { stroke: '#334155', strokeWidth: 2, dash: [], lineCap: 'round', lineJoin: 'round' };

        // Capture through-wire roles so the merged wire can inherit them
        const cp1WasThrough = cp1?.params?.type === 'cp' && cp1.isThroughWire?.(wire1);
        const cp2WasThrough = cp2?.params?.type === 'cp' && cp2.isThroughWire?.(wire2);

        if (typeof cp1.detachWire === 'function') cp1.detachWire(wire1);
        else { cp1.wire = null; cp1.isConnected = false; }
        wire1.cps.start = null; wire1.cps.end = null;
        const si1 = this.stage.selectedItems.indexOf(wire1);
        if (si1 !== -1) this.stage.selectedItems.splice(si1, 1);
        wire1.renderer.fullDelete();

        if (typeof cp2.detachWire === 'function') cp2.detachWire(wire2);
        else { cp2.wire = null; cp2.isConnected = false; }
        wire2.cps.start = null; wire2.cps.end = null;
        const si2 = this.stage.selectedItems.indexOf(wire2);
        if (si2 !== -1) this.stage.selectedItems.splice(si2, 1);
        wire2.renderer.fullDelete();

        this.wires = [];
        this._throughWires = [];
        this.wire  = null;

        const mergedWire = new WireSegment(this.stage, { points, attributes: attrs });
        this.stage.add(mergedWire);
        mergedWire.connect2(cp1, cp2);

        // Propagate the through-wire role to the merged wire.
        if (cp1WasThrough) cp1.adoptThroughWire?.(mergedWire);
        if (cp2WasThrough) cp2.adoptThroughWire?.(mergedWire);

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

        [...this.wires].forEach(w => w?.delete?.());
        this.wires = [];
        this._throughWires = [];
        this.wire  = null;

        this._destroySelf();
    }
}
