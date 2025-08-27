
import { stage } from './main.js';

export class Wire extends Konva.Layer {
    constructor(){
        super();
        this.wires = [];
        this.tempLineAttributes = {
            stroke: 'black',
            strokeWidth: 2,
            dash: [4, 4],
            lineCap: 'round',
            lineJoin: 'round',
        };
        this.finalLineAttributes = {
            stroke: 'black',
            strokeWidth: 2,
            dash: [],
            lineCap: 'round',
            lineJoin: 'round',
        };
        this.isDrawing = false;
        this.tempLine = null;
        this.startDot = null;
    }

    startWire(dot) {
        this.isDrawing = true;
        this.startDot = dot.getAbsolutePosition();
        this.tempLine = new Konva.Line({
            points: [this.startDot.x, this.startDot.y, this.startDot.x, this.startDot.y] ,
            ...this.tempLineAttributes,
        });
        this.add(this.tempLine);
    }

    updateWire() {
        if (!this.isDrawing) return;
        console.log('Updating wire in progress...');
        const pos = stage.getPointerPosition();
        // Make sure tempLine is not blocking pointer events
        this.tempLine.listening(false);
        // this.tempLine.points([this.startDot.x, this.startDot.y, pos.x, pos.y]);
        // this.batchDraw();
        if (!pos) return;
        const dx = Math.abs(pos.x - this.startDot.x);
        const dy = Math.abs(pos.y - this.startDot.y);

        // Choose the axis with the larger distance for the "elbow"
        let midPoint;
        if (dx > dy) {
            // Horizontal first, then vertical
            midPoint = { x: pos.x, y: this.startDot.y };
        } else {
            // Vertical first, then horizontal
            midPoint = { x: this.startDot.x, y: pos.y };
        }

        this.tempLine.points([
            this.startDot.x, this.startDot.y,
            midPoint.x, midPoint.y,
            pos.x, pos.y
        ]);
        this.batchDraw();
    }

    endWire(dot) {
        if (!this.isDrawing) return;

        const pos = dot.getAbsolutePosition();
        
        //this.tempLine.points([this.startDot.x, this.startDot.y, pos.x, pos.y]);
        const midX = (this.startDot.x + pos.x) / 2;
        const midY = (this.startDot.y + pos.y) / 2;

        // Create a path with two right angle elbows at the midpoints
        const points = [
            this.startDot.x, this.startDot.y,
            midX, this.startDot.y,
            midX, pos.y,
            pos.x, pos.y
        ];

        this.tempLine.points(points);
        this.tempLine.setAttrs(this.finalLineAttributes);
        this.tempLine.draw(); // Ensure the attributes are rendered
        this.tempLine.listening(true);
        this.batchDraw();
        this.wires.push(this.tempLine);
        this.tempLine = null;
        this.isDrawing = false;
    }

    cancelWire() {
        if (this.tempLine) {
            this.tempLine.destroy();
            this.tempLine = null;
        }
        this.isDrawing = false;
    }

    updateWireOnDrag(startDot, endDot, wireLine) {
        const startPos = startDot.getAbsolutePosition();
        const endPos = endDot.getAbsolutePosition();
        const midX = (startPos.x + endPos.x) / 2;

        const points = [
            startPos.x, startPos.y,
            midX, startPos.y,
            midX, endPos.y,
            endPos.x, endPos.y
        ];

        wireLine.points(points);
        wireLine.batchDraw && wireLine.batchDraw();
    }
}

export const wire = new Wire();

