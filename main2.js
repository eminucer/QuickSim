import { stage, tempWire } from "./components/Stage/stageSetup.js";
import { BlockAdd }        from "./components/Block/BlockAdd.js";
import { BlockMultiply }   from "./components/Block/BlockMultiply.js";
import { BlockDivide }     from "./components/Block/BlockDivide.js";
import { BlockIntegrator } from "./components/Block/BlockIntegrator.js";
import { BlockGain }       from "./components/Block/BlockGain.js";
import { BlockConstant }   from "./components/Block/BlockConstant.js";
import { BlockStep }       from "./components/Block/BlockStep.js";
import { BlockSinusoidal } from "./components/Block/BlockSinusoidal.js";
import { BlockRamp }       from "./components/Block/BlockRamp.js";
import { BlockDisplay }    from "./components/Block/BlockDisplay.js";

/* ─────────────────────────────────────────
   Palette block catalogue
───────────────────────────────────────── */
const CATALOGUE = [
    { label: 'Sources', items: [
        { Class: BlockConstant,  name: 'Constant',   type: 'Source' },
        { Class: BlockStep,      name: 'Unit Step',  type: 'Source' },
        { Class: BlockSinusoidal,name: 'Sinusoidal', type: 'Source' },
        { Class: BlockRamp,      name: 'Ramp',       type: 'Source' },
    ]},
    { label: 'Math', items: [
        { Class: BlockAdd,       name: 'Add',        type: 'Operator' },
        { Class: BlockMultiply,  name: 'Multiply',   type: 'Operator' },
        { Class: BlockDivide,    name: 'Divide',     type: 'Operator' },
        { Class: BlockIntegrator,name: 'Integrator', type: 'Dynamic' },
        { Class: BlockGain,      name: 'Gain',       type: 'Transfer' },
    ]},
    { label: 'Sinks', items: [
        { Class: BlockDisplay,   name: 'Display',    type: 'Sink' },
    ]},
];

// Flat map for quick lookup during drop
const BLOCK_CLASS_MAP = {};
CATALOGUE.forEach(cat => cat.items.forEach(item => {
    BLOCK_CLASS_MAP[item.name] = item.Class;
}));

/* ─────────────────────────────────────────
   Hidden Konva stage for palette thumbnails
───────────────────────────────────────── */
const hiddenKonva = new Konva.Stage({
    container: 'hidden-stage',
    width: 200,
    height: 200,
});
const hiddenLayer = new Konva.Layer();
hiddenKonva.add(hiddenLayer);

// Minimal fake stage satisfying Block constructor requirements
const fakeStage = {
    stage: hiddenKonva,
    blockLayer: hiddenLayer,
    wireLayer: hiddenLayer,
    selectedItems: [],
    blocks: [],
    wires: [],
    add(item) {
        if (item && item.renderer) hiddenLayer.add(item.renderer);
    },
    draw() { hiddenLayer.batchDraw(); },
    onPointerMove() {},
    offPointerMove() {},
    getPointerPosition() { return null; },
    deselectAll() {},
    deleteSelected() {},
};

/* ─────────────────────────────────────────
   Build palette
───────────────────────────────────────── */
function buildPaletteItem(imageUrl, name, type) {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.draggable = true;
    item.dataset.blockType = name;

    const thumb = document.createElement('div');
    thumb.className = 'palette-thumb';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = name;
    thumb.appendChild(img);

    const info = document.createElement('div');
    info.className = 'palette-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'palette-name';
    nameEl.textContent = name;
    const typeEl = document.createElement('div');
    typeEl.className = 'palette-type';
    typeEl.textContent = type;
    info.appendChild(nameEl);
    info.appendChild(typeEl);

    item.appendChild(thumb);
    item.appendChild(info);
    return item;
}

const paletteEl = document.getElementById('palette');

