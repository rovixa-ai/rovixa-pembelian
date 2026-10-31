/* ======================================
TREEHOUSE POS
PEMBELIAN MASSAL
SINKRONISASI DAN DATA LOKAL
FILE: masal-sync.js
====================================== */

Object.assign(PembelianMassal, {

    /* ======================================
       REFRESH LAPORAN PEMBELIAN
    ====================================== */

    async refreshLaporanPembelian() {

        const halamanLaporan =
            document.getElementById("laporan-pembelian");

        const tanggal =
            document.getElementById(
                "laporanPembelianTanggal"
            );

        if (
            typeof LaporanPembelian === "undefined" ||
            typeof LaporanPembelian.filter !== "function"
        ) {
            return;
        }

        if (!halamanLaporan && !tanggal) {
            return;
        }

        if (
            halamanLaporan &&
            (
                halamanLaporan.hidden ||
                halamanLaporan.offsetParent === null
            )
        ) {
            return;
        }

        if (tanggal && !tanggal.value) {
            return;
        }

        try {

            await LaporanPembelian.filter();

            
        } catch (error) {

            console.error(
                "REFRESH LAPORAN PEMBELIAN ERROR:",
                error
            );
        }
    },

    /* ======================================
       TUNGGU SINKRONISASI SEBELUMNYA
    ====================================== */

    async waitForSyncIdle() {

        while (
            typeof Sync !== "undefined" &&
            Sync.processing
        ) {

            await new Promise(resolve => {
                setTimeout(resolve, 100);
            });
        }
    },

    /* ======================================
       PROSES ANTREAN PEMBELIAN
    ====================================== */

    async processPurchaseQueue(purchaseId) {

        if (
            typeof Sync === "undefined" ||
            typeof Sync.process !== "function"
        ) {

            console.warn(
                "SYNC PROCESS TIDAK TERSEDIA."
            );

            return;
        }

        const maxAttempts = 5;

        for (
            let attempt = 1;
            attempt <= maxAttempts;
            attempt++
        ) {

            await this.waitForSyncIdle();

            const queues =
                await DB.getAll("syncQueue") || [];

            const queue = queues.find(item =>
                item.type === "pembelian" &&
                String(item.referenceId) === String(purchaseId) &&
                item.status !== "success"
            );

            if (!queue) {

                

                return;
            }

            if (queue.status === "pending") {

                await Sync.process();
            }

            await this.waitForSyncIdle();

            const updatedQueues =
                await DB.getAll("syncQueue") || [];

            const updatedQueue =
                updatedQueues.find(item =>
                    item.id === queue.id
                );

            if (
                updatedQueue &&
                updatedQueue.status === "success"
            ) {
                return;
            }

            if (
                updatedQueue &&
                updatedQueue.lastError
            ) {

                console.error(
                    "SINKRONISASI PEMBELIAN GAGAL:",
                    updatedQueue.lastError
                );

                return;
            }

            await new Promise(resolve => {
                setTimeout(resolve, 300);
            });
        }

        console.warn(
            "ANTREAN PEMBELIAN MASIH MENUNGGU:",
            purchaseId
        );
    },

    /* ======================================
       UPDATE DETAIL DAN PEMBAYARAN LOKAL
    ====================================== */

    async updateLocalEditRecords(data, purchaseId) {

        const allDetails =
            await DB.getAll("detailPembelian") || [];

        const oldDetails = allDetails.filter(item => {

            const reference = String(
                item.pembelianId ||
                item.transaksiId ||
                item.idPembelian ||
                item.idTransaksi ||
                ""
            );

            return reference === String(purchaseId);
        });

        const oldPayments =
            await DB.getAll("pembayaranPembelian") || [];

        const matchingPayments = oldPayments.filter(item => {

            const reference = String(
                item.pembelianId ||
                item.transaksiId ||
                item.idPembelian ||
                item.idTransaksi ||
                ""
            );

            return reference === String(purchaseId);
        });

        for (const detail of oldDetails) {
            await DB.delete("detailPembelian", detail.id);
        }

        for (const payment of matchingPayments) {
            await DB.delete("pembayaranPembelian", payment.id);
        }

        for (
            let index = 0;
            index < data.items.length;
            index++
        ) {

            const item = data.items[index];

            const detailId =
                `${purchaseId}-DETAIL-${index + 1}`;

            await DB.put("detailPembelian", {

                id: detailId,

                pembelianId: purchaseId,

                transaksiId: purchaseId,

                kode: item.barang,

                nama: item.namaBarang,

                namaBarang: item.namaBarang,

                satuan: item.satuan,

                barcode: item.barcode,

                qty: Number(item.qty) || 0,

                konversi: Number(item.konversi) || 1,

                harga: Number(item.harga) || 0,

                disc: Number(item.disc) || 0,

                total: Number(item.total) || 0
            });
        }

        for (
            let index = 0;
            index < data.payments.length;
            index++
        ) {

            const payment = data.payments[index];

            await DB.put("pembayaranPembelian", {

                id: `${purchaseId}-PAYMENT-${index + 1}`,

                pembelianId: purchaseId,

                transaksiId: purchaseId,

                metode: payment.metode,

                nominal: Number(payment.nominal) || 0,

                kembalian: 0
            });
        }
    }

});