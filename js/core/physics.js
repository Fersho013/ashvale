/* =====================================================================
   2. FÍSICAS Y COLISIONES (AABB)
   ===================================================================== */
export function checkRectCollision(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}
export function dist(a, b) {
    return Math.hypot((a.x + a.w/2) - (b.x + b.w/2), (a.y + a.h/2) - (b.y + b.h/2));
}
