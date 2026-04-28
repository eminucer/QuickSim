import { Block } from '../Block/Block.js';
import { WireSegment } from '../Wire/WireSegment.js';
import { Junction } from '../Wire/Junction.js';
import { DefaultBlockRenderer } from '../Block/DefaultBlockRenderer.js';
import { WireSegmentRenderer } from '../Wire/WireSegmentRenderer.js';

export class Stage {
    constructor(container, { noKeyboard = false, noResize = false } = {}) {
        const width  = window.innerWidth;
        const height = window.innerHeight;

        this.stage = new Konva.Stage({ container, width, height });

        this.gridLayer  = new Konva.Layer();
        this.blockLayer = new Konva.Layer();
        this.wireLayer  = new Konva.Layer();

        this.selectedItems = [];
        this.blocks        = [];
        this.junctions     = [];

        this._isPanning   = false;
        this._isSpaceDown = false;
        this._lastPanPos  = null;

        this._didMarquee    = false;
        this._marqueeOrigin = null;
        this._marqueeRect   = new Konva.Rect({
            fill:        'rgba(59,130,246,0.07)',
            stroke:      '#3B82F6',
            strokeWidth: 1,
            dash:        [4, 3],
            listening:   false,
            visible:     false,
        });

        this.stage.add(this.gridLayer);
        this.stage.add(this.wireLayer);
        this.stage.add(this.blockLayer);
        this.blockLayer.add(this._marqueeRect);

        if (!noKeyboard) this._initKeyboard();
        this._initStageEvents();
        if (!noResize)   this._initResize();
    }

    /* ──────────────────────────────────────
       Add items to the stage
    ────────────────────────────────────── */
    add(...items) {
        items.forEach(i => {
            if (i instanceof Block) {
                this.blockLayer.add(i.renderer);
                this.blocks.push(i);
                this.blockLayer.batchDraw();
            } else if (i instanceof WireSegment) {
                this.wireLayer.add(i.renderer);
                this._liftJunctions();
                this.wireLayer.batchDraw();
            }
        });
    }

    addToLayer(item) {
        if (item instanceof DefaultBlockRenderer)      this.blockLayer.add(item);
        else if (item instanceof WireSegmentRenderer) {
            this.wireLayer.add(item);
            this._liftJunctions();
        }
    }

    /* ──────────────────────────────────────
       Junction creation
    ────────────────────────────────────── */
    createJunction(worldPos, wireOrientation = null) {
        const junction = new Junction(this, worldPos, wireOrientation);
        this.wireLayer.add(junction.renderer);
        junction.renderer.moveToTop();
        this.junctions.push(junction);
        this.wireLayer.batchDraw();
        return junction;
    }

    _liftJunctions() {
        this.junctions.forEach(j => j.renderer?.moveToTop());
    }

    /* ──────────────────────────────────────
       Wire creation (for split wires)
    ────────────────────────────────────── */
    createWires(wires) {
        const ws1 = new WireSegment(this, { points: wires.ws1.points, attributes: wires.ws1.attributes });
        const ws2 = new WireSegment(this, { points: wires.ws2.points, attributes: wires.ws2.attributes });

        this.add(ws1);
        this.add(ws2);
        this.stage.batchDraw();

        ws1.connect2(wires.ws1.start, wires.ws1.end);
        ws2.connect2(wires.ws2.start, wires.ws2.end);

        return { ws1, ws2 };
    }

    /* ──────────────────────────────────────
       Draw helpers
    ────────────────────────────────────── */
    draw(item) {
        if (item instanceof Block || item instanceof DefaultBlockRenderer) {
            this.blockLayer.batchDraw();
        } else if (item instanceof WireSegment || item instanceof WireSegmentRenderer) {
            this.wireLayer.batchDraw();
        }
    }

    /* ──────────────────────────────────────
       Selection
    ────────────────────────────────────── */
    deselectAll() {
        const items = [...this.selectedItems];
        this.selectedItems = [];
        items.forEach(item => item.deSelect());
        this._marqueeRect.visible(false);
        if (this.blockLayer) this.blockLayer.batchDraw();
    }

