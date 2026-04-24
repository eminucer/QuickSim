import { DefaultBlockRenderer } from "./DefaultBlockRenderer.js";

export class MuxBlockRenderer extends DefaultBlockRenderer {
    render() {
        const w = this.width;
        const h = this.height;
        const inset = Math.max(0, (h - 20) / 2);

        // Trapezoid: full height on left (many inputs), narrow on right (1 output)
        this.block = new Konva.Line({
            points:      [0, 0, w, inset, w, h - inset, 0, h],
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
            text:          'MUX',
            fontSize:      9,
            fontStyle:     'bold',
            fill:          '#4C1D95',
            listening:     false,
        });
        this.add(this.label);
    }

    resize(newH) {
        this.height = newH;
        this.owner.size.height = newH;
        const w     = this.width;
        const inset = Math.max(0, (newH - 20) / 2);
        this.block.points([0, 0, w, inset, w, newH - inset, 0, newH]);
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
