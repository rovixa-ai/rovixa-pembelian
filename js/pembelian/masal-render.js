
/* ======================================
   TREEHOUSE POS
   PEMBELIAN MASSAL
   PAGE RENDER
   FILE: masal-render.js
====================================== */

const PembelianMassalRender = {

    render() {

        return `
            <div
                class="pembelian-massal-page"
                id="pembelian-massal-modal"
            >

                <section
                    class="pembelian-massal-container"
                    aria-labelledby="pembelian-massal-title"
                >

                    <header class="pembelian-massal-header">

                        <div>
                            <h2 id="pembelian-massal-title">
                                Pembelian
                            </h2>

                            <p>
                                Transaksi Pembelian barang
                            </p>
                        </div>

                    </header>

                    <div class="pembelian-massal-body">

                        <section class="pembelian-massal-info">

                            

                            <div class="pembelian-massal-info-grid">

                                <div class="pembelian-massal-field">
                                    <label for="massal-tanggal">Tanggal</label>
                                    <input
                                        type="date"
                                        id="massal-tanggal"
                                        required
                                    >
                                </div>

                                <div class="pembelian-massal-field">
                                    <label for="massal-supplier">Supplier</label>
                                    <input
                                        type="text"
                                        id="massal-supplier"
                                        value="Supplier"
                                        placeholder="Nama supplier"
                                        required
                                    >
                                </div>

                                <div class="pembelian-massal-field">
                                    <label for="massal-invoice">No. Invoice</label>
                                    <input
                                        type="text"
                                        id="massal-invoice"
                                        placeholder="Nomor invoice"
                                    >
                                </div>

                            </div>

                        </section>

                        <section class="pembelian-massal-items-section">

                            

                            <div class="pembelian-massal-table-wrapper">

                                <table class="pembelian-massal-table">

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
                                            <th>Jual Satuan</th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody id="massal-items"></tbody>

                                </table>

                            </div>

                            <div
                                class="pembelian-massal-mobile-items"
                                id="massal-mobile-items"
                            ></div>

                            <div class="pembelian-massal-add-bottom">

                                <button
                                    type="button"
                                    id="massal-tambah-item-bottom"
                                    class="pembelian-massal-button pembelian-massal-button-secondary"
                                >
                                    + Tambah Barang
                                </button>

                            </div>

                        </section>

                        <section class="pembelian-massal-payment-section">

                            

                            <div class="pembelian-massal-payment-grid">

                                <div class="pembelian-massal-field">
                                    <label for="massal-metode">
                                        Metode Pembayaran
                                    </label>

                                    <select id="massal-metode">
                                        <option value="Cash">Cash</option>
                                        <option value="Transfer">Transfer</option>
                                        <option value="QRIS">QRIS</option>
                                        <option value="Kartu">Kartu</option>
                                    </select>
                                </div>

                                <div class="pembelian-massal-field">
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

                                <div class="pembelian-massal-payment-action">
                                    <button
                                        type="button"
                                        id="massal-isi-sisa"
                                        class="pembelian-massal-button pembelian-massal-button-secondary"
                                    >
                                        Isi Sesuai Total
                                    </button>
                                </div>

                            </div>

                        </section>

                    </div>

                    <footer class="pembelian-massal-footer">

                        <div class="pembelian-massal-summary">
                            <span>Total Pembelian</span>

                            <strong id="massal-grand-total">
                                Rp 0
                            </strong>
                        </div>

                        <div class="pembelian-massal-footer-actions">

                            <button
                                type="button"
                                class="pembelian-massal-button pembelian-massal-button-cancel"
                                data-massal-action="reset"
                            >
                                Reset Form
                            </button>

                            <button
                                type="button"
                                id="massal-simpan"
                                class="pembelian-massal-button pembelian-massal-button-save"
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
