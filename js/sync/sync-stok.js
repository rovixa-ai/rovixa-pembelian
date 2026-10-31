// ======================================
// SYNC STOK
// TREEHOUSE POS
// ======================================

Object.assign(Sync, {

    async addStokAdjustment(data) {

        if (
            !data ||
            !data.kode
        ) {

            throw new Error(
                "Kode barang wajib diisi."
            );

        }

        if (
            data.jenis !== "tambah" &&
            data.jenis !== "kurangi"
        ) {

            throw new Error(
                "Jenis penyesuaian stok tidak valid."
            );

        }

        const jumlah =
            Number(data.jumlah);

        if (
            !Number.isInteger(jumlah) ||
            jumlah <= 0
        ) {

            throw new Error(
                "Jumlah stok harus berupa bilangan bulat lebih dari 0."
            );

        }

        const stokSebelum =
            Number(data.stokSebelum);

        const stokSesudah =
            Number(data.stokSesudah);

        if (
            !Number.isFinite(stokSesudah) ||
            stokSesudah < 0
        ) {

            throw new Error(
                "Stok sesudah tidak valid."
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

        const stokSekarang =
            Number(barang.stok || 0);

        if (
            stokSekarang !==
            stokSebelum
        ) {

            throw new Error(
                "Stok barang sudah berubah. Silakan refresh data stok."
            );

        }

        const id =
            "LOCAL-STK-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 7);

        const adjustment = {

            id,

            kode:
                data.kode,

            jenis:
                data.jenis,

            jumlah,

            stokSebelum,

            stokSesudah,

            alasan:
                data.alasan || "",

            catatan:
                data.catatan || "",

            syncStatus:
                "pending",

            createdAt:
                new Date().toISOString(),

            syncedAt:
                null

        };

        await DB.put(
            "stokAdjustment",
            adjustment
        );

        barang.stok =
            stokSesudah;

        await DB.put(
            "barang",
            barang
        );

        const queue = {

            id:
                "SYNC-STK-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            type:
                "stokAdjustment",

            referenceId:
                id,

            status:
                "pending",

            retry:
                0,

            createdAt:
                new Date().toISOString(),

            lastError:
                null

        };

        await DB.put(
            "syncQueue",
            queue
        );

        this.autoProcess();

        
        return adjustment;
    },


    async syncStokAdjustment(queue) {

        const adjustment =
            await DB.get(
                "stokAdjustment",
                queue.referenceId
            );

        if (!adjustment) {

            throw new Error(
                "Data stok adjustment lokal tidak ditemukan."
            );

        }

        const result =
            await API.saveStokAdjustment(
                adjustment
            );

        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Gagal menyimpan penyesuaian stok."
            );

        }

        adjustment.syncStatus =
            "synced";

        adjustment.syncedAt =
            new Date().toISOString();

        await DB.put(
            "stokAdjustment",
            adjustment
        );

        

        return result;
    }

});