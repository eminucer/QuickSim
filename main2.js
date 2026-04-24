import { stage } from "./components/Stage/stageSetup.js";
import { Stage }           from "./components/Stage/Stage.js";
import { BlockAdd }        from "./components/Block/BlockAdd.js";
import { BlockMultiply }   from "./components/Block/BlockMultiply.js";
import { BlockDivide }     from "./components/Block/BlockDivide.js";
import { BlockGain }       from "./components/Block/BlockGain.js";
import { BlockSqrt }       from "./components/Block/BlockSqrt.js";
import { BlockAbs }        from "./components/Block/BlockAbs.js";
import { BlockExp }        from "./components/Block/BlockExp.js";
import { BlockLog }        from "./components/Block/BlockLog.js";
import { BlockLog10 }      from "./components/Block/BlockLog10.js";
import { BlockSin }        from "./components/Block/BlockSin.js";
import { BlockCos }        from "./components/Block/BlockCos.js";
import { BlockTan }        from "./components/Block/BlockTan.js";
import { BlockAsin }       from "./components/Block/BlockAsin.js";
import { BlockAcos }       from "./components/Block/BlockAcos.js";
import { BlockAtan }       from "./components/Block/BlockAtan.js";
import { BlockPower }      from "./components/Block/BlockPower.js";
import { BlockMod }        from "./components/Block/BlockMod.js";
import { BlockFunction }   from "./components/Block/BlockFunction.js";
import { BlockIntegrator }       from "./components/Block/BlockIntegrator.js";
import { BlockDifferentiator }   from "./components/Block/BlockDifferentiator.js";
import { BlockDelay }            from "./components/Block/BlockDelay.js";
import { BlockODE }              from "./components/Block/BlockODE.js";
import { BlockStateSpace }       from "./components/Block/BlockStateSpace.js";
import { BlockRateLimiter }      from "./components/Block/BlockRateLimiter.js";
import { BlockPID }              from "./components/Block/BlockPID.js";
import { BlockTransferFunction } from "./components/Block/BlockTransferFunction.js";
import { BlockLPF }              from "./components/Block/BlockLPF.js";
import { BlockHPF }              from "./components/Block/BlockHPF.js";
import { BlockConstant }   from "./components/Block/BlockConstant.js";
import { BlockStep }       from "./components/Block/BlockStep.js";
import { BlockSinusoidal } from "./components/Block/BlockSinusoidal.js";
import { BlockRamp }       from "./components/Block/BlockRamp.js";
import { BlockTriangle }   from "./components/Block/BlockTriangle.js";
import { BlockPulse }      from "./components/Block/BlockPulse.js";
import { BlockSquare }     from "./components/Block/BlockSquare.js";
import { BlockClock }      from "./components/Block/BlockClock.js";
import { BlockSawtooth }   from "./components/Block/BlockSawtooth.js";
import { BlockDisplay }    from "./components/Block/BlockDisplay.js";
import { BlockSubmodel }   from "./components/Block/BlockSubmodel.js";
import { BlockInport }     from "./components/Block/BlockInport.js";
import { BlockOutport }    from "./components/Block/BlockOutport.js";
import { BlockMux }        from "./components/Block/BlockMux.js";
import { BlockDemux }      from "./components/Block/BlockDemux.js";
import { WireSegment }     from "./components/Wire/WireSegment.js";

