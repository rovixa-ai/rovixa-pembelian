/* ======================================
   ROVIXA KASIR PEMBELIAN PWA
   REGISTRATION
====================================== */

(function () {

    "use strict";


    /* ======================================
       REGISTER SERVICE WORKER
    ====================================== */

    function registerServiceWorker() {

        if (!("serviceWorker" in navigator)) {
            return;
        }

        window.addEventListener("load", function () {

            navigator.serviceWorker.register(
                "./service-worker.js",
                {
                    scope: "./"
                }
            )

            .catch(function (error) {

                console.error(
                    "Rovixa Kasir Pembelian Service Worker gagal:",
                    error
                );

            });

        });

    }


    registerServiceWorker();


})();