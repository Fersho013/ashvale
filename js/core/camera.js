/* =====================================================================
   8. CÁMARA 2D
   ===================================================================== */
import { MAP_W, MAP_H } from '../world/map.js';

export class Camera {
    constructor(width, height) {
        this.x = 0; this.y = 0; this.width = width; this.height = height;
        this.deadzone = { w: 200, h: 120 };
    }
    follow(target) {
        const dzLeft = this.x + (this.width - this.deadzone.w) / 2;
        const dzRight = this.x + (this.width + this.deadzone.w) / 2;
        const dzTop = this.y + (this.height - this.deadzone.h) / 2;
        const dzBottom = this.y + (this.height + this.deadzone.h) / 2;
        const tcx = target.x + target.w / 2, tcy = target.y + target.h / 2;
        if (tcx < dzLeft) this.x = tcx - (this.width - this.deadzone.w) / 2;
        else if (tcx > dzRight) this.x = tcx - (this.width + this.deadzone.w) / 2;
        if (tcy < dzTop) this.y = tcy - (this.height - this.deadzone.h) / 2;
        else if (tcy > dzBottom) this.y = tcy - (this.height + this.deadzone.h) / 2;
        this.x = Math.max(0, Math.min(this.x, MAP_W - this.width));
        this.y = Math.max(0, Math.min(this.y, MAP_H - this.height));
    }
}
