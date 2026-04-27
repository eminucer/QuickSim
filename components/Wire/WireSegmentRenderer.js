
export class WireSegmentRenderer extends Konva.Group {

    static startPoint          = null;
    static startPointPos       = null;
    // Junction created by right-click but not yet anchored by a wire connection.
    // Cancelled draws delete it; successful connects leave it in place.
    static provisionalJunction = null;

    constructor(owner) {
        super();
        this.owner     = owner;
        this.stage     = this.owner.stage;
        this.isDrawing = false;
        this.wire      = null;

        // Current wire geometry as {x,y}[] — kept in sync with this.wire.points().
        // Segment drag and block-drag updates operate on this array directly.
        this._pts = null;

        // Segment-drag state
        this._dragging     = false;
        this._dragMoved    = false;
        this._dragSegIdx   = -1;
        this._dragStartPos = null;
        this._origPts      = null;

        this.tempWireAttrs = {
            stroke:      '#64748b',
            strokeWidth: 1.5,
            dash:        [6, 4],
            lineCap:     'round',
            lineJoin:    'round',
        };
        this.normalAttrs = {
            stroke:      '#334155',
            strokeWidth: 2,
            dash:        [],
            lineCap:     'round',
            lineJoin:    'round',
        };
        this.highlightAttrs = {
            stroke:      '#F97316',
            strokeWidth: 3,
        };
    }

    /* ═══════════════════════════════════════
       DRAWING PHASE
    ═══════════════════════════════════════ */

    start(connectionPoint) {
        this.isDrawing = true;
        WireSegmentRenderer.startPoint    = connectionPoint;
        WireSegmentRenderer.startPointPos = connectionPoint.getPositions();

        // Draw an initial stub in the port's exit direction so there is
        // visible feedback the moment the port is clicked, before the
        // pointer has moved.  Junctions use no stub (the dot itself is
        // feedback enough, and they turn immediately).
        const pos       = WireSegmentRenderer.startPointPos;
        const dir       = this._portExitDir(connectionPoint);
        const stubLen   = connectionPoint?.params?.type === 'cp' ? 0 : 24;
        const [ax, ay]  = this._stubEnd(pos.x, pos.y, dir, stubLen);

        this.wire = new Konva.Line({
            points:   [pos.x, pos.y, ax, ay],
            ...this.tempWireAttrs,
            listening: false,
        });
        this.add(this.wire);

        // Bring this renderer to the top of wireLayer so it is never
        // obscured by wire renderers that were added earlier.
        this.moveToTop();
        if (this.getLayer()) this.getLayer().batchDraw();

        this.stage.onPointerMove(this.update.bind(this));
    }

    /** Abort draw + clear all static state (Escape, clicking canvas, etc.) */
    cancelDraw() {
        if (this.wire) { this.wire.destroy(); this.wire = null; }
        this.isDrawing = false;
        this.stage.offPointerMove();
        WireSegmentRenderer.startPoint    = null;
        WireSegmentRenderer.startPointPos = null;

        // If the draw started from a right-click junction, remove that junction
        // and merge its two sub-segment wires back into the original wire.
        const pj = WireSegmentRenderer.provisionalJunction;
        if (pj) {
            WireSegmentRenderer.provisionalJunction = null;
            pj._mergeAndDelete();
        }

        if (this.getLayer()) this.getLayer().batchDraw();
    }

    /** Remove temp visual but KEEP static state so the next wire's connect() can use it. */
    delete() {
        if (this.wire) { this.wire.destroy(); this.wire = null; }
        this.isDrawing = false;
        // intentionally NOT clearing startPoint / startPointPos
    }