/* ─────────────────────────────────────────
   Palette block catalogue
───────────────────────────────────────── */
const CATALOGUE = [
    { label: 'Sources', items: [
        { Class: BlockConstant,  name: 'Constant',    type: 'Source' },
        { Class: BlockStep,      name: 'Unit Step',   type: 'Source' },
        { Class: BlockRamp,      name: 'Ramp',        type: 'Source' },
        { Class: BlockSinusoidal,name: 'Sinusoidal',  type: 'Source' },
        { Class: BlockTriangle,  name: 'Triangle',    type: 'Source' },
        { Class: BlockSquare,    name: 'Square Wave', type: 'Source' },
        { Class: BlockSawtooth,  name: 'Sawtooth',    type: 'Source' },
        { Class: BlockPulse,     name: 'Pulse',       type: 'Source' },
        { Class: BlockClock,     name: 'Clock',       type: 'Source' },
    ]},
    { label: 'Algebraic', items: [
        { Class: BlockAdd,      name: 'Add',      type: 'Algebraic' },
        { Class: BlockMultiply, name: 'Multiply', type: 'Algebraic' },
        { Class: BlockDivide,   name: 'Divide',   type: 'Algebraic' },
        { Class: BlockGain,     name: 'Gain',     type: 'Algebraic' },
        { Class: BlockAbs,      name: 'Abs',      type: 'Algebraic' },
        { Class: BlockSqrt,     name: 'Sqrt',     type: 'Algebraic' },
        { Class: BlockExp,      name: 'Exp',      type: 'Algebraic' },
        { Class: BlockLog,      name: 'Log',      type: 'Algebraic' },
        { Class: BlockLog10,    name: 'Log10',    type: 'Algebraic' },
        { Class: BlockPower,    name: 'Power',    type: 'Algebraic' },
        { Class: BlockMod,      name: 'Mod',      type: 'Algebraic' },
        { Class: BlockSin,      name: 'Sin',      type: 'Algebraic' },
        { Class: BlockCos,      name: 'Cos',      type: 'Algebraic' },
        { Class: BlockTan,      name: 'Tan',      type: 'Algebraic' },
        { Class: BlockAsin,     name: 'Asin',     type: 'Algebraic' },
        { Class: BlockAcos,     name: 'Acos',     type: 'Algebraic' },
        { Class: BlockAtan,     name: 'Atan',     type: 'Algebraic' },
        { Class: BlockFunction, name: 'Function', type: 'Algebraic' },
    ]},
    { label: 'Dynamics', items: [
        { Class: BlockIntegrator,      name: 'Integrator',       type: 'Dynamic' },
        { Class: BlockDifferentiator,  name: 'Differentiator',   type: 'Dynamic' },
        { Class: BlockDelay,           name: 'Delay',            type: 'Dynamic' },
        { Class: BlockTransferFunction,name: 'TransferFunction', type: 'Dynamic' },
        { Class: BlockStateSpace,      name: 'StateSpace',       type: 'Dynamic' },
        { Class: BlockODE,             name: 'ODE',              type: 'Dynamic' },
        { Class: BlockPID,             name: 'PID',              type: 'Dynamic' },
        { Class: BlockLPF,             name: 'LPF',              type: 'Dynamic' },
        { Class: BlockHPF,             name: 'HPF',              type: 'Dynamic' },
        { Class: BlockRateLimiter,     name: 'RateLimiter',      type: 'Dynamic' },
    ]},
    { label: 'Sinks', items: [
        { Class: BlockDisplay,   name: 'Display',    type: 'Sink' },
    ]},
    { label: 'Routing', items: [
        { Class: BlockMux,   name: 'Mux',   type: 'Routing' },
        { Class: BlockDemux, name: 'Demux', type: 'Routing' },
    ]},
    { label: 'Ports', items: [
        { Class: BlockInport,  name: 'Inport',  type: 'Submodel only' },
        { Class: BlockOutport, name: 'Outport', type: 'Submodel only' },
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
        const templateBlock = new Class(fakeStage, { pos: { x: 8, y: 8 } });
        fakeStage.add(templateBlock);
        hiddenLayer.draw();

        const box = templateBlock.renderer.getClientRect({ relativeTo: hiddenLayer });
        const url = templateBlock.renderer.toDataURL({
            pixelRatio: 2,
            x:     box.x - 3,
            y:     box.y - 3,
            width: box.width  + 6,
            height: box.height + 6,
        });

        templateBlock.renderer.destroy();
        hiddenLayer.draw();

        const paletteItem = buildPaletteItem(url, name, type);
        itemsEl.appendChild(paletteItem);
    });
});

/* ─────────────────────────────────────────
   Palette search
───────────────────────────────────────── */
// Build a flat index of every palette item for O(n) filtering
const paletteIndex = [];
paletteEl.querySelectorAll('.palette-category').forEach(catEl => {
    catEl.querySelectorAll('.palette-item').forEach(itemEl => {
        paletteIndex.push({
            el:    itemEl,
            name:  itemEl.dataset.blockType.toLowerCase(),
            catEl,
        });
    });
});

