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
        this.configurable = params.configurable || false;

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

    _computeHeight(numInputs, numOutputs) {
        return Math.max(40, Math.max(numInputs, numOutputs) * 20);
    }

    resize(numInputs, numOutputs) {
        const newH = this._computeHeight(numInputs, numOutputs);

        const prevInputCount  = this.inputPorts.length;
        const prevOutputCount = this.outputPorts.length;

        // Remove excess input ports (disconnect wires first)
        for (let i = numInputs; i < prevInputCount; i++) {
            if (this.inputPorts[i].wire) this.inputPorts[i].wire.delete();
            this.inputPorts[i].renderer.destroy();
        }
        this.inputPorts.splice(numInputs);

        // Remove excess output ports
        for (let i = numOutputs; i < prevOutputCount; i++) {
            if (this.outputPorts[i].wire) this.outputPorts[i].wire.delete();
            this.outputPorts[i].renderer.destroy();
        }
        this.outputPorts.splice(numOutputs);

        // Update state and resize the visual rect/label
        this.numOfPorts = [numInputs, numOutputs];
        this.size.height = newH;
        this.renderer.resize(newH);

        // Rebuild renderers for kept ports — positions change with new height/count
        this.inputPorts.forEach((port, i) => {
            port.renderer.destroy();
            port.params = { ...port.params, idx: i, numOfPorts: numInputs };
            const R = port.createRendererClass();
            port.renderer = new R(port, port.params);
            port.renderer.render();
            this.renderer.add(port.renderer);
        });

        this.outputPorts.forEach((port, i) => {
            port.renderer.destroy();
            port.params = { ...port.params, idx: i, numOfPorts: numOutputs };
            const R = port.createRendererClass();
            port.renderer = new R(port, port.params);
            port.renderer.render();
            this.renderer.add(port.renderer);
        });

        // Add new input ports
        for (let i = prevInputCount; i < numInputs; i++) {
            const port = new Port(this, { type: 'input', idx: i, numOfPorts: numInputs });
            this.add(port);
            this.inputPorts.push(port);
        }

        // Add new output ports
        for (let i = prevOutputCount; i < numOutputs; i++) {
            const port = new Port(this, { type: 'output', idx: i, numOfPorts: numOutputs });
            this.add(port);
            this.outputPorts.push(port);
        }

        // Re-route wires from kept ports
        [...this.inputPorts, ...this.outputPorts].forEach(port => {
            if (port.wire) port.updateWiresOnDrag();
        });

        if (this.stage.blockLayer) this.stage.blockLayer.batchDraw();
        if (this.stage.wireLayer)  this.stage.wireLayer.batchDraw();
    }

    createRendererClass() {
        return DefaultBlockRenderer;
    }
}
