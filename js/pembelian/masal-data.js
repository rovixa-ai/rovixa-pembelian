/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
DATA MASTER DAN FORM
FILE: masal-data.js
====================================== */

Object.assign(PembelianMassal, {

    /* ======================================
       TANGGAL DEFAULT
    ====================================== */

    setDefaultDate() {

        const input = document.getElementById(
            "massal-tanggal"
        );

        if (!input) {
            return;
        }

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        input.value = `${year}-${month}-${day}`;
    },

    /* ======================================
       REFRESH DATA MASTER
    ====================================== */

    async refreshMasterData() {

        this.barangList =
            await DB.getAll("barang") || [];

        this.satuanList =
            await DB.getAll("satuan") || [];

        this.barangList =
            this.barangList.filter(
                barang =>
                    String(
                        barang.status || "Aktif"
                    ).toLowerCase() !== "nonaktif"
            );
    },

    /* ======================================
       RESET FORM DENGAN KONFIRMASI
    ====================================== */

    
async resetForm() {

    if (this.isSaving) {
        return;
    }

    if (this.editMode) {

        const confirmed = await Dialog.confirm(
            "Batalkan edit pembelian ini?",
            {
                title: "Konfirmasi Pembatalan",
                confirmText: "Ya, Batalkan",
                cancelText: "Lanjutkan Edit",
                variant: "danger"
            }
        );

        if (confirmed) {
            this.returnFromEdit();
        }

        return;
    }

    if (this.items.length > 0) {

        const confirmed = await Dialog.confirm(
            "Kosongkan seluruh isian Pembelian Massal?",
            {
                title: "Konfirmasi Reset",
                confirmText: "Ya, Kosongkan",
                cancelText: "Batal",
                variant: "danger"
            }
        );

        if (!confirmed) {
            return;
        }
    }

    this.clearForm();
},


    /* ======================================
       KOSONGKAN FORM
    ====================================== */

    clearForm() {

        this.items = [];

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

        this.setDefaultDate();

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

        PembelianMassalItem.renderItems(this);

        this.updateTotal();
    }

});