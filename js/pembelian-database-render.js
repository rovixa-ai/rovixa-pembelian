/* ======================================
   TREEHOUSE POS
   PEMBELIAN DATABASE RENDER
   CREATE DATABASE SPREADSHEET
====================================== */

const PembelianDatabaseRender = {

    initializedButtons:
        new WeakSet(),


    /* ==================================
       CONFIG
    ================================== */

    config: {

        pembelian: {

            input:
                "pembelianConfigPembelian",

            button:
                "pembelianConfigRenderPembelian",

            type:
                "pembelian"

        },


        detailPembelian: {

            input:
                "pembelianConfigDetailPembelian",

            button:
                "pembelianConfigRenderDetailPembelian",

            type:
                "detailpembelian"

        },


        pembayaran: {

            input:
                "pembelianConfigPembayaran",

            button:
                "pembelianConfigRenderPembayaran",

            type:
                "pembayaran"

        }

    },


    /* ==================================
       INIT
    ================================== */

    init() {

        this.bind();

    },


    /* ==================================
       BIND
    ================================== */

    bind() {

        Object.keys(
            this.config
        ).forEach(
            type => {

                const config =
                    this.config[type];


                const input =
                    document.getElementById(
                        config.input
                    );


                const button =
                    document.getElementById(
                        config.button
                    );


                if (
                    !input ||
                    !button
                ) {

                    return;

                }


                /*
                 * Jangan pasang event
                 * lebih dari satu kali.
                 */

                if (
                    this.initializedButtons.has(
                        button
                    )
                ) {

                    this.updateButton(
                        type
                    );

                    return;

                }


                this.initializedButtons.add(
                    button
                );


                /* ==========================
                   BUTTON
                =========================== */

                button.addEventListener(
                    "click",
                    () => {

                        this.render(
                            type
                        );

                    }
                );


                /* ==========================
                   INPUT
                =========================== */

                input.addEventListener(
                    "input",
                    () => {

                        this.updateButton(
                            type
                        );

                    }
                );


                /*
                 * Kondisi awal
                 */

                this.updateButton(
                    type
                );

            }
        );


        /*
         * Pastikan event dropdown
         * tahun juga terpasang.
         */

        this.bindYear();

    },


    /* ==================================
       BIND YEAR
    ================================== */

    bindYear() {

        const yearInput =
            document.getElementById(
                "pembelianConfigYear"
            );


        if (!yearInput) {

            return;

        }


        /*
         * Jangan pasang listener
         * lebih dari satu kali.
         */

        if (
            this.yearInput ===
            yearInput
        ) {

            return;

        }


        this.yearInput =
            yearInput;


        yearInput.addEventListener(
            "change",
            () => {

                /*
                 * PembelianDatabaseConfig
                 * sudah menangani pergantian
                 * tahun dan loadForm().
                 */

                setTimeout(
                    () => {

                        this.checkDatabases();

                    },
                    0
                );

            }
        );

    },


    /* ==================================
       UPDATE BUTTON
    ================================== */

    updateButton(type) {

        const config =
            this.config[type];


        if (!config) {

            return;

        }


        const input =
            document.getElementById(
                config.input
            );


        const button =
            document.getElementById(
                config.button
            );


        if (
            !input ||
            !button
        ) {

            return;

        }


        /*
         * Jika ID sudah ada
         * tombol disabled.
         *
         * Jika ID kosong
         * tombol aktif.
         */

        button.disabled =
            input.value.trim() !== "";

    },


    /* ==================================
       UPDATE ALL BUTTON
    ================================== */

    updateButtons() {

        Object.keys(
            this.config
        ).forEach(
            type => {

                this.updateButton(
                    type
                );

            }
        );

    },


    /* ==================================
       GET YEAR
    ================================== */

    getYear() {

        const yearInput =
            document.getElementById(
                "pembelianConfigYear"
            );


        if (!yearInput) {

            return null;

        }


        const year =
            Number(
                yearInput.value
            );


        return year || null;

    },


    /* ==================================
       CHECK DATABASES
    ================================== */

    async checkDatabases() {

        const year =
            this.getYear();


        if (!year) {

            return;

        }


        const pembelianInput =
            document.getElementById(
                "pembelianConfigPembelian"
            );


        const detailInput =
            document.getElementById(
                "pembelianConfigDetailPembelian"
            );


        const pembayaranInput =
            document.getElementById(
                "pembelianConfigPembayaran"
            );


        if (
            !pembelianInput ||
            !detailInput ||
            !pembayaranInput
        ) {

            return;

        }


        const pembelian =
            pembelianInput.value.trim();


        const detailPembelian =
            detailInput.value.trim();


        const pembayaran =
            pembayaranInput.value.trim();


        /*
         * Tidak ada database
         * yang perlu diperiksa.
         */

        if (
            !pembelian &&
            !detailPembelian &&
            !pembayaran
        ) {

            this.updateButtons();

            return;

        }


        try {

            this.status(
                "Memeriksa database pembelian tahun " +
                year +
                "...",
                "info"
            );


            const response =
                await API.post({

                    action:
                        "checkPembelianDatabaseSpreadsheet",

                    year:
                        year,

                    pembelian:
                        pembelian,

                    detailPembelian:
                        detailPembelian,

                    pembayaran:
                        pembayaran

                });


            


            if (
                !response ||
                response.success !== true
            ) {

                throw new Error(
                    response &&
                    response.message
                        ? response.message
                        : "Gagal memeriksa database pembelian."
                );

            }


            /*
             * Tentukan ID yang masih valid.
             */

            const validPembelian =
                response.pembelian === true
                    ? pembelian
                    : "";


            const validDetailPembelian =
                response.detailPembelian === true
                    ? detailPembelian
                    : "";


            const validPembayaran =
                response.pembayaran === true
                    ? pembayaran
                    : "";


            /*
             * Hapus ID yang sudah tidak valid
             * dari textbox.
             */

            pembelianInput.value =
                validPembelian;


            detailInput.value =
                validDetailPembelian;


            pembayaranInput.value =
                validPembayaran;


            /*
             * ==================================
             * SINKRONKAN KE LOCAL STORAGE
             * ==================================
             */

            if (
                typeof PembelianDatabaseConfig !==
                "undefined"
            ) {

                PembelianDatabaseConfig
                    .saveYearDatabase(
                        year,
                        {
                            pembelian:
                                validPembelian,

                            detailPembelian:
                                validDetailPembelian,

                            pembayaran:
                                validPembayaran
                        }
                    );

            }


            /*
             * Update tombol Render.
             */

            this.updateButtons();


            /*
             * Tentukan database yang hilang.
             */

            let removed = [];


            if (
                pembelian &&
                response.pembelian !== true
            ) {

                removed.push(
                    "Pembelian"
                );

            }


            if (
                detailPembelian &&
                response.detailPembelian !== true
            ) {

                removed.push(
                    "Detail Pembelian"
                );

            }


            if (
                pembayaran &&
                response.pembayaran !== true
            ) {

                removed.push(
                    "Pembayaran"
                );

            }


            /*
             * Semua database valid.
             */

            if (
                response.complete === true
            ) {

                this.status(
                    "3 database pembelian tahun " +
                    year +
                    " tersedia.",
                    "success"
                );

                return;

            }


            /*
             * Ada database yang sudah dihapus.
             */

            if (
                removed.length > 0
            ) {

                this.status(
                    "Database pembelian tahun " +
                    year +
                    " belum lengkap. " +
                    removed.join(", ") +
                    " tidak ditemukan. ID lama telah dihapus.",
                    "error"
                );

                return;

            }


            /*
             * Belum lengkap tetapi tidak ada
             * ID invalid yang ditemukan.
             */

            this.status(
                "Database pembelian tahun " +
                year +
                " belum memiliki 3 file database.",
                "info"
            );

        }

        catch (error) {

            console.error(
                "PEMBELIAN DATABASE CHECK ERROR:",
                error
            );


            this.updateButtons();


            this.status(
                error.message ||
                "Gagal memeriksa database pembelian.",
                "error"
            );

        }

    },


    /* ==================================
       RENDER
    ================================== */

    async render(type) {

        const config =
            this.config[type];


        if (!config) {

            return;

        }


        const input =
            document.getElementById(
                config.input
            );


        const button =
            document.getElementById(
                config.button
            );


        if (
            !input ||
            !button
        ) {

            return;

        }


        /*
         * Jangan render jika
         * ID sudah tersedia.
         */

        if (
            input.value.trim()
        ) {

            this.updateButton(
                type
            );

            return;

        }


        const year =
            this.getYear();


        /*
         * Validasi tahun.
         */

        if (!year) {

            this.status(

                "Tahun belum dipilih.",

                "error"

            );

            return;

        }


        /*
         * Simpan text asli.
         */

        const originalText =
            button.textContent;


        try {

            /*
             * Disable sementara.
             */

            button.disabled =
                true;


            button.textContent =
                "Rendering...";


            this.status(

                "Membuat database " +
                this.getDatabaseName(type) +
                " tahun " +
                year +
                "...",

                "info"

            );


            /*
             * REQUEST KE APPS SCRIPT
             */

            const response =
                await API.post({

                    action:
                        "createPembelianDatabaseSpreadsheet",

                    type:
                        config.type,

                    year:
                        year

                });


           


            /*
             * VALIDASI RESPONSE
             */

            if (
                !response ||
                response.success !== true
            ) {

                throw new Error(

                    response &&
                    response.message

                        ? response.message

                        : "Gagal membuat database pembelian."

                );

            }


            /*
             * VALIDASI ID
             */

            if (
                !response.id
            ) {

                throw new Error(

                    "Spreadsheet ID tidak diterima."

                );

            }


            /*
             * MASUKKAN ID.
             */

            input.value =
                String(
                    response.id
                ).trim();


            /*
             * Simpan ID langsung
             * ke konfigurasi tahun.
             */

            const currentDatabase =
                PembelianDatabaseConfig
                    .getYearDatabase(
                        year
                    );


            PembelianDatabaseConfig
                .saveYearDatabase(
                    year,
                    {

                        pembelian:
                            type === "pembelian"
                                ? response.id
                                : currentDatabase.pembelian,

                        detailPembelian:
                            type === "detailPembelian"
                                ? response.id
                                : currentDatabase.detailPembelian,

                        pembayaran:
                            type === "pembayaran"
                                ? response.id
                                : currentDatabase.pembayaran

                    }
                );


            /*
             * Tombol otomatis disabled.
             */

            this.updateButton(
                type
            );


            /*
             * Status sukses.
             */

            this.status(

                "Database " +
                this.getDatabaseName(type) +
                " tahun " +
                year +
                " berhasil dibuat.",

                "success"

            );

        }

        catch (error) {

            console.error(

                "PEMBELIAN DATABASE RENDER ERROR:",

                error

            );


            /*
             * Jika gagal,
             * tombol kembali aktif.
             */

            button.disabled =
                false;


            button.textContent =
                originalText;


            this.status(

                error.message ||
                "Gagal membuat database pembelian.",

                "error"

            );

        }

    },


    /* ==================================
       DATABASE NAME
    ================================== */

    getDatabaseName(type) {

        const names = {

            pembelian:
                "Pembelian",

            detailPembelian:
                "Detail Pembelian",

            pembayaran:
                "Pembayaran"

        };


        return (

            names[type] ||

            type

        );

    },


    /* ==================================
       STATUS
    ================================== */

    status(
        message,
        type = "info"
    ) {

        const element =
            document.getElementById(
                "pembelianConfigStatus"
            );


        if (!element) {

            return;

        }


        element.className =
            "config-status config-status-" +
            type;


        element.textContent =
            message;

    }

};


/* ======================================
   AUTO INIT
====================================== */

(function() {

    /*
     * Coba bind langsung.
     */

    PembelianDatabaseRender.init();


    /*
     * Karena aplikasi menggunakan
     * render halaman secara dinamis,
     * MutationObserver akan mendeteksi
     * tombol Config ketika muncul.
     */

    if (
        document.body
    ) {

        const observer =
            new MutationObserver(
                () => {

                    PembelianDatabaseRender.bind();

                }
            );


        observer.observe(

            document.body,

            {

                childList:
                    true,

                subtree:
                    true

            }

        );

    }

})();