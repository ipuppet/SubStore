const BaseUI = require("/scripts/ui/components/base-ui")

class Factory extends BaseUI {
    constructor(kernel) {
        super(kernel)
        this.selectedPage = this.kernel.setting.get("general.firstScreen")
    }

    async home() {
        const HomeUI = require("./home")
        let interfaceUi = new HomeUI(this.kernel, this)
        return this.creator(await interfaceUi.getViews(), 0)
    }

    setting() {
        const SettingUI = require("./setting")
        let interfaceUi = new SettingUI(this.kernel, this)
        return this.creator(interfaceUi.getViews(), 1, false)
    }

    /**
     * 渲染页面
     */
    async render() {
        // 视图
        this.setViews([
            await this.home(),
            this.setting()
        ])
        // 菜单
        this.setMenus([
            {
                icon: ["house", "house.fill"],
                title: $l10n("HOME")
            },
            {
                icon: "gear",
                title: $l10n("SETTING")
            }
        ])
        super.render()
    }
}

module.exports = Factory