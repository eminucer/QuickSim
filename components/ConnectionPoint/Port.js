import { ConnectionPoint } from "./ConnectionPoint.js";
import { PortRenderer } from "./PortRenderer.js";

export class Port extends ConnectionPoint {
    constructor(block, params) {
        super(block, params);
    }

    createRendererClass() {
        return PortRenderer;
    }
}