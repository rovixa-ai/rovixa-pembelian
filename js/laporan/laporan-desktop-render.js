// laporan-pembelian-render-desktop.js

const LaporanPembelianDesktopRender = {

    render() {

        return `

            <div
                class="laporan-pembelian-modal"
                id="laporanPembelianModal"
                hidden
            >

                <div
                    class="laporan-pembelian-modal-backdrop"
                    id="laporanPembelianModalBackdrop"
                ></div>

                <div class="laporan-pembelian-modal-container">

                    <div class="laporan-page-header">

                        <div>
                            <h2>Laporan Pembelian</h2>
                            <p>Laporan transaksi pembelian</p>
                        </div>

                        <div class="laporan-page-actions">

                            <button
                                type="button"
                                id="laporanPembelianLaporan"
                                class="laporan-laporan-button"
                                aria-label="Cetak laporan"
                                title="Cetak laporan"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                    <rect x="6" y="14" width="12" height="8"></rect>
                                </svg>
                            </button>

                            <button
                                type="button"
                                id="laporanPembelianClose"
                                class="laporan-close-button"
                                aria-label="Tutup"
                                title="Tutup"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>

                        </div>

                    </div>

                    <div class="laporan-pembelian-modal-body">

                        <div class="laporan-card">

                            <div class="laporan-card-header">

                                <h3>Filter Laporan</h3>

                            </div>

                            <div class="laporan-form-grid">

                                <div class="laporan-form-group">

                                    <label for="laporanPembelianTanggal">
                                        Tanggal
                                    </label>

                                    <div class="laporan-tanggal-wrapper">

                                        <input
                                            type="date"
                                            id="laporanPembelianTanggal"
                                        >

                                        <button
                                            type="button"
                                            id="laporanPembelianReset"
                                            class="laporan-reset-button"
                                        >
                                            Reset
                                        </button>

                                    </div>

                                </div>

                                <div class="laporan-form-group">

                                    <label for="laporanPembelianSupplier">
                                        Supplier
                                    </label>

                                    <select id="laporanPembelianSupplier">

                                        <option value="">
                                            Semua Supplier
                                        </option>

                                    </select>

                                </div>

                            </div>

                        </div>

                        <div class="laporan-card laporan-summary-card">

                            <div class="laporan-card-header">
                                <h3>Ringkasan</h3>
                            </div>

                            <div class="laporan-summary-grid">

                                <div class="laporan-summary-item">
                                    <span>Total Transaksi</span>
                                    <strong id="laporanPembelianTotalTransaksi">0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Total Item</span>
                                    <strong id="laporanPembelianTotalItem">0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Subtotal</span>
                                    <strong id="laporanPembelianSubtotal">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Discount</span>
                                    <strong id="laporanPembelianDiscount">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Total</span>
                                    <strong id="laporanPembelianTotal">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Cash</span>
                                    <strong id="laporanPembelianCash">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>QRIS</span>
                                    <strong id="laporanPembelianQRIS">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Debit</span>
                                    <strong id="laporanPembelianKartu">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Transfer</span>
                                    <strong id="laporanPembelianTransfer">Rp 0</strong>
                                </div>

                                <div class="laporan-summary-item">
                                    <span>Total Payment</span>
                                    <strong id="laporanPembelianTotalPayment">Rp 0</strong>
                                </div>

                            </div>

                        </div>

                        <div class="laporan-card laporan-result-card">

                            <div class="laporan-card-header">

                                <h3>Transaksi</h3>

                                <span id="laporanPembelianCount">
                                    0 transaksi
                                </span>

                            </div>

                            <div class="laporan-table-wrapper">

                                <table class="laporan-table">

                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>ID</th>
                                            <th>Tanggal &amp; Jam</th>
                                            <th>Supplier</th>
                                            <th>Subtotal</th>
                                            <th>Disc</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody id="laporanPembelianTableBody"></tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;

    }

};