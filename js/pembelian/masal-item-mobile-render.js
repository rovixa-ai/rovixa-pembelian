// ======================================
// TREEHOUSE POS
// PEMBELIAN MASSAL
// ITEM MOBILE RENDER
// FILE: pembelian-massal-item-mobile-render.js
// ======================================

const PembelianMassalItemMobileRender = {

    /* ======================================
       RENDER ITEM MOBILE
    ====================================== */

    render(controller = PembelianMassalItem, page = PembelianMassal) {

        const mobile = document.getElementById(
            "massal-mobile-items"
        );

        if (!mobile) {
            return;
        }

        const items = page.items || [];

        mobile.innerHTML = items.map((item, index) => {

            const satuanList = item.satuanList || [];

            const escape = value =>
                page.escapeAttribute(
                    value === null || value === undefined
                        ? ""
                        : String(value)
                );

            const satuanOptions = satuanList.map(satuan => `
                <option
                    value="${escape(satuan.satuan)}"
                    ${String(item.satuan || "").trim().toUpperCase() === String(satuan.satuan || "").trim().toUpperCase() ? "selected" : ""}
                >
                    ${page.escapeHTML(satuan.satuan || "")}
                </option>
            `).join("");

            return `
                <article class="pembelian-massal-mobile-card">

                    <div class="pembelian-massal-mobile-card-header">

                        <strong>Barang ${index + 1}</strong>

                        <button
                            type="button"
                            data-massal-remove="${index}"
                            aria-label="Hapus barang"
                        >
                            Hapus
                        </button>

                    </div>

                    <div class="pembelian-massal-mobile-field">

                        <label>Barang</label>

                        <input
                            type="text"
                            value="${escape(item.namaBarang)}"
                            placeholder="Nama barang"
                            list="massal-mobile-nama-${index}"
                            data-massal-field="namaBarang"
                            data-massal-index="${index}"
                        >

                        <datalist id="massal-mobile-nama-${index}">
                            ${(page.barangList || []).map(barang => `
                                <option value="${escape(barang.nama)}"></option>
                            `).join("")}
                        </datalist>

                    </div>

                    <div class="pembelian-massal-mobile-identity-grid">

                        <div class="pembelian-massal-mobile-field">

                            <label>Kode</label>

                            <input
                                type="text"
                                value="${escape(item.barang)}"
                                data-massal-field="kode"
                                data-massal-index="${index}"
                                readonly
                            >

                        </div>

                        <div class="pembelian-massal-mobile-field">

                            <label>Barcode</label>

                            <div class="pembelian-massal-mobile-barcode-wrapper">

                                <input
                                    type="text"
                                    value="${escape(item.barcode)}"
                                    placeholder="Barcode"
                                    data-massal-field="barcode"
                                    data-massal-index="${index}"
                                >

                                <button
                                    type="button"
                                    class="pembelian-massal-mobile-barcode-camera"
                                    data-massal-action="scan-barcode"
                                    data-massal-index="${index}"
                                    title="Scan Barcode"
                                    aria-label="Scan Barcode"
                                >
                                    <img
                                        src="icons/camera.png"
                                        alt=""
                                    >
                                </button>

                            </div>

                        </div>

                        <div class="pembelian-massal-mobile-field">

                            <label>Satuan</label>

                            <input
                                type="text"
                                value="${escape(item.satuan)}"
                                placeholder="Pilih atau ketik satuan"
                                list="massal-mobile-satuan-${index}"
                                data-massal-field="satuan"
                                data-massal-index="${index}"
                                autocomplete="off"
                            >

                            <datalist id="massal-mobile-satuan-${index}">
                                ${(item.satuanList || []).map(satuan => `
                                    <option value="${escape(satuan.satuan || satuan.nama || satuan)}"></option>
                                `).join("")}
                            </datalist>

                        </div>

                    </div>

                    <div class="pembelian-massal-mobile-grid">

                        <div class="pembelian-massal-mobile-field">

                            <label>Isi</label>

                            <input
                                type="number"
                                min="1"
                                step="any"
                                value="${item.konversi}"
                                data-massal-field="konversi"
                                data-massal-index="${index}"
                            >

                        </div>

                        <div class="pembelian-massal-mobile-field">

                            <label>Qty</label>

                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                value="${item.qty}"
                                data-massal-field="qty"
                                data-massal-index="${index}"
                            >

                        </div>

                        <div class="pembelian-massal-mobile-field">

                            <label>Harga</label>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                value="${item.harga|| ''}"
                                placeholder="Harga beli ${item.satuan || ''}"
                                data-massal-field="harga"
                                data-massal-index="${index}"
                            >

                        </div>

                    </div>

                    <div class="pembelian-massal-mobile-grid">

                        <div class="pembelian-massal-mobile-field">

                            <label>Harga Jual PCS</label>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                value="${item.hargaJualPCS || ''}"
                                placeholder="Harga jual PCS"
                                data-massal-field="hargaJualPCS"
                                data-massal-index="${index}"
                            >

                        </div>

                        <div class="pembelian-massal-mobile-field">

                            <label>Harga Jual Satuan</label>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                value="${item.hargaJual || ''}"
                                placeholder="Harga jual ${item.satuan || ''}"
                                data-massal-field="hargaJual"
                                data-massal-index="${index}"
                            >

                        </div>

                    </div>

                    <div class="pembelian-massal-mobile-total">

                        <span>Total Harga</span>

                        <strong data-massal-total="${index}">
                            ${page.formatRupiah(
                                PembelianMassalItem.itemTotal(item)
                            )}
                        </strong>

                    </div>

                </article>
            `;

        }).join("");

    }

};