/* ======================================
   ROVIXA KASIR PEMBELIAN
   SERVICE WORKER
====================================== */

"use strict";


/* ======================================
   CACHE CONFIG
====================================== */

const CACHE_PREFIX = "rovixa-pembelian-pwa";

const CACHE_VERSION = "v1";

const STATIC_CACHE =
    CACHE_PREFIX + "-static-" + CACHE_VERSION;

const RUNTIME_CACHE =
    CACHE_PREFIX + "-runtime-" + CACHE_VERSION;


/* ======================================
   APP SHELL
====================================== */

const APP_SHELL = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/style.css",

    "./icons/pembelian-icon-192.svg",

    "./icons/pembelian-icon-512.svg"

];


/* ======================================
   INSTALL
====================================== */

self.addEventListener("install", function (event) {

    event.waitUntil(

        (async function () {

            const cache =
                await caches.open(STATIC_CACHE);

            for (const path of APP_SHELL) {

                try {

                    await cache.add(
                        new Request(path, {
                            cache: "reload"
                        })
                    );

                } catch (error) {

                    console.warn(
                        "Gagal menyimpan cache:",
                        path,
                        error
                    );

                }

            }

            await self.skipWaiting();

        })()

    );

});


/* ======================================
   ACTIVATE
====================================== */

self.addEventListener("activate", function (event) {

    event.waitUntil(

        (async function () {

            const cacheNames =
                await caches.keys();

            await Promise.all(

                cacheNames.map(function (name) {

                    if (
                        name.startsWith(CACHE_PREFIX) &&
                        name !== STATIC_CACHE &&
                        name !== RUNTIME_CACHE
                    ) {

                        return caches.delete(name);

                    }

                })

            );

            await self.clients.claim();

        })()

    );

});


/* ======================================
   FETCH
====================================== */

self.addEventListener("fetch", function (event) {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Hanya menangani request dari domain sendiri.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Hanya menangani folder KasirPembelian.
    const scopeURL = new URL("./", self.registration.scope);

    if (!url.pathname.startsWith(scopeURL.pathname)) {
        return;
    }


    /* ======================================
       NAVIGATION
    ====================================== */

    if (request.mode === "navigate") {

        event.respondWith(

            (async function () {

                const cacheKey =
                    new URL(
                        request.url,
                        self.location.origin
                    );

                cacheKey.search = "";
                cacheKey.hash = "";

                try {

                    const response =
                        await fetch(request);

                    if (response.ok) {

                        const cache =
                            await caches.open(RUNTIME_CACHE);

                        await cache.put(
                            cacheKey.href,
                            response.clone()
                        );

                    }

                    return response;

                } catch (error) {

                    const cached =
                        await caches.match(
                            cacheKey.href,
                            {
                                cacheName: RUNTIME_CACHE
                            }
                        );

                    if (cached) {
                        return cached;
                    }

                    const staticCache =
                        await caches.open(STATIC_CACHE);

                    return (
                        await staticCache.match("./index.html") ||
                        await staticCache.match("./") ||
                        new Response(
                            "Aplikasi tidak tersedia saat offline.",
                            {
                                status: 503,
                                headers: {
                                    "Content-Type": "text/plain"
                                }
                            }
                        )
                    );

                }

            })()

        );

        return;

    }


    /* ======================================
       STATIC ASSETS
    ====================================== */

    event.respondWith(

        (async function () {

            const cached =
                await caches.match(request);

            if (cached) {

                fetch(request)

                    .then(async function (response) {

                        if (response.ok) {

                            const cache =
                                await caches.open(RUNTIME_CACHE);

                            await cache.put(
                                request,
                                response.clone()
                            );

                        }

                    })

                    .catch(function () {});

                return cached;

            }


            try {

                const response =
                    await fetch(request);

                if (response.ok) {

                    const cache =
                        await caches.open(RUNTIME_CACHE);

                    await cache.put(
                        request,
                        response.clone()
                    );

                }

                return response;

            } catch (error) {

                return new Response(
                    "Resource tidak tersedia saat offline.",
                    {
                        status: 504,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );

            }

        })()

    );

});