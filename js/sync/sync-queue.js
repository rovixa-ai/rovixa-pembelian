
// ======================================
// SYNC QUEUE
// TREEHOUSE POS
// ======================================

Object.assign(Sync, {

    processRequested: false,

    async process() {

        if (!navigator.onLine) {

            

            return;

        }

        if (this.processing) {

            this.processRequested = true;

            

            return;

        }

        this.processing = true;

        try {

            do {

                this.processRequested = false;

                const queueList =
                    await DB.getAll(
                        "syncQueue"
                    );

                const pendingList =
                    queueList.filter(
                        item =>
                            item.status === "pending"
                    );

                

                for (
                    const queue of pendingList
                ) {

                    if (!navigator.onLine) {

                        

                        break;

                    }

                    await this.processItem(
                        queue
                    );

                }

                /*
                 * Periksa ulang antrean jika ada pemanggilan process()
                 * saat proses sinkronisasi masih berjalan.
                 */

            } while (
                this.processRequested &&
                navigator.onLine
            );

        } catch (error) {

            console.error(
                "SYNC PROCESS ERROR:",
                error
            );

        } finally {

            this.processing = false;

            /*
             * Jaga agar permintaan proses ulang tidak hilang
             * ketika proses sebelumnya baru saja berakhir.
             */

            if (
                this.processRequested &&
                navigator.onLine
            ) {

                this.processRequested = false;

                this.autoProcess();

            }

        }

    },


    async processItem(queue) {

        try {

            queue.status =
                "syncing";

            await DB.put(
                "syncQueue",
                queue
            );

            let result;

            switch (queue.type) {

                case "pembelian":

                    result =
                        await this.syncPembelian(
                            queue
                        );

                    break;


                case "pembelianUpdate":

                    result =
                        await this.syncUpdatePembelian(
                            queue
                        );

                    break;


                case "barang":

                    result =
                        await this.syncBarang(
                            queue
                        );

                    break;


                case "barangUpdate":

                    result =
                        await this.syncUpdateBarang(
                            queue
                        );

                    break;


                case "satuan":

                    result =
                        await this.syncSatuan(
                            queue
                        );

                    break;


                case "stokAdjustment":

                    result =
                        await this.syncStokAdjustment(
                            queue
                        );

                    break;


                default:

                    throw new Error(
                        "Tipe sync tidak dikenal: " +
                        queue.type
                    );

            }

            queue.status =
                "success";

            queue.syncedAt =
                new Date().toISOString();

            queue.lastError =
                null;

            await DB.put(
                "syncQueue",
                queue
            );

            

            return result;

        } catch (error) {

            queue.status =
                "pending";

            queue.retry =
                Number(queue.retry || 0) + 1;

            queue.lastError =
                error?.message ||
                String(error);

            await DB.put(
                "syncQueue",
                queue
            );

            console.error(
                "SYNC ITEM ERROR:",
                queue.type,
                queue.referenceId,
                error
            );

            return null;

        }

    },


    async retry() {

        const queueList =
            await DB.getAll(
                "syncQueue"
            );

        const failedList =
            queueList.filter(
                item =>
                    item.status === "pending"
            );

        for (
            const queue of failedList
        ) {

            queue.status =
                "pending";

            await DB.put(
                "syncQueue",
                queue
            );

        }

        await this.process();

    },


    async getPendingCount() {

        const queueList =
            await DB.getAll(
                "syncQueue"
            );

        return queueList.filter(
            item =>
                item.status === "pending"
        ).length;

    }

});
