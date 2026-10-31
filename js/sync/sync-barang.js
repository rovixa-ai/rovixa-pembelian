// ======================================
// SYNC BARANG
// TREEHOUSE POS
// ======================================

Object.assign(Sync, {

    async addBarang(data) {

        if (!data || !data.kode) {

            throw new Error(
                "Kode barang wajib diisi."
            );

        }

        const existing =
            await DB.get(
                "barang",
                data.kode
            );

        if (existing) {

            throw new Error(
                "Kode barang sudah terdaftar."
            );

        }

        const barang = {

            kode: data.kode,

            barcode:
                data.barcode || "",

            nama:
                data.nama,

            kategori:
                data.kategori || "",

            satuanDasar:
                data.satuanDasar,

            stok:
                Number(data.stok || 0),

            status:
                data.status || "Aktif"

        };

        await DB.put(
            "barang",
            barang
        );

        const queue = {

            id:
                "SYNC-BRG-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            type: "barang",

            referenceId:
                barang.kode,

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

        this.autoProcess();

        

        return barang;
    },


    async updateBarang(data) {

        if (
            !data ||
            !data.kode
        ) {

            throw new Error(
                "Data barang tidak valid."
            );

        }

        const barang =
            await DB.get(
                "barang",
                data.kode
            );

        if (!barang) {

            throw new Error(
                "Data barang tidak ditemukan."
            );

        }

        const updatedBarang = {

            ...barang,

            barcode:
                data.barcode || "",

            nama:
                data.nama || "",

            kategori:
                data.kategori || "",

            satuanDasar:
                data.satuanDasar || "",

            status:
                data.status || "Aktif",

            stok:
                barang.stok || 0,

            syncStatus:
                "pending",

            syncedAt:
                null

        };

        if (!updatedBarang.nama) {

            throw new Error(
                "Nama barang wajib diisi."
            );

        }

        if (!updatedBarang.satuanDasar) {

            throw new Error(
                "Satuan dasar wajib diisi."
            );

        }

        await DB.put(
            "barang",
            updatedBarang
        );

        const queue = {

            id:
                "SYNC-BRG-EDIT-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            type: "barangUpdate",

            action: "update",

            referenceId:
                updatedBarang.kode,

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

        this.autoProcess();

        

        return updatedBarang;
    },


    async syncBarang(queue) {

        const barang =
            await DB.get(
                "barang",
                queue.referenceId
            );

        if (!barang) {

            throw new Error(
                "Data barang lokal tidak ditemukan."
            );

        }

        const result =
            await API.saveBarang(
                barang
            );

        if (
            !result ||
            !result.success
        ) {

            const message =
                result?.message || "";

            if (
                message ===
                "Kode barang sudah terdaftar."
            ) {

                console.warn(
                    "BARANG SUDAH TERDAFTAR DI SERVER:",
                    barang.kode
                );

                return result;

            }

            throw new Error(
                message ||
                "Gagal menyimpan barang ke server."
            );

        }

        barang.syncStatus =
            "synced";

        barang.syncedAt =
            new Date().toISOString();

        await DB.put(
            "barang",
            barang
        );

        

        return result;
    },


    async syncUpdateBarang(queue) {

        const barang =
            await DB.get(
                "barang",
                queue.referenceId
            );

        if (!barang) {

            throw new Error(
                "Data barang lokal tidak ditemukan."
            );

        }

        const result =
            await API.updateBarang(
                barang
            );

        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Gagal memperbarui barang."
            );

        }

        barang.syncStatus =
            "synced";

        barang.syncedAt =
            new Date().toISOString();

        await DB.put(
            "barang",
            barang
        );

        

        return result;
    }

});
