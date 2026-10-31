// ======================================
// SYNC CORE
// TREEHOUSE POS
// ======================================

const Sync = {

    processing: false,

    initialized: false,

    init() {

        if (this.initialized) return;

        this.initialized = true;

        window.addEventListener("online", () => {

            

            this.process();

        });

        window.addEventListener("offline", () => {

            

        });

        if (navigator.onLine) {

            

            this.process();

        }

    },

    autoProcess() {

        setTimeout(() => {

            this.process();

        }, 100);

    }

};