    /** Live preview while the mouse moves. */
    update(worldPos) {
        if (!this.isDrawing || !this.wire) return;
        const pos = worldPos ?? this.stage.getWorldPointerPosition();
        if (!pos) return;
        this.wire.listening(false);
        this.wire.points(this._getTempWirePoints(
            WireSegmentRenderer.startPointPos, pos,
            WireSegmentRenderer.startPoint,
        ));
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    /**
     * Simple stub + single-elbow preview for the temp wire.
     * No obstacle avoidance — just exit the port, then one 90° turn to the cursor.
     */
    _getTempWirePoints(startPos, endPos, startCP) {
        const sx = startPos.x, sy = startPos.y;
        const ex = endPos.x,   ey = endPos.y;
        const STUB = 24;
        const stub = startCP?.params?.type === 'cp' ? 0 : STUB;

        const startDir = this._portExitDir(startCP, endPos);
        const [ax, ay] = this._stubEnd(sx, sy, startDir, stub);

        const startH = startDir === 'right' || startDir === 'left';
        // One elbow: if exiting horizontally go to cursor x then y, else cursor y then x
        const inner = startH ? [ex, ay] : [ax, ey];

        return this._cleanPath([sx, sy, ax, ay, ...inner, ex, ey]);
    }

    /* ═══════════════════════════════════════
       CONNECTION PHASE
    ═══════════════════════════════════════ */

    /** Finalize the wire visual between two ports. Caller assigns cps. */
    end(connectionPoint) {
        if (this.wire) { this.wire.destroy(); this.wire = null; }

        const startPos = WireSegmentRenderer.startPointPos;
        const endPos   = connectionPoint.getPositions();
        const points   = this._getWirePoints(startPos, endPos,
            WireSegmentRenderer.startPoint, connectionPoint);

        this._pts = this._toPointObjects(points);
        this.wire = new Konva.Line({ points, ...this.normalAttrs });
        this.wire.listening(true);
        this._initWireEvents();
        this.add(this.wire);

        this.isDrawing = false;
        this.stage.offPointerMove();
    }

    /** Called by WireSegment.connect(). Returns true on success. */
    connect(connectionPoint) {
        if (WireSegmentRenderer.startPoint === connectionPoint) {
            this.start(connectionPoint);
            return false;
        }

        const startType = WireSegmentRenderer.startPoint?.params?.type;
        const endType   = connectionPoint.params?.type;
        const typesOK   = !(startType && endType && startType === endType && startType !== 'cp');

        if (!typesOK || connectionPoint.isConnected) {
            this.cancelDraw(); // also cleans up provisionalJunction if present
            this.destroy();
            return false;
        }

        const startPoint = WireSegmentRenderer.startPoint;
        this.end(connectionPoint);

        this.owner.cps = { start: startPoint, end: connectionPoint };
        startPoint.assignWire(this.owner);
        connectionPoint.assignWire(this.owner);

        // Wire connected successfully — the provisional junction (if any) is now
        // permanent. Tag it with this branch wire for auto-cleanup on deletion.
        const pj = WireSegmentRenderer.provisionalJunction;
        if (pj) {
            pj._branchWire = this.owner;
            WireSegmentRenderer.provisionalJunction = null;
        }

        WireSegmentRenderer.startPoint    = null;
        WireSegmentRenderer.startPointPos = null;
        return true;
    }

    /** Direct connect for split wires — no visual setup needed here. */
    connect2(startCP, endCP) {
        this.owner.cps = { start: startCP, end: endCP };
        startCP.assignWire(this.owner);
        endCP.assignWire(this.owner);
    }

    /** Connect two CPs programmatically and draw the routed wire path. */
    connect2WithVisual(startCP, endCP) {
        const startPos = startCP.getPositions();
        const endPos   = endCP.getPositions();
        const points   = this._getWirePoints(startPos, endPos, startCP, endCP);
        if (this.wire) { this.wire.destroy(); this.wire = null; }
        this._pts = this._toPointObjects(points);
        this.wire = new Konva.Line({ points, ...this.normalAttrs });
        this.wire.listening(true);
        this._initWireEvents();
        this.add(this.wire);
        this.owner.cps = { start: startCP, end: endCP };
        startCP.assignWire(this.owner);
        endCP.assignWire(this.owner);
    }

    /* ═══════════════════════════════════════
       VISUAL UPDATES
    ═══════════════════════════════════════ */

    /**
     * Called when a connected block moves.
     * Always recomputes the full route from scratch so stale knees are
     * eliminated and the wire is re-optimised for the new positions.
     */
    updateOnDrag(_cp) {
        if (!this.owner.cps.start || !this.owner.cps.end) return;

        const startCP  = this.owner.cps.start;
        const endCP    = this.owner.cps.end;
        const startPos = startCP.getPositions();
        const endPos   = endCP.getPositions();
        const points   = this._getWirePoints(startPos, endPos, startCP, endCP);
        this._pts      = this._toPointObjects(points);

        if (this.wire) {
            this.wire.points(points);
            if (this.getLayer()) this.getLayer().batchDraw();
        }
    }

    /** Full repoint — used when a split wire is created. */
    updatePoints(params) {
        if (this.wire) this.wire.destroy();
        const points = params.points;
        this._pts = this._toPointObjects(points);
        this.wire = new Konva.Line({ points, ...params.attributes });
        this.wire.listening(true);
        this._initWireEvents();
        this.add(this.wire);
        if (this.stage) this.stage.draw(this.owner);
    }

    highlight() {
        if (this.wire) {
            this.wire.stroke(this.highlightAttrs.stroke);
            this.wire.strokeWidth(this.highlightAttrs.strokeWidth);
        }
    }

    unhighlight() {
        if (this.wire) {
            this.wire.stroke(this.normalAttrs.stroke);
            this.wire.strokeWidth(this.normalAttrs.strokeWidth);
        }
    }

    fullDelete() {
        this._cancelSegmentDrag();
        if (this.wire) { this.wire.destroy(); this.wire = null; }
        this.destroy();
    }

    /* ═══════════════════════════════════════
       WIRE EVENTS
    ═══════════════════════════════════════ */

    _initWireEvents() {
        // ── Hover highlight ──
        this.wire.on('mouseover', () => {
            if (this._dragging) return;
            if (!this.owner.isSelected) {
                this.wire.stroke(this.highlightAttrs.stroke);
                this.wire.strokeWidth(this.highlightAttrs.strokeWidth);
                if (this.getLayer()) this.getLayer().batchDraw();
            }
        });

        // ── Directional cursor — tells the user which way a segment can be dragged ──
        this.wire.on('mousemove', () => {
            if (this._dragging) return;
            const mousePos = this.stage.getWorldPointerPosition();
            if (!mousePos || !this._pts) { document.body.style.cursor = 'pointer'; return; }
            const idx = this._closestSegmentIdx(mousePos);
            if (idx >= 0) {
                // All segments show a drag cursor — stubs get a knee inserted on drag
                document.body.style.cursor = this._isHSeg(this._pts, idx) ? 'ns-resize' : 'ew-resize';
            } else {
                document.body.style.cursor = 'pointer';
            }
        });

        this.wire.on('mouseout', () => {
            if (this._dragging) return;
            if (!this.owner.isSelected) {
                this.wire.stroke(this.normalAttrs.stroke);
                this.wire.strokeWidth(this.normalAttrs.strokeWidth);
                if (this.getLayer()) this.getLayer().batchDraw();
            }
            document.body.style.cursor = 'default';
        });

        // ── Segment drag ──
        this.wire.on('mousedown', e => {
            if (e.evt.button !== 0) return;
            e.cancelBubble = true;
            const mousePos = this.stage.getWorldPointerPosition();
            if (!mousePos || !this._pts) return;
            const idx = this._closestSegmentIdx(mousePos);
            if (idx < 0) return; // not near any segment
            this._startSegmentDrag(idx, mousePos);
        });

        // ── Click to select (suppressed if we just finished dragging) ──
        this.wire.on('click', e => {
            if (this._dragMoved) { this._dragMoved = false; e.cancelBubble = true; return; }
            this.owner.select();
            this.wire.stroke(this.highlightAttrs.stroke);
            this.wire.strokeWidth(this.highlightAttrs.strokeWidth);
            if (this.getLayer()) this.getLayer().batchDraw();
        });

        // ── Right-click: create a junction and start a branch wire from it ──
        // The junction is created immediately; if the user cancels (Escape),
        // cancelDraw() calls _mergeAndDelete() which restores the original wire.
        this.wire.on('contextmenu', e => {
            e.evt.preventDefault();
            if (!(e.target instanceof Konva.Line)) return;

            const mousePos = this.stage.getWorldPointerPosition();
            if (!mousePos) return;

            const snapPos = this._closestPointOnLine(this.wire, mousePos);
            if (!snapPos) return;

            const startCP = this.owner.cps.start;
            const endCP   = this.owner.cps.end;
            if (!startCP || !endCP) return;

            const split = this._splitPointsAt(snapPos);
            if (!split) return;

            // Determine orientation of the wire at the snap point from split geometry.
            // The last segment of firstPoints tells us if it's horizontal or vertical.
            const fp   = split.firstPoints;
            const fpN  = fp.length;
            const wireDx = Math.abs(fp[fpN - 2] - fp[fpN - 4]);
            const wireDy = Math.abs(fp[fpN - 1] - fp[fpN - 3]);
            const wireOrientation = wireDx >= wireDy ? 'h' : 'v';

            // Cancel any in-progress draw (also cleans up any previous provisional junction)
            const tw = this.stage.tempWire;
            if (tw && tw.isDrawing()) tw.renderer.cancelDraw();

            // Detach the original wire from both its ports.
            // For junction endpoints, use detachWire (not removeWire) to avoid
            // triggering the junction's auto-merge — the two replacement sub-segment
            // wires will be assigned to the junction immediately after.
            const attrs = { ...this.normalAttrs };
            this.owner.cps.start = null;
            this.owner.cps.end   = null;
            if (typeof startCP.detachWire === 'function') startCP.detachWire(this.owner);
            else { startCP.wire = null; startCP.isConnected = false; }
            if (typeof endCP.detachWire === 'function') endCP.detachWire(this.owner);
            else { endCP.wire = null; endCP.isConnected = false; }
            const si = this.stage.selectedItems.indexOf(this.owner);
            if (si !== -1) this.stage.selectedItems.splice(si, 1);
            this.fullDelete(); // destroy this renderer; 'this' is still valid in JS

            // Create the junction and the two sub-segment wires
            const junction = this.stage.createJunction(snapPos, wireOrientation);
            this.stage.createWires({
                ws1: { start: startCP, end: junction,   points: split.firstPoints,  attributes: attrs },
                ws2: { start: junction, end: endCP,     points: split.secondPoints, attributes: attrs },
            });

            // Mark the junction as provisional so a cancel can remove it
            WireSegmentRenderer.provisionalJunction = junction;

            // Start drawing the branch wire from the junction
            if (tw) tw.start(junction);
        });
    }

    /* ═══════════════════════════════════════
       SEGMENT DRAG
    ═══════════════════════════════════════ */

    _startSegmentDrag(segIdx, startPos) {
        // If the user clicked a port stub (first or last segment), insert a knee
        // right next to the port so the segment becomes freely draggable.
        const n = this._pts.length;
        if (segIdx === 0 || segIdx === n - 2) {
            segIdx = this._insertKneeForStub(segIdx);
        }

        this._dragging     = true;
        this._dragMoved    = false;
        this._dragSegIdx   = segIdx;
        this._dragStartPos = { x: startPos.x, y: startPos.y };
        // Capture AFTER any knee insertion so drag deltas are relative to the new geometry.
        this._origPts      = this._pts.map(p => ({ x: p.x, y: p.y }));

        const isH = this._isHSeg(this._origPts, segIdx);
        document.body.style.cursor = isH ? 'ns-resize' : 'ew-resize';

        if (this.wire) {
            this.wire.stroke(this.highlightAttrs.stroke);
            this.wire.strokeWidth(this.highlightAttrs.strokeWidth);
        }

        const onMove = () => {
            const pos = this.stage.getWorldPointerPosition();
            if (pos) this._doSegmentDrag(pos);
        };
        const onUp = () => {
            this._endSegmentDrag();
            this.stage.stage.off('pointermove.segdrag');
        };

        this.stage.stage.on('pointermove.segdrag', onMove);
        window.addEventListener('mouseup', onUp, { once: true });
    }

    /**
     * Core drag logic — just moves the two endpoints of the segment.
     *
     * Because orthogonal routing means every segment is either purely H or
     * purely V, moving a H segment's y (or V segment's x) automatically
     * "stretches" the two adjacent perpendicular segments without any extra
     * math — no collinear expansion needed.
     */
    _doSegmentDrag(mousePos) {
        const segIdx = this._dragSegIdx;
        const orig   = this._origPts;
        const pts    = this._pts;

        const dx = mousePos.x - this._dragStartPos.x;
        const dy = mousePos.y - this._dragStartPos.y;

        if (Math.hypot(dx, dy) > 1) this._dragMoved = true;

        if (this._isHSeg(orig, segIdx)) {
            // Horizontal segment → move up / down (change y of both endpoints)
            const newY = orig[segIdx].y + dy;
            pts[segIdx].y     = newY;
            pts[segIdx + 1].y = newY;
            // Adjacent vertical segments stretch automatically because only y changed.
        } else {
            // Vertical segment → move left / right (change x of both endpoints)
            const newX = orig[segIdx].x + dx;
            pts[segIdx].x     = newX;
            pts[segIdx + 1].x = newX;
            // Adjacent horizontal segments stretch automatically because only x changed.
        }

        if (this.wire) {
            this.wire.points(this._toFlatPoints(pts));
            if (this.getLayer()) this.getLayer().batchDraw();
        }
    }

    _endSegmentDrag() {
        if (!this._dragging) return;
        this._dragging = false;
        document.body.style.cursor = 'default';
        if (this.wire && !this.owner.isSelected) {
            this.wire.stroke(this.normalAttrs.stroke);
            this.wire.strokeWidth(this.normalAttrs.strokeWidth);
            if (this.getLayer()) this.getLayer().batchDraw();
        }
    }

    _cancelSegmentDrag() {
        if (!this._dragging) return;
        this._dragging = false;
        this.stage.stage.off('pointermove.segdrag');
    }

    /**
     * Insert a knee into a port-stub segment so it becomes freely draggable.
     *
     * Port stubs are always horizontal (they exit blocks horizontally).
     * Dragging them vertically requires a bend, so we splice in two extra
     * points right next to the port: one that stays fixed (anchor), one
     * that will move with the drag.  After insertion the structure is:
     *
     *   START stub:  [port, (port.x+KNEE, port.y), (port.x+KNEE, port.y), old_elbow, ...]
     *                  seg0=H(stub)   seg1=V(zero→grows)   seg2=H(drag target)
     *
     *   END stub:    [..., old_elbow, (end.x-KNEE, end.y), (end.x-KNEE, end.y), port]
     *                                  seg(n-3)=H(drag)   seg(n-2)=V   seg(n-1)=H(stub)
     *
     * Returns the index of the new H segment that should be dragged.
     */
    _insertKneeForStub(stubIdx) {
        const pts  = this._pts;
        const n    = pts.length;
        const KNEE = 20; // world-unit offset from the port for the fixed anchor point

        if (stubIdx === 0) {
            // Start stub: insert two new points right after pts[0]
            const { x: sx, y: sy } = pts[0];
            const kx = sx + KNEE;
            pts.splice(1, 0, { x: kx, y: sy }, { x: kx, y: sy });
            // The draggable H segment is now at index 2 (new pts[2] → old pts[1] now at pts[3])
            return 2;
        } else {
            // End stub (stubIdx === n-2): insert two new points before pts[n-1]
            const { x: ex, y: ey } = pts[n - 1];
            const kx = ex - KNEE;
            pts.splice(n - 1, 0, { x: kx, y: ey }, { x: kx, y: ey });
            // The draggable H segment is at index n-2 (old pts[n-2] → new pts[n-1])
            // n has grown by 2, but the segment index stays n-2 (pointing at the same pair)
            return n - 2;
        }
    }

    /* ═══════════════════════════════════════
       ROUTING GEOMETRY
    ═══════════════════════════════════════ */

    /**
     * Generate an obstacle-aware orthogonal wire path between two port positions.
     *
     * The routing topology is chosen based on the TRUE exit direction of each port
     * after accounting for block rotation (0°/90°/180°/270°):
     *
     *   H→H natural forward (right→left, ax≤bx): 4-pt H-V-H with obstacle-shifted midX.
     *   H→H other (backward / same dir):          6-pt H-V-H-V-H with obstacle-shifted midY.
     *   V→V natural forward (down→up,  ay≤by):    4-pt V-H-V with obstacle-shifted midY.
     *   V→V other:                                 6-pt V-H-V-H-V with obstacle-shifted midX.
     *   H→V or V→H:                                L-shape (single turn).
     *
     * Collinear intermediate points are removed so the result is always minimal.
     */
    _getWirePoints(startPos, endPos, startCP = null, endCP = null) {
        const sx = startPos.x, sy = startPos.y;
        const ex = endPos.x,   ey = endPos.y;
        const STUB = 24, GAP = 10;
        // Junctions turn immediately; only block ports need a clearance stub.
        const startStub = startCP?.params?.type === 'cp' ? 0 : STUB;
        const endStub   = endCP?.params?.type   === 'cp' ? 0 : STUB;

        // True exit direction of each port, accounting for block rotation.
        // Output→right, Input→left at 0°; rotated N×90° CW from there.
        // For junctions / null, direction is inferred from the other endpoint.
        const startDir = this._portExitDir(startCP, endPos);
        const endDir   = this._portExitDir(endCP,   startPos);

        // Stub end-points: where the wire first clears the block
        const [ax, ay] = this._stubEnd(sx, sy, startDir, startStub);
        const [bx, by] = this._stubEnd(ex, ey, endDir,   endStub);

        const obstacles = this._getObstacles(startCP, endCP);
        const allRects  = (this.stage?.blocks ?? [])
            .map(b => this._blockRect(b)).filter(Boolean);

        const startH = startDir === 'right' || startDir === 'left';
        const endH   = endDir   === 'right' || endDir   === 'left';

        let inner;
        if (startH && endH) {
            // Both horizontal stubs
            inner = this._routeHH(ax, ay, bx, by, startDir, endDir, obstacles, allRects, GAP);
        } else if (!startH && !endH) {
            // Both vertical stubs
            inner = this._routeVV(ax, ay, bx, by, startDir, endDir, obstacles, allRects, GAP);
        } else if (startH) {
            // Horizontal start, vertical end → L-shape: go to bx first, then down/up to by
            inner = [bx, ay];
        } else {
            // Vertical start, horizontal end → L-shape: go to by first, then across to bx
            inner = [ax, by];
        }

        return this._cleanPath([sx, sy, ax, ay, ...inner, bx, by, ex, ey]);
    }

    /**
     * Actual exit direction of a port in world space, accounting for block rotation.
     *   Output at 0° → right.  Rotated CW N×90° → right/down/left/up.
     *   Input  at 0° → left.   Same rotation sequence.
     *   Null CP (temp wire preview) → 'left'  (treats cursor as an input).
     *   Junction (type 'cp')        → direction away from otherPos so the
     *                                 stub points toward the other end.
     */
    _portExitDir(cp, otherPos = null) {
        const type = cp?.params?.type;

        // Null: the wire end hasn't been connected yet (live preview).
        // Treat it as an input port so output→cursor routing is natural.
        if (!cp) return 'left';

        // Junction: exit perpendicular to the wire it sits on so the branch
        // visually "taps" the wire rather than running along it.
        // Exception: if the other endpoint is nearly co-linear with the junction's
        // wire direction (|ratio| < 0.5, i.e. within ~27° of the wire axis), it is
        // a through-segment wire — let it exit along the wire as before.
        // When no orientation is stored (legacy / dragged off original wire),
        // fall back to the old direction-toward-other-end behaviour.
        if (type === 'cp') {
            const jPos    = cp.getPositions();
            const wireOri = cp._wireOrientation;

            if (!otherPos) {
                // No target yet (initial stub on start()). Use perpendicular default.
                if (wireOri === 'h') return 'down';
                if (wireOri === 'v') return 'right';
                return 'right';
            }

            const dx  = otherPos.x - jPos.x;
            const dy  = otherPos.y - jPos.y;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);

            if (wireOri === 'h') {
                // Junction on a horizontal wire.
                // Through-wires go nearly horizontally (|dy| < |dx| * 0.5).
                // Anything else (branch wires, diagonal) exits vertically.
                if (adx > 0 && ady < adx * 0.5) return dx >= 0 ? 'right' : 'left';
                return dy >= 0 ? 'down' : 'up';
            }
            if (wireOri === 'v') {
                // Junction on a vertical wire.
                // Through-wires go nearly vertically (|dx| < |dy| * 0.5).
                // Everything else exits horizontally.
                if (ady > 0 && adx < ady * 0.5) return dy >= 0 ? 'down' : 'up';
                return dx >= 0 ? 'right' : 'left';
            }

            // No stored orientation — original behaviour.
            return Math.abs(dx) >= Math.abs(dy)
                ? (dx >= 0 ? 'right' : 'left')
                : (dy >= 0 ? 'down'  : 'up');
        }

        // Regular port: use type + block rotation.
        const baseDir = (type === 'input') ? 'left' : 'right';
        const br      = cp.owner?.renderer;
        if (typeof br?.rotation !== 'function') return baseDir;
        const rot   = ((br.rotation() % 360) + 360) % 360;
        const steps = Math.round(rot / 90) % 4;
        if (steps === 0) return baseDir;
        const seq = ['right', 'down', 'left', 'up'];
        return seq[(seq.indexOf(baseDir) + steps) % 4];
    }

