
import { Blocks } from './Blocks.js';

class LeftPane {
    constructor(containerId) {
        this.stage = new Konva.Stage({
            container: containerId,
            width: 200,
            height: 600,
        });

        const layer = new Konva.Layer();

        const block1 = new Blocks({
            x: 50,
            y: 60,
            width: 70,
            height: 50,
            text: 'Block 1',
            fontSize: 14,
            textColor: 'black',
            color: 'lightgreen',
            draggable: false,
        });

        const block2 = new Blocks({
            x: 50,
            y: 160,
            width: 70,
            height: 50,
            text: 'Block 2',
            fontSize: 14,
            textColor: 'black',
            color: 'lightblue',
            draggable: false,
        });

        const block3 = new Blocks({
            x: 50,
            y: 260,
            width: 70,
            height: 50,
            text: 'Block 3',
            fontSize: 14,
            textColor: 'black',
            color: 'orange',
            draggable: false,
        });

        // layer.add(block1);
        // layer.add(block2);
        // layer.add(block3);

        this.stage.add(block1);
        this.stage.add(block2);
        this.stage.add(block3);
    }
}

export default LeftPane;