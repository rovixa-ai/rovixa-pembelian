// ======================================
// TREEHOUSE POS
// PEMBELIAN MASSAL
// ITEM CONTROLLER
// FILE: pembelian-massal-item.js
// ======================================

const PembelianMassalItem = {

    /* ======================================
       TAMBAH BARIS ITEM
    ====================================== */

    addItem(controller = PembelianMassal) {

        const kodeBaru = this.generateKodeBarang(controller);

        controller.items.push({

            barang: kodeBaru,
            namaBarang: "",
            barcode: "",
            satuan: "",

            satuanList: [],

            konversi: 1,
            qty: 1,
            harga: 0,
            disc: 0,

            hargaJualPCS: 0,
            hargaJual: 0

        });

        this.renderItems(controller);
        controller.updateTotal();
    },


    /* ======================================
       GENERATE KODE BARANG BARU
    ====================================== */

    generateKodeBarang(controller = PembelianMassal) {

        const kodeTerpakai = new Set();

        (controller.barangList || []).forEach(barang => {

            const kode = String(barang.kode || "")
                .trim()
                .toUpperCase();

            if (kode) {
                kodeTerpakai.add(kode);
            }
        });

        (controller.items || []).forEach(item => {

            const kode = String(item.barang || "")
                .trim()
                .toUpperCase();

            if (kode) {
                kodeTerpakai.add(kode);
            }
        });

        let nomor = 1;
        let kodeBaru = "";

        do {

            kodeBaru =
                "BRG" + String(nomor).padStart(4, "0");

            nomor++;

        } while (kodeTerpakai.has(kodeBaru));

        return kodeBaru;
    },


    /* ======================================
       RENDER KODE BARANG
    ====================================== */

    renderKodeBarang(index, controller = PembelianMassal) {

        const item = controller.items[index];

        if (!item) return "";

        if (!item.barang) {
            item.barang = this.generateKodeBarang(controller);
        }

        return `
            <input
                type="text"
                value="${controller.escapeAttribute(item.barang)}"
                data-massal-field="kode"
                data-massal-index="${index}"
                readonly
            >
        `;
    },


    /* ======================================
       GENERATE BARCODE
    ====================================== */

    generateBarcode(controller = PembelianMassal) {

        const barcodeList = new Set([

            ...(controller.barangList || []).map(
                barang =>
                    String(barang.barcode || "").trim()
            ),

            ...(controller.satuanList || []).map(
                satuan =>
                    String(satuan.barcodeSatuan || "").trim()
            ),

            ...(controller.items || []).map(
                item =>
                    String(item.barcode || "").trim()
            )

        ].filter(Boolean));

        let barcode = "";

        do {

            barcode =
                String(Date.now()) +
                String(
                    Math.floor(Math.random() * 10)
                );

        } while (barcodeList.has(barcode));

        return barcode;
    },


    /* ======================================
       CARI BARANG BERDASARKAN NAMA
    ====================================== */

    changeNamaBarang(
        index,
        namaBarang,
        controller = PembelianMassal
    ) {

        const item = controller.items[index];

        if (!item) return;

        item.namaBarang = namaBarang;

        const nama = String(namaBarang || "")
            .trim()
            .toLowerCase();

        if (!nama) {

            item.satuanList = [];
            item.satuan = "";
            item.barcode = "";
            item.konversi = 1;
            item.harga = 0;
            item.hargaJualPCS = 0;
            item.hargaJual = 0;

            this.renderItems(controller);
            controller.updateTotal();

            return;
        }

        const barang = controller.barangList.find(
            row =>
                String(row.nama || "")
                    .trim()
                    .toLowerCase() === nama
        );

        if (barang) {

            item.barang = String(barang.kode || "")
                .trim()
                .toUpperCase();

            item.namaBarang = barang.nama || namaBarang;

            item.satuanList = controller.satuanList.filter(
                row =>
                    String(row.kode) === String(barang.kode)
            );

            item.satuan = "";
            item.konversi = 1;
            item.harga = 0;
            item.hargaJualPCS = 0;
            item.hargaJual = 0;

            item.barcode = String(
                barang.barcode || ""
            );

            const satuanDasar = item.satuanList.find(
                row =>
                    PembelianMassalSatuan.normalizeSatuan(
                        row.satuan
                    ) === "PCS"
            );

            if (satuanDasar) {

                item.hargaJualPCS = Number(
                    satuanDasar.hargaJual
                ) || 0;
            }

            this.renderItems(controller);
            controller.updateTotal();

            return;
        }

        const barangBaruLain = controller.items.find(
            (row, rowIndex) =>
                rowIndex !== index &&
                String(row.namaBarang || "")
                    .trim()
                    .toLowerCase() === nama &&
                !controller.barangList.some(
                    masterBarang =>
                        String(masterBarang.kode) ===
                        String(row.barang)
                )
        );

        if (barangBaruLain) {

            item.barang = barangBaruLain.barang;

            item.satuanList =
                barangBaruLain.satuanList || [];

        } else {

            item.barang = this.generateKodeBarang(controller);

            item.satuanList = [];
        }

        item.satuan = "";
        item.konversi = 1;
        item.harga = 0;
        item.hargaJualPCS = 0;
        item.hargaJual = 0;

        if (!item.barcode) {
            item.barcode = "";
        }

        this.renderItems(controller);
        controller.updateTotal();
    },


    /* ======================================
       GANTI BARANG
    ====================================== */

    changeBarang(
        index,
        kodeBarang,
        controller = PembelianMassal
    ) {

        const item = controller.items[index];

        if (!item) return;

        const barang = controller.barangList.find(
            row =>
                String(row.kode) === String(kodeBarang)
        );

        if (!barang) {
            return;
        }

        item.barang = String(barang.kode || "")
            .trim()
            .toUpperCase();

        item.namaBarang = barang.nama || "";

        item.barcode = String(
            barang.barcode || ""
        );

        item.satuan = "";
        item.konversi = 1;
        item.qty = 1;
        item.harga = 0;
        item.hargaJualPCS = 0;
        item.hargaJual = 0;

        item.satuanList = controller.satuanList.filter(
            row =>
                String(row.kode) === String(barang.kode)
        );

        const satuanDasar = item.satuanList.find(
            row =>
                PembelianMassalSatuan.normalizeSatuan(
                    row.satuan
                ) === "PCS"
        );

        if (satuanDasar) {

            item.hargaJualPCS = Number(
                satuanDasar.hargaJual
            ) || 0;
        }

        this.renderItems(controller);
        controller.updateTotal();
    },


    /* ======================================
       RENDER ITEM DESKTOP DAN MOBILE
    ====================================== */

    renderItems(controller = PembelianMassal) {

        const desktop = document.getElementById(
            "massal-items"
        );

        if (desktop) {

            desktop.innerHTML = controller.items.map(
                (item, index) => {

                    return `
                        <tr>

                            <td>
                                <input
                                    type="text"
                                    value="${controller.escapeAttribute(item.namaBarang)}"
                                    placeholder="Nama barang"
                                    list="massal-nama-barang-${index}"
                                    data-massal-field="namaBarang"
                                    data-massal-index="${index}"
                                >

                                <datalist id="massal-nama-barang-${index}">
                                    ${(controller.barangList || []).map(barang => `
                                        <option value="${controller.escapeAttribute(barang.nama || "")}"></option>
                                    `).join("")}
                                </datalist>
                            </td>

                            <td>
                                ${this.renderKodeBarang(index, controller)}
                            </td>

                            <td>
                                <input
                                    type="text"
                                    value="${controller.escapeAttribute(item.barcode)}"
                                    placeholder="Isi barcode"
                                    data-massal-field="barcode"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <input
                                    type="text"
                                    value="${controller.escapeAttribute(item.satuan)}"
                                    placeholder="Satuan"
                                    list="massal-satuan-${index}"
                                    data-massal-field="satuan"
                                    data-massal-index="${index}"
                                >

                                <datalist id="massal-satuan-${index}">
                                    ${(item.satuanList || []).map(satuan => `
                                        <option value="${controller.escapeAttribute(satuan.satuan || "")}"></option>
                                    `).join("")}
                                </datalist>
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value="${item.konversi}"
                                    data-massal-field="konversi"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value="${item.qty}"
                                    data-massal-field="qty"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value="${item.harga|| ''}"
                                    placeholder="Harga beli ${item.satuan || ''}"
                                    data-massal-field="harga"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <strong data-massal-total="${index}">
                                    ${controller.formatRupiah(this.itemTotal(item))}
                                </strong>
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value="${item.hargaJualPCS || ''}"
                                    placeholder="Harga jual PCS"
                                    data-massal-field="hargaJualPCS"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <input
                                    type="number"
                                    value="${item.hargaJual || ''}"
                                    placeholder="Harga jual ${item.satuan || ''}"
                                    data-massal-field="hargaJual"
                                    data-massal-index="${index}"
                                >
                            </td>

                            <td>
                                <button
                                    type="button"
                                    data-massal-remove="${index}"
                                    aria-label="Hapus barang"
                                >
                                    &times;
                                </button>
                            </td>

                        </tr>
                    `;
                }
            ).join("");
        }

        PembelianMassalItemMobileRender.render(
            this,
            controller
        );
    },


    /* ======================================
       HITUNG TOTAL ITEM
    ====================================== */

    itemTotal(item) {

        return Math.max(
            0,
            (
                Number(item.qty || 0) *
                Number(item.harga || 0)
            ) - Number(item.disc || 0)
        );
    }

};