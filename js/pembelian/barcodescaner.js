
const PembelianBarcodeScanner = {

    stream: null,
    detector: null,
    scanning: false,
    controls: null,

    lastBarcode: "",
    lastDetectedTime: 0,
    scanCount: 0,

    targetMode: "pembelian",
    targetIndex: -1,

    /* STATUS SESI SCANNER */

    sessionActive: false,
    startPromise: null,
    sessionId: 0,

    /* NATIVE SCANNER */

    nativeScanning: false,
    nativeFrameId: null,
    nativeDetecting: false,
    nativeLastScan: 0,
    nativeScanInterval: 50,

    /* AUDIO BEEP */

    audioContext: null,

    /* ======================================
       BUKA SCANNER PEMBELIAN BIASA
    ====================================== */

    async open() {

        if (this.sessionActive || this.startPromise) {
            return;
        }

        this.targetMode = "pembelian";
        this.targetIndex = -1;

        await this.startScanner();
    },

    /* ======================================
       BUKA SCANNER PEMBELIAN MASSAL
    ====================================== */

    async openForMassal(index) {

        if (this.sessionActive || this.startPromise) {
            return;
        }

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            !PembelianMassal.items[index]
        ) {
            Dialog.error(
                "Baris item Pembelian Massal tidak ditemukan.",
                "Scanner Barcode"
            );

            return;
        }

        this.targetMode = "massal";
        this.targetIndex = index;

        await this.startScanner();
    },

    /* ======================================
       AUDIO UNLOCK
    ====================================== */

    async unlockAudio() {

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) {
                return false;
            }

            if (!this.audioContext) {
                this.audioContext = new AudioContextClass();
            }

            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }

            return this.audioContext.state === "running";

        } catch (error) {

            console.warn(
                "PEMBELIAN BARCODE AUDIO ERROR:",
                error
            );

            return false;
        }
    },

    /* ======================================
       AUDIO BEEP
    ====================================== */

    playBeep(type = "success") {

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) {
                return;
            }

            if (!this.audioContext) {
                this.audioContext = new AudioContextClass();
            }

            const context = this.audioContext;

            const playSound = () => {

                const oscillator =
                    context.createOscillator();

                const gain =
                    context.createGain();

                const isError = type === "error";

                oscillator.type = "square";

                oscillator.frequency.value =
                    isError ? 350 : 2200;

                const now = context.currentTime;

                const duration =
                    isError ? 0.35 : 0.20;

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.8,
                    now + 0.01
                );

                gain.gain.setValueAtTime(
                    0.8,
                    now + duration * 0.7
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + duration
                );

                oscillator.connect(gain);
                gain.connect(context.destination);

                oscillator.start(now);

                oscillator.stop(
                    now + duration + 0.01
                );
            };

            if (context.state === "suspended") {

                context.resume()
                    .then(playSound)
                    .catch(error => {

                        console.warn(
                            "PEMBELIAN BARCODE AUDIO ERROR:",
                            error
                        );

                    });

            } else {

                playSound();
            }

        } catch (error) {

            console.warn(
                "PEMBELIAN BARCODE AUDIO ERROR:",
                error
            );
        }
    },

    /* ======================================
       CEK DUKUNGAN BARCODE DETECTOR
    ====================================== */

    async isNativeSupported() {

        try {

            if (!("BarcodeDetector" in window)) {
                return false;
            }

            if (
                typeof BarcodeDetector.getSupportedFormats !==
                "function"
            ) {
                return false;
            }

            const formats =
                await BarcodeDetector.getSupportedFormats();

            return formats.includes("ean_13");

        } catch (error) {

            console.warn(
                "BARCODE DETECTOR SUPPORT ERROR:",
                error
            );

            return false;
        }
    },

    /* ======================================
       BUAT NATIVE DETECTOR
    ====================================== */

    async createNativeDetector() {

        const formats =
            await BarcodeDetector.getSupportedFormats();

        if (!formats.includes("ean_13")) {
            return null;
        }

        return new BarcodeDetector({
            formats: ["ean_13"]
        });
    },

    /* ======================================
       BUAT ZXING READER
    ====================================== */

    createReader() {

        if (
            !window.ZXingBrowser ||
            !window.ZXingBrowser.BrowserMultiFormatOneDReader
        ) {
            throw new Error(
                "Library scanner barcode ZXing tidak tersedia."
            );
        }

        const Reader =
            ZXingBrowser.BrowserMultiFormatOneDReader;

        try {

            const HintType =
                ZXingBrowser.DecodeHintType;

            const BarcodeFormat =
                ZXingBrowser.BarcodeFormat;

            if (
                HintType &&
                BarcodeFormat &&
                HintType.POSSIBLE_FORMATS &&
                BarcodeFormat.EAN_13 !== undefined
            ) {

                const hints = new Map();

                hints.set(
                    HintType.POSSIBLE_FORMATS,
                    [BarcodeFormat.EAN_13]
                );

                return new Reader(hints);
            }

        } catch (error) {

            console.warn(
                "ZXING FORMAT HINT ERROR:",
                error
            );
        }

        return new Reader();
    },

    /* ======================================
       START SCANNER
    ====================================== */

    async startScanner() {

        if (this.sessionActive || this.startPromise) {
            return;
        }

        const modal = document.getElementById(
            "pembelian-barcode-scanner"
        );

        const video = document.getElementById(
            "pembelian-barcode-scanner-video"
        );

        const message = document.getElementById(
            "pembelian-barcode-scanner-message"
        );

        if (!modal || !video) {

            console.error(
                "Elemen scanner barcode tidak ditemukan."
            );

            Dialog.error(
                "Elemen scanner barcode tidak ditemukan.",
                "Scanner Barcode"
            );

            return;
        }

        this.bindCloseEvent();

        this.sessionActive = true;

        const currentSession = ++this.sessionId;

        const startupPromise = this.runScanner(
            currentSession,
            modal,
            video,
            message
        );

        this.startPromise = startupPromise;

        try {

            await startupPromise;

        } finally {

            if (this.startPromise === startupPromise) {
                this.startPromise = null;
            }
        }
    },

    /* ======================================
       JALANKAN SESI KAMERA
    ====================================== */

    async runScanner(
        currentSession,
        modal,
        video,
        message
    ) {

        try {

            this.stopNativeScanner();
            this.stopCamera();

            if (this.controls) {

                try {
                    this.controls.stop();
                } catch (error) {
                    console.warn(
                        "ZXING STOP ERROR:",
                        error
                    );
                }

                this.controls = null;
            }

            try {
                video.pause();
            } catch (error) {
                // Video belum berjalan.
            }

            if (video.srcObject) {

                video.srcObject
                    .getTracks()
                    .forEach(track => {

                        try {
                            track.stop();
                        } catch (error) {
                            console.warn(
                                "CAMERA TRACK STOP ERROR:",
                                error
                            );
                        }

                    });

                video.srcObject = null;
            }

            this.detector = null;
            this.scanning = false;

            this.lastBarcode = "";
            this.lastDetectedTime = 0;
            this.scanCount = 0;

            modal.hidden = false;

            if (message) {
                message.textContent = "Menyiapkan kamera...";
            }

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error(
                    "Browser tidak mendukung akses kamera."
                );
            }

            this.scanning = true;

            /*
             * PRIORITAS 1:
             * BARCODE DETECTOR NATIVE
             */

            const nativeSupported =
                await this.isNativeSupported();

            if (currentSession !== this.sessionId) {
                return;
            }

            if (nativeSupported) {

                try {

                    const started =
                        await this.startNativeScanner(
                            currentSession,
                            video,
                            message
                        );

                    if (
                        started &&
                        currentSession === this.sessionId
                    ) {
                        return;
                    }

                } catch (nativeError) {

                    if (currentSession !== this.sessionId) {
                        return;
                    }

                    console.warn(
                        "NATIVE SCANNER GAGAL, MENGGUNAKAN ZXING:",
                        nativeError
                    );

                    this.stopNativeScanner();
                    this.stopCamera();
                }
            }

            /*
             * PRIORITAS 2:
             * ZXING FALLBACK
             */

            if (currentSession !== this.sessionId) {
                return;
            }

            await this.startZXingScanner(
                currentSession,
                video,
                message
            );

        } catch (error) {

            if (currentSession !== this.sessionId) {
                return;
            }

            console.error(
                "BARCODE CAMERA ERROR:",
                error
            );

            let errorMessage =
                "Kamera tidak dapat digunakan.";

            if (error.name === "NotAllowedError") {

                errorMessage =
                    "Izin kamera ditolak. Izinkan akses kamera pada browser.";

            } else if (error.name === "NotFoundError") {

                errorMessage =
                    "Kamera tidak ditemukan pada perangkat.";

            } else if (error.name === "NotReadableError") {

                errorMessage =
                    "Kamera sedang digunakan aplikasi lain.";

            } else if (
                error.name === "OverconstrainedError"
            ) {

                errorMessage =
                    "Pengaturan kamera tidak didukung perangkat.";

            } else if (error.message) {

                errorMessage = error.message;
            }

            if (message) {
                message.textContent = errorMessage;
            }

            this.close();

            Dialog.error(
                errorMessage,
                "Scanner Barcode"
            );
        }
    },

    /* ======================================
       NATIVE CAMERA SCANNER
    ====================================== */

    async startNativeScanner(
        currentSession,
        video,
        message
    ) {

        this.detector =
            await this.createNativeDetector();

        if (!this.detector) {
            return false;
        }

        if (currentSession !== this.sessionId) {
            return false;
        }

        const constraints = {
            audio: false,

            video: {
                width: {
                    ideal: 1280
                },

                height: {
                    ideal: 720
                },

                frameRate: {
                    ideal: 30,
                    max: 30
                },

                facingMode: {
                    ideal: "environment"
                }
            }
        };

        const stream =
            await navigator.mediaDevices.getUserMedia(
                constraints
            );

        if (currentSession !== this.sessionId) {

            stream.getTracks().forEach(track => track.stop());

            return false;
        }

        this.stream = stream;

        video.srcObject = stream;

        video.setAttribute("playsinline", "");
        video.setAttribute("autoplay", "");
        video.muted = true;

        await video.play();

        if (currentSession !== this.sessionId) {
            this.stopCamera();
            return false;
        }

        await this.optimizeCamera(video);

        if (currentSession !== this.sessionId) {
            this.stopCamera();
            return false;
        }

        this.nativeScanning = true;
        this.nativeDetecting = false;
        this.nativeLastScan = 0;

        if (message) {
            message.textContent =
                "Arahkan barcode ke dalam kotak...";
        }

        this.nativeScanLoop(
            currentSession,
            video,
            message
        );

        return true;
    },

    /* ======================================
       LOOP NATIVE DETECTOR
    ====================================== */

    nativeScanLoop(
        currentSession,
        video,
        message
    ) {

        const scanFrame = async (timestamp) => {

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive ||
                !this.scanning ||
                !this.nativeScanning
            ) {
                return;
            }

            this.nativeFrameId =
                requestAnimationFrame(scanFrame);

            if (
                this.nativeDetecting ||
                video.readyState < 2 ||
                timestamp - this.nativeLastScan <
                    this.nativeScanInterval
            ) {
                return;
            }

            this.nativeLastScan = timestamp;
            this.nativeDetecting = true;

            try {

                const results =
                    await this.detector.detect(video);

                if (
                    currentSession !== this.sessionId ||
                    !this.sessionActive ||
                    !this.scanning
                ) {
                    return;
                }

                this.scanCount++;

                if (!results || results.length === 0) {
                    return;
                }

                for (const result of results) {

                    const barcode = String(
                        result.rawValue || ""
                    ).trim();

                    if (!barcode) {
                        continue;
                    }

                    if (!/^\d{13}$/.test(barcode)) {
                        continue;
                    }

                    await this.onBarcodeDetected(
                        barcode,
                        currentSession,
                        message
                    );

                    break;
                }

            } catch (error) {

                console.warn(
                    "NATIVE BARCODE DETECT ERROR:",
                    error
                );

            } finally {

                this.nativeDetecting = false;
            }
        };

        this.nativeFrameId =
            requestAnimationFrame(scanFrame);
    },

    /* ======================================
       ZXING FALLBACK SCANNER
    ====================================== */

    async startZXingScanner(
        currentSession,
        video,
        message
    ) {

        this.detector = this.createReader();

        if (
            "timeBetweenDecodingAttempts" in this.detector
        ) {
            this.detector.timeBetweenDecodingAttempts = 50;
        }

        const constraints = {
            audio: false,

            video: {
                width: {
                    ideal: 1280
                },

                height: {
                    ideal: 720
                },

                frameRate: {
                    ideal: 30,
                    max: 30
                },

                facingMode: {
                    ideal: "environment"
                }
            }
        };

        if (message) {
            message.textContent =
                "Arahkan barcode ke dalam kotak...";
        }

        const controls =
            await this.detector.decodeFromConstraints(
                constraints,
                video,
                async (result, error, callbackControls) => {

                    if (
                        currentSession !== this.sessionId ||
                        !this.sessionActive ||
                        !this.scanning
                    ) {
                        return;
                    }

                    this.scanCount++;

                    if (error || !result) {
                        return;
                    }

                    const barcode = String(
                        result.getText
                            ? result.getText()
                            : ""
                    ).trim();

                    if (!/^\d{13}$/.test(barcode)) {
                        return;
                    }

                    const activeControls =
                        callbackControls || this.controls;

                    if (activeControls) {

                        try {
                            activeControls.stop();
                        } catch (stopError) {
                            console.warn(
                                "ZXING STOP ERROR:",
                                stopError
                            );
                        }
                    }

                    if (this.controls === activeControls) {
                        this.controls = null;
                    }

                    await this.onBarcodeDetected(
                        barcode,
                        currentSession,
                        message
                    );
                }
            );

        if (currentSession !== this.sessionId) {

            try {
                controls.stop();
            } catch (error) {
                console.warn(
                    "ZXING STOP ERROR:",
                    error
                );
            }

            return;
        }

        this.controls = controls;

        if (video.srcObject) {
            this.stream = video.srcObject;
        }

        await this.optimizeCamera(video);
    },

    /* ======================================
       OPTIMASI KAMERA
    ====================================== */

    async optimizeCamera(video) {

        try {

            const tracks = video.srcObject
                ? video.srcObject.getVideoTracks()
                : [];

            if (!tracks.length) {
                return;
            }

            const track = tracks[0];

            this.stream = video.srcObject;

            const capabilities =
                track.getCapabilities
                    ? track.getCapabilities()
                    : {};

            const advanced = {};

            if (
                Array.isArray(capabilities.focusMode) &&
                capabilities.focusMode.includes("continuous")
            ) {
                advanced.focusMode = "continuous";
            }

            if (
                Object.keys(advanced).length > 0 &&
                track.applyConstraints
            ) {

                await track.applyConstraints({
                    advanced: [advanced]
                });
            }

        } catch (error) {

            console.warn(
                "CAMERA OPTIMIZATION TIDAK TERSEDIA:",
                error
            );
        }
    },

    /* ======================================
       BARCODE DITEMUKAN
    ====================================== */

    async onBarcodeDetected(
        barcode,
        currentSession,
        message
    ) {

        if (
            currentSession !== this.sessionId ||
            !this.sessionActive ||
            !this.scanning
        ) {
            return;
        }

        if (!/^\d{13}$/.test(barcode)) {
            return;
        }

        const now = Date.now();

        if (
            barcode === this.lastBarcode &&
            now - this.lastDetectedTime < 1000
        ) {
            return;
        }

        this.lastBarcode = barcode;
        this.lastDetectedTime = now;
        this.scanning = false;

        this.stopNativeScanner();

        if (this.controls) {

            try {
                this.controls.stop();
            } catch (error) {
                console.warn(
                    "ZXING STOP ERROR:",
                    error
                );
            }

            this.controls = null;
        }

        this.playBeep("success");

        if (message) {
            message.textContent =
                "Barcode ditemukan: " + barcode;
        }

        await this.handleBarcode(barcode);
    },

    /* ======================================
       PROSES BARCODE
    ====================================== */

    async handleBarcode(barcode) {

        this.scanning = false;

        if (!barcode) {
            return;
        }

        const mode = this.targetMode;
        const index = this.targetIndex;

        const message = document.getElementById(
            "pembelian-barcode-scanner-message"
        );

        if (message) {
            message.textContent =
                "Barcode ditemukan: " + barcode;
        }

        try {

            if (mode === "massal") {

                const page = document.getElementById(
                    "pembelian-massal-modal"
                );

                if (
                    !page ||
                    !PembelianMassal.items[index]
                ) {
                    throw new Error(
                        "Baris item Pembelian Massal tidak ditemukan."
                    );
                }

                PembelianMassal.cariBarcodeSatuan(
                    index,
                    barcode,
                    page
                );

            } else {

                const barcodeInput = document.getElementById(
                    "pembelian-barcode"
                );

                if (barcodeInput) {
                    barcodeInput.value = barcode;
                }

                await Pembelian.scanBarcode(barcode);
            }

        } catch (error) {

            console.error(
                "PROSES BARCODE CAMERA ERROR:",
                error
            );

            Dialog.error(
                error.message ||
                "Gagal memproses barcode.",
                "Pemrosesan Barcode"
            );

        } finally {

            this.close();

            if (mode === "pembelian") {

                const barcodeInput = document.getElementById(
                    "pembelian-barcode"
                );

                if (barcodeInput) {
                    barcodeInput.value = "";
                    barcodeInput.focus();
                }
            }
        }
    },

    /* ======================================
       BIND EVENT TOMBOL CLOSE
    ====================================== */

    bindCloseEvent() {

        const modal = document.getElementById(
            "pembelian-barcode-scanner"
        );

        if (!modal) {
            return;
        }

        const closeButton = document.getElementById(
            "pembelian-barcode-scanner-close"
        );

        if (
            closeButton &&
            closeButton.dataset.bound !== "true"
        ) {

            closeButton.dataset.bound = "true";

            closeButton.addEventListener("click", () => {
                this.close();
            });
        }

        const backdrop = modal.querySelector(
            ".pembelian-barcode-scanner-backdrop, " +
            ".pembelian-barcode-scanner-overlay"
        );

        if (
            backdrop &&
            backdrop.dataset.bound !== "true"
        ) {

            backdrop.dataset.bound = "true";

            backdrop.addEventListener("click", () => {
                this.close();
            });
        }
    },

    /* ======================================
       STOP NATIVE SCANNER
    ====================================== */

    stopNativeScanner() {

        this.nativeScanning = false;

        if (this.nativeFrameId !== null) {

            cancelAnimationFrame(
                this.nativeFrameId
            );

            this.nativeFrameId = null;
        }

        this.nativeDetecting = false;
        this.nativeLastScan = 0;
    },

    /* ======================================
       CLOSE
    ====================================== */

    close() {

        this.sessionId++;
        this.sessionActive = false;
        this.scanning = false;

        this.stopNativeScanner();

        if (this.controls) {

            try {
                this.controls.stop();
            } catch (error) {
                console.warn(
                    "ZXING STOP ERROR:",
                    error
                );
            }

            this.controls = null;
        }

        this.stopCamera();

        const modal = document.getElementById(
            "pembelian-barcode-scanner"
        );

        if (modal) {
            modal.hidden = true;
        }

        const video = document.getElementById(
            "pembelian-barcode-scanner-video"
        );

        if (video) {

            try {
                video.pause();
            } catch (error) {
                // Video belum berjalan.
            }

            if (video.srcObject) {

                video.srcObject
                    .getTracks()
                    .forEach(track => {

                        try {
                            track.stop();
                        } catch (error) {
                            console.warn(
                                "CAMERA TRACK STOP ERROR:",
                                error
                            );
                        }

                    });

                video.srcObject = null;
            }
        }

        this.detector = null;

        this.lastBarcode = "";
        this.lastDetectedTime = 0;
        this.scanCount = 0;

        this.targetMode = "pembelian";
        this.targetIndex = -1;
    },

    /* ======================================
       STOP CAMERA
    ====================================== */

    stopCamera() {

        if (!this.stream) {
            return;
        }

        this.stream.getTracks().forEach(track => {

            try {
                track.stop();
            } catch (error) {
                console.warn(
                    "CAMERA TRACK STOP ERROR:",
                    error
                );
            }
        });

        this.stream = null;
    }

};