const searchInput    = document.getElementById('palette-search');
const searchClear    = document.getElementById('palette-search-clear');
const noResultsEl    = document.getElementById('palette-no-results');
const noResultsQuery = document.getElementById('no-results-query');

function filterPalette(raw) {
    const q = raw.trim().toLowerCase();

    searchClear.style.display = raw.length ? 'block' : 'none';

    if (!q) {
        paletteIndex.forEach(({ el, catEl }) => {
            el.style.display  = '';
            catEl.style.display = '';
        });
        noResultsEl.style.display = 'none';
        return;
    }

    // Track which categories have at least one visible item
    const catHasMatch = new Map();
    let anyMatch = false;

    paletteIndex.forEach(({ el, name, catEl }) => {
        const match = name.includes(q);
        el.style.display = match ? '' : 'none';
        if (match) {
            anyMatch = true;
            catHasMatch.set(catEl, true);
        } else if (!catHasMatch.has(catEl)) {
            catHasMatch.set(catEl, false);
        }
    });

    catHasMatch.forEach((visible, catEl) => {
        catEl.style.display = visible ? '' : 'none';
    });

    noResultsEl.style.display      = anyMatch ? 'none' : 'block';
    noResultsQuery.textContent = `"${raw.trim()}"`;
}

searchInput.addEventListener('input', () => filterPalette(searchInput.value));

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    filterPalette('');
    searchInput.focus();
});

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        filterPalette('');
    }
});

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
const toastEl = document.getElementById('toast');
let _toastTimer = null;

function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2600);
}

/* ─────────────────────────────────────────
   Drag & drop from palette to canvas
───────────────────────────────────────── */
let dragType = null;

paletteEl.addEventListener('dragstart', e => {
    const item = e.target.closest('.palette-item');
    if (item) dragType = item.dataset.blockType;
});

paletteEl.addEventListener('dragend', () => { dragType = null; });

const workspacesEl = document.getElementById('workspaces');
workspacesEl.addEventListener('dragover', e => e.preventDefault());

workspacesEl.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragType || !BLOCK_CLASS_MAP[dragType]) return;

    const isInport  = dragType === 'Inport';
    const isOutport = dragType === 'Outport';
    const isPortBlock = isInport || isOutport;

    // Port blocks are submodel-only
    if (isPortBlock && activeTabId === 'main') {
        showToast('In/Out blocks can only be placed inside a submodel');
        dragType = null;
        return;
    }

    const activeStage = activeTabId === 'main'
        ? stage
        : submodelRegistry.get(activeTabId)?.subStage;
    if (!activeStage) { dragType = null; return; }

    // Enforce one Inport / one Outport per submodel
    if (isPortBlock) {
        const duplicate = activeStage.blocks.some(b =>
            isInport ? b instanceof BlockInport : b instanceof BlockOutport
        );
        if (duplicate) {
            showToast(`This submodel already has an ${isInport ? 'In' : 'Out'} block`);
            dragType = null;
            return;
        }
    }

    const rect = workspacesEl.getBoundingClientRect();
    const worldPos = activeStage.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
    );

    const BlockClass = BLOCK_CLASS_MAP[dragType];
    const block = new BlockClass(activeStage, { pos: worldPos });
    activeStage.add(block);

    // Link port block to its parent submodel and add the corresponding port
    if (isPortBlock) {
        const entry = submodelRegistry.get(activeTabId);
        if (entry?.submodelBlock) {
            block.parentSubmodelBlock = entry.submodelBlock;
            syncSubmodelPorts(entry.submodelBlock, isInport ? 'input' : 'output', 1);
        }
    }

    dragType = null;
});

/* ─────────────────────────────────────────
   Keyboard shortcuts
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;

    if (e.code === 'Escape') {
        const activeStage = activeTabId === 'main'
            ? stage
            : submodelRegistry.get(activeTabId)?.subStage;
        const activeTempWire = activeStage?.tempWire;
        if (activeTempWire?.isDrawing()) activeTempWire.renderer.cancelDraw();
        activeStage?.deselectAll();
    }
});

/* ─────────────────────────────────────────
   Toolbar buttons
───────────────────────────────────────── */
document.getElementById('btn-fit').addEventListener('click', () => stage.fitToScreen());
document.getElementById('btn-reset-zoom').addEventListener('click', () => stage.resetZoom());
document.getElementById('btn-rotate').addEventListener('click', () => stage.rotateSelected());
document.getElementById('btn-delete').addEventListener('click', () => stage.deleteSelected());

