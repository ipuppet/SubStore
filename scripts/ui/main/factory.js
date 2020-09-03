const BaseUI = require("/scripts/ui/components/base-ui")

class Factory extends BaseUI {
    constructor(kernel) {
        super(kernel)
        this.selected_page = this.kernel.setting.get("general.first_screen")
        // 视图与菜单对应关系
        this.page_index = [// 通过索引获取页面id
            "home",// 0 => 首页
            "setting"// 1 => 设置
        ]
    }

    async home() {
        const HomeUI = require("./home")
        let ui_interface = new HomeUI(this.kernel, this)
        return this.creator(await ui_interface.get_views(), 0)
    }

    setting() {
        const SettingUI = require("./setting")
        let ui_interface = new SettingUI(this.kernel, this)
        return this.creator(ui_interface.get_views(), 1)
    }

    /**
     * 渲染页面
     */
    async render() {
        // 视图
        this.set_views([
            await this.home(),
            this.setting()
        ])
        // 菜单
        this.set_menus([
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