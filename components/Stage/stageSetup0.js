import { createGrid } from '../../Grid.js';
import { WireSegment } from '../Wire/WireSegment.js';

const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
    container: 'workspace', // Make sure you have a <div id="container"></div> in your HTML
    width,
    height,
});

const scaleBy = 1.05;

stage.on('wheel', (e) => {
  e.evt.preventDefault();

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale
  };

  const direction = e.evt.deltaY > 0 ? -1 : 1;
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale
  };

  stage.position(newPos);
  stage.batchDraw();
});

// let isPanning = false;
// let lastPos = null;

// stage.on('mousedown', (e) => {
//   if (e.evt.button === 1) { // middle mouse button
//     isPanning = true;
//     lastPos = stage.getPointerPosition();
//     stage.container().style.cursor = 'grabbing';
//   }
// });

// stage.on('mousemove', () => {
//   if (!isPanning) return;

//   const pos = stage.getPointerPosition();
//   stage.position({
//     x: stage.x() + pos.x - lastPos.x,
//     y: stage.y() + pos.y - lastPos.y
//   });

//   lastPos = pos;
//   stage.batchDraw();
// });

// stage.on('mouseup mouseleave', () => {
//   isPanning = false;
//   lastPos = null;
//   stage.container().style.cursor = 'default';
// });

const blockLayer = new Konva.Layer();
const gridLayer = new Konva.Layer();
const wireLayer = new Konva.Layer();

let selectedItems = [];

const grid = createGrid({
    width,
    height,
    cellSize: 50,   
    stroke: '#ddd',
    layer: gridLayer,
});

// Remove highlight on stage click or right click
stage.on('mousedown touchstart contextmenu', (e) => {
  // clicked on empty space
  if (e.target === stage) {
    deselectAll();
  }
});

function deselectAll(){
  //console.log("Total selected item: ", selectedItems.length);
  while(selectedItems.length > 0){
    const item = selectedItems.pop();
    item.deSelect();
    console.log("Wire ID: ", item.id, " deselected!");
  }
}

const tempWire = new WireSegment(); // TODO: Should there be another layer for wires?
wireLayer.add(tempWire.renderer);

stage.add(gridLayer);
stage.add(blockLayer);
stage.add(wireLayer);

export {stage, blockLayer, gridLayer, wireLayer, tempWire, selectedItems, deselectAll};