// Route Delete/Backspace to whichever stage is currently visible
document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.code !== 'Delete' && e.code !== 'Backspace') return;
    e.preventDefault();
    if (activeTabId === 'main') {
        stage.deleteSelected();
    } else {
        const entry = submodelRegistry.get(activeTabId);
        if (entry) entry.subStage.deleteSelected();
    }
});

/* ─────────────────────────────────────────
   Tab management
───────────────────────────────────────── */
let activeTabId = 'main';
// blockId → { tabEl, workspaceEl, subStage }
const submodelRegistry = new Map();

const tabBar = document.getElementById('tab-bar');

document.querySelector('#tab-bar .tab[data-id="main"]').addEventListener('click', () => {
    switchToTab('main');
});

function switchToTab(id) {
    activeTabId = id;

    document.querySelectorAll('#tab-bar .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.workspace-canvas').forEach(w => w.classList.add('hidden'));

    if (id === 'main') {
        document.querySelector('#tab-bar .tab[data-id="main"]').classList.add('active');
        document.getElementById('workspace').classList.remove('hidden');
    } else {
        // Leaving the main canvas — clear its selection so the Delete key
        // doesn't accidentally target the outer submodel block.
        stage.deselectAll();
        const entry = submodelRegistry.get(id);
        if (!entry) return;
        entry.tabEl.classList.add('active');
        entry.workspaceEl.classList.remove('hidden');
        // Ensure the submodel stage fills the container
        entry.subStage.stage.width(window.innerWidth);
        entry.subStage.stage.height(window.innerHeight);
        entry.subStage.stage.batchDraw();
    }
}

function openSubmodelTab(block) {
    const id = block.id;

    if (submodelRegistry.has(id)) {
        // Tab was closed but registry entry persists — re-add the tab
        const entry = submodelRegistry.get(id);
        if (!entry.tabEl.isConnected) {
            tabBar.appendChild(entry.tabEl);
        }
        switchToTab(id);
        return;
    }

    // Create workspace container
    const wsEl = document.createElement('div');
    wsEl.className = 'workspace-canvas hidden';
    wsEl.id = `ws-sub-${id}`;
    workspacesEl.appendChild(wsEl);

    // Create submodel Stage (no keyboard handler — main stage handles keys)
    const subStage = new Stage(`ws-sub-${id}`, { noKeyboard: true, noResize: true });

    // Give the submodel stage its own tempWire so port clicks draw on this stage
    const subTempWire = new WireSegment(subStage);
    subStage.wireLayer.add(subTempWire.renderer);
    subStage.tempWire = subTempWire;

    // Populate with internal blocks and wires
    populateSubmodelStage(subStage, block.internalData);

    // Link inport/outport blocks to their parent submodel block so that
    // deleting a port block can remove the corresponding external port
    subStage.blocks.forEach(b => {
        if (b instanceof BlockInport || b instanceof BlockOutport) {
            b.parentSubmodelBlock = block;
        }
    });

    // Create tab element
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.dataset.id = id;
    tabEl.innerHTML = `<span>${block.label || 'Submodel'}</span><span class="tab-close" title="Close">×</span>`;
    tabEl.querySelector('.tab-close').addEventListener('click', e => {
        e.stopPropagation();
        closeSubmodelTab(id);
    });
    tabEl.addEventListener('click', () => switchToTab(id));
    tabBar.appendChild(tabEl);

    submodelRegistry.set(id, { tabEl, workspaceEl: wsEl, subStage, submodelBlock: block });
    switchToTab(id);
}

function closeSubmodelTab(id) {
    const entry = submodelRegistry.get(id);
    if (!entry) return;
    entry.tabEl.remove();
    // Keep workspace and subStage alive so re-open restores state
    entry.workspaceEl.classList.add('hidden');
    if (activeTabId === id) switchToTab('main');
}

