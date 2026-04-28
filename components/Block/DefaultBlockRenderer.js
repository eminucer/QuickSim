export class DefaultBlockRenderer extends Konva.Group {
    constructor(owner) {
        super({ draggable: true });
        this.owner        = owner;
        this.stage        = owner.stage;
        this.width        = owner.size.width;
        this.height       = owner.size.height;
        this.color        = owner.color;
        this.strokeColor  = owner.strokeColor || '#374151';
        this.block        = null;
        this.label        = null;
        this.pos          = owner.pos;
        this._bindEvents();
    }

    _bindEvents() {
        this.on('dragstart', () => {
            this._prevDragPos = { x: this.x(), y: this.y() };
        });
        this.on('dragmove', () => {
            const dx = this.x() - this._prevDragPos.x;
            const dy = this.y() - this._prevDragPos.y;
            this._prevDragPos = { x: this.x(), y: this.y() };

            // Build sets of selected items moving together
            const selectedBlocks = new Set(
                this.stage.selectedItems.filter(item => item.inputPorts)
            );
            selectedBlocks.add(this.owner);

            const selectedJunctions = new Set(
                this.stage.selectedItems.filter(item => item.params?.type === 'cp')
            );

            // Move other selected blocks
            selectedBlocks.forEach(block => {
                if (block === this.owner) return;
                block.renderer.x(block.renderer.x() + dx);
                block.renderer.y(block.renderer.y() + dy);
            });

            // Move selected junctions (update both the Konva node and the cached _pos)
            selectedJunctions.forEach(junction => {
                junction._pos.x += dx;
                junction._pos.y += dy;
                junction.renderer.x(junction.renderer.x() + dx);
                junction.renderer.y(junction.renderer.y() + dy);
            });

            // Returns true if a CP's owner (block or junction itself) is in the selection
            const inSelection = cp => {
                if (!cp) return false;
                if (cp.params?.type === 'cp') return selectedJunctions.has(cp);
                return selectedBlocks.has(cp.owner);
            };

            // Update wires: translate internal wires rigidly, re-route boundary wires.
            // Through-wires of a junction are handled atomically: updateOnDrag
            // delegates to the junction's reflowParentPath, which re-routes the
            // entire conceptual parent path and re-snaps the junction onto it.
            const processedWires = new Set();

            const processWire = (wire, fromCP) => {
                if (processedWires.has(wire)) return;
                processedWires.add(wire);

                const otherCP = wire.cps.start === fromCP ? wire.cps.end : wire.cps.start;

                if (inSelection(otherCP)) {
                    // Both ends inside the selection → shift all points rigidly.
                    // translateAll also keeps _userPts in sync so incremental
                    // updates remain valid after the group drag.
                    wire.renderer.translateAll(dx, dy);
                } else {
                    // One end crosses the boundary → re-anchor from the selected end.
                    // If the other end is a junction, updateOnDrag delegates to
                    // junction.reflowParentPath (handled inside the renderer).
                    wire.updateOnDrag(fromCP);
                }
            };

            // Process wires from selected blocks' ports
            selectedBlocks.forEach(block => {
                [...block.inputPorts, ...block.outputPorts].forEach(port => {
                    if (port.wire) processWire(port.wire, port);
                });
            });

            // Process wires from selected junctions
            selectedJunctions.forEach(junction => {
                junction.wires.forEach(wire => processWire(wire, junction));
            });

            // Keep selection bounds rect in sync
            if (this.stage._updateSelectionBounds) this.stage._updateSelectionBounds();

            if (this.stage.wireLayer) this.stage.wireLayer.batchDraw();
            if (this.getLayer()) this.getLayer().batchDraw();
        });
        this.on('mouseover', () => {
            if (!this._isManagedByParentHover)
                document.body.style.cursor = 'move';
        });
        this.on('mouseout', () => {
            document.body.style.cursor = 'default';
        });
        this.on('click', e => {
            if (e.evt.button !== 0) return; // ignore right-clicks
            if (e.target && e.target._isPort) return;
            this.owner.select();
        });
        this.on('contextmenu', e => {
            e.evt.preventDefault();
            document.dispatchEvent(new CustomEvent('block-contextmenu', {
                detail: { block: this.owner, x: e.evt.clientX, y: e.evt.clientY }
            }));
        });
        this.on('dblclick', e => {
            if (!this.owner.configurable) return;
            e.evt.preventDefault();
            document.dispatchEvent(new CustomEvent('block-dblclick', {
                detail: { block: this.owner }
            }));
        });
    }

    render() {
        this.block = new Konva.Rect({
            x: this.pos.x,
            y: this.pos.y,
            width:        this.width,
            height:       this.height,
            fill:         this.color,
            stroke:       this.strokeColor,
            strokeWidth:  2,
            cornerRadius: 5,
        });
        this.add(this.block);

        this.label = new Konva.Text({
            x:            this.pos.x,
            y:            this.pos.y,
            width:        this.block.width(),
            height:       this.block.height(),
            align:        'center',
            verticalAlign:'middle',
            text:         this.owner.label,
            fontSize:     this.owner.fontSize || 16,
            fontStyle:    'bold',
            fill:         '#1e293b',
        });
        this.add(this.label);
    }

    move(newPos) {
        this.pos = newPos;
        this.position(newPos);
        if (this.stage && this.stage.draw) this.stage.draw(this);
    }

    /* ── Selection highlight ── */
    showSelected() {
        this.block.strokeWidth(3);
        this.block.shadowColor(this.strokeColor);
        this.block.shadowBlur(12);
        this.block.shadowOpacity(0.6);
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    hideSelected() {
        this.block.strokeWidth(2);
        this.block.shadowBlur(0);
        this.block.shadowOpacity(0);
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    /**
     * Rotate the block 90° clockwise around its visual center.
     *
     * On the first call we shift the Konva transform origin to the block
     * center so all subsequent rotations spin in place.  After that we
     * just increment the rotation angle and redraw connected wires.
     */
    rotate() {
        const w = this.owner.size.width;
        const h = this.owner.size.height;

        if (this.offsetX() === 0 && this.offsetY() === 0) {
            // First rotation: anchor the transform origin to the center.
            // Compensate the position so the block stays where it is visually.
            this.offsetX(w / 2);
            this.offsetY(h / 2);
            this.x(this.x() + w / 2);
            this.y(this.y() + h / 2);
        }

        this.rotation((this.rotation() + 90) % 360);

        // Keep the label text upright and re-centered
        this._updateLabelTransform();

        // Redraw all connected wires to follow the new port positions
        [...this.owner.inputPorts, ...this.owner.outputPorts].forEach(port => {
            port.updateWiresOnDrag();
        });

        if (this.getLayer()) this.getLayer().batchDraw();
    }

    /**
     * Counter-rotate the label so it stays visually upright after the
     * block group has been rotated.
     *
     * At 90°/270° the group is visually h-wide and w-tall, so the label's
     * text box dimensions are swapped to keep it filling the block correctly.
     * Both the label and its text box are anchored to the block's center.
     */
    _updateLabelTransform() {
        if (!this.label) return;
        const w     = this.owner.size.width;
        const h     = this.owner.size.height;
        const angle = this.rotation(); // always 0, 90, 180, or 270

        // At 90°/270° the visible block is h-wide and w-tall — swap box dimensions
        const boxW = (angle === 90 || angle === 270) ? h : w;
        const boxH = (angle === 90 || angle === 270) ? w : h;

        // Anchor the label's rotation center to the block's center (w/2, h/2)
        this.label.offsetX(boxW / 2);
        this.label.offsetY(boxH / 2);
        this.label.x(w / 2);
        this.label.y(h / 2);
        this.label.width(boxW);
        this.label.height(boxH);
        // Counter-rotate to cancel out the group's rotation
        this.label.rotation(-angle);
    }

    resize(newH) {
        this.height = newH;
        this.owner.size.height = newH;
        this.block.height(newH);
        this.label.height(newH);
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    turnOnBox() {
        const box = this.getClientRect({ skipTransform: false });
        const bbox = new Konva.Rect({
            x:           box.x,
            y:           box.y,
            width:       box.width,
            height:      box.height,
            stroke:      'red',
            strokeWidth: 1,
            dash:        [4, 4],
            listening:   false
        });
        this.add(bbox);
        if (this.stage && this.stage.draw) this.stage.draw(this);
    }
}
