
 // ======================================
// LAPORAN PEMBELIAN
// FILTER
// ======================================

Object.assign(LaporanPembelian, {

    // ==================================
    // FILTER
    // ==================================

    async filter() {

        try {

            const tanggal =
                document.getElementById(
                    "laporanPembelianTanggal"
                )?.value || "";

            const supplier =
                document.getElementById(
                    "laporanPembelianSupplier"
                )?.value || "";

            if (!tanggal) {

                Dialog.error(
    "Tanggal belum dipilih."
);

                return;

            }

            /*
            ==================================
            AMBIL DATA DARI INDEXEDDB
            ==================================
            */

            this.setLoading(true);

            const [
                pembelian,
                detailPembelian,
                pembayaran
            ] = await Promise.all([

                DB.getAll("pembelian"),

                DB.getAll("detailPembelian"),

                DB.getAll("pembayaranPembelian")

            ]);

            

            /*
            ==================================
            MAP DETAIL PEMBELIAN
            SATU DETAIL HANYA DICATAT SEKALI
            ==================================
            */

            const detailMap = new Map();

            detailPembelian.forEach(item => {

                const transaksiId =
                    String(
                        item.pembelianId ||
                        item.transaksiId ||
                        item.id ||
                        ""
                    ).trim();

                if (!transaksiId) {
                    return;
                }

                const detail = {

                    kode:
                        item.kode || "",

                    namaBarang:
                        item.nama ||
                        item.namaBarang ||
                        item.kode ||
                        "",

                    satuan:
                        item.satuan || "",

                    qty:
                        Number(item.qty) || 0,

                    konversi:
                        Number(
                            item.isi ||
                            item.konversi ||
                            1
                        ) || 1,

                    harga:
                        Number(item.harga) || 0,

                    disc:
                        Number(item.disc) || 0,

                    total:
                        Number(item.total) || 0

                };

                if (!detailMap.has(transaksiId)) {

                    detailMap.set(
                        transaksiId,
                        []
                    );

                }

                detailMap
                    .get(transaksiId)
                    .push(detail);

            });

            /*
            ==================================
            MAP PEMBAYARAN
            ==================================
            */

            const paymentMap = new Map();

            pembayaran.forEach(payment => {

                const transaksiId =
                    String(
                        payment.pembelianId ||
                        payment.transaksiId ||
                        payment.id ||
                        ""
                    ).trim();

                if (!transaksiId) {
                    return;
                }

                const paymentData = {

                    metode:
                        payment.metode || "",

                    nominal:
                        Number(payment.nominal) || 0,

                    kembalian:
                        Number(payment.kembalian) || 0

                };

                if (!paymentMap.has(transaksiId)) {

                    paymentMap.set(
                        transaksiId,
                        []
                    );

                }

                paymentMap
                    .get(transaksiId)
                    .push(paymentData);

            });

            /*
            ==================================
            FILTER HEADER PEMBELIAN
            ==================================
            */

            const transactions =
                pembelian

                    .filter(row => {

                        const rowTanggal =
                            String(
                                row.tanggal || ""
                            ).trim();

                        const rowSupplier =
                            String(
                                row.supplier || ""
                            ).trim();

                        const tanggalMatch =
                            rowTanggal === tanggal;

                        const supplierMatch =
                            !supplier ||
                            rowSupplier === supplier;

                        return (
                            tanggalMatch &&
                            supplierMatch
                        );

                    })

                    .map(row => {

                        const id =
                            String(
                                row.id || ""
                            ).trim();

                        /*
                        ==================================
                        DATA DETAIL
                        ==================================
                        */

                        let items = [];

                        if (
                            Array.isArray(row.items)
                        ) {

                            items =
                                row.items.map(item => ({

                                    kode:
                                        item.barang ||
                                        item.kode ||
                                        "",

                                    namaBarang:
                                        item.namaBarang ||
                                        item.nama ||
                                        item.barang ||
                                        "",

                                    satuan:
                                        item.satuan || "",

                                    qty:
                                        Number(item.qty) || 0,

                                    konversi:
                                        Number(
                                            item.isi ||
                                            item.konversi ||
                                            1
                                        ) || 1,

                                    harga:
                                        Number(item.harga) || 0,

                                    disc:
                                        Number(item.disc) || 0,

                                    total:
                                        Number(item.total) ||
                                        (
                                            (
                                                Number(item.qty) || 0
                                            ) *
                                            (
                                                Number(item.harga) || 0
                                            )
                                        ) -
                                        (
                                            Number(item.disc) || 0
                                        )

                                }));

                        }

                        if (!items.length) {

                            items =
                                detailMap.get(id) || [];

                        }

                        /*
                        ==================================
                        DATA PEMBAYARAN
                        ==================================
                        */

                        let payments = [];

                        if (
                            Array.isArray(row.payments)
                        ) {

                            payments =
                                row.payments.map(payment => ({

                                    metode:
                                        payment.metode || "",

                                    nominal:
                                        Number(payment.nominal) || 0,

                                    kembalian:
                                        Number(payment.kembalian) || 0

                                }));

                        }

                        if (!payments.length) {

                            payments =
                                paymentMap.get(id) || [];

                        }

                        /*
                        ==================================
                        HITUNG SUBTOTAL DARI ITEM
                        ==================================
                        */

                        const calculatedSubtotal =
                            items.reduce(
                                (sum, item) => {

                                    return (
                                        sum +
                                        (
                                            (
                                                Number(item.qty) || 0
                                            ) *
                                            (
                                                Number(item.harga) || 0
                                            )
                                        )
                                    );

                                },
                                0
                            );

                        /*
                        ==================================
                        HITUNG DISCOUNT DARI ITEM
                        ==================================
                        */

                        const calculatedDiscount =
                            items.reduce(
                                (sum, item) => {

                                    return (
                                        sum +
                                        (
                                            Number(item.disc) || 0
                                        )
                                    );

                                },
                                0
                            );

                        /*
                        ==================================
                        SUBTOTAL HEADER
                        ==================================
                        */

                        const rowSubtotal =
                            Number(row.subtotal);

                        const subtotal =
                            Number.isFinite(rowSubtotal)
                                ? rowSubtotal
                                : calculatedSubtotal;

                        /*
                        ==================================
                        DISCOUNT HEADER
                        ==================================
                        */

                        const rowDiscount =
                            Number(row.disc);

                        const discount =
                            Number.isFinite(rowDiscount)
                                ? rowDiscount
                                : calculatedDiscount;

                        /*
                        ==================================
                        TOTAL HEADER
                        ==================================
                        */

                        const rowTotal =
                            Number(row.total);

                        const calculatedTotal =
                            subtotal - discount;

                        const transactionTotal =
                            Number.isFinite(rowTotal)
                                ? rowTotal
                                : calculatedTotal;

                         const sumberWaktu =
                            String(
                                row.tanggalJam ||
                                row.jam ||
                                row.waktu ||
                                ""
                            ).trim();

                        const hasilJam =
                            sumberWaktu.match(
                                /(?:T|\s)(\d{2}:\d{2}(?::\d{2})?)/ 
                            ) ||
                            sumberWaktu.match(
                                /^(\d{2}:\d{2}(?::\d{2})?)$/
                            );

                        const waktuDariTanggal =
                            String(
                                row.tanggal || ""
                            )
                                .trim()
                                .match(
                                    /(?:T|\s)(\d{2}:\d{2}(?::\d{2})?)/
                                );

                        const tanggalJam =
                            hasilJam
                                ? hasilJam[1]
                                : (
                                    waktuDariTanggal
                                        ? waktuDariTanggal[1]
                                        : (
                                            row.tanggal instanceof Date
                                                ? row.tanggal
                                                    .toTimeString()
                                                    .slice(0, 8)
                                                : ""
                                        )
                                );

                        return {

                            ...row,

                            id,

                            tanggalJam,

                            subtotal,

                            disc: discount,

                            total: transactionTotal,

                            items,

                            payments

                        };



                    });

                    transactions.sort((a, b) => {
    const tanggalA = String(
        a.tanggal || ""
    ).trim();

    const tanggalB = String(
        b.tanggal || ""
    ).trim();

    const waktuA = String(
        a.tanggalJam || ""
    ).trim();

    const waktuB = String(
        b.tanggalJam || ""
    ).trim();

    const tanggalWaktuA = `${tanggalA} ${waktuA}`;
    const tanggalWaktuB = `${tanggalB} ${waktuB}`;

    return tanggalWaktuB.localeCompare(tanggalWaktuA);
});

            /*
            ==================================
            HITUNG SUMMARY
            ==================================
            */

            let totalTransaksi = 0;
            let totalItem = 0;
            let subtotal = 0;
            let discount = 0;
            let total = 0;

            let cash = 0;
            let qris = 0;
            let debit = 0;
            let transfer = 0;
            let kartu = 0;

            let totalPayment = 0;

            transactions.forEach(row => {

                totalTransaksi++;

                row.items.forEach(item => {

                    totalItem +=
                        Number(item.qty) || 0;

                });

                subtotal +=
                    Number(row.subtotal) || 0;

                discount +=
                    Number(row.disc) || 0;

                total +=
                    Number(row.total) || 0;

                row.payments.forEach(payment => {

                    const nominal =
                        Number(payment.nominal) || 0;

                    totalPayment += nominal;

                    const metode =
                        String(
                            payment.metode || ""
                        )
                            .trim()
                            .toUpperCase();

                    if (metode === "CASH") {

                        cash += nominal;

                    } else if (metode === "QRIS") {

                        qris += nominal;

                    } else if (metode === "DEBIT") {

                        debit += nominal;

                    } else if (metode === "TRANSFER") {

                        transfer += nominal;

                    } else if (metode === "KARTU") {

                        kartu += nominal;

                    }

                });

            });

            /*
            ==================================
            BENTUK DATA REPORT
            ==================================
            */

            this.report = {

                transactions,

                summary: {

                    totalTransaksi,

                    totalItem,

                    subtotal,

                    discount,

                    total,

                    cash,

                    qris,

                    debit,

                    transfer,

                    kartu,

                    totalPayment

                }

            };

            this.data = this.report;

            this.filtered = transactions;

            /*
            ==================================
            UPDATE SUPPLIER
            ==================================
            */

            this.updateSupplierOptions(
                this.filtered,
                supplier
            );

            /*
            ==================================
            RENDER
            ==================================
            */

            this.renderTable();

            this.renderSummary(
                this.report.summary
            );

        }

        catch (error) {

            console.error(
                "LaporanPembelian:",
                error
            );

            Dialog.error(
                error.message ||
                "Gagal memuat laporan pembelian."
            );

        }

        finally {

            this.setLoading(false);

        }

    }

});
