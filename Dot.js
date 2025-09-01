
import  { wire } from './main.js';

export class Dot extends Konva.Circle {
    constructor(objOn, params = { x: 0, y: 0, radius: 5, fill: 'black' }) {
        super({
            x: params.x,
            y: params.y,
            radius: params.radius,
            fill: params.fill,
            stroke: 'black',
            strokeWidth: 1,
        });

        this.objOn = objOn;
        this.wires = [];

        this.on('mouseover', () => {
            document.body.style.cursor = 'pointer';
            this.fill('blue');
            this.stroke('black');
        });

        this.on('mouseout', () => {
            this.fill('black');
            this.stroke('white');
            document.body.style.cursor = 'default';
        });

        this.on('mousedown touchstart', (e) => {
            // Prevent drag from starting
            e.cancelBubble = true;
        });

        this.on('pointerdown', (e) => {
            e.cancelBubble = false; // Allow event to bubble up
            console.log('Dot clicked');
            // Allow wire actions to apply to dots of any Blocks instance
            if (wire.isDrawing && wire.startDot !== this) {
                wire.endWire(this, this.objOn.id);
                console.log('isDrawing is true, ending wire');
                return;
            } else {
                wire.startWire(this, this.objOn.id);
            }
        });

        this.on('contextmenu', (e) => {
            e.evt.preventDefault();
            console.log('Right click detected on dot');
            wire.cancelWire();
            // You can add custom right-click logic here
        });

    }

    addWire(wireObj) {
        this.wires.push(wireObj);
    }
    
}