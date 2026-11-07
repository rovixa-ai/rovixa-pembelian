
const StoreConfig = {

    STORAGE_KEY: "ROVIXA_POS_STORE_CONFIG",

    config: {},


    /* ======================================
       LOAD CONFIG DARI LOCAL STORAGE
    ====================================== */

    async loadLocal() {

        try {

            const cached =
                localStorage.getItem(
                    this.STORAGE_KEY
                );

            if (!cached) {

                this.config = {};

                return this.config;

            }

            const parsed =
                JSON.parse(cached);

            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {

                throw new Error(
                    "Format Store Config lokal tidak valid."
                );

            }

            this.config = parsed;

            return this.config;

        }

        catch (error) {

            console.error(
                "STORE CONFIG LOCAL LOAD ERROR:",
                error
            );

            throw error;

        }

    },


    /* ======================================
       LOAD CONFIG DARI SERVER
       UNTUK BOOTSTRAP PERTAMA
    ====================================== */

    async load() {

        try {

            const result =
                await API.getBootstrap();


            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Gagal mengambil konfigurasi toko."
                );

            }


            const storeConfig =
                result.data?.storeConfig || {};


            if (
                typeof storeConfig !== "object" ||
                Array.isArray(storeConfig)
            ) {

                throw new Error(
                    "Format Store Config dari server tidak valid."
                );

            }


            this.config = {
                ...storeConfig
            };


            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(this.config)
            );


            return this.config;

        }

        catch (error) {

            console.error(
                "STORE CONFIG LOAD ERROR:",
                error
            );

            this.config = {};

            throw error;

        }

    },


    /* ======================================
       GET CONFIG
    ====================================== */

    get(key) {

        return (
            this.config[key] ??
            ""
        );

    },


    getStoreName() {

        return this.get(
            "STORE_NAME"
        );

    },


    getCurrency() {

        return (
            this.get(
                "CURRENCY"
            ) ||
            "IDR"
        );

    },


    isTaxEnabled() {

        return (
            String(
                this.get(
                    "TAX_ENABLED"
                )
            ).toLowerCase() ===
            "true"
        );

    },


    getTaxPercent() {

        return (
            Number(
                this.get(
                    "TAX_PERCENT"
                )
            ) ||
            0
        );

    },


    isDiscountEnabled() {

        return (
            String(
                this.get(
                    "DISCOUNT_ENABLED"
                )
            ).toLowerCase() ===
            "true"
        );

    },


    getAddress() {

        return this.get(
            "STORE_ADDRESS"
        );

    },


    getPhone() {

        return this.get(
            "STORE_PHONE"
        );

    },


    getEmail() {

        return this.get(
            "STORE_EMAIL"
        );

    },


    getLogo() {

        return this.get(
            "STORE_LOGO"
        );

    },


    getDescription() {

        return this.get(
            "STORE_DESCRIPTION"
        );

    },


    getStatus() {

        return this.get(
            "STORE_STATUS"
        );

    },


    getProductPrefix() {

        return this.get(
            "PRODUCT_PREFIX"
        );

    },


    getTransactionPrefix() {

        return this.get(
            "TRANSACTION_PREFIX"
        );

    },


    getReceiptHeader() {

        return this.get(
            "RECEIPT_HEADER"
        );

    },


    getReceiptFooter() {

        return this.get(
            "RECEIPT_FOOTER"
        );

    },


    isQrisEnabled() {

        return (
            String(
                this.get(
                    "QRIS_ENABLED"
                )
            ).toLowerCase() ===
            "true"
        );

    },


    getQrisProvider() {

        return this.get(
            "QRIS_PROVIDER"
        );

    },


    getQrisMerchantId() {

        return this.get(
            "QRIS_MERCHANT_ID"
        );

    },


    getQrisApiUrl() {

        return this.get(
            "QRIS_API_URL"
        );

    },


    getQrisCallbackUrl() {

        return this.get(
            "QRIS_CALLBACK_URL"
        );

    },


    getQrisStoreId() {

        return this.get(
            "QRIS_STORE_ID"
        );

    },


    getTimezone() {

        return (
            this.get(
                "TIMEZONE"
            ) ||
            "Asia/Jakarta"
        );

    }

};
