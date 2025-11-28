

export function createGrid({ width, height, cellSize, stroke = '#ddd', layer }) {
    const gridGroup = new Konva.Group();

    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
        const line = new Konva.Line({
            points: [x, 0, x, height],
            stroke,
            strokeWidth: 1,
        });
        gridGroup.add(line);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
        const line = new Konva.Line({
            points: [0, y, width, y],
            stroke,
            strokeWidth: 1,
        });
        gridGroup.add(line);
    }

    if (layer) {
        layer.add(gridGroup);
        layer.batchDraw();
    }

    return gridGroup;
}