// Recursively close and destroy a submodel tab and all open nested submodel tabs
function destroySubmodelRecursive(id) {
    const entry = submodelRegistry.get(id);
    if (!entry) return;
    // Depth-first: destroy any nested submodels whose tabs were opened
    entry.subStage.blocks.forEach(block => {
        if (block instanceof BlockSubmodel) destroySubmodelRecursive(block.id);
    });
    entry.tabEl?.remove();
    entry.workspaceEl.remove();
    submodelRegistry.delete(id);
    if (activeTabId === id) switchToTab('main');
}

// Clean up when a submodel block is deleted from the canvas
document.addEventListener('submodel-destroyed', e => destroySubmodelRecursive(e.detail.id));

// Resize submodel stages when window resizes
window.addEventListener('resize', () => {
    for (const [, entry] of submodelRegistry) {
        entry.subStage.stage.width(window.innerWidth);
        entry.subStage.stage.height(window.innerHeight);
        entry.subStage.stage.batchDraw();
    }
});

/* ─────────────────────────────────────────
   Submodel open (double-click submodel block)
───────────────────────────────────────── */
document.addEventListener('submodel-open', e => openSubmodelTab(e.detail.block));

/* ─────────────────────────────────────────
   Inport / Outport deletion → update parent submodel block
───────────────────────────────────────── */
function syncSubmodelPorts(submodelBlock, type, newCount) {
    if (!submodelBlock) return;
    const ni = type === 'input'  ? newCount : submodelBlock.inputPorts.length;
    const no = type === 'output' ? newCount : submodelBlock.outputPorts.length;
    submodelBlock.resize(ni, no);
    submodelBlock.stage.blockLayer?.batchDraw();
    submodelBlock.stage.wireLayer?.batchDraw();
}

document.addEventListener('inport-deleted', e => {
    const { submodelBlock } = e.detail;
    if (submodelBlock) syncSubmodelPorts(submodelBlock, 'input', 0);
});

document.addEventListener('outport-deleted', e => {
    const { submodelBlock } = e.detail;
    if (submodelBlock) syncSubmodelPorts(submodelBlock, 'output', 0);
});

/* ─────────────────────────────────────────
   Submodel internals: serialize / deserialize
───────────────────────────────────────── */
function serializeInternals(blocks, wires) {
    const bIdx = new Map(blocks.map((b, i) => [b, i]));

    const blockData = blocks.map(b => ({
        Class:        b.constructor,
        pos:          { x: b.renderer.x(), y: b.renderer.y() },
        label:        b.label,
        numOfPorts:   [...b.numOfPorts],
        internalData: b.internalData ?? null,
        portIndex:    b.portIndex ?? null,
    }));

    const wireData = wires.flatMap(wire => {
        const findRef = cp => {
            if (!cp?.owner || !bIdx.has(cp.owner)) return null;
            const bi = bIdx.get(cp.owner);
            const ii = cp.owner.inputPorts.indexOf(cp);
            if (ii >= 0) return { bi, pt: 'input',  pi: ii };
            const oi = cp.owner.outputPorts.indexOf(cp);
            if (oi >= 0) return { bi, pt: 'output', pi: oi };
            return null;
        };
        const s = findRef(wire.cps.start);
        const e = findRef(wire.cps.end);
        return (s && e) ? [{ s, e }] : [];
    });

    return { blockData, wireData };
}