    /** Stub end-point: one STUB-length step from (px,py) in direction dir. */
    _stubEnd(px, py, dir, stub) {
        switch (dir) {
            case 'right': return [px + stub, py];
            case 'left':  return [px - stub, py];
            case 'down':  return [px, py + stub];
            case 'up':    return [px, py - stub];
            default:      return [px + stub, py];
        }
    }

    /**
     * Route between two horizontal-stub end-points.
     * Natural forward (right→left, ax≤bx): single V segment at bestMidX → H-V-H.
     * All other cases (backward, same direction): single H bridge at bestMidY → H-V-H-V-H.
     */
    _routeHH(ax, ay, bx, by, startDir, endDir, obstacles, allRects, gap) {
        if (startDir === 'right' && endDir === 'left' && ax <= bx) {
            const midX = this._bestMidX(ax, bx, ay, by, obstacles, gap);
            return [midX, ay, midX, by];
        }
        const midY = this._bestMidY(ax, bx, (ay + by) / 2, allRects, gap);
        return [ax, midY, bx, midY];
    }

    /**
     * Route between two vertical-stub end-points.
     * Natural forward (down→up, ay≤by): single H segment at bestMidY → V-H-V.
     * All other cases: single V bridge at bestMidX → V-H-V-H-V.
     */
    _routeVV(ax, ay, bx, by, startDir, endDir, obstacles, allRects, gap) {
        if (startDir === 'down' && endDir === 'up' && ay <= by) {
            const midY = this._bestMidY(ax, bx, (ay + by) / 2, allRects, gap);
            return [ax, midY, bx, midY];
        }
        const midX = this._bestMidX(
            Math.min(ax, bx), Math.max(ax, bx),
            Math.min(ay, by), Math.max(ay, by),
            obstacles, gap,
        );
        return [midX, ay, midX, by];
    }

