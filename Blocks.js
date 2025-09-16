import { stage, wire } from './main.js';
import { Dot } from './Dot.js';

export class Blocks extends Konva.Group {
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
        type: 'custom',
        shape: 'rect',
    }) {
        super({
            x: params.x,
            y: params.y,
            draggable: params.draggable,
        });

        this.id = Blocks.id++;
        this.type = params.type || 'custom';
        let block;
        if (params.shape === 'circle') {
            block = new Konva.Circle({
                x: params.width / 2,
                y: params.height / 2,
                radius: Math.min(params.width, params.height) / 2,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
            });
            this.add(circle);
        } else if (params.shape === 'triangle') {
            block = new Konva.RegularPolygon({
                x: params.width / 2,
                y: params.height / 2,
                sides: 3,
                radius: Math.min(params.width, params.height) / 2,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
                rotation: 90,
            });
            this.add(block);
        } else {
            block = new Konva.Rect({
                x: 0,
                y: 0,
                width: params.width,
                height: params.height,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
                cornerRadius: 5,
            });
            this.add(block);
        }

        this.dots = [
            new Dot(this, { x: 0, y: params.height / 2, radius: 5, fill: 'black' }),
            new Dot(this, { x: params.width, y: params.height / 2, radius: 5, fill: 'black' }),
        ];

        // this.dots = [
        //     new Dot(this, { x: params.width / 3, y: params.height / 2, radius: 5, fill: 'black' }),
        //     new Dot(this, { x: params.width * 0.95, y: params.height / 2, radius: 5, fill: 'black' }),
        // ];

        this.dots.forEach(dot => this.add(dot));

        this.textNode = new Konva.Text({
            x: 0,
            y: 0,
            width: params.width,
            height: params.height,
            text: params.text,
            fontSize: params.fontSize,
            fill: params.textColor,
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle',
        });
        this.add(this.textNode);

        // Wire handling
        stage.on('pointermove', () => wire.updateWire());
        stage.on('contextmenu', (e) => {
            e.evt.preventDefault();
            wire.cancelWire();
        });

        this.on('dragmove', () => {
            wire.updateWireOnDrag(this.id, this.dots);
        });
    }
}