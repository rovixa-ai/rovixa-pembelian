// ======================================
// TREEHOUSE POS
// LOGIN PEMBELIAN
// ======================================

const Login = {

    /* ==================================
       INIT
    ================================== */

    async init() {

        

        try {

            await this.prepareUsers();

            this.render();

            this.event();

        } catch (error) {

            console.error(
                "LOGIN INIT ERROR:",
                error
            );

            this.render();

            this.showMessage(
                error.message ||
                "Gagal menyiapkan login."
            );

        }

    },


    /* ==================================
       PREPARE USERS
    ================================== */

    async prepareUsers() {

        if (typeof DB === "undefined") {
            throw new Error("Database tidak tersedia.");
        }

        let users = await DB.getAll("users");

        if (Array.isArray(users) && users.length) {
            return users;
        }

        if (
            typeof Download !== "undefined" &&
            typeof Download.downloadUsers === "function"
        ) {

            const result =
                await Download.downloadUsers();

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Data user belum tersedia."
                );

            }

            users = await DB.getAll("users");

        }

        if (!Array.isArray(users) || !users.length) {

            throw new Error(
                "Data user belum tersedia di perangkat."
            );

        }

        return users;

    },


    /* ==================================
       STORE INFORMATION
    ================================== */

    getStoreInfo() {

        let storeName = "Treehouse POS";
        let logo = "";

        if (
            typeof StoreConfig !== "undefined"
        ) {

            if (
                typeof StoreConfig.getStoreName === "function"
            ) {

                storeName =
                    StoreConfig.getStoreName() ||
                    storeName;

            }

            if (
                typeof StoreConfig.getLogo === "function"
            ) {

                logo =
                    StoreConfig.getLogo() || "";

            }

        }

        return {
            storeName,
            logo
        };

    },


    /* ==================================
       RENDER
    ================================== */

    render() {

        const app =
            document.getElementById("app");

        if (!app) {

            console.error(
                "Elemen app tidak ditemukan."
            );

            return;

        }

        let container =
            document.getElementById("loginPage");

        if (!container) {

            container =
                document.createElement("div");

            container.id = "loginPage";

            document.body.appendChild(
                container
            );

        }

        app.classList.add("login-mode");

        const store = this.getStoreInfo();

        const storeName =
            this.escapeHTML(
                store.storeName
            );

        const logoContent = store.logo
            ? `
                <img
                    src="${this.escapeHTML(store.logo)}"
                    alt="Logo ${storeName}"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                >
                <span style="display:none;">
                    ${this.escapeHTML(
                        String(store.storeName).charAt(0).toUpperCase()
                    )}
                </span>
            `
            : `
                <span>
                    ${this.escapeHTML(
                        String(store.storeName).charAt(0).toUpperCase()
                    )}
                </span>
            `;

        container.className = "login-page";

        container.innerHTML = `

            <div class="login-card">

                <div class="login-logo">
                    ${logoContent}
                </div>

                <div class="login-header">

                    <h1>${storeName}</h1>

                    <p>Login Pembelian</p>

                </div>

                <form
                    class="login-form"
                    id="loginForm"
                    autocomplete="off"
                >

                    <div class="login-field">

                        <label for="loginUsername">
                            Username
                        </label>

                        <input
                            type="text"
                            id="loginUsername"
                            name="username"
                            placeholder="Masukkan username"
                            autocomplete="username"
                            spellcheck="false"
                            autocapitalize="off"
                            required
                        >

                    </div>

                    <div class="login-field">

                        <label for="loginPIN">
                            PIN
                        </label>

                        <input
                            type="password"
                            id="loginPIN"
                            name="pin"
                            placeholder="Masukkan PIN"
                            inputmode="numeric"
                            autocomplete="current-password"
                            maxlength="20"
                            required
                        >

                    </div>

                    <div
                        class="login-message"
                        id="loginMessage"
                        hidden
                    ></div>

                    <button
                        type="submit"
                        class="login-button"
                        id="loginButton"
                    >
                        LOGIN
                    </button>

                </form>

            </div>

        `;

    },


    /* ==================================
       ESCAPE HTML
    ================================== */

    escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    },


    /* ==================================
       EVENT
    ================================== */

    event() {

        const form =
            document.getElementById("loginForm");

        const username =
            document.getElementById("loginUsername");

        const pin =
            document.getElementById("loginPIN");

        if (!form) {
            return;
        }

        form.onsubmit = async event => {

            event.preventDefault();

            await this.submit();

        };

        if (pin) {

            pin.oninput = () => {

                pin.value =
                    pin.value.replace(/\D/g, "");

            };

        }

        if (username) {

            setTimeout(() => {

                username.focus();

            }, 50);

        }

    },


    /* ==================================
       SUBMIT
    ================================== */

    async submit() {

        const username =
            document.getElementById("loginUsername");

        const pin =
            document.getElementById("loginPIN");

        const button =
            document.getElementById("loginButton");

        if (!username || !pin) {
            return;
        }

        const usernameValue =
            username.value.trim();

        const pinValue =
            pin.value.trim();

        this.clearMessage();

        if (!usernameValue) {

            this.showMessage(
                "Username belum diisi."
            );

            username.focus();

            return;

        }

        if (!pinValue) {

            this.showMessage(
                "PIN belum diisi."
            );

            pin.focus();

            return;

        }

        if (button) {

            button.disabled = true;

            button.textContent =
                "Memeriksa...";

        }

        try {

            if (typeof Auth === "undefined") {

                throw new Error(
                    "Auth tidak tersedia."
                );

            }

            const result =
                await Auth.login(
                    usernameValue,
                    pinValue
                );

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Username atau PIN tidak valid."
                );

            }

           

            const app =
                document.getElementById("app");

            if (app) {
                app.classList.remove("login-mode");
            }

            const loginPage =
                document.getElementById("loginPage");

            if (loginPage) {
                loginPage.remove();
            }

            if (
                typeof App !== "undefined" &&
                typeof App.renderHeader === "function"
            ) {

                App.renderHeader();

            }

            if (
                typeof Router !== "undefined" &&
                typeof Router.go === "function"
            ) {

                Router.go("pembelian");

            }

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            this.showMessage(
                error.message ||
                "Login gagal."
            );

            pin.value = "";

            pin.focus();

        } finally {

            if (button && button.isConnected) {

                button.disabled = false;

                button.textContent = "LOGIN";

            }

        }

    },


    /* ==================================
       SHOW MESSAGE
    ================================== */

    showMessage(message) {

        const element =
            document.getElementById("loginMessage");

        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.hidden = false;

    },


    /* ==================================
       CLEAR MESSAGE
    ================================== */

    clearMessage() {

        const element =
            document.getElementById("loginMessage");

        if (!element) {
            return;
        }

        element.textContent = "";

        element.hidden = true;

    }

};