import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class DemuxBlockRenderer extends DefaultBlockRenderer {
    render() {
        const w = this.width;
        const h = this.height;
        const inset = Math.max(0, (h - 20) / 2);

        // Trapezoid: narrow on left (1 input), full height on right (many outputs)
        this.block = new Konva.Line({
            points:      [0, inset, w, 0, w, h, 0, h - inset],
            closed:      true,
            fill:        this.color,
            stroke:      this.strokeColor,
            strokeWidth: 2,
        });
        this.add(this.block);

        this.label = new Konva.Text({
            x:             0,
            y:             0,
            width:         w,
            height:        h,
            align:         'center',
            verticalAlign: 'middle',
            text:          'DMX',
            fontSize:      9,
            fontStyle:     'bold',
            fill:          '#92400E',
            listening:     false,
        });
        this.add(this.label);
    }

    resize(newH) {
        this.height = newH;
        this.owner.size.height = newH;
        const w     = this.width;
        const inset = Math.max(0, (newH - 20) / 2);
        this.block.points([0, inset, w, 0, w, newH, 0, newH - inset]);
        if (this.label) {
            this.label.height(newH);
        }
        if (this.getLayer()) this.getLayer().batchDraw();
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
