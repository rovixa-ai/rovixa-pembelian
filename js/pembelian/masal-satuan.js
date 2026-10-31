// ======================================
// TREEHOUSE POS
// PEMBELIAN MASSAL
// SATUAN CONTROLLER
// FILE: pembelian-massal-satuan.js
// ======================================

const PembelianMassalSatuan = {

    /* ======================================
       NORMALISASI NAMA SATUAN
    ====================================== */

    normalizeSatuan(value) {

        return String(value || "")
            .trim()
            .toUpperCase();
    },


    /* ======================================
       CARI SATUAN MASTER
    ====================================== */

    findSatuan(kode, namaSatuan, controller = PembelianMassal) {

        return (controller.satuanList || []).find(
            satuan =>
                String(satuan.kode) === String(kode) &&
                this.normalizeSatuan(satuan.satuan) ===
                this.normalizeSatuan(namaSatuan)
        ) || null;
    },


    /* ======================================
       GANTI SATUAN PEMBELIAN
    ====================================== */

    changeSatuan(index, namaSatuan, controller = PembelianMassal) {

        const item = controller.items[index];

        if (!item) return;

        const satuan = String(
            namaSatuan || ""
        ).trim();

        const selected = (item.satuanList || []).find(
            row =>
                this.normalizeSatuan(row.satuan) ===
                this.normalizeSatuan(satuan)
        );

        item.satuan = selected
            ? selected.satuan
            : satuan;

        if (selected) {

            item.barcode = String(
                selected.barcodeSatuan ||
                item.barcode ||
                ""
            );

            item.harga = Number(
                selected.hargaBeli
            ) || 0;

            item.konversi = Number(
                selected.isi
            ) || Number(
                selected.konversi
            ) || 1;

            item.hargaJual = Number(
                selected.hargaJual
            ) || 0;

        } else {

            if (
                this.normalizeSatuan(satuan) === "PCS"
            ) {

                item.konversi = 1;

                item.hargaJual = Number(
                    item.hargaJualPCS
                ) || 0;
            }
        }

        PembelianMassalItem.renderItems(controller);
        controller.updateTotal();
    }

};