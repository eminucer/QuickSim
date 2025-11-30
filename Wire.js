import { Dot } from './Dot.js';

export class Wire extends Konva.Layer {
    constructor(stage){
        super();
        this.wires = {};
        this.stage = stage;

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
        this.startDotPos = null;
        this.startDot = null;
        this.startBlockId = null;
        this.selectedLine = null;

        this.rewireActive = false;
        this.rewireWireObj = null;
        this.rewireEnd = null; // 'start' or 'end'
        this.rewireTempLine = null;

        this.on('mouseover', (e) => {
            if (e.target instanceof Konva.Line && e.target !== this.tempLine && e.target !== this.rewireTempLine && this.selectedLine !== e.target) {
                e.target.stroke('orange');
                e.target.strokeWidth(4);
                this.batchDraw();
                document.body.style.cursor = 'pointer';
            }
        });

        this.on('mouseout', (e) => {
            if (
                e.target instanceof Konva.Line &&
                e.target !== this.tempLine &&
                e.target !== this.rewireTempLine &&
                this.selectedLine !== e.target
            ) {
                e.target.stroke(this.finalLineAttributes.stroke);
                e.target.strokeWidth(this.finalLineAttributes.strokeWidth);
                this.batchDraw();
                document.body.style.cursor = 'default';
            }
        });

        // Highlight line on click
        this.on('click', (e) => {
            if (e.target instanceof Konva.Line && e.target !== this.tempLine) {
            if (this.selectedLine && this.selectedLine !== e.target) {
                this.selectedLine.stroke(this.finalLineAttributes.stroke);
                this.selectedLine.strokeWidth(this.finalLineAttributes.strokeWidth);
            }
            this.selectedLine = e.target;
            this.selectedLine.stroke('orange');
            this.selectedLine.strokeWidth(4);
            this.batchDraw();
            }
        });

        // Delete selected line on Delete or Backspace key press
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedLine) {
                console.log('Deleting selected line');
                // Remove the selected line from the layer
                this.selectedLine.destroy();
                this.selectedLine = null;
                this.batchDraw();
                // Optionally, remove from wires array
                Object.keys(this.wires).forEach(blockId => {
                    this.wires[blockId] = this.wires[blockId].filter(wireObj => wireObj.line !== this.selectedLine);
                });
            }
        });

        // Remove highlight on stage click or right click
        this.stage.on('mousedown touchstart contextmenu', (e) => {
            if (
                this.selectedLine &&
                (!e.target || !(e.target instanceof Konva.Line))
            ) {
                this.selectedLine.stroke(this.finalLineAttributes.stroke);
                this.selectedLine.strokeWidth(this.finalLineAttributes.strokeWidth);
                this.selectedLine = null;
                this.batchDraw();
            }
        });

        // Right mouse down on a wire to start rewire
        this.on('contextmenu', (e) => {
                e.evt.preventDefault();
                if (e.target instanceof Konva.Line && e.target !== this.tempLine) {
                    if (!this.rewireActive) {
                        const wireObj = this.findWireObjByLine(e.target);
                        if (!wireObj) return;
                        const mousePos = this.stage.getPointerPosition();
                        const dot = new Dot(this, { x: mousePos.x, y: mousePos.y, radius: 5, fill: 'black' });
                        this.add(dot); // Just to have a reference, not displayed
                        this.rewireWireObj = wireObj;
                        this.rewireActive = true;
                        this.rewireStartPoint = { x: mousePos.x, y: mousePos.y };
                        this.rewireTempLine = new Konva.Line({
                            points: [mousePos.x, mousePos.y, mousePos.x, mousePos.y],
                            ...this.tempLineAttributes,
                        });
                        this.add(this.rewireTempLine);
                        this.batchDraw();
                        console.log('Started rewiring');
                    } else {
                        // If already drawing, right-click cancels
                        if (this.rewireTempLine) {
                            this.rewireTempLine.destroy();
                            this.rewireTempLine = null;
                        }
                        this.rewireWireObj = null;
                        this.rewireActive = false;
                        this.rewireStartPoint = null;
                        this.batchDraw();
                        console.log('Cancelled rewiring');
                    }
                }
        });

        // Mouse move to update temp rewire line
        this.stage.on('mousemove', (e) => {
            if (this.rewireActive && this.rewireTempLine && this.rewireStartPoint) {
                const mousePos = this.stage.getPointerPosition();
                const start = this.rewireStartPoint;
                const midX = mousePos.x;
                const midY = start.y;
                this.rewireTempLine.points([
                    start.x, start.y,
                    midX, midY,
                    mousePos.x, mousePos.y
                ]);
                this.batchDraw();
                console.log('Updating rewire line');
            }
        });

        // Mouse up: check if over a dot, then rewire
        this.stage.on('mousedown', (e) => {
            if (this.rewireActive && this.rewireTempLine) {
                // If left-click on a dot, complete the wire
                if (e.evt.button === 0 && e.target instanceof Konva.Circle && e.target.blockId) {
                    const newDot = e.target;
                    const newDotPos = newDot.getAbsolutePosition();
                    // Draw wire from rewireStartPoint to newDot
                    const start = this.rewireStartPoint;
                    const end = newDotPos;
                    const midX = end.x;
                    const midY = start.y;
                    const points = [
                        start.x, start.y,
                        midX, midY,
                        end.x, end.y
                    ];
                    // Create a new wire line (or update as needed)
                    const newWire = new Konva.Line({
                        points,
                        ...this.finalLineAttributes,
                    });
                    this.add(newWire);
                    // Optionally, add to wires data structure
                    if (!this.wires[newDot.blockId]) this.wires[newDot.blockId] = [];
                    this.wires[newDot.blockId].push({
                        line: newWire,
                        startDot: null,
                        startDotPos: start,
                        endDot: newDot,
                        endDotPos: end,
                        startBlockId: null,
                        endBlockId: newDot.blockId
                    });
                    newWire.draw();
                }
                // Cleanup
                this.rewireTempLine.destroy();
                this.rewireTempLine = null;
                this.rewireWireObj = null;
                this.rewireActive = false;
                this.rewireStartPoint = null;
                this.batchDraw();
            }
        });
    }

    startWire(dot, blockId) {
        this.isDrawing = true;
        this.startDot = dot;
        this.startDotPos = this.startDot.getAbsolutePosition();
        this.startBlockId = blockId;
        this.tempLine = new Konva.Line({
            points: [this.startDotPos.x, this.startDotPos.y, this.startDotPos.x, this.startDotPos.y] ,
            ...this.tempLineAttributes,
        });
        this.add(this.tempLine);
    }

    updateWire() {
        if (!this.isDrawing) return;
        const pos = this.stage.getPointerPosition();
        // Make sure tempLine is not blocking pointer events
        this.tempLine.listening(false);
        // this.tempLine.points([this.startDotPos.x, this.startDotPos.y, pos.x, pos.y]);
        // this.batchDraw();
        if (!pos) return;
        const dx = Math.abs(pos.x - this.startDotPos.x);
        const dy = Math.abs(pos.y - this.startDotPos.y);

        // Choose the axis with the larger distance for the "elbow"
        let midPoint;
        if (dx > dy) {
            // Horizontal first, then vertical
            midPoint = { x: pos.x, y: this.startDotPos.y };
        } else {
            // Vertical first, then horizontal
            midPoint = { x: this.startDotPos.x, y: pos.y };
        }

        this.tempLine.points([
            this.startDotPos.x, this.startDotPos.y,
            midPoint.x, midPoint.y,
            pos.x, pos.y
        ]);
        this.batchDraw();
    }

    endWire(dot, blockId) {
        if (!this.isDrawing) return;

        let pos = dot.getAbsolutePosition();
        //this.tempLine.points([this.startDotPos.x, this.startDotPos.y, pos.x, pos.y]);
        const midX = (this.startDotPos.x + pos.x) / 2;
        const midY = (this.startDotPos.y + pos.y) / 2;

        // Create a path with two right angle elbows at the midpoints
        const points = [
            this.startDotPos.x, this.startDotPos.y,
            midX, this.startDotPos.y,
            midX, pos.y,
            pos.x, pos.y
        ];

        this.tempLine.points(points);
        this.tempLine.setAttrs(this.finalLineAttributes);
        this.tempLine.draw(); // Ensure the attributes are rendered
        this.tempLine.listening(true);
        this.batchDraw();
        if (!this.wires[blockId]) this.wires[blockId] = [];
        const wireObj =  {
            startDot: this.startDot,
            endDot: dot,
            startDotPos: this.startDotPos,
            endDotPos: pos,
            startBlockId: this.startBlockId,
            endBlockId: blockId,
            line: this.tempLine,
        };
        this.wires[blockId].push(wireObj);
        this.tempLine = null;
        this.isDrawing = false;
        this.startDot.addWire(wireObj);
        dot.addWire(wireObj);

    }

    cancelWire() {
        if (this.tempLine) {
            this.tempLine.destroy();
            this.tempLine = null;
        }
        this.isDrawing = false;
    }

    updateWireOnDrag(blockId, dots) {
        dots.forEach(dot => {
            if (!dot.wires) return;
            dot.wires.forEach(wireObj => {
                // Update the start or end dot depending on which block this is
                let start, end;
                if (wireObj.startBlockId === blockId) {
                    wireObj.startDotPos = dot.getAbsolutePosition();
                }
                if (wireObj.endBlockId === blockId) {
                    wireObj.endDotPos = dot.getAbsolutePosition();
                }
                start = wireObj.startDotPos;
                end = wireObj.endDotPos;
                // Recalculate midpoints for elbow wire
                const midX = (start.x + end.x) / 2;
                const points = [
                    start.x, start.y,
                    midX, start.y,
                    midX, end.y,
                    end.x, end.y
                ];
                wireObj.line.points(points);
                if (wireObj.line.batchDraw) wireObj.line.batchDraw();
            });
        });

    }

    // Utility to find wireObj by Konva.Line
    findWireObjByLine(line) {
        for (const blockId in this.wires) {
            for (const wireObj of this.wires[blockId]) {
                if (wireObj.line === line) return wireObj;
            }
        }
        return null;
    }
}

// Utility for distance
function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
