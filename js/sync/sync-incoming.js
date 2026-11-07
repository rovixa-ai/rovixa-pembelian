
/* ======================================
   ROVIXA POS
   INCOMING SYNC - PEMBELIAN
   GOOGLE SHEETS → INDEXEDDB

   SCOPE:
   - BARANG
   - SATUAN
   - PEMBELIAN
   - DETAIL PEMBELIAN
   - PEMBAYARAN PEMBELIAN
   - STORE CONFIG

   TANPA PENJUALAN
   TANPA EXPENSE
====================================== */

"use strict";

const IncomingSync = {

    processing: false,

    LAST_SYNC_KEY: "lastIncomingSyncPembelian",

    /* ======================================
       HELPERS
    ====================================== */

    getResponseData(result) {

        if (!result || result.success === false) {
            throw new Error(
                result?.message ||
                "Gagal mengambil perubahan dari server."
            );
        }

        return result.data &&
            typeof result.data === "object"
                ? result.data
                : result;

    },


    async getCheckpoint() {

        const config = await DB.get(
            "config",
            this.LAST_SYNC_KEY
        );

        return String(
            config?.value || "1970-01-01T00:00:00.000Z"
        );

    },


    async saveCheckpoint(value) {

        if (!value) {
            throw new Error(
                "Checkpoint server tidak tersedia."
            );
        }

        const timestamp = new Date(value);

        if (isNaN(timestamp.getTime())) {
            throw new Error(
                "Format checkpoint server tidak valid."
            );
        }

        await DB.put(
            "config",
            {
                key: this.LAST_SYNC_KEY,
                value: timestamp.toISOString()
            }
        );

    },


    async getDatabaseConfig() {

        const year = Number(
            PembelianDatabaseConfig.getActiveYear()
        );

        if (
            !Number.isInteger(year) ||
            year < 2000 ||
            year > 9999
        ) {
            throw new Error(
                "Tahun database Pembelian tidak valid."
            );
        }

        const response = await API.get(
            "resolvePembelianDatabase",
            {
                year
            }
        );

        if (
            !response ||
            response.success !== true
        ) {
            throw new Error(
                response?.message ||
                "Database Pembelian tidak ditemukan."
            );
        }

        const resolvedYear = Number(
            response.year || year
        );

        const pembelian = String(
            response.pembelian || ""
        ).trim();

        const detailPembelian = String(
            response.detailPembelian || ""
        ).trim();

        const pembayaran = String(
            response.pembayaran || ""
        ).trim();

        if (
            !pembelian ||
            !detailPembelian ||
            !pembayaran
        ) {
            throw new Error(
                "Konfigurasi database Pembelian tidak lengkap."
            );
        }

        const database = {
            year: resolvedYear,
            pembelian,
            detailPembelian,
            pembayaran
        };

        PembelianDatabaseConfig.saveYearDatabase(
            resolvedYear,
            database
        );

        PembelianDatabaseConfig.setActiveYear(
            resolvedYear
        );

        return database;

    },


    /* ======================================
       DETEKSI TRANSAKSI PENDING

       ID transaksi yang masih berada dalam
       syncQueue tidak boleh ditimpa server.
    ====================================== */

    collectPendingIds(value, result = new Set()) {

        if (!value) {
            return result;
        }

        if (typeof value === "string") {

            const match = value.match(
                /PB-\d{6}-\d{6}-\d{3}/
            );

            if (match) {
                result.add(match[0]);
            }

            return result;
        }

        if (Array.isArray(value)) {

            value.forEach(item => {
                this.collectPendingIds(item, result);
            });

            return result;
        }

        if (typeof value === "object") {

            Object.values(value).forEach(item => {
                this.collectPendingIds(item, result);
            });

        }

        return result;

    },


    async getPendingPurchaseIds() {

        const queue = await DB.getAll(
            "syncQueue"
        );

        const pendingIds = new Set();

        (Array.isArray(queue) ? queue : [])
            .forEach(item => {

                this.collectPendingIds(
                    item,
                    pendingIds
                );

            });

        return pendingIds;

    },


    /* ======================================
       NORMALISASI BARANG
    ====================================== */

    normalizeBarang(items) {

        return items
            .filter(item =>
                item &&
                String(item.kode || "").trim()
            )
            .map(item => ({
                ...item,
                kode: String(item.kode).trim()
            }));

    },


    /* ======================================
       NORMALISASI SATUAN
    ====================================== */

    normalizeSatuan(items) {

        return items
            .filter(item =>
                item &&
                String(item.id || "").trim()
            )
            .map(item => ({
                ...item,
                id: String(item.id).trim()
            }));

    },


    /* ======================================
       NORMALISASI HEADER PEMBELIAN
    ====================================== */

    normalizePembelian(items) {

        return items
            .filter(item =>
                item &&
                String(item.id || "").trim()
            )
            .map(item => ({
                ...item,
                id: String(item.id).trim()
            }));

    },


    /* ======================================
       NORMALISASI DETAIL PEMBELIAN

       Mengikuti Download.bootstrap():
       PB-ID-DETAIL-1
       PB-ID-DETAIL-2
       PB-ID-DETAIL-3
    ====================================== */

    normalizeDetailPembelian(items) {

        const counters = {};

        return items
            .filter(item => item)
            .map((item, index) => {

                const transaksiId = String(
                    item.pembelianId ??
                    item.transaksiId ??
                    item.id ??
                    ""
                ).trim();

                if (!transaksiId) {
                    return null;
                }

                counters[transaksiId] =
                    (counters[transaksiId] || 0) + 1;

                const detailNumber =
                    counters[transaksiId];

                return {

                    ...item,

                    id:
                        transaksiId +
                        "-DETAIL-" +
                        detailNumber,

                    pembelianId:
                        transaksiId,

                    transaksiId:
                        transaksiId,

                    serverDetailId:
                        String(item.id ?? ""),

                    serverDetailIndex:
                        index

                };

            })
            .filter(Boolean);

    },


    /* ======================================
       NORMALISASI PEMBAYARAN

       Mengikuti Download.bootstrap():
       PB-ID-PAYMENT-1
       PB-ID-PAYMENT-2
       PB-ID-PAYMENT-3
    ====================================== */

    normalizePembayaran(items) {

        const counters = {};

        return items
            .filter(item => item)
            .map((item, index) => {

                const transaksiId = String(
                    item.pembelianId ??
                    item.transaksiId ??
                    item.id ??
                    ""
                ).trim();

                if (!transaksiId) {
                    return null;
                }

                counters[transaksiId] =
                    (counters[transaksiId] || 0) + 1;

                const paymentNumber =
                    counters[transaksiId];

                return {

                    ...item,

                    id:
                        transaksiId +
                        "-PAYMENT-" +
                        paymentNumber,

                    pembelianId:
                        transaksiId,

                    transaksiId:
                        transaksiId,

                    serverPaymentId:
                        String(item.id ?? ""),

                    serverPaymentIndex:
                        index

                };

            })
            .filter(Boolean);

    },


    /* ======================================
       SIMPAN MASTER DATA

       Tidak menggunakan replaceAll.
       Data lokal yang tidak dikirim server
       tidak dihapus.
    ====================================== */

    async applyMasterData(data) {

        const barang = this.normalizeBarang(
            Array.isArray(data.barang)
                ? data.barang
                : []
        );

        const satuan = this.normalizeSatuan(
            Array.isArray(data.satuan)
                ? data.satuan
                : []
        );

        for (const item of barang) {

            await DB.put(
                "barang",
                item
            );

        }

        for (const item of satuan) {

            await DB.put(
                "satuan",
                item
            );

        }

        return {
            barang: barang.length,
            satuan: satuan.length
        };

    },


    /* ======================================
       SIMPAN DATA PEMBELIAN

       Transaksi pending dilewati.
       Data detail dan pembayaran memakai
       primary key lokal yang unik.
    ====================================== */

    async applyPurchaseData(
        data,
        pendingIds
    ) {

        const pembelian = this.normalizePembelian(
            Array.isArray(data.pembelian)
                ? data.pembelian
                : []
        );

        const detailPembelian =
            this.normalizeDetailPembelian(
                Array.isArray(data.detailPembelian)
                    ? data.detailPembelian
                    : []
            );

        const pembayaranPembelian =
            this.normalizePembayaran(
                Array.isArray(data.pembayaranPembelian)
                    ? data.pembayaranPembelian
                    : []
            );


        /* ==================================
           HEADER PEMBELIAN
        ================================== */

        let headerCount = 0;

        for (const item of pembelian) {

            if (pendingIds.has(item.id)) {
                continue;
            }

            await DB.put(
                "pembelian",
                item
            );

            headerCount++;

        }


        /* ==================================
           DETAIL PEMBELIAN
        ================================== */

        let detailCount = 0;

        for (const item of detailPembelian) {

            if (
                pendingIds.has(item.pembelianId)
            ) {
                continue;
            }

            await DB.put(
                "detailPembelian",
                item
            );

            detailCount++;

        }


        /* ==================================
           PEMBAYARAN PEMBELIAN
        ================================== */

        let paymentCount = 0;

        for (const item of pembayaranPembelian) {

            if (
                pendingIds.has(item.pembelianId)
            ) {
                continue;
            }

            await DB.put(
                "pembayaranPembelian",
                item
            );

            paymentCount++;

        }

        return {

            pembelian: headerCount,

            detailPembelian: detailCount,

            pembayaranPembelian: paymentCount

        };

    },


    /* ======================================
       STORE CONFIG

       Memperbarui konfigurasi toko lokal
       jika server mengirim storeConfig.

       Jika server tidak mengirim properti
       storeConfig, konfigurasi lokal
       tidak diubah.
    ====================================== */

    async applyStoreConfig(data) {

        if (
            !Object.prototype.hasOwnProperty.call(
                data,
                "storeConfig"
            )
        ) {
            return {
                updated: false
            };
        }

        const storeConfig = data.storeConfig;

        if (
            !storeConfig ||
            typeof storeConfig !== "object" ||
            Array.isArray(storeConfig)
        ) {
            throw new Error(
                "Format Store Config dari server tidak valid."
            );
        }

        if (
            typeof StoreConfig === "undefined" ||
            !StoreConfig.STORAGE_KEY
        ) {
            throw new Error(
                "StoreConfig atau STORAGE_KEY tidak tersedia."
            );
        }

        const newConfig = {
            ...storeConfig
        };

        const serializedConfig =
            JSON.stringify(newConfig);

        if (!serializedConfig) {
            throw new Error(
                "Store Config gagal dikonversi."
            );
        }

        localStorage.setItem(
            StoreConfig.STORAGE_KEY,
            serializedConfig
        );

        StoreConfig.config = newConfig;

        return {
            updated: true
        };

    },


    /* ======================================
       APPLY SERVER CHANGES
    ====================================== */

    async applyChanges(data, pendingIds) {

        const masterResult =
            await this.applyMasterData(data);

        const purchaseResult =
            await this.applyPurchaseData(
                data,
                pendingIds
            );

        const storeConfigResult =
            await this.applyStoreConfig(data);

        return {

            ...masterResult,

            ...purchaseResult,

            storeConfigUpdated:
                storeConfigResult.updated

        };

    },


    /* ======================================
       MAIN SYNC
    ====================================== */

    async sync() {

        if (this.processing) {

            return {
                success: false,
                skipped: true,
                message: "IncomingSync sedang berjalan."
            };

        }

        this.processing = true;

        try {

            /* ==============================
               VALIDASI DATABASE
            ============================== */

            if (
                typeof DB === "undefined" ||
                !DB.instance
            ) {
                throw new Error(
                    "Database lokal belum diinisialisasi."
                );
            }

            const requiredStores = [
                "barang",
                "satuan",
                "pembelian",
                "detailPembelian",
                "pembayaranPembelian",
                "syncQueue",
                "config"
            ];

            for (const store of requiredStores) {

                if (
                    !DB.instance.objectStoreNames.contains(
                        store
                    )
                ) {
                    throw new Error(
                        'Object store "' +
                        store +
                        '" tidak ditemukan.'
                    );
                }

            }


            /* ==============================
               DATABASE PEMBELIAN
            ============================== */

            const database =
                await this.getDatabaseConfig();


            /* ==============================
               CHECKPOINT
            ============================== */

            const since =
                await this.getCheckpoint();


            /* ==============================
               PENDING TRANSACTIONS
            ============================== */

            const pendingIds =
                await this.getPendingPurchaseIds();


            /* ==============================
               REQUEST SERVER
            ============================== */

            const response = await API.get(
                "syncChanges",
                {

                    since,

                    year: database.year,

                    pembelianId:
                        database.pembelian,

                    detailPembelianId:
                        database.detailPembelian,

                    pembayaranPembelianId:
                        database.pembayaran

                }
            );

            const data =
                this.getResponseData(response);


            /* ==============================
               VALIDASI TANGGAL CHECKPOINT
            ============================== */

            const serverCheckpoint =
                String(
                    data.lastSync || ""
                ).trim();

            if (!serverCheckpoint) {

                throw new Error(
                    "Server tidak mengirim lastSync."
                );

            }


            /* ==============================
               APPLY PERUBAHAN
            ============================== */

            const result =
                await this.applyChanges(
                    data,
                    pendingIds
                );


            /* ==============================
               SIMPAN CHECKPOINT

               Hanya setelah seluruh proses
               penyimpanan berhasil.
            ============================== */

            await this.saveCheckpoint(
                serverCheckpoint
            );


            /* ==============================
               RESPONSE
            ============================== */

            return {

                success: true,

                year: database.year,

                lastSync: serverCheckpoint,

                barang: result.barang,

                satuan: result.satuan,

                pembelian: result.pembelian,

                detailPembelian:
                    result.detailPembelian,

                pembayaranPembelian:
                    result.pembayaranPembelian,

                storeConfigUpdated:
                    result.storeConfigUpdated,

                pendingTransactions:
                    pendingIds.size

            };

        } catch (error) {

            console.error(
                "INCOMING SYNC PEMBELIAN ERROR:",
                error
            );

            return {

                success: false,

                message: error.message

            };

        } finally {

            this.processing = false;

        }

    }

};
