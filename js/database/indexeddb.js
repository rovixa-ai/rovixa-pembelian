const DB = {

    name: "TreehouseAdminDB",

    version: 14,

    instance: null,

    init() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                this.name,
                this.version
            );

            request.onupgradeneeded = event => {

                const database = event.target.result;

                const stores = [
                    ["barang", "kode"],
                    ["satuan", "id"],
                    ["pembelian", "id"],
                    ["detailPembelian", "id"],
                    ["pembayaran", "id"],
                    ["pembayaranPembelian", "id"],
                    ["stokAdjustment", "id"],
                    ["syncQueue", "id"],
                    ["config", "key"],
                    ["users", "id"]
                ];

                for (const [storeName, keyPath] of stores) {

                    if (
                        !database.objectStoreNames.contains(
                            storeName
                        )
                    ) {

                        database.createObjectStore(
                            storeName,
                            {
                                keyPath
                            }
                        );

                        

                    }

                }

            };

            request.onsuccess = event => {

                this.instance = event.target.result;

                this.instance.onversionchange = () => {

                    console.warn(
                        "IndexedDB menerima permintaan perubahan versi."
                    );

                    this.instance.close();

                    this.instance = null;

                };

                

                resolve(this.instance);

            };

            request.onerror = event => {

                console.error(
                    "IndexedDB Error:",
                    event.target.error
                );

                reject(
                    event.target.error
                );

            };

            request.onblocked = () => {

                console.error(
                    "IndexedDB upgrade terblokir oleh koneksi database lain."
                );

            };

        });

    },

    getStore(
        storeName,
        mode = "readonly"
    ) {

        if (!this.instance) {

            throw new Error(
                "IndexedDB belum diinisialisasi."
            );

        }

        if (
            !this.instance.objectStoreNames.contains(
                storeName
            )
        ) {

            const availableStores = Array.from(
                this.instance.objectStoreNames
            );

            console.error(
                "OBJECT STORE TIDAK DITEMUKAN:",
                storeName,
                "| Database:",
                this.instance.name,
                "| Versi:",
                this.instance.version,
                "| Store tersedia:",
                availableStores
            );

            throw new DOMException(
                `Object store "${storeName}" tidak ditemukan. ` +
                `Store tersedia: ${
                    availableStores.join(", ") || "(kosong)"
                }`,
                "NotFoundError"
            );

        }

        const transaction = this.instance.transaction(
            storeName,
            mode
        );

        return transaction.objectStore(
            storeName
        );

    },

    put(
        storeName,
        data
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName,
                    "readwrite"
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.put(data);

            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    add(
        storeName,
        data
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName,
                    "readwrite"
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.add(data);

            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    get(
        storeName,
        key
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.get(key);

            request.onsuccess = () => {

                resolve(
                    request.result || null
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    getAll(
        storeName
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.getAll();

            request.onsuccess = () => {

                resolve(
                    request.result || []
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    clear(
        storeName
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName,
                    "readwrite"
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.clear();

            request.onsuccess = () => {

                resolve();

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    delete(
        storeName,
        key
    ) {

        return new Promise((resolve, reject) => {

            let store;

            try {

                store = this.getStore(
                    storeName,
                    "readwrite"
                );

            } catch (error) {

                reject(error);

                return;

            }

            const request = store.delete(key);

            request.onsuccess = () => {

                resolve();

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    },

    async replaceAll(
        storeName,
        dataList
    ) {

        await this.clear(
            storeName
        );

        for (const data of dataList) {

            await this.put(
                storeName,
                data
            );

        }

    }

};