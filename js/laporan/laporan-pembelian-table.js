Object.assign(LaporanPembelian, {

    renderTable() {

        const tbody =
            document.getElementById(
                "laporanPembelianTableBody"
            );

        const count =
            document.getElementById(
                "laporanPembelianCount"
            );

        if (!tbody) {
            return;
        }

        if (count) {
            count.textContent =
                `${this.filtered.length} transaksi`;
        }

        if (!this.filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="laporan-empty"
                    >
                        Tidak ada transaksi.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            this.filtered
                .map((row, index) => {

                    const sumberWaktu =
                        String(
                            row.tanggalJam ||
                            row.jam ||
                            row.waktu ||
                            ""
                        ).trim();

                    const hasilWaktu =
                        sumberWaktu.match(
                            /(?:T|\s)(\d{2}:\d{2}(?::\d{2})?)/
                        ) ||
                        sumberWaktu.match(
                            /^(\d{2}:\d{2}(?::\d{2})?)$/
                        );

                    const jam =
                        hasilWaktu
                            ? hasilWaktu[1]
                            : "-";

                    return `

                        <tr
                            data-row-action="detail"
                            data-id="${this.escape(
                                row.id || ""
                            )}"
                            class="laporan-table-row"
                        >

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                <strong>
                                    ${this.escape(
                                        row.id || "-"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${this.escape(jam)}
                            </td>

                            <td>
                                ${this.escape(
                                    row.supplier || "-"
                                )}
                            </td>

                            <td>
                                ${this.money(
                                    row.subtotal
                                )}
                            </td>

                            <td>
                                ${this.money(
                                    row.discount ??
                                    row.disc ??
                                    0
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${this.money(
                                        row.total
                                    )}
                                </strong>
                            </td>

                            <td>
                                <span
                                    class="laporan-status"
                                >
                                    ${this.escape(
                                        row.status || "-"
                                    )}
                                </span>
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="laporan-detail-button"
                                    data-action="edit"
                                    data-id="${this.escape(
                                        row.id || ""
                                    )}"
                                >
                                    Edit
                                </button>
                            </td>

                        </tr>

                    `;
                })
                .join("");

        this.bindTableEvents();
    },


    bindTableEvents() {

        const tbody =
            document.getElementById(
                "laporanPembelianTableBody"
            );

        if (!tbody) {
            return;
        }

        tbody.onclick = async event => {

            const button =
                event.target.closest(
                    '[data-action="edit"]'
                );

            if (button) {

                event.stopPropagation();

                const id =
                    button.dataset.id;

                if (!id) {
                    return;
                }

                if (
                    typeof this.saveEditReturnState ===
                    "function"
                ) {
                    this.saveEditReturnState();
                }

                this.closeModal();

                Router.go(
                    "pembelian",
                    {
                        mode: "edit",
                        id: id
                    }
                );

                return;
            }

            const row =
                event.target.closest(
                    "tr[data-row-action='detail']"
                );

            if (!row) {
                return;
            }

            const id =
                row.dataset.id;

            if (!id) {
                return;
            }

            this.detail(id);
        };
    }

});