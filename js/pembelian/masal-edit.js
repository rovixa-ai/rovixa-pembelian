/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
EDIT TRANSAKSI
FILE: masal-edit.js
====================================== */

Object.assign(PembelianMassal, {

    /* ======================================
       MUAT TRANSAKSI UNTUK EDIT
    ====================================== */

    async loadEditData(id) {

        const purchaseId = String(id || "").trim();

        if (!purchaseId) {
            Dialog.error("ID pembelian tidak ditemukan.");
            return false;
        }

        this.items = [];

        let purchase = await DB.get(
            "pembelian",
            purchaseId
        );

        if (!purchase) {

            const purchases =
                await DB.getAll("pembelian") || [];

            purchase = purchases.find(item =>
                String(item.id || "") === purchaseId ||
                String(item.serverId || "") === purchaseId
            );
        }

        if (!purchase) {

            Dialog.error(
                "Data pembelian tidak ditemukan di database lokal."
            );

            this.returnFromEdit();
            return false;
        }

        const actualId = String(
            purchase.id || purchaseId
        );

        this.editMode = true;
        this.editId = actualId;
        this.editOriginal = { ...purchase };

        /* ======================================
           PULIHKAN HEADER TRANSAKSI
        ====================================== */

        const tanggal = document.getElementById(
            "massal-tanggal"
        );

        const supplier = document.getElementById(
            "massal-supplier"
        );

        const invoice = document.getElementById(
            "massal-invoice"
        );

        if (tanggal) {
            tanggal.value = String(
                purchase.tanggal || ""
            ).slice(0, 10);
        }

        if (supplier) {
            supplier.value = purchase.supplier || "";
        }

        if (invoice) {
            invoice.value = purchase.invoice || "";
        }

        /* ======================================
           SIAPKAN ID REFERENSI TRANSAKSI
        ====================================== */

        const possibleIds = new Set(
            [
                purchaseId,
                actualId,
                String(purchase.serverId || ""),
                String(purchase.referenceId || "")
            ].filter(Boolean)
        );

        /* ======================================
           AMBIL SELURUH DETAIL BARANG
        ====================================== */

        const allDetails =
            await DB.getAll("detailPembelian") || [];

        const details = allDetails.filter(detail => {

            const reference = String(
                detail.pembelianId ||
                detail.transaksiId ||
                detail.idPembelian ||
                detail.idTransaksi ||
                ""
            );

            return possibleIds.has(reference);
        });

        const originalItems = Array.isArray(
            purchase.items
        )
            ? purchase.items
            : [];

        /*
         * Data items yang tersimpan di header menjadi
         * sumber utama karena memuat seluruh field
         * yang disusun oleh masal-save.js.
         *
         * Detail terpisah digunakan jika items tidak
         * tersedia atau kosong.
         */

        const sourceItems = originalItems.length
            ? originalItems
            : details;

        /*
         * Jangan mengganti data transaksi asli dengan
         * nilai master yang mungkin sudah berubah.
         */

        const masterSatuanList = Array.isArray(
            this.satuanList
        )
            ? this.satuanList
            : [];

        this.items = sourceItems.map((row, index) => {

            const rowKode = String(
                row.barang ||
                row.kode ||
                row.kodeBarang ||
                ""
            ).trim().toUpperCase();

            const rowSatuan = String(
                row.satuan || ""
            ).trim();

            const original = originalItems.find(item =>

                String(
                    item.barang ||
                    item.kode ||
                    item.kodeBarang ||
                    ""
                ).trim().toUpperCase() === rowKode &&

                String(
                    item.satuan || ""
                ).trim().toLowerCase() ===
                    rowSatuan.toLowerCase()

            ) || originalItems[index] || {};

            const kode = String(
                row.barang ||
                row.kode ||
                row.kodeBarang ||
                original.barang ||
                original.kode ||
                original.kodeBarang ||
                ""
            ).trim().toUpperCase();

            const namaBarang = String(
                row.namaBarang ||
                row.nama ||
                original.namaBarang ||
                original.nama ||
                ""
            ).trim();

            const satuan = String(
                row.satuan ||
                original.satuan ||
                ""
            ).trim();

            const masterSatuan = masterSatuanList.find(item =>

                String(
                    item.kode ||
                    item.kodeBarang ||
                    ""
                ).trim().toUpperCase() === kode &&

                String(
                    item.satuan || ""
                ).trim().toLowerCase() ===
                    satuan.toLowerCase()

            );

            const masterSatuanPCS = masterSatuanList.find(item =>

                String(
                    item.kode ||
                    item.kodeBarang ||
                    ""
                ).trim().toUpperCase() === kode &&

                String(
                    item.satuan || ""
                ).trim().toUpperCase() === "PCS"

            );

            const barcode =
                row.barcode ??
                original.barcode ??
                masterSatuan?.barcodeSatuan ??
                masterSatuan?.barcode ??
                "";

            const konversi =
                row.konversi ??
                row.isi ??
                original.konversi ??
                original.isi ??
                masterSatuan?.isi ??
                1;

            const qty =
                row.qty ??
                original.qty ??
                0;

            const harga =
                row.harga ??
                original.harga ??
                0;

            const hargaJualPCS = Number(
                row.hargaJualPCS ??
                row.hargaJualDasar ??
                original.hargaJualPCS ??
                original.hargaJualDasar ??
                masterSatuanPCS?.hargaJual ??
                0
            );

            const hargaJual =
                row.hargaJual ??
                original.hargaJual ??
                masterSatuan?.hargaJual ??
                0;

            const disc =
                row.disc ??
                row.diskon ??
                original.disc ??
                original.diskon ??
                0;

            const total =
                row.total ??
                original.total ??
                PembelianMassalItem.itemTotal({
                    qty: Number(qty),
                    harga: Number(harga),
                    disc: Number(disc)
                });

            return {

                namaBarang,

                barang: kode,

                barcode: String(
                    barcode
                ).trim(),

                satuan,

                konversi: Number(konversi),

                qty: Number(qty),

                harga: Number(harga),

                hargaJualPCS,

                hargaJual: Number(
                    hargaJual
                ),

                disc: Number(disc),

                total: Number(total)
            };
        });

        /* ======================================
           AMBIL SELURUH PEMBAYARAN
        ====================================== */

        const allPayments =
            await DB.getAll("pembayaranPembelian") || [];

        const payments = allPayments.filter(payment => {

            const reference = String(
                payment.pembelianId ||
                payment.transaksiId ||
                payment.idPembelian ||
                payment.idTransaksi ||
                ""
            );

            return possibleIds.has(reference);
        });

        const storedPayments = Array.isArray(
            purchase.payments
        )
            ? purchase.payments
            : [];

        /*
         * Pertahankan semua metode dan nominal pembayaran
         * yang tersimpan. Form Pembelian Massal saat ini
         * hanya menyediakan satu metode pembayaran.
         */

        const sourcePayments = payments.length
            ? payments
            : storedPayments;

        const paymentMethods = [
            ...new Set(
                sourcePayments
                    .map(payment =>
                        String(
                            payment.metode || "Cash"
                        ).trim()
                    )
                    .filter(Boolean)
            )
        ];

        if (paymentMethods.length > 1) {

            Dialog.warning(
                "Transaksi ini menggunakan beberapa metode pembayaran. " +
                "Form Pembelian Massal hanya mendukung satu metode. " +
                "Edit dibatalkan agar rincian pembayaran tidak berubah."
            );

            this.returnFromEdit();
            return false;
        }

        const metode = document.getElementById(
            "massal-metode"
        );

        const nominal = document.getElementById(
            "massal-nominal"
        );

        if (metode) {
            metode.value = paymentMethods[0] || "Cash";
        }

        const totalPembayaran = sourcePayments.reduce(
            (sum, payment) =>
                sum + Number(payment.nominal || 0),
            0
        );

        if (nominal) {

            nominal.value = String(
                sourcePayments.length
                    ? totalPembayaran
                    : Number(
                        purchase.dibayar ??
                        purchase.total ??
                        0
                    )
            );
        }

        /* ======================================
           RENDER FORM BARANG
        ====================================== */

        PembelianMassalItem.renderItems(this);

        if (this.items.length === 0) {
            PembelianMassalItem.addItem(this);
        }

        this.updateTotal();

        this.resetEditInterface(true);

        return true;
    },

    /* ======================================
       RESET TAMPILAN EDIT/NORMAL
    ====================================== */

    resetEditInterface(isEditing = false) {

        const saveButton = document.getElementById(
            "massal-simpan"
        );

        const resetButton = document.querySelector(
            '#pembelian-massal-modal [data-massal-action="reset"]'
        );

        const title = document.querySelector(
            "#pembelian-massal-modal h1, " +
            "#pembelian-massal-modal h2"
        );

        if (saveButton) {
            saveButton.textContent = isEditing
                ? "Simpan Perubahan"
                : "Simpan Pembelian";
        }

        if (resetButton) {
            resetButton.textContent = isEditing
                ? "Batal Edit"
                : "Reset";
        }

        if (title) {
            title.textContent = isEditing
                ? "Edit Pembelian"
                : "Pembelian Massal";
        }
    },

    /* ======================================
       BERSIHKAN FORM SEPERTI BARU DIBUKA
    ====================================== */

    resetFormAfterEdit() {

        this.items = [];

        const tanggal = document.getElementById(
            "massal-tanggal"
        );

        const supplier = document.getElementById(
            "massal-supplier"
        );

        const invoice = document.getElementById(
            "massal-invoice"
        );

        const metode = document.getElementById(
            "massal-metode"
        );

        const nominal = document.getElementById(
            "massal-nominal"
        );

        if (typeof this.setDefaultDate === "function") {
            this.setDefaultDate();
        } else if (tanggal) {
            tanggal.value = new Date()
                .toISOString()
                .slice(0, 10);
        }

        if (supplier) {
            supplier.value = "Supplier";
        }

        if (invoice) {
            invoice.value = "";
        }

        if (metode) {
            metode.value = "Cash";
        }

        if (nominal) {
            nominal.value = "0";
        }

        this.resetEditInterface(false);

        PembelianMassalItem.renderItems(this);

        this.updateTotal();

        PembelianMassalItem.addItem(this);

        this.initializedElement = document.getElementById(
            "pembelian-massal-modal"
        );
    },

    /* ======================================
       BATAL EDIT DAN KEMBALI KE PEMBELIAN
    ====================================== */

    returnFromEdit() {

        this.editMode = false;
        this.editId = "";
        this.editOriginal = null;
        this.preserveItems = false;
        this.pendingBarcode = "";

        if (
            typeof LaporanPembelian !== "undefined" &&
            typeof LaporanPembelian.returnFromEdit === "function"
        ) {

            LaporanPembelian.returnFromEdit(true);

        } else if (
            typeof Router !== "undefined" &&
            typeof Router.go === "function"
        ) {

            Router.go("pembelian");

        }

        this.resetFormAfterEdit();
    }

});