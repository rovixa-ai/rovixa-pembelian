// ======================================
// TREEHOUSE POS
// LAPORAN PEMBELIAN
// DETAIL MOBILE RENDER
// FILE: laporan-pembelian-detail-render-mobile.js
// ======================================

const LaporanPembelianDetailMobileRender = {

    render({ row, items, payments, report }) {

        return `

            <div
                class="laporan-pembelian-detail-overlay"
                data-action="close-detail"
            ></div>

            <div class="laporan-pembelian-detail-dialog">

                <div class="laporan-pembelian-detail-header">

                    <div>
                        <h3>Detail Pembelian</h3>

                        <p>
                            ${report.escape(row.id || "-")}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="laporan-pembelian-detail-close"
                        data-action="close-detail"
                    >
                        ×
                    </button>

                </div>

                <div class="laporan-pembelian-detail-info">

                    <div>
                        <span>ID Pembelian</span>
                        <strong>${report.escape(row.id || "-")}</strong>
                    </div>

                    <div>
                        <span>Tanggal</span>
                        <strong>
                            ${report.escape(
                                report.date(row.tanggal) +
                                (
                                    row.tanggalJam
                                        ? " " + row.tanggalJam
                                        : ""
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Supplier</span>
                        <strong>${report.escape(row.supplier || "-")}</strong>
                    </div>

                    <div>
                        <span>Invoice</span>
                        <strong>${report.escape(row.invoice || "-")}</strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong>${report.escape(row.status || "-")}</strong>
                    </div>

                </div>

                <div class="laporan-pembelian-detail-section">

                    <div class="laporan-pembelian-detail-section-title">
                        Detail Barang
                    </div>

                    <div class="laporan-pembelian-detail-table-wrapper">

                        <table class="laporan-pembelian-detail-table">

                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode</th>
                                    <th>Nama Barang</th>
                                    <th>Satuan</th>
                                    <th>Qty</th>
                                    <th>Konversi</th>
                                    <th>Harga</th>
                                    <th>Disc</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${
                                    items.length
                                        ? items.map((item, index) => `

                                            <tr>
                                                <td>${index + 1}</td>

                                                <td>
                                                    ${report.escape(item.kode || "-")}
                                                </td>

                                                <td>
                                                    ${report.escape(item.namaBarang || "-")}
                                                </td>

                                                <td>
                                                    ${report.escape(item.satuan || "-")}
                                                </td>

                                                <td>
                                                    ${report.number(item.qty)}
                                                </td>

                                                <td>
                                                    ${report.number(item.konversi)}
                                                </td>

                                                <td>
                                                    ${report.money(item.harga)}
                                                </td>

                                                <td>
                                                    ${report.money(item.disc)}
                                                </td>

                                                <td>
                                                    <strong>
                                                        ${report.money(item.total)}
                                                    </strong>
                                                </td>
                                            </tr>

                                        `).join("")
                                        : `
                                            <tr>
                                                <td
                                                    colspan="9"
                                                    class="laporan-pembelian-detail-empty"
                                                >
                                                    Tidak ada detail barang.
                                                </td>
                                            </tr>
                                        `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

                <div class="laporan-pembelian-detail-total">

                    <div>
                        <span>Subtotal</span>
                        <strong>${report.money(row.subtotal)}</strong>
                    </div>

                    <div>
                        <span>Discount</span>
                        <strong>
                            ${report.money(row.disc ?? row.discount ?? 0)}
                        </strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>${report.money(row.total)}</strong>
                    </div>

                </div>

                <div class="laporan-pembelian-detail-section">

                    <div class="laporan-pembelian-detail-section-title">
                        Pembayaran
                    </div>

                    <div class="laporan-pembelian-detail-table-wrapper">

                        <table class="laporan-pembelian-detail-table">

                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Metode</th>
                                    <th>Nominal</th>
                                    <th>Kembalian</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${
                                    payments.length
                                        ? payments.map((payment, index) => `

                                            <tr>
                                                <td>${index + 1}</td>

                                                <td>
                                                    ${report.escape(payment.metode || "-")}
                                                </td>

                                                <td>
                                                    ${report.money(payment.nominal)}
                                                </td>

                                                <td>
                                                    ${report.money(payment.kembalian)}
                                                </td>
                                            </tr>

                                        `).join("")
                                        : `
                                            <tr>
                                                <td
                                                    colspan="4"
                                                    class="laporan-pembelian-detail-empty"
                                                >
                                                    Tidak ada pembayaran.
                                                </td>
                                            </tr>
                                        `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

                <div class="laporan-pembelian-detail-footer">

                    <button
                        type="button"
                        data-action="close-detail"
                    >
                        Tutup
                    </button>

                </div>

            </div>

        `;

    }

};