function populateSubmodelStage(subStage, data) {
    if (!data) return;
    const { blockData, wireData } = data;

    const blocks = blockData.map(bd => {
        const block = new bd.Class(subStage, { pos: bd.pos, portIndex: bd.portIndex ?? 0 });
        // Restore label if it differs from the constructor default
        if (block.label !== bd.label && block.renderer.label) {
            block.label = bd.label;
            block.renderer.label.text(bd.label);
        }
        // Restore port count for configurable blocks (Add, Multiply, etc.)
        const [ni, no] = bd.numOfPorts;
        if (block.numOfPorts[0] !== ni || block.numOfPorts[1] !== no) {
            block.resize(ni, no);
        }
        // Restore nested submodel contents
        if (bd.internalData != null) block.internalData = bd.internalData;
        return block;
    });

    blocks.forEach(b => subStage.add(b));

    wireData.forEach(wd => {
        const sb = blocks[wd.s.bi];
        const eb = blocks[wd.e.bi];
        if (!sb || !eb) return;
        const sPort = wd.s.pt === 'input' ? sb.inputPorts[wd.s.pi] : sb.outputPorts[wd.s.pi];
        const ePort = wd.e.pt === 'input' ? eb.inputPorts[wd.e.pi] : eb.outputPorts[wd.e.pi];
        if (!sPort || !ePort || sPort.isConnected || ePort.isConnected) return;

        const wire = new WireSegment(subStage);
        subStage.wireLayer.add(wire.renderer);
        wire.renderer.connect2WithVisual(sPort, ePort);
    });

    subStage.blockLayer.batchDraw();
    subStage.wireLayer.batchDraw();
}

/* ─────────────────────────────────────────
   Make Submodel
───────────────────────────────────────── */
let submodelCounter = 0;

function makeSubmodel() {
    // Operate on whichever stage is currently visible
    const activeStage = activeTabId === 'main'
        ? stage
        : (submodelRegistry.get(activeTabId)?.subStage ?? stage);

    // Use all selected blocks on the active stage, or fall back to the right-clicked block
    const selected = activeStage.selectedItems.filter(item => item.inputPorts != null);
    const targets  = selected.length > 0 ? selected : (contextMenuBlock ? [contextMenuBlock] : []);
    if (targets.length === 0) return;

    const blockSet = new Set(targets);

    // Classify each boundary wire as input (signal coming IN) or output (going OUT)
    const inputConns  = []; // { externalCP, internalPort, wire }
    const outputConns = []; // { internalPort, externalCP, wire }
    const internalWireSet = new Set();

    targets.forEach(block => {
        [...block.inputPorts, ...block.outputPorts].forEach(port => {
            const wire = port.wire;
            if (!wire) return;
            const other = wire.cps.start === port ? wire.cps.end : wire.cps.start;
            if (!other) return;
            const isInternal = other.owner != null && blockSet.has(other.owner);
            if (isInternal) {
                internalWireSet.add(wire);
            } else if (port.params.type === 'input') {
                inputConns.push({ externalCP: other, internalPort: port, wire });
            } else {
                outputConns.push({ internalPort: port, externalCP: other, wire });
            }
        });
    });

    // Compute bounding-box center for submodel placement
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targets.forEach(b => {
        minX = Math.min(minX, b.renderer.x());
        minY = Math.min(minY, b.renderer.y());
        maxX = Math.max(maxX, b.renderer.x() + b.size.width);
        maxY = Math.max(maxY, b.renderer.y() + b.size.height);
    });

    // Capture internal state before deletion
    const internalData = serializeInternals(targets, [...internalWireSet]);

    // Add one Inport block (N outputs) and one Outport block (M inputs)
    const numIn  = inputConns.length;
    const numOut = outputConns.length;
    const centerY = (minY + maxY) / 2;

    if (numIn > 0) {
        const inportBi = internalData.blockData.length;
        internalData.blockData.push({
            Class:        BlockInport,
            pos:          { x: minX - 120, y: centerY - Math.max(40, numIn * 20) / 2 },
            label:        'In',
            numOfPorts:   [0, numIn],
            portIndex:    null,
            internalData: null,
        });
        inputConns.forEach((conn, i) => {
            const targetIdx = targets.indexOf(conn.internalPort.owner);
            const portIdx   = conn.internalPort.owner.inputPorts.indexOf(conn.internalPort);
            internalData.wireData.push({
                s: { bi: inportBi,  pt: 'output', pi: i },
                e: { bi: targetIdx, pt: 'input',  pi: portIdx },
            });
        });
    }

    if (numOut > 0) {
        const outportBi = internalData.blockData.length;
        internalData.blockData.push({
            Class:        BlockOutport,
            pos:          { x: maxX + 50, y: centerY - Math.max(40, numOut * 20) / 2 },
            label:        'Out',
            numOfPorts:   [numOut, 0],
            portIndex:    null,
            internalData: null,
        });
        outputConns.forEach((conn, i) => {
            const targetIdx = targets.indexOf(conn.internalPort.owner);
            const portIdx   = conn.internalPort.owner.outputPorts.indexOf(conn.internalPort);
            internalData.wireData.push({
                s: { bi: targetIdx, pt: 'output', pi: portIdx },
                e: { bi: outportBi, pt: 'input',  pi: i },
            });
        });
    }

    // Protect boundary wires: null out the internal-side port reference so
    // block.delete() won't destroy these wires (we'll re-route them below)
    [...inputConns, ...outputConns].forEach(conn => {
        conn.internalPort.wire        = null;
        conn.internalPort.isConnected = false;
    });

    // Delete selected blocks (cleans up internal wires + removes from active stage)
    activeStage.deselectAll();
    [...targets].forEach(b => b.delete());

    // Create the submodel block at the bounding-box center
    const subH   = Math.max(60, Math.max(numIn, numOut, 1) * 24 + 16);
    const subPos = {
        x: Math.round((minX + maxX) / 2 - 45),
        y: Math.round((minY + maxY) / 2 - subH / 2),
    };

    const submodel = new BlockSubmodel(activeStage, {
        numInputs:    numIn,
        numOutputs:   numOut,
        pos:          subPos,
        internalData,
        label:        `Sub ${++submodelCounter}`,
    });
    activeStage.add(submodel);

    // Re-route boundary wires: swap the internal port endpoint to the submodel port
    inputConns.forEach(({ externalCP, internalPort, wire }, i) => {
        if (wire.cps.start === internalPort) wire.cps.start = submodel.inputPorts[i];
        else                                 wire.cps.end   = submodel.inputPorts[i];
        submodel.inputPorts[i].wire        = wire;
        submodel.inputPorts[i].isConnected = true;
        wire.renderer.updateOnDrag(externalCP);
    });

    outputConns.forEach(({ internalPort, externalCP, wire }, i) => {
        if (wire.cps.start === internalPort) wire.cps.start = submodel.outputPorts[i];
        else                                 wire.cps.end   = submodel.outputPorts[i];
        submodel.outputPorts[i].wire        = wire;
        submodel.outputPorts[i].isConnected = true;
        wire.renderer.updateOnDrag(externalCP);
    });

    activeStage.blockLayer.batchDraw();
    activeStage.wireLayer.batchDraw();
}

