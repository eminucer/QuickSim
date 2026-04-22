import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";
import { Port } from "../ConnectionPoint/Port.js";

export class Block {
    static id = 0;

    constructor(stage, params = {}) {
        this.stage       = stage;
        this.name        = params.name;
        this.id          = Block.id++;
        this.type        = params.type;
        this.numOfPorts  = params.numOfPorts; // [inputs, outputs]
        this.pos         = { x: 0, y: 0 };
        this.size        = params.size        || { width: 60, height: 60 };
        this.color       = params.color       || '#DBEAFE';
        this.strokeColor = params.strokeColor || '#1D4ED8';
        this.label       = params.label       || 'Block';
        this.fontSize    = params.fontSize    || 16;
        this.isSelected  = false;

        this.inputPorts  = [];
        this.outputPorts = [];

        const RendererClass = this.createRendererClass();
        this.renderer = new RendererClass(this);
        this.renderer.render();

        if (params.initMovePos) this.move(params.initMovePos);
        this.addPorts();
    }

    addPorts() {
        for (let i = 0; i < this.numOfPorts[0]; i++) {
            const port = new Port(this, { type: 'input',  idx: i, numOfPorts: this.numOfPorts[0] });
            this.add(port);
            this.inputPorts.push(port);
        }
        for (let i = 0; i < this.numOfPorts[1]; i++) {
            const port = new Port(this, { type: 'output', idx: i, numOfPorts: this.numOfPorts[1] });
            this.add(port);
            this.outputPorts.push(port);
        }
    }

    add(item) {
        this.renderer.add(item.renderer);
    }

    move(newPos) {
        this.pos = newPos;
        this.renderer.move(newPos);
    }

    /* ── Selection ── */
    select() {
        this.stage.deselectAll();
        this.isSelected = true;
        this.stage.selectedItems.push(this);
        this.renderer.showSelected();
    }

    deSelect() {
        this.isSelected = false;
        this.renderer.hideSelected();
    }

    /* ── Deletion ── */
    delete() {
        // 1. Disconnect + destroy all connected wires first
        [...this.inputPorts, ...this.outputPorts].forEach(port => {
            if (port.wire) port.wire.delete();
        });

        // 2. Remove from stage tracking
        if (this.stage.blocks) {
            const idx = this.stage.blocks.indexOf(this);
            if (idx !== -1) this.stage.blocks.splice(idx, 1);
        }
        const selIdx = this.stage.selectedItems.indexOf(this);
        if (selIdx !== -1) this.stage.selectedItems.splice(selIdx, 1);

        // 3. Destroy renderer (removes from layer, destroys all port renderer children)
        this.renderer.destroy();
        this.stage.blockLayer && this.stage.blockLayer.batchDraw();
    }

    rotate() {
        this.renderer.rotate();
    }

    createRendererClass() {
        return DefaultBlockRenderer;
    }
}
