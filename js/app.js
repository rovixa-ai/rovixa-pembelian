/*======================================
TREEHOUSE POS
APP
======================================*/

const App = {

    pembelianMassalMediaQuery: null,
    pembelianMassalResizeHandler: null,
    pembelianMassalResizeTimer: null,
    pembelianMassalRenderMode: null,

    /*======================================
    INITIALIZE APPLICATION
    ======================================*/

    async init() {

        Loading.show(
            "Menyiapkan database dan memuat data aplikasi...",
            "Memuat Aplikasi"
        );

        try {

            Loading.update(
                "Menginisialisasi database lokal...",
                "Memuat Aplikasi"
            );

            await DB.init();

            Loading.update(
                "Memuat konfigurasi toko...",
                "Memuat Aplikasi"
            );

            await StoreConfig.load();

            Loading.update(
                "Menyiapkan sinkronisasi data...",
                "Memuat Aplikasi"
            );

            Sync.init();

            /*======================================
            DOWNLOAD DATA USER UNTUK LOGIN
            ======================================*/

            Loading.update(
                "Memuat data pengguna...",
                "Memuat Aplikasi"
            );

            if (
                typeof Download !== "undefined" &&
                typeof Download.downloadUsers === "function"
            ) {

                const usersResult =
                    await Download.downloadUsers();

                if (
                    !usersResult ||
                    usersResult.success !== true
                ) {

                    console.warn(
                        "Download user gagal:",
                        usersResult?.message
                    );

                }

            }

            /*======================================
            DOWNLOAD DATA TRANSAKSI
            ======================================*/

            Loading.update(
                "Mengunduh dan menyiapkan data transaksi...",
                "Memuat Aplikasi"
            );

            const result =
                await Download.bootstrap();

            if (
                !result ||
                !result.success
            ) {

                console.warn(
                    "Download gagal:",
                    result?.message
                );

            }

            /*======================================
            VALIDASI SESSION LOGIN
            ======================================*/

            Loading.update(
                "Memeriksa sesi pengguna...",
                "Memuat Aplikasi"
            );

            let sessionResult = {
                success: false,
                loggedIn: false
            };

            if (
                typeof Auth !== "undefined" &&
                typeof Auth.validateSession === "function"
            ) {

                sessionResult =
                    await Auth.validateSession();

            }

            /*======================================
            SESSION VALID
            BUKA HALAMAN PEMBELIAN
            ======================================*/

            if (
                sessionResult &&
                sessionResult.success === true &&
                sessionResult.loggedIn === true
            ) {

                Loading.update(
                    "Menyiapkan tampilan aplikasi...",
                    "Memuat Aplikasi"
                );

                this.renderHeader();

                Router.go("pembelian");

            }

            /*======================================
            SESSION TIDAK VALID
            TAMPILKAN LOGIN
            ======================================*/

            else {

                if (
                    typeof Login === "undefined" ||
                    typeof Login.init !== "function"
                ) {

                    throw new Error(
                        "Modul Login tidak tersedia. " +
                        "Pastikan js/auth.js dan js/login.js sudah dimuat."
                    );

                }

                await Login.init();

            }

        } catch (error) {

            console.error(
                "APP PEMBELIAN INIT ERROR:",
                error
            );

            Dialog.error(
                error.message ||
                "Gagal memuat aplikasi."
            );

        } finally {

            Loading.hide();

        }

    },


    /*======================================
    LOGOUT
    ======================================*/

    async logout() {

        const confirmed = await Dialog.confirm(
            "Apakah Anda yakin ingin logout?",
            {
                title: "Konfirmasi Logout",
                confirmText: "Ya, Logout",
                cancelText: "Batal",
                variant: "danger"
            }
        );

        if (!confirmed) {
            return;
        }

        if (
            typeof Auth !== "undefined" &&
            typeof Auth.logout === "function"
        ) {

            Auth.logout();

        }

        this.stopPembelianMassalRenderSwitch();

        const app =
            document.getElementById("app");

        if (app) {

            app.classList.add(
                "login-mode"
            );

        }

        const loginPage =
            document.getElementById("loginPage");

        if (loginPage) {

            loginPage.remove();

        }

        if (
            typeof Login !== "undefined" &&
            typeof Login.init === "function"
        ) {

            await Login.init();

        } else {

            Dialog.error(
                "Modul Login tidak tersedia."
            );

        }

    },


    /*======================================
    RENDER HEADER
    ======================================*/

    renderHeader() {

        const isMobile =
            window.matchMedia(
                "(max-width: 768px)"
            ).matches;

        if (isMobile) {

            AppMobileRender.renderHeader();

        } else {

            AppDesktopRender.renderHeader();

        }

        const sidebar =
            document.getElementById("sidebar");

        if (sidebar) {
            sidebar.remove();
        }

        const mobileMenu =
            document.getElementById("mobileMenu");

        if (mobileMenu) {
            mobileMenu.remove();
        }

    },


    /*======================================
    RENDER PEMBELIAN MASSAL
    DESKTOP / MOBILE
    ======================================*/

    renderPembelianMassal() {

        const isMobile =
            window.matchMedia(
                "(max-width: 768px)"
            ).matches;

        if (isMobile) {

            if (
                typeof PembelianMassalMobileRender ===
                "undefined"
            ) {

                console.error(
                    "PembelianMassalMobileRender tidak ditemukan. " +
                    "Pastikan masal-render-mobile.js sudah dimuat."
                );

                return null;

            }

            return PembelianMassalMobileRender.render();

        }

        if (
            typeof PembelianMassalRender ===
            "undefined"
        ) {

            console.error(
                "PembelianMassalRender tidak ditemukan. " +
                "Pastikan masal-render.js sudah dimuat."
            );

            return null;

        }

        return PembelianMassalRender.render();

    },


    /*======================================
    RENDER MODAL SCANNER BARCODE
    ======================================*/

    renderPembelianBarcodeScanner() {

        if (
            document.getElementById(
                "pembelian-barcode-scanner"
            )
        ) {
            return;
        }

        if (
            typeof PembelianScannerRender === "undefined"
        ) {

            console.error(
                "PembelianScannerRender tidak ditemukan."
            );

            return;

        }

        const container = document.createElement("div");

        container.innerHTML =
            PembelianScannerRender.render().trim();

        const modal = container.firstElementChild;

        if (modal) {
            document.body.appendChild(modal);
        }

    },


    /*======================================
    PASANG PEMANTAU PERUBAHAN UKURAN LAYAR
    ======================================*/

    startPembelianMassalRenderSwitch() {

        if (!this.pembelianMassalMediaQuery) {

            this.pembelianMassalMediaQuery =
                window.matchMedia(
                    "(max-width: 768px)"
                );

        }

        if (this.pembelianMassalResizeHandler) {
            return;
        }

        this.pembelianMassalResizeHandler = () => {

            if (
                !this.pembelianMassalMediaQuery
            ) {
                return;
            }

            const nextMode =
                this.pembelianMassalMediaQuery.matches
                    ? "mobile"
                    : "desktop";

            if (
                nextMode ===
                this.pembelianMassalRenderMode
            ) {
                return;
            }

            if (this.pembelianMassalResizeTimer) {

                clearTimeout(
                    this.pembelianMassalResizeTimer
                );

            }

            this.pembelianMassalResizeTimer =
                setTimeout(() => {

                    this.switchPembelianMassalRender();

                }, 120);

        };

        if (
            typeof this.pembelianMassalMediaQuery
                .addEventListener === "function"
        ) {

            this.pembelianMassalMediaQuery.addEventListener(
                "change",
                this.pembelianMassalResizeHandler
            );

        } else {

            this.pembelianMassalMediaQuery.addListener(
                this.pembelianMassalResizeHandler
            );

        }

    },


    /*======================================
    LEPAS PEMANTAU UKURAN LAYAR
    ======================================*/

    stopPembelianMassalRenderSwitch() {

        if (
            this.pembelianMassalResizeTimer
        ) {

            clearTimeout(
                this.pembelianMassalResizeTimer
            );

            this.pembelianMassalResizeTimer = null;

        }

        if (
            !this.pembelianMassalMediaQuery ||
            !this.pembelianMassalResizeHandler
        ) {
            return;
        }

        if (
            typeof this.pembelianMassalMediaQuery
                .removeEventListener === "function"
        ) {

            this.pembelianMassalMediaQuery.removeEventListener(
                "change",
                this.pembelianMassalResizeHandler
            );

        } else {

            this.pembelianMassalMediaQuery.removeListener(
                this.pembelianMassalResizeHandler
            );

        }

        this.pembelianMassalResizeHandler = null;

    },


    /*======================================
    SIMPAN NILAI FORM PEMBELIAN
    ======================================*/

    capturePembelianMassalForm() {

        const page = document.getElementById(
            "pembelian-massal-modal"
        );

        if (!page) {
            return null;
        }

        const fields = {};

        page.querySelectorAll(
            "input[id], select[id], textarea[id]"
        ).forEach(element => {

            fields[element.id] = {
                value: element.value,
                checked:
                    element instanceof HTMLInputElement
                        ? element.checked
                        : undefined
            };

        });

        return fields;

    },


    /*======================================
    PULIHKAN NILAI FORM PEMBELIAN
    ======================================*/

    restorePembelianMassalForm(fields) {

        if (!fields) {
            return;
        }

        const page = document.getElementById(
            "pembelian-massal-modal"
        );

        if (!page) {
            return;
        }

        Object.entries(fields).forEach(
            ([id, saved]) => {

                const element =
                    page.querySelector(
                        "#" + CSS.escape(id)
                    );

                if (!element) {
                    return;
                }

                element.value = saved.value;

                if (
                    element instanceof HTMLInputElement &&
                    typeof saved.checked === "boolean"
                ) {

                    element.checked =
                        saved.checked;

                }

            }
        );

    },


    /*======================================
    PINDAH RENDER PEMBELIAN
    DESKTOP <-> MOBILE
    ======================================*/

    switchPembelianMassalRender() {

        const pageElement =
            document.getElementById("page");

        const currentPage =
            typeof Router !== "undefined"
                ? Router.currentPage
                : "";

        if (
            currentPage !== "pembelian" ||
            !pageElement ||
            !document.getElementById(
                "pembelian-massal-modal"
            )
        ) {
            return;
        }

        const nextMode =
            window.matchMedia(
                "(max-width: 768px)"
            ).matches
                ? "mobile"
                : "desktop";

        if (
            nextMode ===
            this.pembelianMassalRenderMode
        ) {
            return;
        }

        const formState =
            this.capturePembelianMassalForm();

        const renderedHTML =
            this.renderPembelianMassal();

        if (renderedHTML === null) {
            return;
        }

        pageElement.innerHTML =
            renderedHTML;

        this.pembelianMassalRenderMode =
            nextMode;

        this.restorePembelianMassalForm(
            formState
        );

        /*
         * State item tetap berada pada
         * PembelianMassal.items.
         * Render ulang dari state tersebut.
         */

        if (
            typeof PembelianMassalItem !== "undefined" &&
            typeof PembelianMassalItem.renderItems === "function"
        ) {

            PembelianMassalItem.renderItems(
                PembelianMassal
            );

        }

        this.restorePembelianMassalForm(
            formState
        );

        /*
         * Bind ulang hanya pada elemen halaman
         * yang baru dibuat.
         */

        if (
            typeof PembelianMassal !== "undefined" &&
            typeof PembelianMassal.bindEvents === "function"
        ) {

            PembelianMassal.bindEvents();

        }

        if (
            typeof PembelianMassal !== "undefined" &&
            typeof PembelianMassal.updateTotal === "function"
        ) {

            PembelianMassal.updateTotal();

        }

    },


    /*======================================
    LOAD PAGE
    ======================================*/

    loadPage(page) {

        /*==================================
        CEGAH AKSES HALAMAN TANPA LOGIN
        ==================================*/

        if (
            typeof Auth !== "undefined" &&
            !Auth.isLoggedIn()
        ) {

            this.stopPembelianMassalRenderSwitch();

            if (
                typeof Login !== "undefined"
            ) {

                Login.init();

            }

            return;

        }

        const pages = {

            pembelian: {
                title: "Pembelian",
                subtitle: "Transaksi pembelian"
            },

            "laporan-pembelian": {
                title: "Laporan Pembelian",
                subtitle: "Laporan transaksi pembelian"
            }

        };

        const info =
            pages[page];

        if (!info) {
            return;
        }

        this.renderPembelianBarcodeScanner();

        /*==================================
        PEMBELIAN MASSAL
        SEBAGAI HALAMAN UTAMA
        ==================================*/

        if (page === "pembelian") {

            const headerTitle =
                document.getElementById(
                    "header-title"
                );

            const headerSubtitle =
                document.getElementById(
                    "header-subtitle"
                );

            const pageElement =
                document.getElementById(
                    "page"
                );

            if (headerTitle) {

                headerTitle.textContent =
                    info.title;

            }

            if (headerSubtitle) {

                headerSubtitle.textContent =
                    info.subtitle;

            }

            if (!pageElement) {
                return;
            }

            const renderedHTML =
                this.renderPembelianMassal();

            if (renderedHTML === null) {
                return;
            }

            pageElement.innerHTML =
                renderedHTML;

            this.pembelianMassalRenderMode =
                window.matchMedia(
                    "(max-width: 768px)"
                ).matches
                    ? "mobile"
                    : "desktop";

            const params =
                typeof Router !== "undefined"
                    ? Router.params || {}
                    : {};

            PembelianMassal.init(params);

            this.startPembelianMassalRenderSwitch();

            /*==================================
            LAPORAN PEMBELIAN MODAL
            ==================================*/

            const laporanModal =
                document.getElementById(
                    "laporanPembelianModal"
                );

            if (!laporanModal) {

                const laporanContainer =
                    document.createElement(
                        "div"
                    );

                laporanContainer.innerHTML =
                    LaporanPembelian.render();

                const modal =
                    laporanContainer.firstElementChild;

                if (modal) {

                    document.body.appendChild(
                        modal
                    );

                }

            }

            LaporanPembelian.init();

        }


        /*==================================
        LAPORAN PEMBELIAN
        MODAL
        ==================================*/

        else if (
            page === "laporan-pembelian"
        ) {

            LaporanPembelian.openModal();

            return;

        }

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        App.init();

    }
);