    deleteSelected() {
        const items = [...this.selectedItems];
        this.selectedItems = [];
        items.forEach(item => {
            // Guard: renderer may already be destroyed (e.g. wire deleted by block delete)
            if (item.renderer && item.renderer.getLayer && item.renderer.getLayer()) {
                // Reset stuck _deleting flag: _mergeAndDelete can set it without
                // destroying the renderer (e.g. when wire endpoints are already null).
                if (item instanceof Junction) item._deleting = false;
                item.delete();
            }
        });
    }

    rotateSelected() {
        this.selectedItems.forEach(item => {
            if (item instanceof Block) item.rotate();
        });
    }

    /* ──────────────────────────────────────
       Coordinate conversion
    ────────────────────────────────────── */
    screenToWorld(screenX, screenY) {
        const scale = this.stage.scaleX();
        const pos   = this.stage.position();
        return {
            x: (screenX - pos.x) / scale,
            y: (screenY - pos.y) / scale,
        };
    }

    getPointerPosition() { return this.stage.getPointerPosition(); }

    /** Pointer position converted to stage world coords (undoes scale + pan). */
    getWorldPointerPosition() {
        const pos = this.stage.getPointerPosition();
        if (!pos) return null;
        return this.screenToWorld(pos.x, pos.y);
    }

    onPointerMove(callback) {
        this.offPointerMove();
        this._pmHandler = (e) => {
            const rect     = this.stage.container().getBoundingClientRect();
            const scale    = this.stage.scaleX();
            const stagePos = this.stage.position();
            callback({
                x: (e.clientX - rect.left - stagePos.x) / scale,
                y: (e.clientY - rect.top  - stagePos.y) / scale,
            });
        };
        window.addEventListener('mousemove', this._pmHandler);
    }
    offPointerMove() {
        if (this._pmHandler) {
            window.removeEventListener('mousemove', this._pmHandler);
            this._pmHandler = null;
        }
    }

    /* ──────────────────────────────────────
       View helpers
    ────────────────────────────────────── */
    fitToScreen() {
        if (this.blocks.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.blocks.forEach(b => {
            const r = b.renderer.getClientRect({ relativeTo: this.blockLayer });
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.width);
            maxY = Math.max(maxY, r.y + r.height);
        });

        const padding = 80;
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;
        const scaleX = this.stage.width()  / contentW;
        const scaleY = this.stage.height() / contentH;
        const newScale = Math.min(scaleX, scaleY, 2);

        this.stage.scale({ x: newScale, y: newScale });
        this.stage.position({
            x: -minX * newScale + padding * newScale,
            y: -minY * newScale + padding * newScale,
        });
        this.stage.batchDraw();
        this._updateGridBackground();
    }

    resetZoom() {
        this.stage.scale({ x: 1, y: 1 });
        this.stage.position({ x: 0, y: 0 });
        this.stage.batchDraw();
        this._updateGridBackground();
    }

    /* ──────────────────────────────────────
       CSS grid background sync
    ────────────────────────────────────── */
    _updateGridBackground() {
        const container = this.stage.container();
        const scale     = this.stage.scaleX();
        const pos       = this.stage.position();
        const baseSize  = 24;
        const size      = baseSize * scale;
        container.style.backgroundSize     = `${size}px ${size}px`;
        container.style.backgroundPosition = `${pos.x % size}px ${pos.y % size}px`;
    }

    /* ──────────────────────────────────────
       Keyboard handlers (Space pan + Delete)
    ────────────────────────────────────── */
    _initKeyboard() {
        console.log('Stage.js loaded — R key rotation REMOVED');
        document.addEventListener('keydown', e => {
            if (e.target.matches('input, textarea, select')) return;
            if (e.code === 'Space' && !this._isSpaceDown) {
                e.preventDefault();
                this._isSpaceDown = true;
                this.stage.container().style.cursor = 'grab';
                // Disable block dragging so space+drag pans instead
                this.blocks.forEach(b => b.renderer.draggable(false));
            }

        });

        document.addEventListener('keyup', e => {
            if (e.code === 'Space') {
                this._isSpaceDown = false;
                if (!this._isPanning) {
                    this.stage.container().style.cursor = 'default';
                }
                this.blocks.forEach(b => b.renderer.draggable(true));
            }
        });
    }

