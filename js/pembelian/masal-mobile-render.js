/* ======================================
   TREEHOUSE POS
   PEMBELIAN MASSAL
   MOBILE PAGE RENDER
   FILE: masal-render-mobile.js
====================================== */

const PembelianMassalMobileRender = {

    render() {

        return `
            <div
                class="pembelian-massal-mobile-page"
                id="pembelian-massal-modal"
            >

                <section
                    class="pembelian-massal-mobile-container"
                    aria-labelledby="pembelian-massal-mobile-title"
                >

                    <!-- HEADER -->

                    <header class="pembelian-massal-mobile-header">

                        <div class="pembelian-massal-mobile-header-info">

                            <h2 id="pembelian-massal-mobile-title">
                                Pembelian
                            </h2>

                            <p>
                                Transaksi pembelian barang
                            </p>

                        </div>

                    </header>

                    <!-- FORM BODY -->

                    <div class="pembelian-massal-mobile-body">

                        <!-- INFORMASI PEMBELIAN -->

                        <section class="pembelian-massal-mobile-info">

                            <div class="pembelian-massal-mobile-section-heading">

                                <h3>Informasi Pembelian</h3>

                            </div>

                            <div class="pembelian-massal-mobile-info-grid">

                                <div class="pembelian-massal-mobile-field">

                                    <label for="massal-tanggal">
                                        Tanggal Pembelian
                                    </label>

                                    <input
                                        type="date"
                                        id="massal-tanggal"
                                        required
                                    >

                                </div>

                                <div class="pembelian-massal-mobile-field">

                                    <label for="massal-supplier">
                                        Supplier
                                    </label>

                                    <input
                                        type="text"
                                        id="massal-supplier"
                                        value="Supplier"
                                        placeholder="Nama supplier"
                                        required
                                    >

                                </div>

                                <div class="pembelian-massal-mobile-field">

                                    <label for="massal-invoice">
                                        No. Invoice
                                    </label>

                                    <input
                                        type="text"
                                        id="massal-invoice"
                                        placeholder="Nomor invoice"
                                    >

                                </div>

                            </div>

                        </section>

                        <!-- DAFTAR BARANG -->

                        <section class="pembelian-massal-mobile-items-section">

                            <div class="pembelian-massal-mobile-section-heading">

                                <div>
                                    <h3>Daftar Barang</h3>

                                    <p>
                                        Masukkan barang pembelian
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    id="massal-tambah-item-bottom"
                                    class="pembelian-massal-mobile-add-button"
                                >
                                    <span aria-hidden="true">+</span>
                                    Tambah
                                </button>

                            </div>

                            <!--
                                ID dipertahankan agar fungsi JavaScript
                                yang sudah ada tetap dapat digunakan.
                            -->

                            <div class="pembelian-massal-mobile-table-wrapper">

                                <table class="pembelian-massal-mobile-table">

                                    <thead>
                                        <tr>
                                            <th>Nama Barang</th>
                                            <th>Kode</th>
                                            <th>Barcode</th>
                                            <th>Satuan</th>
                                            <th>Isi</th>
                                            <th>Qty</th>
                                            <th>Harga Beli</th>
                                            <th>Total Harga</th>
                                            <th>Jual PCS</th>
                                            <th>Jual</th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody id="massal-items"></tbody>

                                </table>

                            </div>

                            <!-- KARTU BARANG MOBILE -->

                            <div
                                class="pembelian-massal-mobile-items"
                                id="massal-mobile-items"
                            ></div>

                        </section>

                        <!-- PEMBAYARAN -->

                        <section class="pembelian-massal-mobile-payment-section">

                            <div class="pembelian-massal-mobile-section-heading">

                                <h3>Pembayaran</h3>

                            </div>

                            <div class="pembelian-massal-mobile-payment-grid">

                                <div class="pembelian-massal-mobile-field">

                                    <label for="massal-metode">
                                        Metode Pembayaran
                                    </label>

                                    <select id="massal-metode">

                                        <option value="Cash">
                                            Cash
                                        </option>

                                        <option value="Transfer">
                                            Transfer
                                        </option>

                                        <option value="QRIS">
                                            QRIS
                                        </option>

                                        <option value="Kartu">
                                            Kartu
                                        </option>

                                    </select>

                                </div>

                                <div class="pembelian-massal-mobile-field">

                                    <label for="massal-nominal">
                                        Nominal Dibayar
                                    </label>

                                    <input
                                        type="number"
                                        id="massal-nominal"
                                        min="0"
                                        step="1"
                                        value="0"
                                    >

                                </div>

                                <div class="pembelian-massal-mobile-payment-action">

                                    <button
                                        type="button"
                                        id="massal-isi-sisa"
                                        class="pembelian-massal-mobile-fill-button"
                                    >
                                        Isi Sesuai Total
                                    </button>

                                </div>

                            </div>

                        </section>

                    </div>

                    <!-- RINGKASAN DAN AKSI -->

                    <footer class="pembelian-massal-mobile-footer">

                        <div class="pembelian-massal-mobile-summary">

                            <span>Total Pembelian</span>

                            <strong id="massal-grand-total">
                                Rp 0
                            </strong>

                        </div>

                        <div class="pembelian-massal-mobile-footer-actions">

                            <button
                                type="button"
                                class="pembelian-massal-mobile-reset-button"
                                data-massal-action="reset"
                            >
                                Reset Form
                            </button>

                            <button
                                type="button"
                                id="massal-simpan"
                                class="pembelian-massal-mobile-save-button"
                            >
                                Simpan Pembelian
                            </button>

                        </div>

                    </footer>

                </section>

            </div>
        `;
    }

};