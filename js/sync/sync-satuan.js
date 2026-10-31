// ======================================
// SYNC SATUAN
// TREEHOUSE POS
// ======================================

Object.assign(Sync, {

    async addSatuan(data) {

        if (
            !data ||
            !data.kode ||
            !data.satuan
        ) {

            throw new Error(
                "Kode barang dan satuan wajib diisi."
            );

        }

        const id =
            data.kode +
            "|" +
            data.satuan;

        const existing =
            await DB.get(
                "satuan",
                id
            );

        if (existing) {

            return {

                duplicate: true,

                data: existing

            };

        }

        const satuan = {

            id,

            kode:
                data.kode,

            satuan:
                data.satuan,

            isi:
                Number(data.isi) || 1,

            hargaJual:
                Number(data.hargaJual) || 0,

            barcodeSatuan:
                data.barcodeSatuan || "",

            status:
                data.status || "Aktif",

            syncStatus:
                "pending",

            createdAt:
                new Date().toISOString(),

            syncedAt:
                null

        };

        await DB.put(
            "satuan",
            satuan
        );

        const queue = {

            id:
                "SYNC-SAT-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            type: "satuan",

            referenceId:
                id,

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

        

        return satuan;
    },


    async syncSatuan(queue) {

        const satuan =
            await DB.get(
                "satuan",
                queue.referenceId
            );

        if (!satuan) {

            throw new Error(
                "Data satuan lokal tidak ditemukan."
            );

        }

        let result;

        if (
            queue.action === "update"
        ) {

            result =
                await API.updateSatuan({

                    ...satuan,

                    oldKode:
                        queue.oldKode,

                    oldSatuan:
                        queue.oldSatuan

                });

        } else {

            result =
                await API.saveSatuan(
                    satuan
                );

        }

        if (
            !result ||
            !result.success
        ) {

            const message =
                result?.message || "";

            const isDuplicateAdd =
                queue.action !== "update" &&
                message
                    .toLowerCase()
                    .includes(
                        "satuan untuk barang ini sudah terdaftar"
                    );

            if (isDuplicateAdd) {

                const confirmDuplicate =
                    confirm(
                        message +
                        "\n\n" +
                        "Hapus antrian sinkronisasi satuan ini?"
                    );

                if (confirmDuplicate) {

                    await DB.delete(
                        "syncQueue",
                        queue.id
                    );

                    satuan.syncStatus =
                        "synced";

                    satuan.syncedAt =
                        new Date().toISOString();

                    await DB.put(
                        "satuan",
                        satuan
                    );

                    

                    return {

                        success: true,

                        duplicate: true,

                        removed: true

                    };

                }

            }

            throw new Error(
                message ||
                (
                    queue.action === "update"
                        ? "Gagal memperbarui satuan."
                        : "Gagal menyimpan satuan."
                )
            );

        }

        satuan.syncStatus =
            "synced";

        satuan.syncedAt =
            new Date().toISOString();

        await DB.put(
            "satuan",
            satuan
        );

        if (
            queue.action === "update"
        ) {

            

        } else {

            

        }

        return result;
    }

});