    /* ──────────────────────────────────────
       Stage mouse / wheel events
    ────────────────────────────────────── */
    _initStageEvents() {
        // ── Zoom ──
        this.stage.on('wheel', e => {
            e.evt.preventDefault();
            const scaleBy  = 1.06;
            const oldScale = this.stage.scaleX();
            const minScale = 0.1;
            const maxScale = 6;
            const pointer  = this.stage.getPointerPosition();

            const mousePointTo = {
                x: (pointer.x - this.stage.x()) / oldScale,
                y: (pointer.y - this.stage.y()) / oldScale,
            };

            const direction = e.evt.deltaY > 0 ? -1 : 1;
            let newScale    = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
            newScale        = Math.max(minScale, Math.min(maxScale, newScale));

            this.stage.scale({ x: newScale, y: newScale });
            this.stage.position({
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            });
            this.stage.batchDraw();
            this._updateGridBackground();
        });

        // ── Panning (middle mouse or space+drag) + marquee (left on empty canvas) ──
        this.stage.on('mousedown', e => {
            const isMiddle    = e.evt.button === 1;
            const isSpaceDrag = this._isSpaceDown && e.evt.button === 0;

            if (isMiddle || isSpaceDrag) {
                e.evt.preventDefault();
                this._isPanning  = true;
                this._lastPanPos = this.stage.getPointerPosition();
                this.stage.container().style.cursor = 'grabbing';
                return;
            }

            // Start marquee on plain left-click on empty canvas
            if (e.evt.button === 0 && e.target === this.stage) {
                const worldPos = this.getWorldPointerPosition();
                if (worldPos) {
                    this._marqueeOrigin = worldPos;
                    this._marqueeRect.setAttrs({
                        x: worldPos.x, y: worldPos.y,
                        width: 0, height: 0, visible: true,
                    });
                    this._marqueeRect.moveToTop();
                }
            }
        });

        this.stage.on('mousemove', () => {
            if (this._isPanning) {
                const pos = this.stage.getPointerPosition();
                if (!pos || !this._lastPanPos) return;
                this.stage.position({
                    x: this.stage.x() + (pos.x - this._lastPanPos.x),
                    y: this.stage.y() + (pos.y - this._lastPanPos.y),
                });
                this._lastPanPos = pos;
                this.stage.batchDraw();
                this._updateGridBackground();
                return;
            }

            // Update marquee rect
            if (this._marqueeOrigin) {
                const cur = this.getWorldPointerPosition();
                if (!cur) return;
                const ox = this._marqueeOrigin.x, oy = this._marqueeOrigin.y;
                this._marqueeRect.setAttrs({
                    x: Math.min(ox, cur.x),
                    y: Math.min(oy, cur.y),
                    width:  Math.abs(cur.x - ox),
                    height: Math.abs(cur.y - oy),
                });
                this.blockLayer.batchDraw();
            }
        });

        this.stage.on('mouseup', () => {
            if (this._isPanning) {
                this._isPanning = false;
                this.stage.container().style.cursor = this._isSpaceDown ? 'grab' : 'default';
            }

            if (this._marqueeOrigin) {
                const r = this._marqueeRect;
                if (r.width() > 5 || r.height() > 5) {
                    this._selectBlocksInRect({
                        x: r.x(), y: r.y(), width: r.width(), height: r.height(),
                    });
                    this._didMarquee = true;
                    // _selectBlocksInRect → _updateSelectionBounds controls rect visibility
                } else {
                    // Tiny drag — treat as a click, hide the rect
                    this._marqueeRect.visible(false);
                    this.blockLayer.batchDraw();
                }
                this._marqueeOrigin = null;
            }
        });

        // ── Deselect on empty canvas click ──
        this.stage.on('click', e => {
            if (this._didMarquee) { this._didMarquee = false; return; }
            if (e.target === this.stage) {
                if (this.tempWire?.isDrawing()) this.tempWire.renderer.cancelDraw();
                this.deselectAll();
            }
        });

        // Prevent context menu default on stage (wires handle it themselves)
        this.stage.on('contextmenu', e => {
            e.evt.preventDefault();
            if (this.tempWire?.isDrawing()) this.tempWire.renderer.cancelDraw();
        });
    }

