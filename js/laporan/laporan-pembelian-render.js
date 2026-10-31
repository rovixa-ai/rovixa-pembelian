Object.assign(LaporanPembelian, {

    render() {

        const isMobile =
            window.matchMedia("(max-width: 768px)").matches;

        if (isMobile) {
            return LaporanPembelianMobileRender.render();
        }

        return LaporanPembelianDesktopRender.render();

    }

});