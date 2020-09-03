const BaseUISetting = require("/scripts/ui/components/base-ui-setting")

class SettingUI extends BaseUISetting {
    constructor(kernel, factory) {
        super(kernel, factory)
    }

    readme() {
        const content = $file.read("/README.md").string
        this.factory.push([{
            type: "markdown",
            props: { content: content },
            layout: (make, view) => {
                make.size.equalTo(view.super)
            }
        }])
    }

    backup_to_iCloud() {
    }

    recover_from_iCloud() {
    }

    clear_cache() {
        require("./home").clear_cache()
        $ui.toast($l10n("FINISH"))
    }

    tips() {
        $ui.alert({
            title: $l10n("TIPS"),
            message: `运行环境中的QX即Quantumult X
其他则是指Loon和Surge
当切换运行环境时，请清除缓存`,
        })
    }
}

module.exports = SettingUI