const StoreConfig = {

    config: {},


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


            this.config =
                result.data?.storeConfig ||
                {};


            


            return this.config;

        }

        catch (error) {

            console.error(
                "STORE CONFIG LOAD ERROR:",
                error
            );


            this.config =
                {};

            throw error;

        }

    },


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