    /**
     * Remove collinear intermediate points from a flat point array so the
     * path has the minimum number of segments.  Always keeps first and last.
     */
    _cleanPath(flat) {
        const pts = this._toPointObjects(flat);
        if (pts.length < 3) return flat;
        const out = [pts[0]];
        for (let i = 1; i < pts.length - 1; i++) {
            const p = out[out.length - 1], c = pts[i], n = pts[i + 1];
            const colH = Math.abs(p.y - c.y) < 0.1 && Math.abs(c.y - n.y) < 0.1;
            const colV = Math.abs(p.x - c.x) < 0.1 && Math.abs(c.x - n.x) < 0.1;
            if (!colH && !colV) out.push(c);
        }
        out.push(pts[pts.length - 1]);
        return this._toFlatPoints(out);
    }

    /* ═══════════════════════════════════════
       OBSTACLE-AWARE ROUTING HELPERS
    ═══════════════════════════════════════ */

    /**
     * Return blocks that are obstacles for this wire.
     * Excludes the blocks that own the start and end connection points.
     */
    _getObstacles(startCP = null, endCP = null) {
        if (!this.stage?.blocks) return [];
        const sb = (startCP ?? this.owner.cps?.start)?.owner;
        const eb = (endCP   ?? this.owner.cps?.end)?.owner;
        return this.stage.blocks.filter(b => b !== sb && b !== eb);
    }

