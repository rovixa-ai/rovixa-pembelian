/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
SIMPAN TRANSAKSI
FILE: masal-save.js
====================================== */

Object.assign(PembelianMassal, {

    /* ======================================
       SIMPAN TRANSAKSI
    ====================================== */

    async save() {

        if (this.isSaving) {
            return;
        }

        const tanggal =
            document.getElementById(
                "massal-tanggal"
            )?.value || "";

        const supplier =
            document.getElementById(
                "massal-supplier"
            )?.value.trim() || "";

        const invoice =
            document.getElementById(
                "massal-invoice"
            )?.value.trim() || "";

        const metode =
            document.getElementById(
                "massal-metode"
            )?.value || "Cash";

        const nominal = Number(
            document.getElementById(
                "massal-nominal"
            )?.value || 0
        );

        if (!tanggal) {
            Dialog.error("Tanggal pembelian wajib diisi.");
            return;
        }

        if (!supplier) {
            Dialog.error("Nama supplier wajib diisi.");
            return;
        }

        if (!Array.isArray(this.items) || !this.items.length) {
            Dialog.error("Tambahkan minimal satu barang.");
            return;
        }

        /* ======================================
           VALIDASI BARANG
        ====================================== */

        for (let index = 0; index < this.items.length; index++) {

            const item = this.items[index];

            item.namaBarang = String(
                item.namaBarang || ""
            ).trim();

            item.barang = String(
                item.barang || ""
            ).trim().toUpperCase();

            item.barcode = String(
                item.barcode || ""
            ).trim();

            item.satuan = String(
                item.satuan || ""
            ).trim();

            item.konversi = Number(item.konversi);
            item.qty = Number(item.qty);
            item.harga = Number(item.harga);
            item.hargaJualPCS = Number(item.hargaJualPCS);
            item.hargaJual = Number(item.hargaJual);
            item.disc = Number(item.disc || 0);

            if (!item.namaBarang) {
                Dialog.error(
                    `Nama barang pada baris ${index + 1} wajib diisi.`
                );
                return;
            }

            if (!item.barang) {
                item.barang =
                    PembelianMassalItem.generateKodeBarang(this);
            }

            if (!item.satuan) {
                Dialog.error(
                    `Satuan pembelian pada baris ${index + 1} wajib diisi.`
                );
                return;
            }

            if (
                !Number.isFinite(item.konversi) ||
                item.konversi < 1
            ) {
                Dialog.error(
                    `Konversi / isi pada baris ${index + 1} minimal 1.`
                );
                return;
            }

            if (
                !Number.isFinite(item.qty) ||
                item.qty <= 0
            ) {
                Dialog.error(
                    `Qty pada baris ${index + 1} harus lebih dari 0.`
                );
                return;
            }

            if (
                !Number.isFinite(item.harga) ||
                item.harga < 0
            ) {
                Dialog.error(
                    `Harga beli pada baris ${index + 1} tidak valid.`
                );
                return;
            }

            if (
                !Number.isFinite(item.hargaJualPCS) ||
                item.hargaJualPCS < 0
            ) {
                Dialog.error(
                    `Harga jual PCS pada baris ${index + 1} tidak valid.`
                );
                return;
            }

            if (
                !Number.isFinite(item.hargaJual) ||
                item.hargaJual < 0
            ) {
                Dialog.error(
                    `Harga jual satuan pembelian pada baris ${index + 1} tidak valid.`
                );
                return;
            }

            if (
                !Number.isFinite(item.disc) ||
                item.disc < 0
            ) {
                Dialog.error(
                    `Diskon pada baris ${index + 1} tidak valid.`
                );
                return;
            }
        }

        /* ======================================
           VALIDASI KODE DUPLIKAT
        ====================================== */

        const namaPerKode = new Map();

        for (const item of this.items) {

            const kode = String(
                item.barang || ""
            ).trim().toUpperCase();

            const nama = String(
                item.namaBarang || ""
            ).trim().toLowerCase();

            if (
                namaPerKode.has(kode) &&
                namaPerKode.get(kode) !== nama
            ) {
                Dialog.error(
                    `Kode barang ${kode} digunakan oleh lebih dari satu nama barang.`
                );
                return;
            }

            namaPerKode.set(kode, nama);
        }

        /* ======================================
           VALIDASI PEMBAYARAN
        ====================================== */

        const total = Number(this.getTotal());

        if (!Number.isFinite(total) || total < 0) {
            Dialog.error("Total pembelian tidak valid.");
            return;
        }

        if (!Number.isFinite(nominal) || nominal < 0) {
            Dialog.error("Nominal pembayaran tidak valid.");
            return;
        }

        if (nominal !== total) {
            Dialog.error(
                "Nominal pembayaran harus sama dengan total pembelian."
            );
            return;
        }

        /* ======================================
           STATUS EDIT
        ====================================== */

        const isEdit = Boolean(this.editMode);

        const editId = String(
            this.editId || ""
        ).trim();

        if (isEdit && !editId) {
            Dialog.error("ID pembelian untuk edit tidak ditemukan.");
            return;
        }

        /* ======================================
           KUNCI TOMBOL SIMPAN
        ====================================== */

        const button = document.getElementById(
            "massal-simpan"
        );

        this.isSaving = true;

        if (button) {
            button.disabled = true;
            button.textContent = "Menyimpan...";
        }

        let purchaseId = null;

        try {

            /* ======================================
               AMBIL HEADER LAMA SEBELUM DIPERBARUI
            ====================================== */

            let existing = null;

            if (isEdit) {

                existing = await DB.get(
                    "pembelian",
                    editId
                );

                if (!existing) {
                    const purchases =
                        await DB.getAll("pembelian") || [];

                    existing = purchases.find(item =>
                        String(item.id || "") === editId ||
                        String(item.serverId || "") === editId
                    );
                }

                if (!existing) {
                    throw new Error(
                        "Transaksi pembelian yang akan diedit tidak ditemukan."
                    );
                }
            }

            /* ======================================
               SIAPKAN MASTER DATA
            ====================================== */

            await this.refreshMasterData();

            const backgroundItems = this.items.map(
                item => ({ ...item })
            );

            const masterDiproses = new Set();

            for (const item of backgroundItems) {

                const kode = String(
                    item.barang || ""
                ).trim().toUpperCase();

                const satuan =
                    PembelianMassalSatuan.normalizeSatuan(
                        item.satuan
                    );

                const key = `${kode}|${satuan}`;

                if (masterDiproses.has(key)) {
                    continue;
                }

                masterDiproses.add(key);

                const barang =
                    await PembelianMassalMaster.ensureMasterBarang(
                        item,
                        this
                    );

                await PembelianMassalMaster.ensureSatuanDasarPCS(
                    item,
                    barang,
                    this
                );

                await PembelianMassalMaster.ensureSatuanPembelian(
                    item,
                    barang,
                    this
                );
            }

            /* ======================================
               PERTAHANKAN FIELD TAMBAHAN DETAIL LAMA
            ====================================== */

            const oldItems = Array.isArray(existing?.items)
                ? existing.items
                : [];

            const usedOldItems = new Set();

            const items = this.items.map(item => {

                const kode = String(
                    item.barang || ""
                ).trim().toUpperCase();

                const satuan = String(
                    item.satuan || ""
                ).trim().toLowerCase();

                const oldIndex = oldItems.findIndex(
                    (oldItem, index) => {

                        if (usedOldItems.has(index)) {
                            return false;
                        }

                        const oldKode = String(
                            oldItem.barang ||
                            oldItem.kode ||
                            oldItem.kodeBarang ||
                            ""
                        ).trim().toUpperCase();

                        const oldSatuan = String(
                            oldItem.satuan || ""
                        ).trim().toLowerCase();

                        return (
                            oldKode === kode &&
                            oldSatuan === satuan
                        );
                    }
                );

                const oldItem = oldIndex >= 0
                    ? oldItems[oldIndex]
                    : {};

                if (oldIndex >= 0) {
                    usedOldItems.add(oldIndex);
                }

                return {

                    ...oldItem,

                    ...item,

                    barang: kode,

                    namaBarang: String(
                        item.namaBarang || ""
                    ).trim(),

                    barcode: String(
                        item.barcode || ""
                    ).trim(),

                    satuan: String(
                        item.satuan || ""
                    ).trim(),

                    konversi: Number(item.konversi),

                    qty: Number(item.qty),

                    harga: Number(item.harga),

                    hargaJualPCS: Number(
                        item.hargaJualPCS
                    ),

                    hargaJual: Number(
                        item.hargaJual
                    ),

                    disc: Number(item.disc || 0),

                    total: PembelianMassalItem.itemTotal(item)
                };
            });

            /* ======================================
               PERTAHANKAN FIELD TAMBAHAN PEMBAYARAN
            ====================================== */

            const oldPayments = Array.isArray(existing?.payments)
                ? existing.payments
                : [];

            const allLocalPayments =
                await DB.getAll("pembayaranPembelian") || [];

            const possibleIds = new Set(
                [
                    editId,
                    String(existing?.id || ""),
                    String(existing?.serverId || ""),
                    String(existing?.referenceId || "")
                ].filter(Boolean)
            );

            const localOldPayments = isEdit
                ? allLocalPayments.filter(payment => {

                    const reference = String(
                        payment.pembelianId ||
                        payment.transaksiId ||
                        payment.idPembelian ||
                        payment.idTransaksi ||
                        ""
                    );

                    return possibleIds.has(reference);
                })
                : [];

            const paymentSources = [
                ...oldPayments,
                ...localOldPayments
            ];

            const oldPayment = paymentSources.find(
                payment =>
                    String(payment.metode || "").trim() ===
                    String(metode || "").trim()
            ) || {};

            const payments = [
                {
                    ...oldPayment,
                    metode,
                    nominal
                }
            ];

            /* ======================================
               SUSUN DATA HEADER TRANSAKSI
            ====================================== */

            const data = {

                ...(existing || {}),

                id: isEdit
                    ? String(existing.id || editId)
                    : null,

                tanggal,

                supplier,

                invoice,

                items,

                payments,

                total,

                dibayar: nominal
            };

            /* ======================================
               SIMPAN TRANSAKSI BARU ATAU EDIT
            ====================================== */

            let hasilSimpan;

            if (isEdit) {

                const actualId = String(
                    existing.id || editId
                );

                const isLocal = actualId.startsWith(
                    "LOCAL-PB-"
                );

                if (isLocal) {

                    /* ==================================
                       SIMPAN HEADER LOKAL
                       PERTAHANKAN METADATA LAMA
                    ================================== */

                    const updatedPurchase = {

                        ...existing,

                        ...data,

                        id: actualId,

                        database: existing.database || null,

                        syncStatus: "pending",

                        syncedAt: null,

                        updatedAt: new Date().toISOString()
                    };

                    await DB.put(
                        "pembelian",
                        updatedPurchase
                    );

                    /* ==================================
                       SIAPKAN ANTREAN TRANSAKSI LOKAL
                    ================================== */

                    const queues =
                        await DB.getAll("syncQueue") || [];

                    let queue = queues.find(item =>
                        item.type === "pembelian" &&
                        String(item.referenceId) === actualId &&
                        item.status !== "success"
                    );

                    if (queue) {

                        queue.status = "waitingMaster";
                        queue.retry = 0;
                        queue.lastError = null;

                    } else {

                        queue = {

                            id:
                                "SYNC-" +
                                Date.now() +
                                "-" +
                                Math.random()
                                    .toString(36)
                                    .slice(2, 7),

                            type: "pembelian",

                            referenceId: actualId,

                            status: "waitingMaster",

                            retry: 0,

                            createdAt: new Date().toISOString(),

                            lastError: null
                        };
                    }

                    await DB.put(
                        "syncQueue",
                        queue
                    );

                    hasilSimpan = updatedPurchase;
                    purchaseId = actualId;

                } else {

                    /* ==================================
                       SIMPAN UPDATE TRANSAKSI SERVER
                    ================================== */

                    data.id = actualId;

                    await Sync.updatePembelian(
                        data,
                        { deferProcess: true }
                    );

                    const latest = await DB.get(
                        "pembelian",
                        actualId
                    );

                    const updatedPurchase = {

                        ...(latest || existing),

                        ...data,

                        id: actualId,

                        database:
                            latest?.database ||
                            existing.database ||
                            data.database ||
                            null,

                        serverId:
                            latest?.serverId ||
                            existing.serverId ||
                            actualId,

                        syncStatus: "pending",

                        syncedAt: null,

                        updatedAt: new Date().toISOString()
                    };

                    await DB.put(
                        "pembelian",
                        updatedPurchase
                    );

                    hasilSimpan = updatedPurchase;
                    purchaseId = actualId;
                }

            } else {

                /* ======================================
                   SIMPAN TRANSAKSI BARU
                ====================================== */

                hasilSimpan =
                    await Sync.addPembelian(
                        data,
                        { deferProcess: true }
                    );

                purchaseId =
                    hasilSimpan?.id ||
                    hasilSimpan?.referenceId ||
                    data.id;
            }

            if (!purchaseId) {
                throw new Error(
                    "ID transaksi pembelian tidak ditemukan setelah penyimpanan."
                );
            }

            /* ======================================
               PERBARUI DETAIL DAN PEMBAYARAN LOKAL
               KHUSUS MODE EDIT
            ====================================== */

            if (isEdit) {

                const storedPurchase = await DB.get(
                    "pembelian",
                    purchaseId
                );

                const referenceIds = new Set(
                    [
                        editId,
                        purchaseId,
                        String(existing.id || ""),
                        String(existing.serverId || ""),
                        String(storedPurchase?.id || ""),
                        String(storedPurchase?.serverId || ""),
                        String(existing.referenceId || "")
                    ].filter(Boolean)
                );

                const allDetails =
                    await DB.getAll("detailPembelian") || [];

                const matchingDetails = allDetails.filter(
                    detail => {

                        const reference = String(
                            detail.pembelianId ||
                            detail.transaksiId ||
                            detail.idPembelian ||
                            detail.idTransaksi ||
                            ""
                        );

                        return referenceIds.has(reference);
                    }
                );

                const allPayments =
                    await DB.getAll("pembayaranPembelian") || [];

                const matchingPayments = allPayments.filter(
                    payment => {

                        const reference = String(
                            payment.pembelianId ||
                            payment.transaksiId ||
                            payment.idPembelian ||
                            payment.idTransaksi ||
                            ""
                        );

                        return referenceIds.has(reference);
                    }
                );

                /* ==================================
                   HAPUS DETAIL LAMA DARI DATABASE LOKAL
                ================================== */

                for (const detail of matchingDetails) {

                    if (detail.id !== undefined && detail.id !== null) {

                        await DB.delete(
                            "detailPembelian",
                            detail.id
                        );
                    }
                }

                /* ==================================
                   TULIS DETAIL TERBARU KE DATABASE LOKAL
                ================================== */

                for (let index = 0; index < items.length; index++) {

                    const item = items[index];

                    const detailId =
                        `${purchaseId}-DETAIL-${index + 1}`;

                    const previousDetail = matchingDetails.find(
                        detail => {

                            const kode = String(
                                detail.kode ||
                                detail.barang ||
                                detail.kodeBarang ||
                                ""
                            ).trim().toUpperCase();

                            const satuan = String(
                                detail.satuan || ""
                            ).trim().toLowerCase();

                            return (
                                kode === String(
                                    item.barang || ""
                                ).trim().toUpperCase() &&
                                satuan === String(
                                    item.satuan || ""
                                ).trim().toLowerCase()
                            );
                        }
                    ) || {};

                    await DB.put(
                        "detailPembelian",
                        {

                            ...previousDetail,

                            id: detailId,

                            pembelianId: purchaseId,

                            transaksiId: purchaseId,

                            kode: item.barang,

                            barang: item.barang,

                            nama: item.namaBarang,

                            namaBarang: item.namaBarang,

                            satuan: item.satuan,

                            barcode: item.barcode,

                            qty: item.qty,

                            konversi: item.konversi,

                            harga: item.harga,

                            hargaJualPCS: item.hargaJualPCS,

                            hargaJual: item.hargaJual,

                            disc: item.disc,

                            total: item.total
                        }
                    );
                }

                /* ==================================
                   HAPUS PEMBAYARAN LAMA DARI DATABASE LOKAL
                ================================== */

                for (const payment of matchingPayments) {

                    if (
                        payment.id !== undefined &&
                        payment.id !== null
                    ) {

                        await DB.delete(
                            "pembayaranPembelian",
                            payment.id
                        );
                    }
                }

                /* ==================================
                   TULIS PEMBAYARAN TERBARU KE DATABASE LOKAL
                ================================== */

                for (let index = 0; index < payments.length; index++) {

                    const payment = payments[index];

                    const paymentId =
                        `${purchaseId}-PAYMENT-${index + 1}`;

                    await DB.put(
                        "pembayaranPembelian",
                        {

                            ...payment,

                            id: paymentId,

                            pembelianId: purchaseId,

                            transaksiId: purchaseId,

                            metode: payment.metode,

                            nominal: Number(payment.nominal),

                            kembalian: Number(
                                payment.kembalian || 0
                            )
                        }
                    );
                }
            }

            /* ======================================
               REFRESH LAPORAN DARI INDEXEDDB
               TANPA MENUNGGU SINKRONISASI
            ====================================== */

            void this.refreshLaporanPembelian().catch(error => {

                console.error(
                    "REFRESH LAPORAN PEMBELIAN LOKAL ERROR:",
                    error
                );

            });

            /* ======================================
               SELESAIKAN SIMPAN
            ====================================== */

            if (isEdit) {

                Dialog.success(
                    "Pembelian berhasil disimpan secara lokal. Sinkronisasi berjalan di latar belakang."
                );

                if (typeof this.returnFromEdit === "function") {

                    this.returnFromEdit();

                } else {

                    this.editMode = false;
                    this.editId = "";
                    this.editOriginal = null;

                    this.clearForm();

                    if (
                        typeof Router !== "undefined" &&
                        typeof Router.go === "function"
                    ) {
                        Router.go("pembelian");
                    }
                }

            } else {

                Dialog.success(
                    "Pembelian Massal berhasil disimpan secara lokal. Sinkronisasi berjalan di latar belakang."
                );

                this.clearForm();
            }

            /* ======================================
               SINKRONISASI DI LATAR BELAKANG
            ====================================== */

            void (async () => {

                try {

                    const queues =
                        await DB.getAll("syncQueue") || [];

                    const isServerEdit =
                        isEdit &&
                        !String(purchaseId).startsWith("LOCAL-PB-");

                    const queueTypes = isServerEdit
                        ? ["pembelianUpdate"]
                        : ["pembelian"];

                    const queue = queues.find(item =>
                        queueTypes.includes(item.type) &&
                        String(item.referenceId) === String(purchaseId) &&
                        item.status !== "success"
                    );

                    if (queue) {

                        queue.status = "pending";
                        queue.retry = 0;
                        queue.lastError = null;

                        await DB.put(
                            "syncQueue",
                            queue
                        );
                    }

                    if (isServerEdit) {

                        if (typeof Sync.autoProcess === "function") {

                            Sync.autoProcess();

                        } else if (typeof Sync.process === "function") {

                            void Sync.process();
                        }

                    } else {

                        await this.processPurchaseQueue(
                            purchaseId
                        );
                    }

                    await this.waitForSyncIdle();

                } catch (error) {

                    console.error(
                        "PEMBELIAN MASSAL BACKGROUND ERROR:",
                        error
                    );
                }

            })();

        } catch (error) {

            console.error(
                "PEMBELIAN MASSAL SAVE ERROR:",
                error
            );

            Dialog.error(
                error.message ||
                "Gagal menyimpan Pembelian Massal."
            );

        } finally {

            this.isSaving = false;

            if (button) {

                button.disabled = false;

                button.textContent = this.editMode
                    ? "Simpan Perubahan"
                    : "Simpan Pembelian";
            }
        }
    }

});