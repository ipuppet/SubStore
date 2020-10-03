const BaseUISetting = require("/scripts/ui/components/base-ui-setting")

class SettingUI extends BaseUISetting {
    constructor(kernel, factory) {
        super(kernel, factory)
        this.backupPath = "drive://SubStore/backup.json"
        if (!$file.exists("drive://SubStore/")) {
            $file.mkdir("drive://SubStore/")
        }
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

    clearCache() {
        this.start()
        require("./home").clearCache()
        this.done()
    }

    tips() {
        $ui.alert({
            title: $l10n("TIPS"),
            message: `运行环境中的QX即Quantumult X
其他则是指Loon和Surge
当切换运行环境时，请清除缓存`
        })
    }

    backupToICloud() {
        this.start()
        const backupAction = () => {
            $http.get({
                url: `${this.kernel.host}/api/storage`,
                handler: (resp) => {
                    if (resp.error) {
                        $ui.alert($l10n("BACKUP_ERROR"))
                        this.cancel()
                    } else {
                        $file.write({
                            data: $data({ string: JSON.stringify(resp.data) }),
                            path: this.backupPath
                        })
                        this.done()
                    }
                }
            })
        }
        if ($file.exists(this.backupPath)) {
            $ui.alert({
                title: $l10n("BACKUP"),
                message: $l10n("ALREADY_HAS_BACKUP"),
                actions: [
                    {
                        title: $l10n("OK"),
                        handler: () => {
                            backupAction()
                        }
                    },
                    {
                        title: $l10n("CANCEL"),
                        handler: () => { this.cancel() }
                    }
                ]
            })
        } else {
            backupAction()
        }
    }

    recoverFromICloud() {
        this.start()
        $drive.open({
            handler: data => {
                let message = "您要恢复的内容包含以下信息，是否恢复？"
                try {
                    let config = JSON.parse(data.string)
                    let subsList = Object.keys(config.subs)
                    let collectionsList = Object.keys(config.collections)
                    message += "\n单个订阅：\n"
                    message += subsList.join("\n")
                    message += "\n组合订阅：\n"
                    message += collectionsList.join("\n")
                } catch (error) {
                    $ui.alert("无法读取到正确的信息!")
                    return
                }
                $ui.alert({
                    title: $l10n("ALERT_INFO"),
                    message: message,
                    actions: [
                        {
                            title: $l10n("OK"),
                            handler: () => {
                                $http.post({
                                    url: `${this.kernel.host}/api/storage`,
                                    body: data.string,
                                    handler: (resp) => {
                                        if (resp.error) {
                                            $ui.alert($l10n("RECOVER_ERROR"))
                                            this.cancel()
                                        } else {
                                            // 完成动画
                                            this.done()
                                        }
                                    }
                                })
                            }
                        },
                        {
                            title: $l10n("CANCEL"),
                            handler: () => {
                                this.cancel()
                            }
                        }
                    ]
                })
            }
        })
    }
}

module.exports = SettingUI