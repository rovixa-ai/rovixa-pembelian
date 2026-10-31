// ======================================
// TREEHOUSE POS
// LAPORAN PEMBELIAN
// DETAIL LOGIC
// FILE: laporan-pembelian-detail.js
// ======================================

Object.assign(LaporanPembelian, {

    detail(id) {

        const row = this.filtered.find(
            item => String(item.id) === String(id)
        );

        if (!row) return;

        this.showDetailModal(row);

    },

    // ==================================
    // SHOW DETAIL MODAL
    // ==================================

    showDetailModal(row) {

        this.removeDetailModal();

        const items = Array.isArray(row.items)
            ? row.items
            : [];

        const payments = Array.isArray(row.payments)
            ? row.payments
            : [];

        const modal = document.createElement("div");

        modal.id = "laporanPembelianDetailModal";

        modal.className = "laporan-pembelian-detail-modal";

        const isMobile = window.matchMedia(
            "(max-width: 768px)"
        ).matches;

        const renderData = {
            row,
            items,
            payments,
            report: this
        };

        modal.innerHTML = isMobile
            ? LaporanPembelianDetailMobileRender.render(renderData)
            : LaporanPembelianDetailDesktopRender.render(renderData);

        document.body.appendChild(modal);

        this.bindDetailModalEvents();

    },

    // ==================================
    // MODAL EVENTS
    // ==================================

    bindDetailModalEvents() {

        const modal = document.getElementById(
            "laporanPembelianDetailModal"
        );

        if (!modal) return;

        modal.addEventListener("click", event => {

            const action = event.target.closest(
                '[data-action="close-detail"]'
            );

            if (!action) return;

            this.removeDetailModal();

        });

        document.addEventListener(
            "keydown",
            this.detailEscapeHandler
        );

    },

    // ==================================
    // ESC KEY
    // ==================================

    detailEscapeHandler(event) {

        if (event.key !== "Escape") return;

        LaporanPembelian.removeDetailModal();

    },

    // ==================================
    // REMOVE MODAL
    // ==================================

    removeDetailModal() {

        const modal = document.getElementById(
            "laporanPembelianDetailModal"
        );

        if (modal) {
            modal.remove();
        }

        document.removeEventListener(
            "keydown",
            this.detailEscapeHandler
        );

    }

});