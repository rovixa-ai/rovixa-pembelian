// ======================================
// TREEHOUSE POS
// PEMBELIAN MASSAL
// MASTER BARANG DAN SATUAN
// FILE: pembelian-massal-master.js
// ======================================

const PembelianMassalMaster = {

    /* ======================================
       NORMALISASI DATA
    ====================================== */

    normalizeKode(value) {

        return String(value || "")
            .trim()
            .toUpperCase();

    },


    normalizeBarcode(value) {

        return String(value || "")
            .trim();

    },


    normalizeSatuan(value) {

        return PembelianMassalSatuan.normalizeSatuan(
            value
        );
    },


    toNumber(value, fallback = 0) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    },


    /* ======================================
       CARI SATUAN
    ====================================== */

    findSatuan(
        kode,
        namaSatuan,
        controller = PembelianMassal
    ) {

        const normalizedKode =
            this.normalizeKode(kode);

        const normalizedSatuan =
            this.normalizeSatuan(namaSatuan);

        return PembelianMassalSatuan.findSatuan(
            normalizedKode,
            normalizedSatuan,
            controller
        );
    },


    /* ======================================
       SINKRONISASI ARRAY MASTER
    ====================================== */

    updateControllerBarang(
        barang,
        controller = PembelianMassal
    ) {

        if (!Array.isArray(controller.barangList)) {
            controller.barangList = [];
        }

        const index =
            controller.barangList.findIndex(
                item =>
                    this.normalizeKode(item.kode) ===
                    this.normalizeKode(barang.kode)
            );

        if (index >= 0) {

            controller.barangList[index] = barang;

        } else {

            controller.barangList.push(barang);

        }
    },


    updateControllerSatuan(
        satuan,
        oldId = "",
        controller = PembelianMassal
    ) {

        if (!Array.isArray(controller.satuanList)) {
            controller.satuanList = [];
        }

        const index =
            controller.satuanList.findIndex(
                item =>
                    item.id === satuan.id ||
                    (
                        oldId &&
                        item.id === oldId
                    )
            );

        if (index >= 0) {

            controller.satuanList[index] = satuan;

        } else {

            controller.satuanList.push(satuan);

        }
    },


    /* ======================================
       SIMPAN / PERBARUI MASTER BARANG
    ====================================== */

    async ensureMasterBarang(
        item,
        controller = PembelianMassal
    ) {

        const kode =
            this.normalizeKode(item.barang);

        if (!kode) {

            throw new Error(
                "Kode barang wajib diisi."
            );

        }

        const existing =
            await DB.get(
                "barang",
                kode
            );

        if (existing) {

            const updatedData = {

                ...existing,

                kode,

                barcode:
                    this.normalizeBarcode(
                        item.barcode
                    ),

                nama:
                    String(
                        item.namaBarang || ""
                    ).trim(),

                kategori:
                    existing.kategori || "Umum",

                satuanDasar:
                    existing.satuanDasar || "PCS",

                status:
                    existing.status || "Aktif"

            };

            if (!updatedData.nama) {

                throw new Error(
                    `Nama barang ${kode} wajib diisi.`
                );

            }

            const changed =
                existing.barcode !== updatedData.barcode ||
                existing.nama !== updatedData.nama ||
                existing.kategori !== updatedData.kategori ||
                existing.satuanDasar !== updatedData.satuanDasar ||
                existing.status !== updatedData.status;

            if (changed) {

                await Sync.updateBarang(
                    updatedData
                );

            }

            const saved =
                await DB.get(
                    "barang",
                    kode
                );

            this.updateControllerBarang(
                saved || updatedData,
                controller
            );

            return saved || updatedData;
        }

        const dataBarang = {

            kode,

            barcode:
                this.normalizeBarcode(
                    item.barcode
                ),

            nama:
                String(
                    item.namaBarang || ""
                ).trim(),

            kategori: "Umum",

            satuanDasar: "PCS",

            stok: 0,

            status: "Aktif"

        };

        if (!dataBarang.nama) {

            throw new Error(
                `Nama barang ${kode} wajib diisi.`
            );

        }

        await Sync.addBarang(
            dataBarang
        );

        const barang =
            await DB.get(
                "barang",
                kode
            );

        if (!barang) {

            throw new Error(
                `Barang ${kode} belum ditemukan setelah disimpan.`
            );

        }

        this.updateControllerBarang(
            barang,
            controller
        );

        return barang;
    },


    /* ======================================
       SIMPAN / PERBARUI MASTER SATUAN
    ====================================== */

    async ensureMasterSatuan(
        dataSatuan,
        controller = PembelianMassal
    ) {

        const kode =
            this.normalizeKode(
                dataSatuan.kode
            );

        const namaSatuan =
            this.normalizeSatuan(
                dataSatuan.satuan
            );

        if (!kode || !namaSatuan) {

            throw new Error(
                "Kode barang dan nama satuan wajib diisi."
            );

        }

        const oldKode =
            this.normalizeKode(
                dataSatuan.oldKode || kode
            );

        const oldSatuan =
            this.normalizeSatuan(
                dataSatuan.oldSatuan || namaSatuan
            );

        const oldId =
            `${oldKode}|${oldSatuan}`;

        const newId =
            `${kode}|${namaSatuan}`;

        let existing =
            await DB.get(
                "satuan",
                oldId
            );

        if (!existing && oldId !== newId) {

            existing =
                await DB.get(
                    "satuan",
                    newId
                );

        }

        if (!existing) {

            const found =
                this.findSatuan(
                    kode,
                    namaSatuan,
                    controller
                );

            if (found) {

                existing =
                    await DB.get(
                        "satuan",
                        found.id
                    ) || found;

            }

        }

        const isi =
            this.toNumber(
                dataSatuan.isi,
                1
            );

        const hargaBeli =
            this.toNumber(
                dataSatuan.hargaBeli,
                0
            );

        const hargaJual =
            this.toNumber(
                dataSatuan.hargaJual,
                0
            );

        const barcodeSatuan =
            this.normalizeBarcode(
                dataSatuan.barcodeSatuan
            );

        const status =
            String(
                dataSatuan.status || "Aktif"
            ).trim();

        const discount =
            this.toNumber(
                dataSatuan.discount,
                0
            );

        if (isi < 1) {

            throw new Error(
                `Isi satuan ${namaSatuan} harus lebih dari 0.`
            );

        }

        if (hargaBeli < 0 || hargaJual < 0) {

            throw new Error(
                `Harga satuan ${namaSatuan} tidak valid.`
            );

        }

        if (discount < 0) {

            throw new Error(
                `Discount satuan ${namaSatuan} tidak valid.`
            );

        }

        /*======================================
        SATUAN BELUM ADA
        ======================================*/

        if (!existing) {

            const dataBaru = {

                id: newId,

                kode,

                satuan: namaSatuan,

                isi,

                hargaBeli,

                hargaJual,

                barcodeSatuan,

                status,

                discount,

                syncStatus: "pending",

                createdAt:
                    new Date().toISOString(),

                syncedAt: null

            };

            await Sync.addSatuan(
                dataBaru
            );

            const saved =
                await DB.get(
                    "satuan",
                    newId
                );

            if (!saved) {

                throw new Error(
                    `Satuan ${namaSatuan} untuk barang ${kode} belum ditemukan setelah disimpan.`
                );

            }

            /*
             * Sync.addSatuan pada versi saat ini belum
             * menyimpan hargaBeli dan discount.
             * Lengkapi field lokal tanpa mengubah ID.
             */

            const completed = {

                ...saved,

                isi,

                hargaBeli,

                hargaJual,

                barcodeSatuan,

                status,

                discount

            };

            await DB.put(
                "satuan",
                completed
            );

            this.updateControllerSatuan(
                completed,
                "",
                controller
            );

            return completed;
        }

        /*======================================
        SATUAN SUDAH ADA
        PERBARUI SEMUA FIELD TERKAIT
        ======================================*/

        const existingId =
            existing.id ||
            `${existing.kode}|${existing.satuan}`;

        const updatedSatuan = {

            ...existing,

            id: newId,

            kode,

            satuan: namaSatuan,

            isi,

            hargaBeli,

            hargaJual,

            barcodeSatuan,

            status,

            discount,

            syncStatus: "pending",

            syncedAt: null

        };

        const changed =
            existingId !== newId ||
            this.normalizeKode(existing.kode) !== kode ||
            this.normalizeSatuan(existing.satuan) !== namaSatuan ||
            this.toNumber(existing.isi, 1) !== isi ||
            this.toNumber(existing.hargaBeli, 0) !== hargaBeli ||
            this.toNumber(existing.hargaJual, 0) !== hargaJual ||
            this.normalizeBarcode(existing.barcodeSatuan) !== barcodeSatuan ||
            String(existing.status || "Aktif") !== status ||
            this.toNumber(existing.discount, 0) !== discount;

        if (changed) {

            /*
             * Jika ID berubah, periksa apakah ID tujuan
             * sudah dipakai satuan lain sebelum mengubahnya.
             */

            if (existingId !== newId) {

                const target =
                    await DB.get(
                        "satuan",
                        newId
                    );

                if (
                    target &&
                    target.id !== existingId
                ) {

                    throw new Error(
                        `Satuan ${namaSatuan} untuk barang ${kode} sudah terdaftar.`
                    );

                }

            }

            /*
             * Simpan data lokal terlebih dahulu.
             * Jika ID berubah, hapus key lama setelah
             * data baru berhasil disimpan.
             */

            await DB.put(
                "satuan",
                updatedSatuan
            );

            if (existingId !== newId) {

                await DB.delete(
                    "satuan",
                    existingId
                );

            }

            /*
             * Antrean update memakai ID tujuan dan identitas
             * lama agar server dapat menemukan baris asal.
             */

            const queue = {

                id:
                    "SYNC-SAT-EDIT-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                type: "satuan",

                action: "update",

                referenceId: newId,

                oldKode:
                    existing.kode,

                oldSatuan:
                    existing.satuan,

                status: "pending",

                retry: 0,

                createdAt:
                    new Date().toISOString(),

                lastError: null

            };

            await DB.put(
                "syncQueue",
                queue
            );

            Sync.autoProcess();
        }

        this.updateControllerSatuan(
            updatedSatuan,
            existingId,
            controller
        );

        return updatedSatuan;
    },


    /* ======================================
       PASTIKAN SATUAN DASAR PCS
    ====================================== */

    async ensureSatuanDasarPCS(
        item,
        barang,
        controller = PembelianMassal
    ) {

        const kode =
            this.normalizeKode(
                item.barang
            );

        const existingPCS =
            this.findSatuan(
                kode,
                "PCS",
                controller
            );

        const konversi =
            Math.max(
                1,
                this.toNumber(
                    item.konversi,
                    1
                )
            );

        const satuanPembelian =
            this.normalizeSatuan(
                item.satuan
            );

        const hargaBeli =
            this.toNumber(
                item.harga,
                0
            );

        const hargaBeliPCS =
            satuanPembelian === "PCS"
                ? hargaBeli
                : hargaBeli / konversi;

        const dataSatuanDasar = {

            id: `${kode}|PCS`,

            kode,

            satuan: "PCS",

            isi: 1,

            hargaBeli: hargaBeliPCS,

            hargaJual:
                this.toNumber(
                    item.hargaJualPCS,
                    0
                ),

            barcodeSatuan:
                this.normalizeBarcode(
                    item.barcode
                ),

            status:
                barang.status || "Aktif",

            discount:
                existingPCS
                    ? this.toNumber(
                        existingPCS.discount,
                        0
                    )
                    : 0

        };

        if (existingPCS) {

            dataSatuanDasar.oldKode =
                existingPCS.kode;

            dataSatuanDasar.oldSatuan =
                existingPCS.satuan;

        }

        return await this.ensureMasterSatuan(
            dataSatuanDasar,
            controller
        );
    },


    /* ======================================
       PASTIKAN SATUAN PEMBELIAN
    ====================================== */

    async ensureSatuanPembelian(
        item,
        barang,
        controller = PembelianMassal
    ) {

        const kode =
            this.normalizeKode(
                item.barang
            );

        const namaSatuan =
            this.normalizeSatuan(
                item.satuan
            );

        if (!namaSatuan) {

            throw new Error(
                `Satuan pembelian barang ${item.namaBarang} belum diisi.`
            );

        }

        const konversi =
            this.toNumber(
                item.konversi,
                0
            );

        if (konversi < 1) {

            throw new Error(
                `Isi/konversi satuan ${namaSatuan} harus lebih dari 0.`
            );

        }

        const existing =
            this.findSatuan(
                kode,
                namaSatuan,
                controller
            );

        const dataSatuanPembelian = {

            id:
                `${kode}|${namaSatuan}`,

            kode,

            satuan: namaSatuan,

            isi: konversi,

            hargaBeli:
                this.toNumber(
                    item.harga,
                    0
                ),

            hargaJual:
                this.toNumber(
                    item.hargaJual,
                    0
                ),

            barcodeSatuan:
                this.normalizeBarcode(
                    item.barcode
                ),

            status:
                barang.status || "Aktif",

            discount:
                existing
                    ? this.toNumber(
                        existing.discount,
                        0
                    )
                    : 0

        };

        if (existing) {

            dataSatuanPembelian.oldKode =
                existing.kode;

            dataSatuanPembelian.oldSatuan =
                existing.satuan;

        }

        return await this.ensureMasterSatuan(
            dataSatuanPembelian,
            controller
        );
    }

};