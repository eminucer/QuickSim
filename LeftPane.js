
import { Blocks } from './Blocks.js';
import { blockTypes } from './BlockTypes.js';

class LeftPane {
    constructor(hiddenStageId) {

        this.stage = new Konva.Stage({
            container: hiddenStageId,
            width: 200,
            height: 200,
        });

        const hiddenLayer = new Konva.Layer();
        this.stage.add(hiddenLayer);

        let blocks = [];

        for (const type in blockTypes) {
            if (blockTypes.hasOwnProperty(type)) {
                console.log('Creating block of type:', type);
                const block = new Blocks(blockTypes[type]);
                hiddenLayer.add(block);
                blocks.push(block);
            }
        }

        hiddenLayer.draw();

        this.stage.add(hiddenLayer);

        //blocks.push(block1, block2, block3, block4, block5, block6, block7);
        
        blocks.forEach((block, index) => {
            const box = block.getClientRect({ relativeTo: block.getLayer() });
            console.log('Adding block to palette:', block);
            block.toDataURL({
                pixelRatio: 2,
                x: box.x,
                y: box.y,
                width: box.width + 10,
                height: box.height,
                callback: (url) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = "palette-item";
                    const img = document.createElement('img');
                    img.src = url;
                    img.draggable = true;
                    img.className = "palette-img";
                    img.dataset.type = block.name;
                    // force display at *original logical size*
                    img.style.width = `${box.width}px`;
                    img.style.height = `${box.height}px`;
                    const text = document.createElement('div');
                    text.style.textAlign = 'center';
                    text.style.fontSize = '12px';
                    text.innerText = block.name;
                    wrapper.appendChild(img);
                    wrapper.appendChild(text);
                    document.getElementById('palette').appendChild(wrapper);
                }
            });  
        });
     
    }
}

export default LeftPane;