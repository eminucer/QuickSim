import { stage } from './main.js';
import { wire } from './Wire.js';

export class Blocks extends Konva.Layer {
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

    const dots = [
        { x: 0, y: params.height / 2 }, // Left center
        { x: params.width, y: params.height / 2 }, // Right center
        // { x: params.width / 2, y: 0 }, // Top center
        // { x: params.width / 2, y: params.height }, // Bottom center
    ];

    this.isDrawing = false;
    this.currentLine = null;
    this.startDot = null;
    this.tempLine = null;

    this.dots = [];


    for (const dotPos of dots) {
        const dot = new Konva.Circle({
            x: dotPos.x,
            y: dotPos.y,
            radius: 5,
            fill: 'black',
            stroke: 'white',
            strokeWidth: 1,
        });

        dot.on('pointerover', () => {
            dot.fill('blue');
            dot.stroke('black');
        });

        dot.on('pointerout', () => {
            dot.fill('black');
            dot.stroke('white');
        });

        dot.on('mousedown touchstart', (e) => {
            // Prevent drag from starting
        e.cancelBubble = true;
        });

        dot.on('pointerdown', (e) => {
            e.cancelBubble = false; // Allow event to bubble up
            console.log('Dot clicked');
            // Allow wire actions to apply to dots of any Blocks instance
            if (wire.isDrawing && wire.startDot !== dot) {
                wire.endWire(dot);
                console.log('isDrawing is true, ending wire');
                return;
            } else {
                wire.startWire(dot);
            }
        });

        stage.on('pointermove', () => {
            wire.updateWire();
        });

        dot.on('contextmenu', (e) => {
            e.evt.preventDefault();
            console.log('Right click detected on dot');
            wire.cancelWire();
            // You can add custom right-click logic here
        });

        stage.on('contextmenu', (e) => {
            e.evt.preventDefault();
            console.log('Right click detected on stage');
            wire.cancelWire();
            // You can add custom right-click logic for the stage here
        });

        // Defer dot interaction setup until layer is added to the stage
        shapeGroup.add(dot);
        this.dots.push(dot);
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
    });

    this.addText(params.text, params.fontSize, params.textColor);
    this.add(shapeGroup);

    }
}
