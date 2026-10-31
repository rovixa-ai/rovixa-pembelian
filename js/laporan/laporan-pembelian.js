// ======================================
// LAPORAN PEMBELIAN
// MAIN MODULE
// ======================================

const LaporanPembelian = {

    data: null,

    report: null,

    filtered: [],

    editReturnState: null,

    // ==================================
    // INIT
    // ==================================

    async init() {

        this.data = null;
        this.report = null;
        this.filtered = [];

        this.bindEvents();

        this.resetSummary();
        this.renderTable();

        await this.loadSupplier();

        if (this.editReturnState) {

            const state = this.editReturnState;

            const tanggal =
                document.getElementById(
                    "laporanPembelianTanggal"
                );

            const supplier =
                document.getElementById(
                    "laporanPembelianSupplier"
                );

            if (tanggal) {
                tanggal.value = state.tanggal || "";
            }

            if (supplier) {
                supplier.value = state.supplier || "";
            }

            await this.filter();

            this.editReturnState = null;

            return;
        }

        this.setDefaultDate();

        await this.filter();

    },

    // ==================================
    // SIMPAN KONDISI SEBELUM EDIT
    // ==================================

    saveEditReturnState() {

        const tanggal =
            document.getElementById(
                "laporanPembelianTanggal"
            );

        const supplier =
            document.getElementById(
                "laporanPembelianSupplier"
            );

        this.editReturnState = {

            tanggal:
                tanggal
                    ? tanggal.value
                    : "",

            supplier:
                supplier
                    ? supplier.value
                    : ""

        };

    },

    // ==================================
    // KEMBALI DARI MODE EDIT
    // ==================================

    async returnFromEdit(refresh = true) {

    const state = this.editReturnState;

    const tanggal =
        document.getElementById(
            "laporanPembelianTanggal"
        );

    const supplier =
        document.getElementById(
            "laporanPembelianSupplier"
        );

    if (state) {

        if (tanggal) {
            tanggal.value = state.tanggal || "";
        }

        if (supplier) {
            supplier.value = state.supplier || "";
        }

    }

    this.openModal();

    if (refresh) {
        await this.filter();
    }

    this.editReturnState = null;
},

    // ==================================
    // MODAL
    // ==================================

    openModal() {

        const modal =
            document.getElementById(
                "laporanPembelianModal"
            );

        if (!modal) {
            return;
        }

        modal.hidden = false;

        document.body.classList.add(
            "laporan-pembelian-modal-open"
        );

    },

    closeModal() {

        const modal =
            document.getElementById(
                "laporanPembelianModal"
            );

        if (!modal) {
            return;
        }

        modal.hidden = true;

        document.body.classList.remove(
            "laporan-pembelian-modal-open"
        );

    },

    // ==================================
    // DEFAULT DATE
    // ==================================

   setDefaultDate() {

    const input =
        document.getElementById(
            "laporanPembelianTanggal"
        );

    if (!input) return;

    const sekarang = new Date();

    const tahun =
        sekarang.getFullYear();

    const bulan =
        String(
            sekarang.getMonth() + 1
        ).padStart(2, "0");

    const tanggal =
        String(
            sekarang.getDate()
        ).padStart(2, "0");

    input.value =
        `${tahun}-${bulan}-${tanggal}`;

},

    // ==================================
    // EVENT
    // ==================================

    bindEvents() {

        const laporan =
            document.getElementById(
                "laporanPembelianLaporan"
            );

        if (laporan) {

            laporan.onclick = () => {
                this.laporan();
            };

        }

        const modalBackdrop =
            document.getElementById(
                "laporanPembelianModalBackdrop"
            );

        if (modalBackdrop) {

            modalBackdrop.onclick = () => {
                this.closeModal();
            };

        }

        document.onkeydown = event => {

            if (event.key !== "Escape") {
                return;
            }

            const modal =
                document.getElementById(
                    "laporanPembelianModal"
                );

            if (modal && !modal.hidden) {
                this.closeModal();
            }

        };

        const tanggal =
            document.getElementById(
                "laporanPembelianTanggal"
            );

        const filter =
            document.getElementById(
                "laporanPembelianFilter"
            );

        const reset =
            document.getElementById(
                "laporanPembelianReset"
            );

        if (tanggal) {

            tanggal.onchange = () => {
                this.filter();
            };

        }

        if (filter) {

            filter.onclick = () => {
                this.filter();
            };

        }

        if (reset) {

            reset.onclick = () => {
                this.reset();
            };

        }

        const supplier =
            document.getElementById(
                "laporanPembelianSupplier"
            );

        if (supplier) {

            supplier.onchange = () => {
                this.filter();
            };

        }

        const close =
            document.getElementById(
                "laporanPembelianClose"
            );

        if (close) {

            close.onclick = () => {
                this.closeModal();
            };

        }

    },

    // ==================================
    // SUPPLIER
    // ==================================

    async loadSupplier() {

        const select =
            document.getElementById(
                "laporanPembelianSupplier"
            );

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Semua Supplier
            </option>
        `;

    },

    // ==================================
    // RESET
    // ==================================

    reset() {

        this.data = null;
        this.report = null;
        this.filtered = [];

        this.setDefaultDate();

        const supplier =
            document.getElementById(
                "laporanPembelianSupplier"
            );

        if (supplier) {

            supplier.innerHTML = `
                <option value="">
                    Semua Supplier
                </option>
            `;

            supplier.value = "";

        }

        this.resetSummary();
        this.renderTable();

        this.filter();

    },

    // ==================================
    // LOADING
    // ==================================

    setLoading(loading) {

        let loader =
            document.getElementById(
                "laporanPembelianLoading"
            );

        if (!loader) {

            loader =
                document.createElement("div");

            loader.id =
                "laporanPembelianLoading";

            loader.className =
                "laporan-pembelian-loading";

            loader.innerHTML = `
                <div class="laporan-pembelian-loading-content">
                    <div class="laporan-pembelian-loading-spinner"></div>
                    <div class="laporan-pembelian-loading-text">
                        Memproses Laporan...
                    </div>
                </div>
            `;

            document.body.appendChild(loader);

        }

        loader.hidden = !loading;

        if (loading) {

            document.body.classList.add(
                "laporan-pembelian-loading-open"
            );

        } else {

            document.body.classList.remove(
                "laporan-pembelian-loading-open"
            );

        }

    },

    // ==================================
    // SUPPLIER OPTIONS
    // ==================================

    updateSupplierOptions(
        transactions,
        selectedSupplier = ""
    ) {

        const select =
            document.getElementById(
                "laporanPembelianSupplier"
            );

        if (!select) return;

        const suppliers =
            [
                ...new Set(
                    transactions
                        .map(
                            row =>
                                String(
                                    row.supplier || ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ].sort(
                (a, b) =>
                    a.localeCompare(b, "id")
            );

        select.innerHTML = `
            <option value="">
                Semua Supplier
            </option>
            ${
                suppliers
                    .map(
                        supplier => `
                            <option value="${this.escape(supplier)}">
                                ${this.escape(supplier)}
                            </option>
                        `
                    )
                    .join("")
            }
        `;

        select.value = selectedSupplier || "";

    },

    // ==================================
    // FORMAT NUMBER
    // ==================================

    number(value) {

        return (
            Number(value) || 0
        ).toLocaleString("id-ID");

    },

    // ==================================
    // FORMAT MONEY
    // ==================================

    money(value) {

        return "Rp " +
            (
                Number(value) || 0
            ).toLocaleString("id-ID");

    },

    // ==================================
    // FORMAT DATE
    // ==================================

    date(value) {

        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    },

    // ==================================
    // SET TEXT
    // ==================================

    setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.textContent = value;

    },

    // ==================================
    // ESCAPE HTML
    // ==================================

    escape(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

};