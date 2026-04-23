import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class GainBlockRenderer extends DefaultBlockRenderer {
    constructor(owner) {
        super(owner);
    }

    render() {
        // Triangle (pointing right)
        this.block = new Konva.Line({
            x: 0,
            y: 0,
            points: [
                0, 0,
                this.width, this.height / 2,
                0, this.height,
            ],
            closed:      true,
            fill:        this.color,
            stroke:      this.strokeColor,
            strokeWidth: 2,
        });
        this.add(this.block);

        this.label = new Konva.Text({
            x:             this.width  * 0.12,
            y:             this.height * 0.3,
            width:         this.width  * 0.6,
            height:        this.height * 0.4,
            align:         'center',
            verticalAlign: 'middle',
            text:          this.owner.label,
            fontSize:      this.owner.fontSize || 16,
            fontStyle:     'bold',
            fill:          '#1e293b',
        });
        this.add(this.label);
    }

    showSelected() {
        this.block.strokeWidth(3);
        this.block.shadowColor(this.strokeColor);
        this.block.shadowBlur(12);
        this.block.shadowOpacity(0.6);
        if (this.getLayer()) this.getLayer().batchDraw();
    }

    hideSelected() {
        this.block.strokeWidth(2);
        this.block.shadowBlur(0);
        this.block.shadowOpacity(0);
        if (this.getLayer()) this.getLayer().batchDraw();
    }
}
