class Factory {
    constructor(kernel) {
        this.kernel = kernel
    }

    async home() {
        const HomeUI = require("./home")
        const interfaceUi = new HomeUI(this.kernel, this)
        return await interfaceUi.getView()
    }

    setting() {
        this.kernel.UIKit.push({
            views: this.kernel.setting.getView(),
            title: $l10n("JSBOX_SETTING"),
            topOffset: false
        })
    }

    /**
     * 渲染页面
     */
    async render() {
        this.kernel.loading.start()
        const homeView = await this.home()
        $ui.render({
            type: "view",
            props: {
                navBarHidden: true,
                statusBarStyle: 0
            },
            layout: $layout.fill,
            views: [homeView],
            events: {
                ready: () => {
                    this.kernel.loading.end()
                }
            }
        })
    }
}

module.exports = Factory