/* ─────────────────────────────────────────
   Block context menu
───────────────────────────────────────── */
const contextMenu = document.getElementById('context-menu');
let contextMenuBlock = null;

const portCountSection = document.getElementById('ctx-port-count-section');
const portCountLabel   = document.getElementById('ctx-port-count-label');
const countValueInput  = document.getElementById('ctx-count-value');
const countDecBtn      = document.getElementById('ctx-count-dec');
const countIncBtn      = document.getElementById('ctx-count-inc');

function applyPortCount(count) {
    if (!contextMenuBlock) return;
    count = Math.max(2, Math.min(20, count));
    if (contextMenuBlock instanceof BlockMux) {
        contextMenuBlock.resize(count, 1);
    } else if (contextMenuBlock instanceof BlockDemux) {
        contextMenuBlock.resize(1, count);
    }
    syncStepperState(count);
}

function syncStepperState(count) {
    countValueInput.value = count;
    countDecBtn.disabled  = count <= 2;
    countIncBtn.disabled  = count >= 20;
}

countDecBtn.addEventListener('click', e => {
    e.stopPropagation();
    applyPortCount(parseInt(countValueInput.value) - 1);
});

countIncBtn.addEventListener('click', e => {
    e.stopPropagation();
    applyPortCount(parseInt(countValueInput.value) + 1);
});

countValueInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.stopPropagation();
        applyPortCount(parseInt(countValueInput.value));
        contextMenu.classList.remove('visible');
        contextMenuBlock = null;
    }
});

// Prevent the document click-to-close handler from firing on stepper interactions
countValueInput.addEventListener('click', e => e.stopPropagation());

