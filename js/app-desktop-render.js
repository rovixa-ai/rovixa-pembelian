/*======================================
TREEHOUSE POS
APP DESKTOP RENDER
======================================*/

const AppDesktopRender = {

    renderSidebar() {

        const sidebarContent =
            document.getElementById("sidebar-content");

        if (sidebarContent) {
            sidebarContent.innerHTML = "";
        }

        const sidebar =
            document.getElementById("sidebar");

        if (sidebar) {
            sidebar.remove();
        }

    },

    renderHeader() {

        const logo =
            StoreConfig.getLogo();

        const storeName =
            StoreConfig.getStoreName();

        document.getElementById(
            "header-content"
        ).innerHTML = `

            <div class="header-store">

                ${
                    logo
                        ? `
                            <img
                                src="${logo}"
                                alt="${storeName}"
                                class="header-store-logo"
                            >
                        `
                        : ""
                }

                <div class="header-store-name">
                    ${storeName}
                </div>

            </div>

            <div class="header-actions">

                <button
                    type="button"
                    class="header-report-button"
                    id="header-laporan-pembelian"
                >
                <span>📊</span>
                    <span>Laporan</span>
                </button>

                <div class="header-admin">
                    ${
                        Auth.getCurrentUser()?.nama ||
                        Auth.getCurrentUser()?.username ||
                        "Admin"
                    }
                </div>

                <button
                    type="button"
                    class="header-logout-button"
                    id="header-logout"
                >
                    <img
                        src="icons/logout.png"
                        alt=""
                        class="header-logout-icon"
                    >

                    <span class="header-logout-text">
                        Logout
                    </span>
                </button>

            </div>

        `;

        document.getElementById(
            "header-laporan-pembelian"
        ).addEventListener(
            "click",
            () => {

                LaporanPembelian.openModal();

            }
        );

        document.getElementById(
            "header-logout"
        ).addEventListener(
            "click",
            async () => {

                if (
                    typeof App !== "undefined" &&
                    typeof App.logout === "function"
                ) {

                    await App.logout();

                }

            }
        );

    }

};