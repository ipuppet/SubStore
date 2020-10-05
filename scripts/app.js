const Kernel = require("../EasyJsBox/src/kernel")
const MainUI = require("./ui/main")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.settingComponent = this._registerComponent("Setting")
        this.setting = this.settingComponent.controller.init()
        this.initSettingMethods()
        this.push = this.settingComponent.view.push
        this.loading = this._registerComponent("Loading").controller
        // 备份路径
        this.backupPath = "drive://SubStore/backup.json"
        if (!$file.exists("drive://SubStore/")) {
            $file.mkdir("drive://SubStore/")
        }
        // 设置host
        if (this.setting.get("advanced.environment") === 0) {
            this.host = "http://localhost:9999"
        } else {
            this.host = "https://sub.store"
        }
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        this.setting.readme = () => {
            const content = $file.read("/README.md").string
            this.push([{
                type: "markdown",
                props: { content: content },
                layout: (make, view) => {
                    make.size.equalTo(view.super)
                }
            }])
        }

        this.setting.clearCache = () => {
            this.settingComponent.view.start()
            require("/scripts/ui/main/home").clearCache()
            this.settingComponent.view.done()
        }

        this.setting.tips = () => {
            $ui.alert({
                title: $l10n("TIPS"),
                message: `运行环境中的QX即Quantumult X\n其他则是指Loon和Surge\n当切换运行环境时，请清除缓存`
            })
        }

        this.setting.backupToICloud = () => {
            this.settingComponent.view.start()
            const backupAction = () => {
                $http.get({
                    url: `${this.kernel.host}/api/storage`,
                    handler: (resp) => {
                        if (resp.error) {
                            $ui.alert($l10n("BACKUP_ERROR"))
                            this.settingComponent.view.cancel()
                        } else {
                            $file.write({
                                data: $data({ string: JSON.stringify(resp.data) }),
                                path: this.backupPath
                            })
                            this.settingComponent.view.done()
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
                            handler: () => { this.settingComponent.view.cancel() }
                        }
                    ]
                })
            } else {
                backupAction()
            }
        }

        this.setting.recoverFromICloud = () => {
            this.settingComponent.view.start()
            $drive.open({
                handler: data => {
                    let message
                    let config
                    try {
                        config = JSON.parse(data.string)
                        let subsList = Object.keys(config.subs)
                        let collectionsList = Object.keys(config.collections)
                        message = "单个订阅：\n"
                        message += subsList.join("\n")
                        message += "\n组合订阅：\n"
                        message += collectionsList.join("\n")
                    } catch (error) {
                        $ui.alert("无法读取到正确的信息!")
                        return
                    }
                    $ui.alert({
                        title: "是否恢复？",
                        message: message,
                        actions: [
                            {
                                title: $l10n("OK"),
                                handler: () => {
                                    $http.post({
                                        url: `${this.kernel.host}/api/storage`,
                                        header: { "Content-Type": "application/json" },
                                        body: config,
                                        handler: resp => {
                                            if (resp.error) {
                                                console.log(resp.error)
                                                $ui.alert({
                                                    title: $l10n("RECOVER_ERROR"),
                                                    message: resp.error.localizedDescription
                                                })
                                                this.settingComponent.view.cancel()
                                            } else {
                                                // 完成动画
                                                this.settingComponent.view.done()
                                            }
                                        }
                                    })
                                }
                            },
                            {
                                title: $l10n("CANCEL"),
                                handler: () => {
                                    this.settingComponent.view.cancel()
                                }
                            }
                        ]
                    })
                }
            })
        }
    }
}

module.exports = {
    run: () => {
        // 实例化应用核心
        let kernel = new AppKernel()
        // 渲染UI
        new MainUI(kernel).render()
    }
}