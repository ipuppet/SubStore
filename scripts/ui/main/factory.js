const BaseView = require("../../../EasyJsBox/src/Foundation/view")

class Factory extends BaseView {
    constructor(kernel) {
        super(kernel)
    }

    async home() {
        const HomeUI = require("./home")
        let interfaceUi = new HomeUI(this.kernel, this)
        return await interfaceUi.getView()
    }

    setting() {
        this.kernel.getComponent("Setting").controller.isSecondaryPage(true, () => {
            $ui.pop()
        })
        $ui.push({
            props: {
                navBarHidden: true,
                statusBarStyle: 0
            },
            views: this.kernel.getComponent("Setting").view.getViews()
        })
    }

    /**
     * 渲染页面
     */
    async render() {
        this.kernel.loading.start()
        let homeView = await this.home()
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