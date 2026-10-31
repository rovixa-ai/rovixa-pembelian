// ======================================
// LAPORAN PEMBELIAN
// SUMMARY
// ======================================

Object.assign(LaporanPembelian, {

    resetSummary() {

        this.setText(
            "laporanPembelianTotalTransaksi",
            "0"
        );

        this.setText(
            "laporanPembelianTotalItem",
            "0"
        );

        this.setText(
            "laporanPembelianSubtotal",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianDiscount",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianTotal",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianCash",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianQRIS",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianKartu",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianTransfer",
            "Rp 0"
        );

        this.setText(
            "laporanPembelianTotalPayment",
            "Rp 0"
        );

    },


    renderSummary(summary = {}) {

        this.setText(
            "laporanPembelianTotalTransaksi",
            this.number(
                summary.totalTransaksi || 0
            )
        );


        this.setText(
            "laporanPembelianTotalItem",
            this.number(
                summary.totalItem || 0
            )
        );


        this.setText(
            "laporanPembelianSubtotal",
            this.money(
                summary.subtotal || 0
            )
        );


        this.setText(
            "laporanPembelianDiscount",
            this.money(
                summary.discount || 0
            )
        );


        this.setText(
            "laporanPembelianTotal",
            this.money(
                summary.total || 0
            )
        );


        this.setText(
            "laporanPembelianCash",
            this.money(
                summary.cash || 0
            )
        );


        this.setText(
            "laporanPembelianQRIS",
            this.money(
                summary.qris || 0
            )
        );


        this.setText(
            "laporanPembelianKartu",
            this.money(
                summary.kartu || 0
            )
        );


        this.setText(
            "laporanPembelianTransfer",
            this.money(
                summary.transfer || 0
            )
        );


        this.setText(
            "laporanPembelianTotalPayment",
            this.money(
                summary.totalPayment || 0
            )
        );

    }

});