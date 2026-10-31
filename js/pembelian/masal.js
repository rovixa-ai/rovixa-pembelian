/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
PAGE CONTROLLER
FILE: masal.js
====================================== */

const PembelianMassal = {

    items: [],
    barangList: [],
    satuanList: [],
    isSaving: false,
    initializedElement: null,

    editMode: false,
    editId: "",
    editOriginal: null,

    /* ======================================
       INIT HALAMAN PEMBELIAN MASSAL
    ====================================== */

    async init(params = {}) {

        const page = document.getElementById(
            "pembelian-massal-modal"
        );

        if (!page) {
            console.error(
                "HALAMAN PEMBELIAN MASSAL TIDAK DITEMUKAN."
            );
            return;
        }

        if (this.isSaving) {
            return;
        }

        try {

            const routeParams =
                params && Object.keys(params).length
                    ? params
                    : (
                        typeof Router !== "undefined"
                            ? Router.params || {}
                            : {}
                    );

            this.editMode =
                routeParams.mode === "edit" &&
                Boolean(routeParams.id);

            this.editId = this.editMode
                ? String(routeParams.id)
                : "";

            this.editOriginal = null;

            await this.refreshMasterData();

            this.bindEvents();

            if (this.editMode) {

                const loaded = await this.loadEditData(
                    this.editId
                );

                if (!loaded) {
                    return;
                }

            } else {

                this.items = [];

                this.setDefaultDate();

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

                if (supplier) supplier.value = "Supplier";
                if (invoice) invoice.value = "";
                if (metode) metode.value = "Cash";
                if (nominal) nominal.value = "0";

                PembelianMassalItem.renderItems(this);

                this.updateTotal();

                PembelianMassalItem.addItem(this);
            }

            this.initializedElement = page;

        } catch (error) {

            console.error(
                "PEMBELIAN MASSAL INIT ERROR:",
                error
            );

            Dialog.error(
    error.message ||
    "Gagal memuat data Pembelian Massal."
);
        }
    },

    /* ======================================
       KOMPATIBILITAS PEMANGGIL OPEN LAMA
    ====================================== */

    async open() {

        await this.init();

    },

    /* ======================================
       TUTUP HALAMAN
    ====================================== */

    close() {

        if (this.isSaving) {
            return;
        }

    },

    /* ======================================
       FORMAT RUPIAH
    ====================================== */

    formatRupiah(value) {

        if (
            typeof Pembelian !== "undefined" &&
            typeof Pembelian.formatRupiah === "function"
        ) {

            return Pembelian.formatRupiah(value);
        }

        return "Rp " + Number(
            value || 0
        ).toLocaleString("id-ID");
    },

    /* ======================================
       ESCAPE HTML
    ====================================== */

    escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    },

    /* ======================================
       ESCAPE ATTRIBUTE
    ====================================== */

    escapeAttribute(value) {

        return this.escapeHTML(value);
    }

};