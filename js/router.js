const Router = {

    currentPage:
        "pembelian",

    params: {},

    go(page, params = {}) {

        this.currentPage =
            page;

        this.params =
            params || {};

        App.loadPage(
            page
        );

    }

};