document.addEventListener('block-contextmenu', e => {
    contextMenuBlock = e.detail.block;

    if (contextMenuBlock instanceof BlockMux) {
        portCountLabel.textContent = 'Input count';
        portCountSection.style.display = 'block';
        syncStepperState(contextMenuBlock.numOfPorts[0]);
    } else if (contextMenuBlock instanceof BlockDemux) {
        portCountLabel.textContent = 'Output count';
        portCountSection.style.display = 'block';
        syncStepperState(contextMenuBlock.numOfPorts[1]);
    } else {
        portCountSection.style.display = 'none';
    }

    contextMenu.style.left = e.detail.x + 'px';
    contextMenu.style.top  = e.detail.y + 'px';
    contextMenu.classList.add('visible');
    if (portCountSection.style.display !== 'none') countValueInput.focus();
});

document.getElementById('ctx-rotate').addEventListener('click', () => {
    if (contextMenuBlock) contextMenuBlock.rotate();
    contextMenu.classList.remove('visible');
});

document.getElementById('ctx-make-submodel').addEventListener('click', () => {
    makeSubmodel();
    contextMenu.classList.remove('visible');
    contextMenuBlock = null;
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

/* ─────────────────────────────────────────
   Block properties dialog (double-click)
───────────────────────────────────────── */
const blockDialog  = document.getElementById('block-dialog');
const dlgTitle     = document.getElementById('dlg-title');
const dlgInputs    = document.getElementById('dlg-inputs');
const dlgOutputs   = document.getElementById('dlg-outputs');
let   dialogBlock  = null;

function openBlockDialog(block) {
    dialogBlock = block;
    dlgTitle.textContent = block.name + ' — Port Configuration';

    if (block instanceof BlockInport) {
        // Inport only configures its output count (= submodel inputs)
        dlgInputs.value    = 0;
        dlgInputs.disabled = true;
        dlgOutputs.value   = block.numOfPorts[1];
        dlgOutputs.disabled = false;
        blockDialog.classList.add('visible');
        dlgOutputs.focus();
        dlgOutputs.select();
    } else if (block instanceof BlockOutport) {
        // Outport only configures its input count (= submodel outputs)
        dlgInputs.value    = block.numOfPorts[0];
        dlgInputs.disabled = false;
        dlgOutputs.value   = 0;
        dlgOutputs.disabled = true;
        blockDialog.classList.add('visible');
        dlgInputs.focus();
        dlgInputs.select();
    } else {
        dlgInputs.value    = block.numOfPorts[0];
        dlgInputs.disabled = false;
        dlgOutputs.value   = block.numOfPorts[1];
        dlgOutputs.disabled = false;
        blockDialog.classList.add('visible');
        dlgInputs.focus();
        dlgInputs.select();
    }
}

function closeBlockDialog() {
    blockDialog.classList.remove('visible');
    dlgInputs.disabled  = false;
    dlgOutputs.disabled = false;
    dialogBlock = null;
}

function applyBlockDialog() {
    if (!dialogBlock) return;

    if (dialogBlock instanceof BlockInport) {
        const outputs = Math.max(1, parseInt(dlgOutputs.value) || 1);
        dialogBlock.resize(0, outputs);
        syncSubmodelPorts(dialogBlock.parentSubmodelBlock, 'input', outputs);
    } else if (dialogBlock instanceof BlockOutport) {
        const inputs = Math.max(1, parseInt(dlgInputs.value) || 1);
        dialogBlock.resize(inputs, 0);
        syncSubmodelPorts(dialogBlock.parentSubmodelBlock, 'output', inputs);
    } else {
        const inputs  = Math.max(1, parseInt(dlgInputs.value)  || 1);
        const outputs = Math.max(1, parseInt(dlgOutputs.value) || 1);
        dialogBlock.resize(inputs, outputs);
    }
    closeBlockDialog();
}

document.addEventListener('block-dblclick', e => openBlockDialog(e.detail.block));

document.getElementById('dlg-ok').addEventListener('click', applyBlockDialog);
document.getElementById('dlg-cancel').addEventListener('click', closeBlockDialog);

// Close on backdrop click
blockDialog.addEventListener('click', e => {
    if (e.target === blockDialog) closeBlockDialog();
});

// Enter to confirm, Escape to cancel
blockDialog.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); applyBlockDialog(); }
    if (e.key === 'Escape') { e.preventDefault(); closeBlockDialog(); }
});
