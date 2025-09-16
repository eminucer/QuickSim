import { Blocks } from './Blocks.js';
import { Wire } from './Wire.js';
import { createGrid } from './Grid.js';
import LeftPane from './LeftPane.js';
import {blockTypes} from './BlockTypes.js';

const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
    container: 'workspace', // Make sure you have a <div id="container"></div> in your HTML
    width,
    height,
});

const gridLayer = new Konva.Layer();
const blockLayer = new Konva.Layer();

const grid = createGrid({
    width,
    height,
    cellSize: 50,   
    stroke: '#ddd',
    layer: gridLayer,
});

const leftPane = new LeftPane('hidden-stage');

stage.add(gridLayer);
stage.add(blockLayer);

// track drag
let dragType = null;

document.getElementById('palette').addEventListener('dragstart', (e) => {
    dragType = e.target.dataset.type;
});

const workspaceDiv = document.getElementById('workspace');
workspaceDiv.addEventListener('dragover', (e) => e.preventDefault());

workspaceDiv.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!dragType) return;

    const rect = workspaceDiv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let blockType = blockTypes[dragType];
    blockType.x = x;
    blockType.y = y;

    const block = new Blocks(blockType);

    blockLayer.add(block);

    dragType = null;
});

export const wire = new Wire(stage);
stage.add(wire);

export {stage};