CATALOGUE.forEach(cat => {
    const catEl = document.createElement('div');
    catEl.className = 'palette-category';

    const hdr = document.createElement('div');
    hdr.className = 'category-header';
    hdr.textContent = cat.label;
    catEl.appendChild(hdr);

    const itemsEl = document.createElement('div');
    itemsEl.className = 'palette-items';
    catEl.appendChild(itemsEl);
    paletteEl.appendChild(catEl);

    cat.items.forEach(({ Class, name, type }) => {
        // Create template block, capture, then destroy — synchronously, one at a time
        const templateBlock = new Class(fakeStage, { pos: { x: 8, y: 8 } });
        fakeStage.add(templateBlock);
        hiddenLayer.draw();

        const box = templateBlock.renderer.getClientRect({ relativeTo: hiddenLayer });

        // toDataURL without a callback returns synchronously for pure-canvas shapes
        const url = templateBlock.renderer.toDataURL({
            pixelRatio: 2,
            x:     box.x - 3,
            y:     box.y - 3,
            width: box.width  + 6,
            height: box.height + 6,
        });

        // Destroy BEFORE creating the next block so they don't overlap
        templateBlock.renderer.destroy();
        hiddenLayer.draw();

        const paletteItem = buildPaletteItem(url, name, type);
        itemsEl.appendChild(paletteItem);
    });
});

/* ─────────────────────────────────────────
   Drag & drop from palette to canvas
───────────────────────────────────────── */
let dragType = null;

paletteEl.addEventListener('dragstart', e => {
    const item = e.target.closest('.palette-item');
    if (item) dragType = item.dataset.blockType;
});

paletteEl.addEventListener('dragend', () => { dragType = null; });

const workspaceEl = document.getElementById('workspace');
workspaceEl.addEventListener('dragover', e => e.preventDefault());

workspaceEl.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragType || !BLOCK_CLASS_MAP[dragType]) return;

    const rect = workspaceEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen (canvas pixel) coords → stage world coords
    const worldPos = stage.screenToWorld(screenX, screenY);

    const BlockClass = BLOCK_CLASS_MAP[dragType];
    const block = new BlockClass(stage, { pos: worldPos });
    stage.add(block);

    dragType = null;
});

/* ─────────────────────────────────────────
   Keyboard shortcuts
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;

    if (e.code === 'Escape') {
        if (tempWire.isDrawing()) {
            tempWire.renderer.cancelDraw();
        }
        stage.deselectAll();
    }
});

/* ─────────────────────────────────────────
   Toolbar buttons
───────────────────────────────────────── */
document.getElementById('btn-fit').addEventListener('click', () => stage.fitToScreen());
document.getElementById('btn-reset-zoom').addEventListener('click', () => stage.resetZoom());
document.getElementById('btn-rotate').addEventListener('click', () => stage.rotateSelected());
document.getElementById('btn-delete').addEventListener('click', () => stage.deleteSelected());

/* ─────────────────────────────────────────
   Block context menu
───────────────────────────────────────── */
const contextMenu = document.getElementById('context-menu');
let contextMenuBlock = null;

document.addEventListener('block-contextmenu', e => {
    contextMenuBlock      = e.detail.block;
    contextMenu.style.left = e.detail.x + 'px';
    contextMenu.style.top  = e.detail.y + 'px';
    contextMenu.classList.add('visible');
});

document.getElementById('ctx-rotate').addEventListener('click', () => {
    if (contextMenuBlock) contextMenuBlock.rotate();
    contextMenu.classList.remove('visible');
});

document.getElementById('ctx-delete').addEventListener('click', () => {
    if (contextMenuBlock) {
        contextMenuBlock.delete();
        contextMenuBlock = null;
    }
    contextMenu.classList.remove('visible');
});

document.addEventListener('click', e => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.remove('visible');
        contextMenuBlock = null;
    }
});

/* ─────────────────────────────────────────
   Junction context menu
───────────────────────────────────────── */
const junctionContextMenu = document.getElementById('junction-context-menu');
let contextMenuJunction = null;

document.addEventListener('junction-contextmenu', e => {
    contextMenuJunction             = e.detail.junction;
    junctionContextMenu.style.left  = e.detail.x + 'px';
    junctionContextMenu.style.top   = e.detail.y + 'px';
    junctionContextMenu.classList.add('visible');
});

document.getElementById('ctx-junction-delete').addEventListener('click', () => {
    if (contextMenuJunction) {
        contextMenuJunction.delete();
        contextMenuJunction = null;
    }
    junctionContextMenu.classList.remove('visible');
});

document.addEventListener('click', e => {
    if (!junctionContextMenu.contains(e.target)) {
        junctionContextMenu.classList.remove('visible');
        contextMenuJunction = null;
    }
});
