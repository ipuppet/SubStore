const { Kernel, VERSION } = require("../EasyJsBox/src/kernel")
const MainUI = require("./ui/main")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.settingComponent = this._registerComponent("Setting")
        this.setting = this.settingComponent.controller
        this.initSettingMethods()
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
        this.setting.readme = animate => {
            animate.touchHighlightStart()
            const content = $file.read("/README.md").string
            this.UIKit.push({
                view: [{
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                }],
                title: $l10n("README"),
                disappeared: () => {
                    animate.touchHighlightEnd()
                }
            })
        }

        this.setting.clearCache = animate => {
            animate.actionStart()
            require("/scripts/ui/main/home").clearCache()
            animate.actionDone()
        }

        this.setting.tips = animate => {
            animate.touchHighlight()
            $ui.alert({
                title: $l10n("TIPS"),
                message: `运行环境中的QX即Quantumult X\n其他则是指Loon和Surge\n当切换运行环境时，请清除缓存`
            })
        }

        this.setting.backupToICloud = animate => {
            animate.actionStart()
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("COPY_TO_CLIPBOARD")],
                handler: (title, idx) => {
                    $http.get({
                        url: `${this.host}/api/storage`,
                        handler: (resp) => {
                            if (resp.error) {
                                $ui.alert($l10n("BACKUP_ERROR"))
                                animate.actionCancel()
                            } else {
                                const data = JSON.stringify(resp.data)
                                switch (idx) {
                                    case 0:
                                        $drive.save({
                                            data: $data({ string: data }),
                                            name: this.backupPath.slice(this.backupPath.lastIndexOf("/") + 1),
                                            handler: success => {
                                                if (success) {
                                                    animate.actionDone()
                                                } else {
                                                    animate.actionCancel()
                                                }
                                            }
                                        })
                                        break
                                    case 1:
                                        $file.write({
                                            data: $data({ string: data }),
                                            path: this.backupPath
                                        })
                                        animate.actionDone()
                                        break
                                    case 2:
                                        $clipboard.text = data
                                        animate.actionDone()
                                        break
                                }
                            }
                        }
                    })
                },
                finished: (cancelled) => {
                    if (cancelled) animate.actionCancel()
                }
            })
        }

        this.setting.recoverFromICloud = animate => {
            animate.actionStart()
            const recoverAction = data => {
                try {
                    let message
                    if (typeof (data) === "string") {
                        data = JSON.parse(data)
                    }
                    try {
                        let subsList = Object.keys(data.subs)
                        let collectionsList = Object.keys(data.collections)
                        message = "单个订阅：\n"
                        message += subsList.join("\n")
                        message += "\n组合订阅：\n"
                        message += collectionsList.join("\n")
                    } catch (error) {
                        throw "无法读取到正确的信息!"
                    }
                    $ui.alert({
                        title: "是否恢复？",
                        message: message,
                        actions: [
                            {
                                title: $l10n("OK"),
                                handler: () => {
                                    $http.post({
                                        url: `${this.host}/api/storage`,
                                        header: { "Content-Type": "application/json" },
                                        body: data,
                                        handler: resp => {
                                            if (resp.error) {
                                                console.log(resp.error)
                                                $ui.alert({
                                                    title: $l10n("RECOVER_ERROR"),
                                                    message: resp.error.localizedDescription
                                                })
                                                animate.actionCancel()
                                            } else {
                                                // 完成动画
                                                animate.actionDone()
                                                // 重新启动
                                                setTimeout(() => { $addin.restart() }, 1000)
                                            }
                                        }
                                    })
                                }
                            },
                            {
                                title: $l10n("CANCEL"),
                                handler: () => {
                                    animate.actionCancel()
                                }
                            }
                        ]
                    })
                } catch (error) {
                    $ui.alert(error)
                    animate.actionCancel()
                    return
                }
            }
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("MANUAL_INPUT")],
                handler: (title, idx) => {
                    if (idx === 0) {
                        $drive.open({
                            handler: data => {
                                recoverAction(data.string)
                            }
                        })
                    } else if (idx === 1) {
                        if ($file.exists(this.backupPath)) {
                            recoverAction($file.read(this.backupPath).string)
                        } else {
                            $ui.alert("FILE_NOT_FOUND")
                        }
                    } else if (idx === 2) {
                        $input.text({
                            placeholder: $l10n("MANUAL_INPUT"),
                            text: "",
                            handler: text => {
                                recoverAction(text.trim())
                            }
                        })
                    }
                },
                finished: (cancelled) => {
                    if (cancelled) animate.actionCancel()
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