    /** Block bounding box in world (layer-local) coordinates, or null. */
    _blockRect(block) {
        if (!block?.renderer || !this.stage?.blockLayer) return null;
        try {
            return block.renderer.getClientRect({ relativeTo: this.stage.blockLayer });
        } catch { return null; }
    }

    /**
     * Find the best x for the vertical segment of a forward H-V-H wire.
     * Tries the centre, then shifts around obstacle clusters, then scans.
     */
    _bestMidX(ax, bx, sy, ey, obstacles, gap) {
        const defaultX = (ax + bx) / 2;
        if (obstacles.length === 0) return defaultX;

        const yLo = Math.min(sy, ey), yHi = Math.max(sy, ey);

        // Obstacles that could block any vertical segment in the free zone
        const relevant = obstacles
            .map(b => this._blockRect(b))
            .filter(r => r &&
                r.x - gap < bx && r.x + r.width  + gap > ax &&
                r.y - gap < yHi && r.y + r.height + gap > yLo);

        if (relevant.length === 0) return defaultX;

        // Already clear?
        if (!relevant.some(r => this._vSegHits(defaultX, yLo, yHi, r, gap))) return defaultX;

        // Combined x-extent of all blockers
        const minBX = Math.min(...relevant.map(r => r.x));
        const maxBX = Math.max(...relevant.map(r => r.x + r.width));

        const tryLeft  = minBX - gap;
        const tryRight = maxBX + gap;

        if (tryLeft >= ax  && !relevant.some(r => this._vSegHits(tryLeft,  yLo, yHi, r, gap))) return tryLeft;
        if (tryRight <= bx && !relevant.some(r => this._vSegHits(tryRight, yLo, yHi, r, gap))) return tryRight;

        // Coarse scan — pick the clearest x in the free zone
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const x = ax + (bx - ax) * i / steps;
            if (!relevant.some(r => this._vSegHits(x, yLo, yHi, r, gap))) return x;
        }

