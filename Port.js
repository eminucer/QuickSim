

import { wire } from './main.js';

// Port class using arrow shapes for input/output
export class Port extends Konva.Shape {
    /**
     * @param {Object} objOn - The block this port is attached to
     * @param {Object} params - { x, y, size, fill, type }
     * @param {string} params.type - 'input' or 'output'
     */
    constructor(objOn, params = { x: 0, y: 0, arrowSize: 10, fill: 'black', type: 'input' }) {
        super({
            x: params.x,
            y: params.y,
            stroke: 'black',
            strokeWidth: 2,
        });

        this.objOn = objOn;
        this.wires = [];
        this.arrowSize = params.arrowSize || params.size || params.arrowSize;
        this.type = params.type || 'input';

        // Draw open triangle arrow shape (no fill, no bottom line)
        this.sceneFunc((context, shape) => {
            context.beginPath();
            // Adjust these factors to control edge length and angle
            const tipX = this.arrowSize;
            const tipY = this.arrowSize / 2;
            const baseX = this.arrowSize / 2;
            const baseYOffset = this.arrowSize / 2; // even wider angle

            // Draw two lines from tip to base points
            context.moveTo(tipX, tipY);
            context.lineTo(baseX, tipY - baseYOffset);
            context.moveTo(tipX, tipY);
            context.lineTo(baseX, tipY + baseYOffset);
            context.strokeShape(shape);
        });
        // Increase hit area for mouseover proximity
        this.hitFunc((context) => {
            // Draw a larger invisible circle around the arrow tip for easier hover
            const radius = this.arrowSize;
            const tipX = this.arrowSize;
            const tipY = this.arrowSize / 2;
            context.beginPath();
            context.arc(tipX, tipY, radius, 0, Math.PI * 2, false);
            context.closePath();
            context.fillStrokeShape(this);
        });

        // Highlight the object in orange and add glow on mouseover
        this.on('mouseover', () => {
            document.body.style.cursor = 'pointer';
            this.stroke('orange');
            this.shadowColor('orange');
            this.shadowBlur(15);
            this.shadowOpacity(0.7);
            console.log('Port mouseover');
        });

        // Remove glow on mouseout (add to mouseout handler)
        this.on('mouseout', () => {
            this.stroke('black');
            this.shadowBlur(0);
            this.shadowOpacity(0);
            document.body.style.cursor = 'default';
        });

        this.on('mousedown touchstart', (e) => {
            e.cancelBubble = true;
        });

        this.on('pointerdown', (e) => {
            e.cancelBubble = false;
            if (wire.isDrawing && wire.startDot !== this) {
                wire.endWire(this, this.objOn.id);
                return;
            } else {
                wire.startWire(this, this.objOn.id);
            }
        });

        this.on('contextmenu', (e) => {
            e.evt.preventDefault();
            wire.cancelWire();
        });

        // Override getAbsolutePosition to include arrow tip adjustment
        this.getAbsolutePosition = () => {
            const pos = Konva.Node.prototype.getAbsolutePosition.call(this);
            return {
                x: pos.x + this.arrowSize,
                y: pos.y + this.arrowSize / 2
            };
        };
    }

    addWire(wireObj) {
        this.wires.push(wireObj);
    }
}