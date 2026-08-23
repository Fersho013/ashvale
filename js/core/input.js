/* =====================================================================
   1. INPUT HANDLER (Teclado, Mouse, Gamepad y Táctil Unificado)
   ===================================================================== */
import { state } from '../state.js';
import { toggleInventory } from '../ui/inventoryUI.js';
import { togglePause } from '../ui/pause.js';

export const Input = {
    keys: {}, keysPressed: {},
    // mouse.down = Click Izquierdo (Ataque básico) · mouse.rightDown = Click Derecho (Parry)
    mouse: { x: 0, y: 0, down: false, rightDown: false },
    gamepad: { connected: false, axes: [0, 0], buttons: {}, justPressed: {} },
    _prevGamepadButtons: {},
    touch: { moveX: 0, moveY: 0, attack: false, block: false, interact: false, q: false, r: false, inv: false },

    init() {
        window.addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.keysPressed[e.code] = true;
            this.keys[e.code] = true;
            if (['Space','KeyW','KeyS','KeyA','KeyD','Tab'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', e => {
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });
        canvas.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });
        canvas.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('gamepadconnected', () => {
            this.gamepad.connected = true;
            document.getElementById('gamepad-status').innerText = "Conectado";
            document.getElementById('gamepad-status').style.color = "#2ecc71";
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.gamepad.connected = false;
            document.getElementById('gamepad-status').innerText = "Desconectado";
            document.getElementById('gamepad-status').style.color = "#e74c3c";
        });

        this.setupTouchControls();
    },

    setupTouchControls() {
        const joyBase = document.getElementById('left-joy-base');
        const joyStick = document.getElementById('left-joy-stick');
        let touchId = null;
        let center = { x: 0, y: 0 };

        if (!joyBase) return;

        joyBase.addEventListener('touchstart', e => {
            e.preventDefault();
            if (touchId !== null) return;
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            const rect = joyBase.getBoundingClientRect();
            center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            updateJoy(touch);
        }, { passive: false });

        joyBase.addEventListener('touchmove', e => {
            e.preventDefault();
            for (let t of e.changedTouches) {
                if (t.identifier === touchId) { updateJoy(t); break; }
            }
        }, { passive: false });

        const endTouch = e => {
            e.preventDefault();
            for (let t of e.changedTouches) {
                if (t.identifier === touchId) {
                    touchId = null;
                    joyStick.style.transform = `translate(-50%, -50%)`;
                    this.touch.moveX = 0; this.touch.moveY = 0;
                    break;
                }
            }
        };

        joyBase.addEventListener('touchend', endTouch, { passive: false });
        joyBase.addEventListener('touchcancel', endTouch, { passive: false });

        const self = this;
        function updateJoy(touch) {
            let dx = touch.clientX - center.x;
            let dy = touch.clientY - center.y;
            let dist = Math.hypot(dx, dy);
            let maxDist = 40;
            if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
            joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            self.touch.moveX = dx / maxDist;
            self.touch.moveY = dy / maxDist;
        }

        const bindBtn = (id, prop) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', e => { e.preventDefault(); this.touch[prop] = true; }, { passive: false });
            btn.addEventListener('touchend', e => { e.preventDefault(); this.touch[prop] = false; }, { passive: false });
        };

        bindBtn('btn-atk', 'attack');
        bindBtn('btn-blk', 'block');
        bindBtn('interaction-prompt', 'interact'); // el letrero de interacción hace de botón (ver applyTouchControlsVisibility)
        bindBtn('btn-q', 'q');
        bindBtn('btn-r', 'r');

        const invBtn = document.getElementById('btn-inv');
        if (invBtn) {
            invBtn.addEventListener('touchstart', e => {
                e.preventDefault();
                if (state.gamePaused) return;
                toggleInventory();
            }, { passive: false });
        }

        const pauseBtn = document.getElementById('touch-pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('touchstart', e => { e.preventDefault(); togglePause(); }, { passive: false });
        }
    },

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        this.gamepad.justPressed = {};
        if (gamepads[0]) {
            const gp = gamepads[0];
            this.gamepad.connected = true;
            this.gamepad.axes[0] = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
            this.gamepad.axes[1] = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;

            // Mapa estándar de botones (W3C Standard Gamepad):
            const map = {
                interact: 2,   // Cuadrado / X   -> Interacción
                inventory: 3,  // Triángulo / Y  -> Inventario
                ability2: 4,   // L1 / LB        -> Habilidad 2
                ability1: 5,   // R1 / RB        -> Habilidad 1
                block: 6,      // L2 / LT        -> Parry básico
                attack: 7,     // R2 / RT        -> Ataque básico
                pause: 9       // Options / Start-> Pausa
            };
            for (const key in map) {
                const idx = map[key];
                const pressed = !!(gp.buttons[idx] && gp.buttons[idx].pressed);
                this.gamepad.buttons[key] = pressed;
                this.gamepad.justPressed[key] = pressed && !this._prevGamepadButtons[key];
                this._prevGamepadButtons[key] = pressed;
            }
        } else {
            this.gamepad.connected = false;
            for (const key in this._prevGamepadButtons) this._prevGamepadButtons[key] = false;
        }
    },

    isDown(codeArray) { return codeArray.some(code => this.keys[code]); },
    wasPressed(code) {
        if (this.keysPressed[code]) { this.keysPressed[code] = false; return true; }
        return false;
    }
};
Input.init();
