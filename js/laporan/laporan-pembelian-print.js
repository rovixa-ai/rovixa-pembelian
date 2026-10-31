Object.assign(LaporanPembelian, {

    async laporan() {

        Loading.show(
            "Menyiapkan laporan pembelian...",
            "Memproses Laporan"
        );

        try {

            const tanggalInput =
                document.getElementById(
                    "laporanPembelianTanggal"
                );

            const tanggal =
                tanggalInput?.value || "";

            if (!tanggal) {

                await Dialog.alert(
                    "Tanggal laporan belum dipilih.",
                    {
                        title: "Data Belum Lengkap"
                    }
                );

                return;

            }

            if (
                typeof PembelianDatabaseConfig ===
                "undefined"
            ) {

                throw new Error(
                    "Konfigurasi database Pembelian tidak tersedia."
                );

            }

            const databaseConfig =
                PembelianDatabaseConfig
                    .getActiveDatabase();

            if (!databaseConfig) {

                throw new Error(
                    "Database Pembelian belum dikonfigurasi."
                );

            }

            const database = {

                year:
                    Number(
                        PembelianDatabaseConfig
                            .getActiveYear()
                    ),

                pembelianId:
                    String(
                        databaseConfig.pembelian ||
                        ""
                    ).trim(),

                detailPembelianId:
                    String(
                        databaseConfig.detailPembelian ||
                        ""
                    ).trim(),

                pembayaranId:
                    String(
                        databaseConfig.pembayaran ||
                        ""
                    ).trim()

            };

            if (!database.pembelianId) {

                throw new Error(
                    "Spreadsheet Pembelian tidak ditemukan."
                );

            }

            if (!database.detailPembelianId) {

                throw new Error(
                    "Spreadsheet Detail Pembelian tidak ditemukan."
                );

            }

            if (!database.pembayaranId) {

                throw new Error(
                    "Spreadsheet Pembayaran tidak ditemukan."
                );

            }

            /*
             * ======================================
             * 1. UPDATE SUMMARY LAPORAN
             * ======================================
             */

            Loading.update(
                "Memperbarui ringkasan dari Spreadsheet...",
                "Memperbarui Laporan"
            );

            const saveResult =
                await API.saveLaporanPembelian({

                    tanggal,

                    database

                });

            if (
                !saveResult ||
                saveResult.success !== true
            ) {

                throw new Error(
                    saveResult?.message ||
                    "Gagal memperbarui laporan pembelian."
                );

            }

            /*
             * ======================================
             * 2. KONFIRMASI CETAK PDF
             * ======================================
             */

            Loading.hide();

            const confirmed =
                await Dialog.confirm(
                    `Ringkasan laporan pembelian tanggal ${tanggal} berhasil diperbarui. Apakah Anda ingin mencetak PDF?`,
                    {
                        title: "Konfirmasi Cetak PDF",
                        confirmText: "Ya, Cetak PDF",
                        cancelText: "Batal",
                        variant: "default"
                    }
                );

            if (!confirmed) {

                return;

            }

            /*
             * ======================================
             * 3. BUAT PDF LAPORAN
             * ======================================
             */

            Loading.show(
                "Membuat file PDF laporan pembelian...",
                "Membuat PDF"
            );

            const printResult =
                await API.printLaporanPembelian({

                    tanggal,

                    database

                });

            if (
                !printResult ||
                printResult.success !== true
            ) {

                throw new Error(
                    printResult?.message ||
                    "Gagal membuat PDF laporan pembelian."
                );

            }

            if (!printResult.url) {

                throw new Error(
                    "PDF berhasil dibuat tetapi URL PDF tidak tersedia."
                );

            }

            /*
             * ======================================
             * 4. BUKA PDF
             * ======================================
             */

            Loading.update(
                "Membuka dokumen laporan...",
                "Laporan Selesai"
            );

            window.open(
                printResult.url,
                "_blank"
            );

        } catch (error) {

            console.error(
                "PRINT LAPORAN PEMBELIAN ERROR:",
                error
            );

            await Dialog.alert(
                error.message ||
                "Gagal memproses laporan pembelian.",
                {
                    title: "Gagal Memproses Laporan",
                    variant: "danger"
                }
            );

        } finally {

            Loading.hide();

        }

    }

});