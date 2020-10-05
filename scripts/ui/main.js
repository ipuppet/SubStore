class MainUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    mainUi() {
        const Factory = require("./main/factory")
        let factory = new Factory(this.kernel).render()
        this.kernel.factory = factory
    }

    todayUi() {
        const TodayUI = require("./today/today")
        new TodayUI(this.kernel).render()
    }

    render() {
        switch ($app.env) {
            case $env.app:
                this.mainUi()
                break
            case $env.keyboard:
                $ui.alert("不要在键盘中使用。。。")
                break
            case $env.today:
                this.todayUi()
                break
            default:
                $ui.alert({
                    title: $l10n("ALERT_INFO"),
                    message: "后续可能开发，敬请期待！"
                })
        }

    }
}

module.exports = MainUI