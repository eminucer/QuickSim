import { stage, wire } from './main.js';
import { Dot } from './Dot.js';

export class Blocks extends Konva.Layer {
    static id = 0;
    constructor(params = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: 'lightblue',
        text: 'Block',
        fontSize: 16,
        textColor: 'black',
        draggable: true,
    }) {

    super();

    this.id = Blocks.id;
    Blocks.id ++;

    const shapeGroup = new Konva.Group({
        x: params.x,
        y: params.y,
        draggable: params.draggable,
    });

    const block = new Konva.Rect({
        x: 0,
        y: 0,
        width: params.width,
        height: params.height,
        fill: params.color,
        stroke: 'black',
        strokeWidth: 2,
        cornerRadius: 10,
    });

    shapeGroup.add(block);

    this.dots = [
        new Dot(this, { x: 0, y: params.height / 2, radius: 5, fill: 'black' }), // Left center
        new Dot(this, { x: params.width, y: params.height / 2, radius: 5, fill: 'black' }), // Right center
    ];

    this.isDrawing = false;
    this.currentLine = null;
    this.startDot = null;
    this.tempLine = null;

    stage.on('pointermove', () => {
        wire.updateWire();
    });

    stage.on('contextmenu', (e) => {
        e.evt.preventDefault();
        console.log('Right click detected on stage');
        wire.cancelWire();
        // You can add custom right-click logic for the stage here
    });


    for (const dot of this.dots) {
        shapeGroup.add(dot);
    }

    this.addText = (text, fontSize = 16, color = 'black') => {
        if (this.textNode) {
            this.textNode.text(text);
            return;
        }
        this.textNode = new Konva.Text({
            x: params.width / 2,
            y: params.height / 2,
            text: text,
            fontSize: fontSize,
            fill: color,
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle',
            width: params.width,
            height: params.height,
            offsetX: params.width / 2,
            offsetY: params.height / 2,
        });
        shapeGroup.add(this.textNode);
    };

    this.onBlockMove = null;

    shapeGroup.on('dragmove', (e) => {
        // Redraw wires connected to this block's dots
        console.log('Block is being dragged');
        wire.updateWireOnDrag(this.id, this.dots);
    });

    this.addText(params.text, params.fontSize, params.textColor);
    this.add(shapeGroup);

    }
}
