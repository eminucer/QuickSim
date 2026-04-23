import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class PortBlockRenderer extends DefaultBlockRenderer {
    render() {
        const D = this.width;
        // Circle that spans the full bounding box so PortRenderer positions stay correct
        this.block = new Konva.Circle({
            x:           D / 2,
            y:           D / 2,
            radius:      D / 2,
            fill:        this.color,
            stroke:      this.strokeColor,
            strokeWidth: 2,
        });
        this.add(this.block);

        this.label = new Konva.Text({
            x:            0,
            y:            0,
            width:        D,
            height:       D,
            align:        'center',
            verticalAlign:'middle',
            text:         this.owner.label,
            fontSize:     this.owner.fontSize || 14,
            fontStyle:    'bold',
            fill:         '#1e293b',
            listening:    false,
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

    // Port circles don't resize with height
    resize() {
        if (this.getLayer()) this.getLayer().batchDraw();
    }
}
