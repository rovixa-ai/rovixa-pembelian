// ======================================
// SYNC PEMBELIAN
// TREEHOUSE POS
// ======================================

Object.assign(Sync, {

    generatePembelianID() {

        const now = new Date();

        const year =
            String(now.getFullYear()).slice(-2);

        const month =
            String(now.getMonth() + 1).padStart(2, "0");

        const day =
            String(now.getDate()).padStart(2, "0");

        const hours =
            String(now.getHours()).padStart(2, "0");

        const minutes =
            String(now.getMinutes()).padStart(2, "0");

        const seconds =
            String(now.getSeconds()).padStart(2, "0");

        const random =
            String(
                Math.floor(Math.random() * 1000)
            ).padStart(3, "0");

        return (
            "PB-" +
            year +
            month +
            day +
            "-" +
            hours +
            minutes +
            seconds +
            "-" +
            random
        );
    },


    async addPembelian(data, options = {}) {

        const id =
            this.generatePembelianID();

        const year =
            PembelianDatabaseConfig.getActiveYear();

        if (!year) {
            throw new Error(
                "Tahun database pembelian belum ditentukan."
            );
        }

        /*
         * Gunakan konfigurasi database yang sudah tersimpan lokal.
         * Tidak memanggil API sebelum transaksi disimpan.
         */

        const cachedDatabase =
            PembelianDatabaseConfig.getActiveDatabase();

        if (!cachedDatabase) {
            throw new Error(
                "Konfigurasi database pembelian lokal tidak ditemukan."
            );
        }

        const resolvedYear =
            cachedDatabase.year || year;

        const pembelianId =
            cachedDatabase.pembelian;

        const detailPembelianId =
            cachedDatabase.detailPembelian;

        const pembayaranId =
            cachedDatabase.pembayaran;

        if (
            !pembelianId ||
            !detailPembelianId ||
            !pembayaranId
        ) {
            throw new Error(
                "Konfigurasi database pembelian lokal tidak lengkap."
            );
        }

        /*
         * Struktur database transaksi dipertahankan.
         */

        const databaseSnapshot = {
            year: resolvedYear,
            pembelianId,
            detailPembelianId,
            pembayaranId
        };

        const now = new Date();

const pembelian = {
    ...data,
    id,

    tanggalJam:
        data.tanggalJam ||
        [
            String(now.getHours()).padStart(2, "0"),
            String(now.getMinutes()).padStart(2, "0"),
            String(now.getSeconds()).padStart(2, "0")
        ].join(":"),

    database: databaseSnapshot,
    syncStatus: "pending",
    stockUpdated: false,
    stockUpdatedAt: null,
    createdAt: now.toISOString(),
    syncedAt: null
};

        await DB.put(
            "pembelian",
            pembelian
        );

        const queue = {
            id:
                "SYNC-" +
                Date.now() +
                "-" +
                Math.random().toString(36).slice(2, 7),
            type: "pembelian",
            referenceId: id,
            status: options.deferProcess
                ? "waitingMaster"
                : "pending",
            retry: 0,
            createdAt: new Date().toISOString(),
            lastError: null
        };

        await DB.put(
            "syncQueue",
            queue
        );

        /*
         * Perilaku pemanggil lain tetap dipertahankan.
         */

        if (!options.deferProcess) {
            this.autoProcess();
        }

        return pembelian;
    },


    async updatePembelian(data, options = {}) {

        if (!data || !data.id) {
            throw new Error(
                "Data pembelian tidak valid."
            );
        }

        const id = data.id;

        const existing =
            await DB.get("pembelian", id);

        if (!existing) {
            throw new Error(
                "Data pembelian tidak ditemukan."
            );
        }

        if (String(id).startsWith("LOCAL-PB-")) {
            throw new Error(
                "Pembelian lokal belum dapat diedit."
            );
        }

        let database =
            existing.database ||
            data.database ||
            null;

        if (
            !database ||
            !database.pembelianId ||
            !database.detailPembelianId ||
            !database.pembayaranId
        ) {

            const year =
                PembelianDatabaseConfig.getActiveYear();

            if (!year) {
                throw new Error(
                    "Tahun database pembelian belum ditentukan."
                );
            }

            const resolveResult =
                await API.get(
                    "resolvePembelianDatabase",
                    { year }
                );

            if (
                !resolveResult ||
                !resolveResult.success
            ) {
                throw new Error(
                    resolveResult?.message ||
                    "Database pembelian tidak dapat ditentukan."
                );
            }

            database = {
                year: resolveResult.year || year,
                pembelianId: resolveResult.pembelian,
                detailPembelianId: resolveResult.detailPembelian,
                pembayaranId: resolveResult.pembayaran
            };
        }

        if (
            !database.pembelianId ||
            !database.detailPembelianId ||
            !database.pembayaranId
        ) {
            throw new Error(
                "Konfigurasi database pembelian tidak lengkap."
            );
        }

        const allDetails =
            await DB.getAll("detailPembelian");

        const oldItems =
            allDetails
                .filter(item => {

                    const reference =
                        item.pembelianId ||
                        item.transaksiId;

                    return (
                        String(reference) ===
                        String(id)
                    );
                })
                .map(item => ({ ...item }));

        const updatedPembelian = {
            ...existing,
            ...data,
            id,
            database,
            pendingUpdate: {
                originalItems: oldItems
            },
            syncStatus: "pending",
            syncedAt: null,
            updatedAt: new Date().toISOString()
        };

        await DB.put(
            "pembelian",
            updatedPembelian
        );

        const queueList =
            await DB.getAll("syncQueue");

        const existingQueue =
            queueList.find(item =>
                item.type === "pembelianUpdate" &&
                String(item.referenceId) === String(id) &&
                item.status !== "success"
            );

        let queue;

        if (existingQueue) {

            queue = {
                ...existingQueue,
                status: options.deferProcess
                    ? "waitingMaster"
                    : "pending",
                retry: 0,
                lastError: null,
                createdAt: new Date().toISOString()
            };

        } else {

            queue = {
                id:
                    "SYNC-PB-EDIT-" +
                    Date.now() +
                    "-" +
                    Math.random().toString(36).slice(2, 7),
                type: "pembelianUpdate",
                action: "update",
                referenceId: id,
                status: options.deferProcess
                    ? "waitingMaster"
                    : "pending",
                retry: 0,
                createdAt: new Date().toISOString(),
                lastError: null
            };
        }

        await DB.put(
            "syncQueue",
            queue
        );

        if (!options.deferProcess) {
            this.autoProcess();
        }

        return updatedPembelian;
    },


    async syncPembelian(queue) {

        const pembelian =
            await DB.get(
                "pembelian",
                queue.referenceId
            );

        if (!pembelian) {
            throw new Error(
                "Data pembelian lokal tidak ditemukan."
            );
        }

        /*
         * ID transaksi dibuat di frontend.
         * ID yang sama digunakan untuk database lokal,
         * server, detail pembelian, dan pembayaran.
         *
         * Tidak menggunakan ID baru dari server.
         * Tidak memindahkan atau mengganti ID transaksi.
         */

        const transactionId =
            String(pembelian.id || "").trim();

        if (
            !/^PB-\d{6}-\d{6}-\d{3}$/.test(transactionId)
        ) {
            throw new Error(
                "Format ID pembelian tidak valid: " +
                transactionId
            );
        }

        if (
            String(queue.referenceId) !==
            transactionId
        ) {
            throw new Error(
                "ID antrean tidak sesuai dengan ID pembelian."
            );
        }

        /*
         * Simpan ke server menggunakan ID transaksi yang sama.
         * Endpoint server harus idempoten terhadap ID ini.
         */

        const result =
    await API.savePembelian({
        ...pembelian,
        id: transactionId,
        tanggalJam: pembelian.tanggalJam || ""
    });

        if (!result || !result.success) {
            throw new Error(
                result?.message ||
                "Gagal menyimpan pembelian ke server."
            );
        }

        /*
         * Pertahankan status yang dikembalikan server
         * jika tersedia, tanpa mengganti ID transaksi.
         */

        if (result.status) {
            pembelian.status = result.status;
        }

        /*
         * JANGAN MENAMBAH STOK LOKAL SECARA MANUAL.
         *
         * Stok sudah diperbarui oleh server melalui
         * updateStokPembelian(). Jika proses berikutnya gagal
         * lalu antrean diulang, penambahan stok lokal manual
         * dapat menggandakan stok.
         *
         * Ambil stok terbaru dari server dan hanya perbarui
         * field stok pada barang lokal.
         */

        const bootstrapResult =
            await API.getBootstrap();

        if (
            !bootstrapResult ||
            bootstrapResult.success !== true
        ) {
            throw new Error(
                bootstrapResult?.message ||
                "Pembelian tersimpan di server, tetapi stok terbaru gagal diambil."
            );
        }

        const barangServer =
            Array.isArray(
                bootstrapResult.data?.barang
            )
                ? bootstrapResult.data.barang
                : [];

        if (!barangServer.length) {
            throw new Error(
                "Pembelian tersimpan di server, tetapi data master Barang dari server kosong."
            );
        }

        for (const dataServer of barangServer) {

            if (!dataServer.kode) {
                continue;
            }

            const stokServer =
                Number(dataServer.stok);

            if (!Number.isFinite(stokServer)) {
                continue;
            }

            const barangLokal =
                await DB.get(
                    "barang",
                    dataServer.kode
                );

            if (!barangLokal) {
                continue;
            }

            if (
                Number(barangLokal.stok || 0) !==
                stokServer
            ) {

                barangLokal.stok =
                    stokServer;

                await DB.put(
                    "barang",
                    barangLokal
                );
            }
        }

        /*
         * Tandai stok telah diselaraskan dari server.
         * Tidak melakukan operasi tambah stok di IndexedDB.
         */

        pembelian.stockUpdated = true;

        pembelian.stockUpdatedAt =
            new Date().toISOString();

        await DB.put(
            "pembelian",
            pembelian
        );

        const items =
            Array.isArray(pembelian.items)
                ? pembelian.items
                : [];

        /*
         * Detail menggunakan ID transaksi yang sama.
         * Gunakan ID detail deterministik agar percobaan ulang
         * menulis record yang sama, bukan membuat duplikat.
         */

        const detailStore =
            "detailPembelian";

        const oldDetail =
            await DB.getAll(detailStore);

        const oldDetails =
            oldDetail.filter(item => {

                const reference =
                    item.pembelianId ||
                    item.transaksiId;

                return (
                    String(reference) === transactionId
                );
            });

        const expectedDetailIds =
            new Set(
                items.map((item, index) =>
                    transactionId +
                    "-DETAIL-" +
                    (index + 1)
                )
            );

        for (const item of oldDetails) {

            if (!expectedDetailIds.has(String(item.id))) {

                await DB.delete(
                    detailStore,
                    item.id
                );
            }
        }

        for (
            let index = 0;
            index < items.length;
            index++
        ) {

            const item = items[index];

            const detail = {
                id:
                    transactionId +
                    "-DETAIL-" +
                    (index + 1),

                pembelianId: transactionId,
                transaksiId: transactionId,
                kode: item.barang || "",
                nama: item.namaBarang || "",
                satuan: item.satuan || "",
                barcode: item.barcode || "",
                qty: Number(item.qty || 0),
                konversi: Number(item.konversi || 1),
                harga: Number(item.harga || 0),
                disc: Number(item.disc || 0),
                total: Number(item.total || 0)
            };

            await DB.put(
                detailStore,
                detail
            );
        }

        /*
         * Nama object store yang benar adalah pembayaranPembelian.
         * Gunakan ID pembayaran deterministik agar proses ulang
         * tidak menggandakan pembayaran.
         */

        const paymentStore =
            "pembayaranPembelian";

        const oldPayments =
            await DB.getAll(paymentStore);

        const oldPaymentList =
            oldPayments.filter(item => {

                const reference =
                    item.pembelianId ||
                    item.transaksiId;

                return (
                    String(reference) === transactionId
                );
            });

        const payments =
            Array.isArray(pembelian.payments)
                ? pembelian.payments
                : [];

        const expectedPaymentIds =
            new Set(
                payments.map((payment, index) =>
                    transactionId +
                    "-PAYMENT-" +
                    (index + 1)
                )
            );

        for (const item of oldPaymentList) {

            if (!expectedPaymentIds.has(String(item.id))) {

                await DB.delete(
                    paymentStore,
                    item.id
                );
            }
        }

        for (
            let index = 0;
            index < payments.length;
            index++
        ) {

            const payment = payments[index];

            const paymentData = {
                id:
                    transactionId +
                    "-PAYMENT-" +
                    (index + 1),

                pembelianId: transactionId,
                transaksiId: transactionId,
                metode: payment.metode || "Cash",
                nominal: Number(payment.nominal || 0),
                kembalian: Number(payment.kembalian || 0)
            };

            await DB.put(
                paymentStore,
                paymentData
            );
        }

        /*
         * Simpan status transaksi.
         * ID tetap sama sebelum dan sesudah sinkronisasi.
         */

        pembelian.id = transactionId;
        pembelian.serverId = transactionId;
        pembelian.syncStatus = "synced";
        pembelian.syncedAt = new Date().toISOString();
        pembelian.stockUpdated = true;

        pembelian.stockUpdatedAt =
            pembelian.stockUpdatedAt ||
            new Date().toISOString();

        await DB.put(
            "pembelian",
            pembelian
        );

        /*
         * Referensi antrean tetap menggunakan ID yang sama.
         * Tidak ada migrasi ID atau penghapusan transaksi lokal.
         */

        queue.referenceId = transactionId;

        await DB.put(
            "syncQueue",
            queue
        );

        return {
            success: true,
            id: transactionId,
            status: pembelian.status
        };
    },


    async syncUpdatePembelian(queue) {

        const pembelian =
            await DB.get(
                "pembelian",
                queue.referenceId
            );

        if (!pembelian) {
            throw new Error(
                "Data pembelian lokal tidak ditemukan."
            );
        }

        /*
         * SIMPAN PERUBAHAN PEMBELIAN KE SERVER
         */

        const result =
            await API.updatePembelian(pembelian);

        if (!result || !result.success) {
            throw new Error(
                result?.message ||
                "Gagal memperbarui pembelian."
            );
        }

        /*
         * PERBARUI STOK BARANG LOKAL
         *
         * Ambil master Barang terbaru dari server.
         * Hanya field stok yang diperbarui di IndexedDB.
         * Data lokal lainnya tetap dipertahankan.
         */

        try {

            const bootstrapResult =
                await API.getBootstrap();

            if (
                !bootstrapResult ||
                bootstrapResult.success !== true
            ) {
                throw new Error(
                    bootstrapResult?.message ||
                    "Gagal mengambil stok terbaru dari server."
                );
            }

            const barangServer =
                Array.isArray(
                    bootstrapResult.data?.barang
                )
                    ? bootstrapResult.data.barang
                    : [];

            if (!barangServer.length) {
                throw new Error(
                    "Data master Barang dari server kosong."
                );
            }

            for (const dataServer of barangServer) {

                if (!dataServer.kode) {
                    continue;
                }

                const barangLokal =
                    await DB.get(
                        "barang",
                        dataServer.kode
                    );

                if (!barangLokal) {
                    continue;
                }

                const stokServer =
                    Number(dataServer.stok);

                if (!Number.isFinite(stokServer)) {
                    continue;
                }

                if (
                    Number(barangLokal.stok || 0) !==
                    stokServer
                ) {

                    barangLokal.stok =
                        stokServer;

                    await DB.put(
                        "barang",
                        barangLokal
                    );
                }
            }

        } catch (stockError) {

            /*
             * Kegagalan memperbarui cache stok tidak membatalkan
             * pembelian yang sudah berhasil disimpan di server.
             */

            console.error(
                "GAGAL MEMPERBARUI STOK LOKAL:",
                stockError
            );
        }

        /*
         * PERBARUI STATUS TRANSAKSI LOKAL
         */

        if (result.status) {
            pembelian.status = result.status;
        }

        pembelian.syncStatus = "synced";
        pembelian.syncedAt = new Date().toISOString();
        pembelian.updatedAt = new Date().toISOString();

        await DB.put(
            "pembelian",
            pembelian
        );

        return result;
    }

});