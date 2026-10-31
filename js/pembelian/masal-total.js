/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
PERHITUNGAN TOTAL
FILE: masal-total.js
====================================== */

Object.assign(PembelianMassal, {

    /* ======================================
       HITUNG TOTAL PEMBELIAN
    ====================================== */

    getTotal() {

        return this.items.reduce(
            (sum, item) =>
                sum + PembelianMassalItem.itemTotal(item),
            0
        );
    },

    /* ======================================
       UPDATE TOTAL
    ====================================== */

    updateTotal() {

        const totalElement = document.getElementById(
            "massal-grand-total"
        );

        if (totalElement) {

            totalElement.textContent =
                this.formatRupiah(this.getTotal());
        }

        document.querySelectorAll(
            "#massal-items [data-massal-total], " +
            "#massal-mobile-items [data-massal-total]"
        ).forEach(element => {

            const index = Number(
                element.dataset.massalTotal
            );

            const item = this.items[index];

            if (item) {

                element.textContent =
                    this.formatRupiah(
                        PembelianMassalItem.itemTotal(item)
                    );
            }
        });
    }

});