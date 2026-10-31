/*======================================
TREEHOUSE POS
APP MOBILE RENDER
======================================*/

const AppMobileRender = {

    renderHeader() {

        const logo =
            StoreConfig.getLogo();

        const storeName =
            StoreConfig.getStoreName();

        const headerContent =
            document.getElementById("header-content");

        if (!headerContent) {
            return;
        }

        const currentUser =
            typeof Auth !== "undefined"
                ? Auth.getCurrentUser()
                : null;

        headerContent.innerHTML = `

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
                    📊
                    <p>Laporan</p>
                </button>

                <div class="header-admin">
                    ${
                        currentUser?.nama ||
                        currentUser?.username ||
                        "Admin"
                    }
                </div>

                <button
                    type="button"
                    class="header-logout-button"
                    id="header-logout"
                    aria-label="Logout"
                    title="Logout"
                >
                    <img
                        src="icons/logout.png"
                        alt=""
                        class="header-logout-icon"
                    >
                    
                    
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

                } else if (
                    typeof Auth !== "undefined" &&
                    typeof Auth.logout === "function"
                ) {

                    Auth.logout();

                    if (
                        typeof Login !== "undefined" &&
                        typeof Login.init === "function"
                    ) {

                        await Login.init();

                    }

                }

            }
        );

    }

};