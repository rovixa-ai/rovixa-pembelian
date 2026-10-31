// ======================================
// TREEHOUSE POS
// PEMBELIAN
// BARCODE SCANNER RENDER
// FILE: pembelian-scanner-render.js
// ======================================

const PembelianScannerRender = {

    render() {

        return `

            <div
                class="pembelian-barcode-scanner"
                id="pembelian-barcode-scanner"
                hidden
            >

                <div class="pembelian-barcode-scanner-backdrop"></div>

                <div
                    class="pembelian-barcode-scanner-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pembelian-barcode-scanner-title"
                >

                    <div class="pembelian-barcode-scanner-header">

                        <div>

                            <h3 id="pembelian-barcode-scanner-title">
                                Scan Barcode
                            </h3>

                            <p>
                                Arahkan barcode ke kamera
                            </p>

                        </div>

                        <button
                            type="button"
                            id="pembelian-barcode-scanner-close"
                            aria-label="Tutup scanner"
                            title="Tutup"
                        >
                            ✕
                        </button>

                    </div>

                    <div class="pembelian-barcode-scanner-camera">

                        <video
                            id="pembelian-barcode-scanner-video"
                            autoplay
                            muted
                            playsinline
                        ></video>

                        <div class="pembelian-barcode-scanner-frame">

                            <div
                                class="pembelian-barcode-scanner-line"
                            ></div>

                        </div>

                    </div>

                    <div class="pembelian-barcode-scanner-status">

                        <span id="pembelian-barcode-scanner-message">
                            Menyiapkan kamera...
                        </span>

                    </div>

                </div>

            </div>

        `;

    }

};