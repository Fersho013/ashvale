/* =====================================================================
   0.5 MÓDULO DE ADAPTACIÓN DE PANTALLA (HEREDABLE)
   Se controla desde la pantalla de Configuración del menú principal.
   ===================================================================== */
export const ScreenManager = {
    canvas: null,
    isMobileMode: false,
    isFullscreen: false,
    virtualWidth: 960,
    virtualHeight: 540,
    maintainAspectRatio: false,
    onResize: null, // hook opcional para sincronizar la Cámara tras cada resize

    init(canvasElement, options = {}) {
        this.canvas = (typeof canvasElement === 'string') ? document.getElementById(canvasElement) : canvasElement;
        if (options.virtualWidth) this.virtualWidth = options.virtualWidth;
        if (options.virtualHeight) this.virtualHeight = options.virtualHeight;
        if (options.maintainAspectRatio !== undefined) this.maintainAspectRatio = options.maintainAspectRatio;

        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('fullscreenchange', () => this._onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this._onFullscreenChange());

        this.resizeCanvas();
        this._refreshMobileOnlyUI();
    },

    async toggleMobileMode(toggleBtn = null) {
        this.isMobileMode = !this.isMobileMode;
        if (this.isMobileMode) {
            await this.enterFullscreen();
            await this.lockLandscape();
            if (toggleBtn) toggleBtn.innerText = "📱 Modo PC";
        } else {
            await this.exitFullscreen();
            this.unlockOrientation();
            if (toggleBtn) toggleBtn.innerText = "🎮 Modo Móvil / Pantalla Completa";
        }
        this.resizeCanvas();
        this._refreshMobileOnlyUI();
    },

    async enterFullscreen() {
        const docEl = document.documentElement;
        try {
            if (docEl.requestFullscreen) await docEl.requestFullscreen();
            else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
            else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen();
            this.isFullscreen = true;
        } catch (err) { console.warn("No se pudo activar la pantalla completa:", err); }
    },

    async exitFullscreen() {
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
            else if (document.msExitFullscreen) await document.msExitFullscreen();
            this.isFullscreen = false;
        } catch (err) { console.warn("No se pudo salir de pantalla completa:", err); }
    },

    async lockLandscape() {
        try {
            if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
            else if (screen.lockOrientation) screen.lockOrientation('landscape');
        } catch (err) { console.warn("Bloqueo de orientación no soportado:", err); }
    },

    unlockOrientation() {
        try {
            if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
            else if (screen.unlockOrientation) screen.unlockOrientation();
        } catch (err) { console.warn("No se pudo desbloquear la orientación:", err); }
    },

    resizeCanvas() {
        if (!this.canvas) return;
        if (this.isMobileMode || this.isFullscreen) {
            const windowWidth = window.innerWidth, windowHeight = window.innerHeight;
            if (this.maintainAspectRatio) {
                const scale = Math.min(windowWidth / this.virtualWidth, windowHeight / this.virtualHeight);
                this.canvas.width = this.virtualWidth; this.canvas.height = this.virtualHeight;
                this.canvas.style.width = `${this.virtualWidth * scale}px`;
                this.canvas.style.height = `${this.virtualHeight * scale}px`;
            } else {
                this.canvas.width = windowWidth; this.canvas.height = windowHeight;
                this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
            }
        } else {
            this.canvas.width = this.virtualWidth; this.canvas.height = this.virtualHeight;
            this.canvas.style.width = ''; this.canvas.style.height = '';
        }
        if (this.onResize) this.onResize();
    },

    _onFullscreenChange() {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this.isFullscreen = isFS;
        if (!isFS && this.isMobileMode) { this.isMobileMode = false; this.unlockOrientation(); this.resizeCanvas(); }
        this._refreshMobileOnlyUI();
    },

    // Muestra/oculta cualquier elemento marcado con la clase ".mobile-only-ui"
    // según el Modo Móvil esté activo o no (punto 3: en PC no debe verse ni
    // rastro de UI táctil/exclusiva de móvil; en Modo Móvil, sí). En vez de
    // tocar el "display" de cada elemento (habría que adivinar si es flex,
    // inline-block, etc. al revelarlo), se alterna una clase en <body> que
    // el CSS usa para aplicar u omitir la regla ".mobile-only-ui { display:none }"
    // — así cada elemento vuelve a su display normal, el que sea, al mostrarse.
    _refreshMobileOnlyUI() {
        document.body.classList.toggle('mobile-mode-active', this.isMobileMode);
    }
};