    /* ──────────────────────────────────────
       Marquee selection
    ────────────────────────────────────── */
    _selectBlocksInRect(rect) {
        this.deselectAll();
        this.blocks.forEach(block => {
            const br = block.renderer.getClientRect({ relativeTo: this.blockLayer });
            const overlaps =
                br.x < rect.x + rect.width  &&
                br.x + br.width  > rect.x   &&
                br.y < rect.y + rect.height  &&
                br.y + br.height > rect.y;
            if (overlaps) {
                block.isSelected = true;
                this.selectedItems.push(block);
                block.renderer.showSelected();
            }
        });

        // Also select junctions whose center falls inside the rect
        this.junctions?.forEach(junction => {
            const pos = junction.getPositions();
            if (pos.x >= rect.x && pos.x <= rect.x + rect.width &&
                pos.y >= rect.y && pos.y <= rect.y + rect.height) {
                this.selectedItems.push(junction);
                junction.renderer.fill('#3B82F6');
                junction.renderer.stroke('#3B82F6');
                junction.renderer.radius(7);
            }
        });

        // Select wires whose both endpoints are inside the selection.
        // A wire endpoint is "inside" when its owner (block or junction) was selected above.
        const selectedSet  = new Set(this.selectedItems);
        const wiresToSelect = new Set();

        this.selectedItems
            .filter(item => item.inputPorts) // blocks only
            .forEach(block => {
                [...block.inputPorts, ...block.outputPorts].forEach(port => {
                    const wire = port.wire;
                    if (!wire || wiresToSelect.has(wire)) return;
                    const otherCP = wire.cps.start === port ? wire.cps.end : wire.cps.start;
                    if (!otherCP) return;
                    // Junctions are stored directly in selectedItems; ports resolve to their owner block.
                    const otherOwner = (otherCP.params?.type === 'cp') ? otherCP : otherCP.owner;
                    if (selectedSet.has(otherOwner)) wiresToSelect.add(wire);
                });
            });

        wiresToSelect.forEach(wire => {
            wire.isSelected = true;
            this.selectedItems.push(wire);
            wire.renderer.highlight();
        });

        if (this.wireLayer) this.wireLayer.batchDraw();
        this._updateSelectionBounds();
    }

    _updateSelectionBounds() {
        const selectedBlocks = this.selectedItems.filter(item => item.inputPorts);
        if (selectedBlocks.length === 0) {
            this._marqueeRect.visible(false);
            if (this.blockLayer) this.blockLayer.batchDraw();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedBlocks.forEach(block => {
            const r = block.renderer.getClientRect({ relativeTo: this.blockLayer });
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.width);
            maxY = Math.max(maxY, r.y + r.height);
        });

        // Expand bounds to cover selected wire paths (world-coordinate points).
        this.selectedItems
            .filter(item => item.renderer?._pts)
            .forEach(wire => {
                wire.renderer._pts.forEach(({ x, y }) => {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                });
            });

        const PAD = 8;
        this._marqueeRect.setAttrs({
            x:       minX - PAD,
            y:       minY - PAD,
            width:   maxX - minX + PAD * 2,
            height:  maxY - minY + PAD * 2,
            visible: true,
        });
        this._marqueeRect.moveToTop();
        if (this.blockLayer) this.blockLayer.batchDraw();
    }

    /* ──────────────────────────────────────
       Resize handler
    ────────────────────────────────────── */
    _initResize() {
        window.addEventListener('resize', () => {
            this.stage.width(window.innerWidth);
            this.stage.height(window.innerHeight);
            this.stage.batchDraw();
        });
    }
}