        return defaultX; // nothing found — fall back (rare)
    }

    /**
     * Find the best y for the middle horizontal segment of a backward wire.
     * `allRects` should include all block rects (even start/end).
     */
    _bestMidY(ax, bx, defaultY, allRects, gap) {
        const xLo = Math.min(ax, bx), xHi = Math.max(ax, bx);

        const blocking = allRects.filter(r => this._hSegHits(defaultY, xLo, xHi, r, gap));
        if (blocking.length === 0) return defaultY;

        const minBY = Math.min(...blocking.map(r => r.y));
        const maxBY = Math.max(...blocking.map(r => r.y + r.height));

        const tryTop    = minBY - gap;
        const tryBottom = maxBY + gap;

        if (!allRects.some(r => this._hSegHits(tryTop,    xLo, xHi, r, gap))) return tryTop;
        if (!allRects.some(r => this._hSegHits(tryBottom, xLo, xHi, r, gap))) return tryBottom;

        // Both still hit something — go whichever way is further away from the blocks
        return Math.abs(tryTop - defaultY) > Math.abs(tryBottom - defaultY)
            ? tryTop : tryBottom;
    }

    /** True if a vertical segment at x spanning [yLo, yHi] hits rect r (with gap). */
    _vSegHits(x, yLo, yHi, r, gap) {
        return x > r.x - gap && x < r.x + r.width  + gap &&
               yLo < r.y + r.height + gap && yHi > r.y - gap;
    }

    /** True if a horizontal segment at y spanning [xLo, xHi] hits rect r (with gap). */
    _hSegHits(y, xLo, xHi, r, gap) {
        return y > r.y - gap && y < r.y + r.height + gap &&
               xLo < r.x + r.width + gap && xHi > r.x - gap;
    }

    /* ═══════════════════════════════════════
       HIT TESTING / GEOMETRY HELPERS
    ═══════════════════════════════════════ */

    /**
     * Split this wire's current flat-point array at snapPos.
     * Uses nearest-segment search (robust against floating-point snap coords).
     * Returns { firstPoints, secondPoints } or null if degenerate.
     */
    _splitPointsAt(snapPos) {
        if (!this.wire || !snapPos) return null;
        const pts = this._toPointObjects(this.wire.points());
        if (pts.length < 2) return null;

        // Find the segment whose projection is closest to snapPos.
        let bestIdx = -1, bestDist = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
            const p = this._closestPointOnSegment(snapPos, pts[i], pts[i + 1]);
            const d = Math.hypot(p.x - snapPos.x, p.y - snapPos.y);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        if (bestIdx < 0) return null;

        const a = pts[bestIdx], b = pts[bestIdx + 1];
        // Refuse degenerate splits at segment endpoints.
        if (Math.hypot(snapPos.x - a.x, snapPos.y - a.y) < 2) return null;
        if (Math.hypot(snapPos.x - b.x, snapPos.y - b.y) < 2) return null;

        return {
            firstPoints:  this._toFlatPoints([...pts.slice(0, bestIdx + 1), snapPos]),
            secondPoints: this._toFlatPoints([snapPos, ...pts.slice(bestIdx + 1)]),
        };
    }

    /**
     * Returns the index of the segment closest to mousePos, or -1 if
     * nothing is within ~12 screen pixels.
     */
    _closestSegmentIdx(mousePos) {
        if (!this._pts || this._pts.length < 2) return -1;
        const scale     = this.stage.stage ? this.stage.stage.scaleX() : 1;
        const threshold = 12 / scale;

        let minDist = Infinity, closestIdx = -1;
        for (let i = 0; i < this._pts.length - 1; i++) {
            const a  = this._pts[i];
            const b  = this._pts[i + 1];
            const cp = this._closestPointOnSegment(mousePos, a, b);
            const d  = Math.hypot(cp.x - mousePos.x, cp.y - mousePos.y);
            if (d < minDist) { minDist = d; closestIdx = i; }
        }
        return minDist <= threshold ? closestIdx : -1;
    }

    /** True if segment i (pts[i] → pts[i+1]) is horizontal. */
    _isHSeg(pts, i) {
        return Math.abs(pts[i].y - pts[i + 1].y) < 1e-4;
    }

    _toPointObjects(flat) {
        const pts = [];
        for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] });
        return pts;
    }

    _toFlatPoints(pts) { return pts.flatMap(p => [p.x, p.y]); }

    _pointOnSegment(p, a, b, eps = 1e-6) {
        if (Math.abs(a.x - b.x) < eps)
            return Math.abs(p.x - a.x) < eps && p.y >= Math.min(a.y, b.y) - eps && p.y <= Math.max(a.y, b.y) + eps;
        if (Math.abs(a.y - b.y) < eps)
            return Math.abs(p.y - a.y) < eps && p.x >= Math.min(a.x, b.x) - eps && p.x <= Math.max(a.x, b.x) + eps;
        return false;
    }

    _closestPointOnSegment(p, a, b) {
        const abx = b.x - a.x, aby = b.y - a.y;
        const apx = p.x - a.x, apy = p.y - a.y;
        const len2 = abx * abx + aby * aby;
        const t    = len2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2));
        return { x: a.x + t * abx, y: a.y + t * aby };
    }

    _closestPointOnLine(line, point) {
        const flat = line.points();
        let closest = null, minDist = Infinity;
        for (let i = 0; i < flat.length - 2; i += 2) {
            const a = { x: flat[i],     y: flat[i + 1] };
            const b = { x: flat[i + 2], y: flat[i + 3] };
            const p = this._closestPointOnSegment(point, a, b);
            const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
            if (d < minDist) { minDist = d; closest = p; }
        }
        return closest;
    }
}
