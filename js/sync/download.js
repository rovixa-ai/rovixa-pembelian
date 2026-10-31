const Download = {

    async downloadUsers() {

        try {

            

            if (
                typeof DB === "undefined" ||
                !DB.instance
            ) {

                throw new Error(
                    "Database lokal belum diinisialisasi."
                );

            }

            if (
                !DB.instance.objectStoreNames.contains(
                    "users"
                )
            ) {

                throw new Error(
                    'Object store "users" belum tersedia. ' +
                    "Pastikan database sudah menggunakan versi terbaru."
                );

            }

            const result =
                await API.getUsers();

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Gagal mengambil data pengguna dari server."
                );

            }

            const users =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            const normalizedUsers =
                users
                    .map(user => {

                        return {

                            id: String(
                                user.id || ""
                            ).trim(),

                            username: String(
                                user.username || ""
                            ).trim(),

                            nama: String(
                                user.nama || ""
                            ).trim(),

                            pinHash: String(
                                user.pinHash || ""
                            ).trim(),

                            role: String(
                                user.role || ""
                            )
                            .trim()
                            .toUpperCase(),

                            status: String(
                                user.status || ""
                            ).trim(),

                            updatedAt: String(
                                user.updatedAt || ""
                            ).trim()

                        };

                    })
                    .filter(user =>
                        user.id &&
                        user.username
                    );

            await DB.replaceAll(
                "users",
                normalizedUsers
            );

            

            return {

                success: true,

                users: normalizedUsers.length

            };

        } catch (error) {

            console.error(
                "DOWNLOAD USERS ERROR:",
                error
            );

            return {

                success: false,

                message: error.message

            };

        }

    },


    async bootstrap() {

        try {

            


            /* ======================================
               BOOTSTRAP MASTER DATABASE
            ====================================== */

            const result =
                await API.getBootstrap();

            

            if (
                !result ||
                !result.success
            ) {

                throw new Error(
                    result?.message ||
                    "Gagal mengambil data bootstrap."
                );

            }

            const data =
                result.data || {};

            const barang =
                Array.isArray(data.barang)
                    ? data.barang
                    : [];

            const satuan =
                Array.isArray(data.satuan)
                    ? data.satuan
                    : [];


            /* ======================================
               SIMPAN MASTER DATABASE
            ====================================== */

            await DB.replaceAll(
                "barang",
                barang
            );

            await DB.replaceAll(
                "satuan",
                satuan
            );


            /* ======================================
               TENTUKAN TAHUN PEMBELIAN
            ====================================== */

            const year =
                Number(
                    PembelianDatabaseConfig
                        .getActiveYear()
                );

            if (!year) {

                throw new Error(
                    "Tahun database Pembelian tidak valid."
                );

            }

            


            /* ======================================
               RESOLVE DATABASE PEMBELIAN
            ====================================== */

            const databaseResponse =
                await API.get(
                    "resolvePembelianDatabase",
                    {
                        year
                    }
                );

           

            if (
                !databaseResponse ||
                databaseResponse.success !== true
            ) {

                throw new Error(
                    databaseResponse?.message ||
                    "Database Pembelian gagal ditemukan atau dibuat."
                );

            }

            const resolvedYear =
                Number(
                    databaseResponse.year ||
                    year
                );

            const pembelianId =
                String(
                    databaseResponse.pembelian ||
                    ""
                ).trim();

            const detailPembelianId =
                String(
                    databaseResponse.detailPembelian ||
                    ""
                ).trim();

            const pembayaranId =
                String(
                    databaseResponse.pembayaran ||
                    ""
                ).trim();

            if (!pembelianId) {

                throw new Error(
                    "Spreadsheet ID Pembelian tidak diterima dari server."
                );

            }

            if (!detailPembelianId) {

                throw new Error(
                    "Spreadsheet ID Detail Pembelian tidak diterima dari server."
                );

            }

            if (!pembayaranId) {

                throw new Error(
                    "Spreadsheet ID Pembayaran tidak diterima dari server."
                );

            }

            const database = {

                year: resolvedYear,

                pembelian: pembelianId,

                detailPembelian: detailPembelianId,

                pembayaran: pembayaranId

            };

           


            /* ======================================
               SIMPAN CONFIG DATABASE LOKAL
            ====================================== */

            PembelianDatabaseConfig
                .saveYearDatabase(
                    resolvedYear,
                    database
                );

            PembelianDatabaseConfig
                .setActiveYear(
                    resolvedYear
                );


            /* ======================================
               DOWNLOAD TRANSAKSI PEMBELIAN
            ====================================== */

            const pembelianResult =
                await API.getDownloadPembelian(
                    database
                );

            

            if (
                !pembelianResult ||
                pembelianResult.success !== true
            ) {

                throw new Error(
                    pembelianResult?.message ||
                    "Gagal download data Pembelian."
                );

            }

            const pembelianData =
                pembelianResult.data || {};

            const pembelian =
                Array.isArray(
                    pembelianData.pembelian
                )
                    ? pembelianData.pembelian
                    : [];

            const detailPembelianServer =
                Array.isArray(
                    pembelianData.detailPembelian
                )
                    ? pembelianData.detailPembelian
                    : [];

            const pembayaranServer =
                Array.isArray(
                    pembelianData.pembayaranPembelian
                )
                    ? pembelianData.pembayaranPembelian
                    : [];


            /* ======================================
               NORMALISASI DETAIL PEMBELIAN
            ====================================== */

            const detailCounter = {};

            const detailPembelian =
                detailPembelianServer.map(
                    (item, index) => {

                        const transaksiId =
                            String(
                                item.pembelianId ??
                                item.transaksiId ??
                                item.id ??
                                ""
                            ).trim();

                        detailCounter[transaksiId] =
                            (detailCounter[transaksiId] || 0) + 1;

                        const detailNumber =
                            detailCounter[transaksiId];

                        return {

                            ...item,

                            id:
                                transaksiId +
                                "-DETAIL-" +
                                detailNumber,

                            pembelianId:
                                transaksiId,

                            transaksiId:
                                transaksiId,

                            serverDetailId:
                                String(
                                    item.id ?? ""
                                ),

                            serverDetailIndex:
                                index

                        };

                    }
                );


            /* ======================================
               NORMALISASI PEMBAYARAN
            ====================================== */

            const paymentCounter = {};

            const pembayaran =
                pembayaranServer.map(
                    (item, index) => {

                        const transaksiId =
                            String(
                                item.pembelianId ??
                                item.transaksiId ??
                                item.id ??
                                ""
                            ).trim();

                        paymentCounter[transaksiId] =
                            (paymentCounter[transaksiId] || 0) + 1;

                        const paymentNumber =
                            paymentCounter[transaksiId];

                        return {

                            ...item,

                            id:
                                transaksiId +
                                "-PAYMENT-" +
                                paymentNumber,

                            pembelianId:
                                transaksiId,

                            transaksiId:
                                transaksiId,

                            serverPaymentId:
                                String(
                                    item.id ?? ""
                                ),

                            serverPaymentIndex:
                                index

                        };

                    }
                );


            /* ======================================
               SIMPAN TRANSAKSI KE INDEXEDDB
            ====================================== */

            await DB.replaceAll(
                "pembelian",
                pembelian
            );

            await DB.replaceAll(
                "detailPembelian",
                detailPembelian
            );

            await DB.replaceAll(
                "pembayaranPembelian",
                pembayaran
            );


            /* ======================================
               LAST BOOTSTRAP
            ====================================== */

            await DB.put(
                "config",
                {
                    key: "lastBootstrap",

                    value:
                        new Date().toISOString()
                }
            );


            /* ======================================
               LOG
            ====================================== */

            

            return {

                success: true,

                year: resolvedYear,

                barang: barang.length,

                satuan: satuan.length,

                pembelian: pembelian.length,

                detailPembelian: detailPembelian.length,

                pembayaran: pembayaran.length

            };

        } catch (error) {

            console.error(
                "BOOTSTRAP DOWNLOAD ERROR:",
                error
            );

            return {

                success: false,

                message: error.message

            };

        }

    }

};