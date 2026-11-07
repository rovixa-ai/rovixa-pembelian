
const PembelianBarcodeScanner = {

    stream: null,
    detector: null,
    reader: null,
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

    animationFrameId: null,
    detectBusy: false,
    lastFrameTime: 0,
    nativeScanning: false,

    /* AUDIO */

    audioContext: null,

    /* FORMAT BARCODE */

    supportedBarcodeFormats: [
        "ean_13",
        "ean_8",
        "upc_a",
        "upc_e",
        "code_128",
        "code_39",
        "itf",
        "qr_code",
        "data_matrix"
    ],

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
       AUDIO BEEP
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

                const isError =
                    type === "error";

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
                oscillator.stop(now + duration + 0.01);
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

            this.stopCamera();

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

            try {
                video.pause();
            } catch (error) {}

            if (video.srcObject) {

                video.srcObject
                    .getTracks()
                    .forEach(track => {
                        try {
                            track.stop();
                        } catch (error) {}
                    });

                video.srcObject = null;
            }

            this.detector = null;
            this.reader = null;

            this.scanning = false;
            this.detectBusy = false;
            this.nativeScanning = false;

            this.lastBarcode = "";
            this.lastDetectedTime = 0;
            this.scanCount = 0;
            this.lastFrameTime = 0;

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

            /* ==================================
               KAMERA BELAKANG ANDROID
            ================================== */

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
                        max: 60
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

            /* CEK SESI SETELAH KAMERA DIPEROLEH */

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive
            ) {

                stream.getTracks().forEach(track => {
                    track.stop();
                });

                return;
            }

            this.stream = stream;

            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;

            video.setAttribute(
                "playsinline",
                "true"
            );

            video.setAttribute(
                "autoplay",
                "true"
            );

            video.srcObject = stream;

            await video.play();

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive
            ) {
                return;
            }

            /* ==================================
               OPTIMASI KAMERA
            ================================== */

            this.optimizeCamera();

            this.scanning = true;

            if (message) {

                message.textContent =
                    "Menyiapkan pembaca barcode...";
            }

            /* ==================================
               PILIH READER
            ================================== */

            const nativeReady =
                await this.initializeNativeReader();

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive
            ) {
                return;
            }

            if (nativeReady) {

                console.info(
                    "PEMBELIAN SCANNER: NATIVE BARCODE DETECTOR"
                );

                if (message) {

                    message.textContent =
                        "Scanner aktif. Arahkan barcode ke kamera...";
                }

                this.startNativeScanner(
                    currentSession,
                    video,
                    message
                );

            } else {

                console.info(
                    "PEMBELIAN SCANNER: ZXING MULTI FORMAT"
                );

                if (message) {

                    message.textContent =
                        "Mengaktifkan scanner kompatibilitas...";
                }

                await this.startZXingFallback(
                    currentSession,
                    video,
                    message
                );
            }

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

            } else if (error.name === "OverconstrainedError") {

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
       INISIALISASI NATIVE BARCODE DETECTOR
    ====================================== */

    async initializeNativeReader() {

        try {

            const BarcodeDetectorClass =
                window.BarcodeDetector;

            if (!BarcodeDetectorClass) {
                return false;
            }

            if (
                !BarcodeDetectorClass.getSupportedFormats
            ) {
                return false;
            }

            const supportedFormats =
                await BarcodeDetectorClass.getSupportedFormats();

            if (!Array.isArray(supportedFormats)) {
                return false;
            }

            /*
             * Native digunakan hanya jika seluruh format
             * yang ditentukan tersedia.
             *
             * Jika tidak lengkap, gunakan ZXing MultiFormat.
             */

            const missingFormats =
                this.supportedBarcodeFormats.filter(
                    format => !supportedFormats.includes(format)
                );

            if (missingFormats.length > 0) {

                console.info(
                    "NATIVE BARCODE FORMAT TIDAK LENGKAP:",
                    missingFormats
                );

                return false;
            }

            this.detector =
                new BarcodeDetectorClass({
                    formats: this.supportedBarcodeFormats
                });

            return true;

        } catch (error) {

            console.warn(
                "NATIVE BARCODE DETECTOR ERROR:",
                error
            );

            this.detector = null;

            return false;
        }
    },

    /* ======================================
       NATIVE SCANNER LOOP
    ====================================== */

    startNativeScanner(
        currentSession,
        video,
        message
    ) {

        this.nativeScanning = true;
        this.scanning = true;

        this.detectBusy = false;
        this.lastFrameTime = 0;

        const scanFrame = async (timestamp) => {

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive ||
                !this.scanning ||
                !this.nativeScanning
            ) {
                return;
            }

            /*
             * Batasi proses decoding sekitar 12 FPS.
             * Menghindari penggunaan CPU berlebihan.
             */

            if (
                timestamp - this.lastFrameTime < 80 ||
                this.detectBusy
            ) {

                this.animationFrameId =
                    requestAnimationFrame(scanFrame);

                return;
            }

            this.lastFrameTime = timestamp;

            this.detectBusy = true;

            try {

                if (
                    video.readyState <
                    HTMLMediaElement.HAVE_CURRENT_DATA
                ) {
                    return;
                }

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

                if (
                    !results ||
                    results.length === 0
                ) {
                    return;
                }

                const result = results[0];

                const barcode = String(
                    result.rawValue || ""
                ).trim();

                if (!barcode) {
                    return;
                }

                await this.onBarcodeDetected(
                    barcode,
                    currentSession,
                    message
                );

            } catch (error) {

                console.error(
                    "NATIVE BARCODE DETECT ERROR:",
                    error
                );

                /*
                 * Jika native gagal ketika berjalan,
                 * lanjutkan dengan ZXing pada stream yang sama.
                 */

                if (
                    currentSession === this.sessionId &&
                    this.sessionActive &&
                    this.scanning
                ) {

                    this.stopNativeScanner();

                    if (message) {

                        message.textContent =
                            "Beralih ke scanner kompatibilitas...";
                    }

                    await this.startZXingFallback(
                        currentSession,
                        video,
                        message
                    );

                    return;
                }

            } finally {

                this.detectBusy = false;
            }

            if (
                currentSession === this.sessionId &&
                this.sessionActive &&
                this.scanning &&
                this.nativeScanning
            ) {

                this.animationFrameId =
                    requestAnimationFrame(scanFrame);
            }
        };

        this.animationFrameId =
            requestAnimationFrame(scanFrame);
    },

    /* ======================================
       ZXING MULTI FORMAT FALLBACK
    ====================================== */

    async startZXingFallback(
        currentSession,
        video,
        message
    ) {

        try {

            if (
                !window.ZXingBrowser ||
                !window.ZXingBrowser.BrowserMultiFormatReader
            ) {

                throw new Error(
                    "ZXing MultiFormat Reader tidak tersedia. Periksa library @zxing/browser."
                );
            }

            const ZXingCore = window.ZXing;

            let hints = undefined;

            /*
             * Atur format barcode pada ZXing.
             */

            if (
                ZXingCore &&
                ZXingCore.DecodeHintType &&
                ZXingCore.BarcodeFormat
            ) {

                const formats = [
                    "EAN_13",
                    "EAN_8",
                    "UPC_A",
                    "UPC_E",
                    "CODE_128",
                    "CODE_39",
                    "ITF",
                    "QR_CODE",
                    "DATA_MATRIX"
                ];

                const possibleFormats =
                    formats
                        .map(name => ZXingCore.BarcodeFormat[name])
                        .filter(format => format !== undefined);

                hints = new Map();

                hints.set(
                    ZXingCore.DecodeHintType.POSSIBLE_FORMATS,
                    possibleFormats
                );
            }

            const ReaderClass =
                window.ZXingBrowser.BrowserMultiFormatReader;

            this.reader = new ReaderClass(hints);

            if (
                "timeBetweenDecodingAttempts" in this.reader
            ) {

                this.reader.timeBetweenDecodingAttempts = 50;
            }

            if (message) {

                message.textContent =
                    "Scanner aktif. Arahkan barcode ke kamera...";
            }

            this.scanning = true;
            this.nativeScanning = false;

            const controls =
                await this.reader.decodeFromVideoElement(
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

                        if (!barcode) {
                            return;
                        }

                        await this.onBarcodeDetected(
                            barcode,
                            currentSession,
                            message,
                            callbackControls
                        );
                    }
                );

            /*
             * Cegah kontrol scanner aktif setelah modal ditutup
             * saat ZXing masih mempersiapkan reader.
             */

            if (
                currentSession !== this.sessionId ||
                !this.sessionActive ||
                !this.scanning
            ) {

                try {
                    controls.stop();
                } catch (error) {}

                return;
            }

            this.controls = controls;

        } catch (error) {

            if (currentSession !== this.sessionId) {
                return;
            }

            console.error(
                "ZXING MULTI FORMAT ERROR:",
                error
            );

            throw error;
        }
    },

    /* ======================================
       BARCODE BERHASIL DITEMUKAN
    ====================================== */

    async onBarcodeDetected(
        barcode,
        currentSession,
        message,
        callbackControls = null
    ) {

        if (
            currentSession !== this.sessionId ||
            !this.sessionActive ||
            !this.scanning
        ) {
            return;
        }

        barcode = String(barcode || "").trim();

        if (!barcode) {
            return;
        }

        /*
         * Tidak membatasi panjang barcode.
         * EAN, UPC, CODE 128, CODE 39, QR, dan lainnya
         * dapat diproses sesuai hasil reader.
         */

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

        this.playBeep("success");

        if (message) {

            message.textContent =
                "Barcode ditemukan: " + barcode;
        }

        const activeControls =
            callbackControls || this.controls;

        if (activeControls) {

            try {
                activeControls.stop();
            } catch (error) {

                console.warn(
                    "ZXING STOP ERROR:",
                    error
                );
            }
        }

        this.controls = null;

        await this.handleBarcode(barcode);
    },

    /* ======================================
       OPTIMASI KAMERA
    ====================================== */

    optimizeCamera() {

        try {

            if (!this.stream) {
                return;
            }

            const tracks =
                this.stream.getVideoTracks();

            if (!tracks.length) {
                return;
            }

            const track = tracks[0];

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

            if (capabilities.zoom) {

                const minZoom =
                    Number(capabilities.zoom.min);

                const maxZoom =
                    Number(capabilities.zoom.max);

                const targetZoom = Math.max(
                    minZoom,
                    Math.min(maxZoom, 1.5)
                );

                if (
                    targetZoom >= minZoom &&
                    targetZoom <= maxZoom
                ) {

                    advanced.zoom = targetZoom;
                }
            }

            if (
                Object.keys(advanced).length > 0 &&
                track.applyConstraints
            ) {

                track.applyConstraints({
                    advanced: [advanced]
                }).catch(error => {

                    console.warn(
                        "CAMERA OPTIMIZATION TIDAK TERSEDIA:",
                        error
                    );
                });
            }

        } catch (error) {

            console.warn(
                "CAMERA OPTIMIZATION ERROR:",
                error
            );
        }
    },

    /* ======================================
       STOP NATIVE SCANNER
    ====================================== */

    stopNativeScanner() {

        this.nativeScanning = false;

        if (this.animationFrameId !== null) {

            cancelAnimationFrame(
                this.animationFrameId
            );

            this.animationFrameId = null;
        }

        this.detectBusy = false;
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

                const barcodeInput =
                    document.getElementById(
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

                const barcodeInput =
                    document.getElementById(
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

        const closeButton =
            document.getElementById(
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
       CLOSE
    ====================================== */

    close() {

        /*
         * Invalidasi sesi sebelum menghentikan kamera.
         */

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
            } catch (error) {}

            if (video.srcObject) {

                video.srcObject
                    .getTracks()
                    .forEach(track => {

                        try {
                            track.stop();
                        } catch (error) {}
                    });

                video.srcObject = null;
            }
        }

        this.detector = null;
        this.reader = null;

        this.lastBarcode = "";
        this.lastDetectedTime = 0;
        this.scanCount = 0;

        this.detectBusy = false;
        this.lastFrameTime = 0;

        this.targetMode = "pembelian";
        this.targetIndex = -1;

        /*
         * startPromise dibersihkan oleh finally
         * pada startScanner().
         */
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
