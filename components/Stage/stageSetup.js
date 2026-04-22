import { Stage } from "./Stage.js";
import { WireSegment } from "../Wire/WireSegment.js";

const stage = new Stage('workspace');
const tempWire = new WireSegment(stage);
stage.tempWire = tempWire; // expose so WireSegmentRenderer can access it without circular imports
stage.add(tempWire);

export {stage, tempWire}