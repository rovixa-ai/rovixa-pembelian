const API = {

    URL: null,

    initialized: false,

    initPromise: null,


    /* ==================================
       INITIALIZE CLIENT API
    ================================== */

    async init() {

        if (this.initialized && this.URL) {
            return this.URL;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {

            if (
                !window.API_CONFIG ||
                typeof window.API_CONFIG.init !== "function"
            ) {
                throw new Error(
                    "Konfigurasi pelanggan belum tersedia."
                );
            }

            await window.API_CONFIG.init();

            const scriptUrl =
                String(
                    window.API_CONFIG.SCRIPT_URL || ""
                ).trim();

            if (
                !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/
                    .test(scriptUrl)
            ) {
                throw new Error(
                    "URL Web App pelanggan tidak valid."
                );
            }

            this.URL = scriptUrl;
            this.initialized = true;

            return this.URL;

        })();

        try {

            return await this.initPromise;

        } catch (error) {

            this.URL = null;
            this.initialized = false;
            this.initPromise = null;

            throw error;

        }

    },


    /* ==================================
       GET
    ================================== */

    async get(action, params = {}) {

        const url = await this.init();

        const query =
            new URLSearchParams({
                action,
                ...params
            });

        const response =
            await fetch(
                `${url}?${query.toString()}`
            );

        const text =
            await response.text();

        try {

            return JSON.parse(text);

        } catch (error) {

            console.error(
                "API RESPONSE:",
                text
            );

            throw new Error(
                "Response API bukan JSON"
            );

        }

    },


    /* ==================================
       POST
    ================================== */

    async post(data = {}) {

        const url = await this.init();

        const response =
            await fetch(
                url,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },
                    body:
                        JSON.stringify(data)
                }
            );

        const text =
            await response.text();

        try {

            return JSON.parse(text);

        } catch (error) {

            console.error(
                "API RESPONSE:",
                text
            );

            throw new Error(
                "Response API bukan JSON"
            );

        }

    },


    /* ==================================
       USER
    ================================== */

    getUsers() {

        return this.get("users");

    },


    /* ==================================
       BARANG
    ================================== */

    getBarang() {

        return this.get("barang");

    },


    /* ==================================
       SATUAN
    ================================== */

    getSatuan(barang) {

        return this.get(
            "satuan",
            {
                barang
            }
        );

    },


    /* ==================================
       BOOTSTRAP
    ================================== */

    getBootstrap() {

        return this.get("bootstrap");

    },


    /* ==================================
       DOWNLOAD PEMBELIAN
    ================================== */

    getDownloadPembelian(database) {

        database = database || {};

        return this.get(
            "downloadPembelian",
            {
                year:
                    database.year,

                pembelianId:
                    database.pembelian,

                detailPembelianId:
                    database.detailPembelian,

                pembayaranId:
                    database.pembayaran
            }
        );

    },


    /* ==================================
       SIMPAN BARANG
    ================================== */

    saveBarang(data) {

        return this.post({
            action: "saveBarang",
            ...data
        });

    },


    /* ==================================
       SIMPAN SATUAN
    ================================== */

    saveSatuan(data) {

        return this.post({
            action: "saveSatuan",
            ...data
        });

    },


    /* ==================================
       UPDATE SATUAN
    ================================== */

    updateSatuan(data) {

        return this.post({
            action: "updateSatuan",
            ...data
        });

    },


    /* ==================================
       PENYESUAIAN STOK
    ================================== */

    saveStokAdjustment(data) {

        return this.post({
            action: "saveStokAdjustment",
            ...data
        });

    },


    /* ==================================
       UPDATE BARANG
    ================================== */

    updateBarang(data) {

        return this.post({
            action: "updateBarang",
            ...data
        });

    },


    /* ==================================
       PEMBELIAN
    ================================== */

    savePembelian(data) {

        return this.post({
            action: "savePembelian",
            ...data
        });

    },


    updatePembelian(data) {

        return this.post({
            action: "updatePembelian",
            ...data
        });

    },


    /* ==================================
       LAPORAN PEMBELIAN
    ================================== */

    saveLaporanPembelian(data) {

        return this.post({
            action: "saveLaporanPembelian",
            ...data
        });

    },


    printLaporanPembelian(data) {

        return this.post({
            action: "printLaporanPembelian",
            ...data
        });

    }

};