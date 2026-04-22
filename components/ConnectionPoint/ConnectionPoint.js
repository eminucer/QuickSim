import { ConnectionPointRenderer } from "./ConnectionPointRenderer.js";

export class ConnectionPoint {
    constructor(owner, params = {}) {
        this.owner = owner;
        this.stage = owner.stage;
        this.isConnected = false;
        this.isSelected = false;
        this.params = params;
        const RendererClass = this.createRendererClass();
        this.renderer = new RendererClass(this, params);
        this.renderer.render();
        this.wire = null;
    }

    createRendererClass() {
        return ConnectionPointRenderer;
    }

    getPositions(){
        return this.renderer.getPositions();
    }

    updateWiresOnDrag(){
        if(this.wire != null){
            this.wire.updateOnDrag(this);
        }
    }

    assignWire(wire){
        this.wire = wire;
        if (this.params.type != "cp")
        this.isConnected = true;
    }

    // connect() {
    //     // Logic to connect this connection point
    // }

    // disconnect() {
    //     // Logic to disconnect this connection point
    // }

    // highlight() {
    //     // Logic to highlight this connection point
    // }

    // startTempWire() {
    //     // Logic to start a temporary wire from this connection point
    // }

    // endTempWire() {
    //     // Logic to end a temporary wire at this connection point
    // }

    // unhighlight() {
    //     // Logic to unhighlight this connection point
    // }

    // onSelect() {
    //     // Logic when this connection point is selected
    // }

    // onDeselect() {
    //     // Logic when this connection point is deselected
    // }

    // onConnect() {
    //     // Logic when this connection point is connected
    // }

    // onDisconnect() {
    //     // Logic when this connection point is disconnected
    // }

    // onDelete() {
    //     // Logic when this connection point is deleted
    // }

    // onStartWire() {
    //     // Additional logic for starting a wire can be added here
    // }

    // onEndWire() {
    //     // Additional logic for ending a wire can be added here
    // }
}