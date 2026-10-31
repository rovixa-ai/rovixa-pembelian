/* ======================================
   TREEHOUSE POS
   PEMBELIAN DATABASE CONFIGURATION
====================================== */

const PembelianDatabaseConfig = {

    STORAGE_KEY:
        "TREEHOUSE_POS_PEMBELIAN_DATABASE_CONFIG",


    /* ==================================
       DEFAULT CONFIG
    ================================== */

    defaultConfig() {

        return {

            activeYear:
                new Date().getFullYear(),

            databases: {}

        };

    },


    /* ==================================
       GET CONFIG
    ================================== */

    getConfig() {

        try {

            const saved =
                localStorage.getItem(
                    this.STORAGE_KEY
                );


            if (!saved) {

                const config =
                    this.defaultConfig();

                this.saveConfig(config);

                return config;

            }


            const config =
                JSON.parse(saved);


            return this.normalize(
                config
            );

        }

        catch (error) {

            console.error(
                "PEMBELIAN DATABASE CONFIG ERROR:",
                error
            );


            return this.defaultConfig();

        }

    },


    /* ==================================
       SAVE CONFIG
    ================================== */

    saveConfig(config) {

        const normalized =
            this.normalize(config);


        localStorage.setItem(

            this.STORAGE_KEY,

            JSON.stringify(
                normalized
            )

        );


        return normalized;

    },


    /* ==================================
       NORMALIZE
    ================================== */

    normalize(config) {

        const result =
            config || {};


        if (
            !result.databases ||
            typeof result.databases !== "object"
        ) {

            result.databases = {};

        }


        if (!result.activeYear) {

            result.activeYear =
                new Date().getFullYear();

        }


        /*
         * Pastikan setiap database
         * mempunyai struktur lengkap.
         */

        Object.keys(
            result.databases
        ).forEach(
            year => {

                const database =
                    result.databases[year] || {};


                result.databases[year] = {

                    pembelian:
                        String(
                            database.pembelian || ""
                        ).trim(),

                    detailPembelian:
                        String(
                            database.detailPembelian || ""
                        ).trim(),

                    pembayaran:
                        String(
                            database.pembayaran || ""
                        ).trim()

                };

            }
        );


        return result;

    },


    /* ==================================
       GET ACTIVE YEAR
    ================================== */

    getActiveYear() {

        const config =
            this.getConfig();


        return Number(
            config.activeYear
        );

    },


    /* ==================================
       GET ACTIVE DATABASE
    ================================== */

    getActiveDatabase() {

        const config =
            this.getConfig();


        const year =
            Number(
                config.activeYear
            );


        const database =
            config.databases[year] || {

                pembelian: "",

                detailPembelian: "",

                pembayaran: ""

            };


        return {

            year: year,

            pembelian:
                database.pembelian || "",

            detailPembelian:
                database.detailPembelian || "",

            pembayaran:
                database.pembayaran || ""

        };

    },


    /* ==================================
       SET ACTIVE YEAR
    ================================== */

    setActiveYear(year) {

        const config =
            this.getConfig();


        config.activeYear =
            Number(year);


        this.saveConfig(
            config
        );


        return this.getActiveDatabase();

    },


    /* ==================================
       GET DATABASE PER TAHUN
    ================================== */

    getYearDatabase(year) {

        const config =
            this.getConfig();


        year =
            Number(year);


        return config.databases[year] || {

            pembelian: "",

            detailPembelian: "",

            pembayaran: ""

        };

    },


    /* ==================================
       SAVE DATABASE PER TAHUN
    ================================== */

    saveYearDatabase(
        year,
        database
    ) {

        const config =
            this.getConfig();


        year =
            Number(year);


        if (
            !config.databases[year]
        ) {

            config.databases[year] = {};

        }


        config.databases[year] = {

            pembelian:
                String(
                    database.pembelian || ""
                ).trim(),

            detailPembelian:
                String(
                    database.detailPembelian || ""
                ).trim(),

            pembayaran:
                String(
                    database.pembayaran || ""
                ).trim()

        };


        this.saveConfig(
            config
        );


        return this.getYearDatabase(
            year
        );

    },


    /* ==================================
       PAGE
    ================================== */

    page() {

        return `

            <div class="config-page">

                <div class="config-header">

                    <div>

                        <h2>
                            Config Pembelian
                        </h2>

                        <p>
                            Pengaturan database transaksi pembelian
                        </p>

                    </div>

                </div>


                <div class="config-card">


                    <!-- ==========================
                         DATABASE TAHUN AKTIF
                    =========================== -->

                    <div class="config-section">

                        <div class="config-section-title">

                            <strong>
                                Database Tahun Aktif
                            </strong>

                            <span>
                                Semua transaksi pembelian
                                menggunakan tahun ini.
                            </span>

                        </div>


                        <div class="config-field">

                            <label>
                                Tahun Aktif
                            </label>


                            <select
                                id="pembelianConfigYear"
                                class="config-input"
                            ></select>

                        </div>

                    </div>



                    <!-- ==========================
                         DATABASE PEMBELIAN
                    =========================== -->

                    <div class="config-section">

                        <div class="config-section-title">

                            <strong>
                                Database Pembelian
                            </strong>

                            <span>
                                Setiap tahun menggunakan
                                tiga Spreadsheet terpisah.
                            </span>

                        </div>


                        <div class="config-field">

                            <label>
                                Spreadsheet Pembelian
                            </label>


                            <div class="config-input-row">

                                <input
                                    type="text"
                                    id="pembelianConfigPembelian"
                                    class="config-input"
                                    placeholder="Masukkan Spreadsheet ID"
                                />


                                <button
                                    type="button"
                                    id="pembelianConfigRenderPembelian"
                                    class="config-button config-button-secondary"
                                >
                                    Render
                                </button>

                            </div>


                            <small>
                                Database untuk tabel Pembelian
                            </small>

                        </div>



                        <div class="config-field">

                            <label>
                                Spreadsheet Detail Pembelian
                            </label>


                            <div class="config-input-row">

                                <input
                                    type="text"
                                    id="pembelianConfigDetailPembelian"
                                    class="config-input"
                                    placeholder="Masukkan Spreadsheet ID"
                                />


                                <button
                                    type="button"
                                    id="pembelianConfigRenderDetailPembelian"
                                    class="config-button config-button-secondary"
                                >
                                    Render
                                </button>

                            </div>


                            <small>
                                Database untuk tabel DetailPembelian
                            </small>

                        </div>



                        <div class="config-field">

                            <label>
                                Spreadsheet Pembayaran
                            </label>


                            <div class="config-input-row">

                                <input
                                    type="text"
                                    id="pembelianConfigPembayaran"
                                    class="config-input"
                                    placeholder="Masukkan Spreadsheet ID"
                                />


                                <button
                                    type="button"
                                    id="pembelianConfigRenderPembayaran"
                                    class="config-button config-button-secondary"
                                >
                                    Render
                                </button>

                            </div>


                            <small>
                                Database untuk tabel Pembayaran
                            </small>

                        </div>

                    </div>



                    <!-- ==========================
                         MASTER DATABASE
                    =========================== -->

                    <div class="config-section config-master-info">

                        <div class="config-section-title">

                            <strong>
                                Master Database
                            </strong>

                            <span>
                                Barang dan Satuan Barang
                                tetap menggunakan Master Database.
                            </span>

                        </div>


                        <div class="config-info">

                            <span class="config-info-icon">
                                ✓
                            </span>


                            <div>

                                <strong>
                                    Master Database tetap
                                </strong>


                                <p>
                                    Perubahan tahun tidak
                                    mengubah sumber data
                                    Barang dan Satuan Barang.
                                </p>

                            </div>

                        </div>

                    </div>



                    <!-- ==========================
                         STATUS
                    =========================== -->

                    <div
                        id="pembelianConfigStatus"
                        class="config-status"
                    ></div>



                    <!-- ==========================
                         ACTION
                    =========================== -->

                    <div class="config-actions">

                        <button
                            type="button"
                            id="pembelianConfigSave"
                            class="config-button config-button-primary"
                        >
                            Simpan Config
                        </button>

                    </div>


                </div>

            </div>

        `;

    },


    /* ==================================
   INIT
================================== */

async init() {

    const currentYear =
        new Date().getFullYear();


    const config =
        this.getConfig();


    /*
     * Tahun saat aplikasi pertama kali
     * dibuka selalu mengikuti tahun sekarang.
     */

    config.activeYear =
        currentYear;


    this.saveConfig(
        config
    );


    /*
     * ==================================
     * RENDER TAHUN
     * ==================================
     */

    this.renderYears();


    /*
     * ==================================
     * CEK DATABASE TAHUN AKTIF
     * ==================================
     */

    const database =
        this.getYearDatabase(
            currentYear
        );


    const incomplete =

        !database.pembelian ||

        !database.detailPembelian ||

        !database.pembayaran;


    /*
     * ==================================
     * DATABASE BELUM ADA DI LOCALSTORAGE
     *
     * Cari database yang sebenarnya
     * sudah ada di Google Drive.
     * ==================================
     */

    if (incomplete) {

        await this.discoverYearDatabase(
            currentYear
        );

    }


    /*
     * ==================================
     * LOAD FORM
     * ==================================
     */

    this.loadForm();


    /*
     * ==================================
     * EVENT
     * ==================================
     */

    this.event();

},


/* ==================================
   DISCOVER DATABASE
================================== */

async discoverYearDatabase(year) {

    try {

        this.status(
            "Memeriksa database pembelian tahun " +
            year +
            "...",
            "info"
        );


        /*
         * ==================================
         * REQUEST KE BACKEND
         * ==================================
         */

        const response =
            await API.post({

                action:
                    "findPembelianDatabaseSpreadsheet",

                year:
                    year

            });


        /*
         * ==================================
         * VALIDASI RESPONSE
         * ==================================
         */

        if (
            !response ||
            response.success !== true
        ) {

            console.warn(
                "DATABASE PEMBELIAN TIDAK DITEMUKAN:",
                response
            );

            return;

        }


        /*
         * ==================================
         * AMBIL CONFIG LAMA
         * ==================================
         */

        const existing =
            this.getYearDatabase(
                year
            );


        /*
         * ==================================
         * GABUNGKAN HASIL DISCOVERY
         *
         * Jangan menghapus ID lama
         * apabila salah satu database
         * tidak ditemukan.
         * ==================================
         */

        const database = {

            pembelian:
                response.pembelian ||
                existing.pembelian ||
                "",

            detailPembelian:
                response.detailPembelian ||
                existing.detailPembelian ||
                "",

            pembayaran:
                response.pembayaran ||
                existing.pembayaran ||
                ""

        };


        /*
         * ==================================
         * SIMPAN KE LOCALSTORAGE
         * ==================================
         */

        this.saveYearDatabase(

            year,

            database

        );


        /*
         * ==================================
         * LOG
         * ==================================
         */

        


        /*
         * ==================================
         * STATUS
         * ==================================
         */

        if (

            database.pembelian &&

            database.detailPembelian &&

            database.pembayaran

        ) {

            this.status(
                "Database Pembelian tahun " +
                year +
                " ditemukan.",
                "success"
            );

        }

    }

    catch (error) {

        console.error(
            "PEMBELIAN DATABASE DISCOVERY ERROR:",
            error
        );


        this.status(
            "Gagal memeriksa database Pembelian.",
            "error"
        );

    }

},


    /* ==================================
       RENDER YEARS
    ================================== */

    renderYears() {

        const select =
            document.getElementById(
                "pembelianConfigYear"
            );


        if (!select) return;


        const currentYear =
            new Date().getFullYear();


        const config =
            this.getConfig();


        const activeYear =
            Number(
                config.activeYear
            );


        const years = [];


        for (
            let year = currentYear - 2;
            year <= currentYear + 5;
            year++
        ) {

            years.push(
                year
            );

        }


        select.innerHTML =

            years.map(
                year => `

                    <option
                        value="${year}"
                        ${
                            year === activeYear
                                ? "selected"
                                : ""
                        }
                    >
                        ${year}
                    </option>

                `
            ).join("");

    },


    /* ==================================
       LOAD FORM
    ================================== */

    loadForm() {

        const yearInput =
            document.getElementById(
                "pembelianConfigYear"
            );


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
            !yearInput ||
            !pembelianInput ||
            !detailInput ||
            !pembayaranInput
        ) {

            return;

        }


        const year =
            Number(
                yearInput.value
            );


        const database =
            this.getYearDatabase(
                year
            );


        /*
         * ==================================
         * ISI DATABASE
         * ==================================
         */

        pembelianInput.value =
            database.pembelian || "";


        detailInput.value =
            database.detailPembelian || "";


        pembayaranInput.value =
            database.pembayaran || "";


        /*
         * ==================================
         * TEXTBOX SELALU READ ONLY
         * ==================================
         */

        pembelianInput.readOnly =
            true;


        detailInput.readOnly =
            true;


        pembayaranInput.readOnly =
            true;


        /*
         * ==================================
         * TAHUN TETAP BISA DIPILIH
         * ==================================
         */

        yearInput.disabled =
            false;


        /*
         * ==================================
         * TOMBOL SIMPAN
         * ==================================
         */

        const saveButton =
            document.getElementById(
                "pembelianConfigSave"
            );


        if (saveButton) {

            saveButton.style.display =
                "inline-block";

        }


        /*
         * ==================================
         * TIDAK ADA LOCK
         * ==================================
         */

        this.status(
            "",
            "info"
        );


        /*
         * ==================================
         * UPDATE RENDER BUTTON
         * ==================================
         */

        if (
            typeof PembelianDatabaseRender !==
            "undefined"
        ) {

            PembelianDatabaseRender.updateButtons();

        }

    },


    /* ==================================
       EVENT
    ================================== */

    event() {

        const yearInput =
            document.getElementById(
                "pembelianConfigYear"
            );


        const saveButton =
            document.getElementById(
                "pembelianConfigSave"
            );


        if (yearInput) {

            yearInput.addEventListener(
                "change",
                () => {

                    const year =
                        Number(
                            yearInput.value
                        );


                    /*
                     * Jadikan tahun aktif.
                     */

                    this.setActiveYear(
                        year
                    );


                    /*
                     * Load database
                     * tahun tersebut.
                     */

                    this.loadForm();


                    /*
                     * Update tombol Render
                     * jika tersedia.
                     */

                    if (
                        typeof PembelianDatabaseRender !==
                        "undefined"
                    ) {

                        PembelianDatabaseRender.updateButtons();

                    }


                   

                }
            );

        }


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                () => {

                    this.save();

                }
            );

        }

    },


    /* ==================================
       SAVE
    ================================== */

    save() {

        const yearInput =
            document.getElementById(
                "pembelianConfigYear"
            );


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
            !yearInput ||
            !pembelianInput ||
            !detailInput ||
            !pembayaranInput
        ) {

            return;

        }


        const year =
            Number(
                yearInput.value
            );


        const pembelian =
            pembelianInput.value.trim();


        const detailPembelian =
            detailInput.value.trim();


        const pembayaran =
            pembayaranInput.value.trim();


        /*
         * ==================================
         * VALIDASI TAHUN
         * ==================================
         */

        if (!year) {

            this.status(

                "Tahun belum dipilih.",

                "error"

            );

            return;

        }


        /*
         * ==================================
         * VALIDASI PEMBELIAN
         * ==================================
         */

        if (!pembelian) {

            this.status(

                "Spreadsheet Pembelian belum diisi.",

                "error"

            );

            return;

        }


        /*
         * ==================================
         * VALIDASI DETAIL PEMBELIAN
         * ==================================
         */

        if (!detailPembelian) {

            this.status(

                "Spreadsheet Detail Pembelian belum diisi.",

                "error"

            );

            return;

        }


        /*
         * ==================================
         * VALIDASI PEMBAYARAN
         * ==================================
         */

        if (!pembayaran) {

            this.status(

                "Spreadsheet Pembayaran belum diisi.",

                "error"

            );

            return;

        }


        /*
         * ==================================
         * SIMPAN DATABASE
         *
         * Tidak ada LOCK.
         * ==================================
         */

        this.saveYearDatabase(

            year,

            {

                pembelian:
                    pembelian,

                detailPembelian:
                    detailPembelian,

                pembayaran:
                    pembayaran

            }

        );


        /*
         * ==================================
         * JADIKAN TAHUN AKTIF
         * ==================================
         */

        this.setActiveYear(
            year
        );


        /*
         * ==================================
         * RELOAD FORM
         * ==================================
         */

        this.loadForm();


        /*
         * ==================================
         * UPDATE TOMBOL RENDER
         * ==================================
         */

        if (
            typeof PembelianDatabaseRender !==
            "undefined"
        ) {

            PembelianDatabaseRender.updateButtons();

        }


        /*
         * ==================================
         * STATUS SUKSES
         * ==================================
         */

        this.status(

            "Config Pembelian tahun " +
            year +
            " berhasil disimpan.",

            "success"

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


        if (!element) return;


        element.className =
            "config-status config-status-" +
            type;


        element.textContent =
            message;

    }

};