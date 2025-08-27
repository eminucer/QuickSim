import { Blocks } from './Blocks.js';
import { wire } from './Wire.js';
import { createGrid } from './Grid.js';
import LeftPane from './LeftPane.js';

const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
    container: 'container', // Make sure you have a <div id="container"></div> in your HTML
    width,
    height,
});

const gridLayer = new Konva.Layer();
const grid = createGrid({
    width,
    height,
    cellSize: 50,   
    stroke: '#ddd',
    layer: gridLayer,
});

stage.add(gridLayer);

const block1 = new Blocks();
const block2 = new Blocks({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    text: 'Block 2',
    fontSize: 20,
    textColor: 'black',
    color: 'lightgreen',
    draggable: true,
});

stage.add(block1);
stage.add(block2);
stage.add(wire);

const leftPane = new LeftPane('left-pane');

export {stage};