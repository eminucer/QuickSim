import { stage, wire } from './main.js';
import { Port } from './Port.js';

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
        name: 'block',
        numOfInputPorts: 1,
        numOfOutputPorts: 1,
        shape: 'rect',}) {
        super({
            x: params.x,
            y: params.y,
            draggable: params.draggable,
        });

        this.id = Blocks.id++;
        this.type = params.type || 'custom';
        this.name = params.name;
        this.block = null;
        const arrowSize = 10;
        if (params.shape === 'circle') {
            this.block = new Konva.Circle({
                x: params.width / 2,
                y: params.height / 2,
                radius: Math.min(params.width, params.height) / 2,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
            });
            this.add(this.block);
        } else if (params.shape === 'triangle') {
            this.block = new Konva.RegularPolygon({
                x: params.width / 2,
                y: params.height / 2,
                sides: 3,
                radius: Math.min(params.width, params.height) / 2,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
                rotation: 90,
            });
            this.add(this.block);
        } else {
            this.block = new Konva.Rect({
                x: arrowSize,
                y: 0,
                width: params.width,
                height: params.height,
                fill: params.color,
                stroke: 'black',
                strokeWidth: 2,
                cornerRadius: 5,
            });
            this.add(this.block);
        }

        // TODO: The following code should be inherited properly for each type of block, not manually added here

        this.ports = [];

        // Add input ports
        for (let i = 0; i < params.numOfInputPorts; i++) {
            const spacing = params.height / (params.numOfInputPorts + 1);
            this.ports.push(
            new Port(this, {
                x: 0,
                y: spacing * (i + 1) - arrowSize / 2,
                arrowSize,
                type: 'input'
            })
            );
        }

        // Add output ports
        for (let i = 0; i < params.numOfOutputPorts; i++) {
            const spacing = params.height / (params.numOfOutputPorts + 1);
            this.ports.push(
            new Port(this, {
                x: params.width + arrowSize / 2,
                y: spacing * (i + 1) - arrowSize / 2,
                arrowSize,
                type: 'output'
            })
            );
        }

        this.ports.forEach(port => this.add(port));

        // Add text label
        this.textNode = new Konva.Text({
            x: arrowSize,
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

        this.block.getParent().add(this.textNode);
        // Wire handling
        stage.on('pointermove', () => wire.updateWire());
        stage.on('contextmenu', (e) => {
            e.evt.preventDefault();
            wire.cancelWire();
        });

        this.on('dragmove', () => {
            wire.updateWireOnDrag(this.id, this.ports);
        });
    }
}