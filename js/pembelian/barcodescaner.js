
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

audioContext: null,

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

            this.audioContext =
                new AudioContextClass();

        }

        const context =
            this.audioContext;

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

            const now =
                context.currentTime;

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
                        "SALES BARCODE AUDIO ERROR:",
                        error
                    );

                });

        } else {

            playSound();

        }

    } catch (error) {

        console.warn(
            "SALES BARCODE AUDIO ERROR:",
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

        /*
         * Tandai sesi sebelum proses asynchronous dimulai.
         * Pemanggilan kedua tidak akan membuka kamera lagi.
         */

        this.sessionActive = true;

        const currentSession = ++this.sessionId;

        this.startPromise = this.runScanner(
            currentSession,
            modal,
            video,
            message
        );

        try {

            await this.startPromise;

        } finally {

            if (this.sessionId === currentSession) {
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

            /*
             * Hentikan referensi sesi sebelumnya sebelum
             * menghubungkan kamera baru.
             */

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

            /*
             * Bersihkan video hanya sebelum sesi baru.
             * Jangan memanggil video.play() secara manual.
             */

            try {
                video.pause();
            } catch (error) {
                // Video mungkin belum mulai diputar.
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

            if (
                !window.ZXingBrowser ||
                !window.ZXingBrowser.BrowserMultiFormatOneDReader
            ) {
                throw new Error(
                    "Library scanner barcode 1D tidak tersedia."
                );
            }

            this.detector =
                new ZXingBrowser.BrowserMultiFormatOneDReader();

            if (
                "timeBetweenDecodingAttempts" in this.detector
            ) {
                this.detector.timeBetweenDecodingAttempts = 50;
            }

            const constraints = {
                audio: false,
                video: {
                    width: {
                        ideal: 1280,
                        min: 960
                    },
                    height: {
                        ideal: 720,
                        min: 540
                    },
                    frameRate: {
                        ideal: 30,
                        max: 60
                    },
                    facingMode: {
                        ideal: "environment"
                    },
                    focusMode: {
                        ideal: "continuous"
                    }
                }
            };

            this.scanning = true;

            if (message) {
                message.textContent =
                    "Arahkan barcode ke dalam kotak...";
            }

            /*
             * ZXing mengelola koneksi stream dan pemutaran video.
             * Jangan memanggil video.play() secara manual.
             */

            const controls =
                await this.detector.decodeFromConstraints(
                    constraints,
                    video,
                    async (result, error, callbackControls) => {

                        /*
                         * Abaikan callback dari sesi lama,
                         * termasuk callback setelah modal ditutup.
                         */

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

                        /* VALIDASI EAN-13 */

                        if (!/^\d{13}$/.test(barcode)) {
                            return;
                        }

                        /* DEBOUNCE */

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

                        await this.handleBarcode(barcode);
                    }
                );

            /*
             * Jika modal ditutup ketika ZXing masih menyiapkan
             * kamera, hentikan kontrol yang baru saja diperoleh.
             */

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

            /* OPTIMASI KAMERA */

            try {

                if (currentSession !== this.sessionId) {
                    return;
                }

                const tracks = video.srcObject
                    ? video.srcObject.getVideoTracks()
                    : [];

                if (tracks.length > 0) {

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

                    if (capabilities.zoom) {

                        const minZoom = Number(
                            capabilities.zoom.min
                        );

                        const maxZoom = Number(
                            capabilities.zoom.max
                        );

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
                        await track.applyConstraints({
                            advanced: [advanced]
                        });
                    }
                }

            } catch (cameraEnhanceError) {

                console.warn(
                    "CAMERA OPTIMIZATION TIDAK TERSEDIA:",
                    cameraEnhanceError
                );
            }

        } catch (error) {

            /*
             * Jangan tampilkan error dari sesi yang sudah ditutup
             * atau digantikan oleh sesi lain.
             */

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
       CLOSE
    ====================================== */

    close() {

        /*
         * Invalidasi sesi terlebih dahulu agar callback kamera
         * yang terlambat tidak memproses barcode.
         */

        this.sessionId++;
        this.sessionActive = false;
        this.scanning = false;

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
                // Video mungkin belum mulai diputar.
            }

            /*
             * Hentikan hanya stream yang masih terpasang.
             */

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

        /*
         * startPromise sengaja tidak dikosongkan di sini.
         * Promise startup yang masih berjalan akan selesai sendiri
         * dan dibersihkan oleh finally pada startScanner().
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
