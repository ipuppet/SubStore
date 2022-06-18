const {
    View,
    UIKit,
    Kernel,
    UILoading,
    Setting
} = require("./libs/easy-jsbox")
const HomeUI = require("./ui/home")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.setting = new Setting()
        this.setting.loadConfig()
        this.initSettingMethods()
        // 备份路径
        this.backupPath = "drive://SubStore/backup.json"
        if (!$file.exists("drive://SubStore/")) {
            $file.mkdir("drive://SubStore/")
        }
        // 设置 host
        this.host = this.setting.get("advanced.api", "https://sub.store")
        this.initComponents()
    }

    initComponents() {
        this.loading = new UILoading()
        this.loading.fullScreen = true

        this.homeUI = new HomeUI(this)
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        this.setting.method.tips = animate => {
            animate.touchHighlight()
            $ui.alert({
                title: $l10n("TIPS"),
                message: `API 被需修改后会清除缓存，若未生效则需要手动清除缓存。`
            })
        }

        this.setting.method.readme = animate => {
            animate.touchHighlight()
            const content = $file.read("/README.md").string
            UIKit.push({
                views: [{
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                }],
                title: $l10n("README")
            })
        }

        this.setting.method.clearCache = animate => {
            animate.actionStart()
            this.homeUI.clearCache()
            animate.actionDone()
        }

        const check = resp => {
            if (resp.error) {
                const url = resp.error.userInfo.NSErrorFailingURLStringKey
                throw url + "\n" + resp.error.localizedDescription
            }
            if (resp.data.status !== "success") {
                const url = resp.response.url
                throw url + "\n" + resp.data.message
            }

            return resp.data.data
        }

        this.setting.method.export = animate => {
            animate.actionStart()
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("COPY_TO_CLIPBOARD")],
                handler: (title, idx) => {
                    $http.get({
                        url: `${this.host}/api/storage`,
                        handler: (resp) => {
                            if (resp.error) {
                                $ui.alert($l10n("EXPORT_ERROR"))
                                animate.actionCancel()
                            } else {
                                const data = JSON.parse(resp.data)
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

        this.setting.method.import = animate => {
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
                                                    title: $l10n("IMPORT_ERROR"),
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
                                recoverAction(data?.string)
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

class AppUI {
    static renderMainUI() {
        const kernel = new AppKernel()
        kernel.homeUI.getView().then(data => {
            kernel.loading.done()
            kernel.UIRender(View.createByViews([data]))
        })

        kernel.loading.setLoop(() => {
            kernel.loading.updateText(kernel.homeUI.nowDownload)
        })
        kernel.loading.load()
    }

    static renderUnsupported() {
        $intents.finish("不支持在此环境中运行")
        $ui.render({
            views: [{
                type: "label",
                props: {
                    text: "不支持在此环境中运行",
                    align: $align.center
                },
                layout: $layout.fill
            }]
        })
    }
}

module.exports = {
    run: () => {
        if ($app.env === $env.app || $app.env === $env.action) {
            AppUI.renderMainUI()
        } else {
            AppUI.renderUnsupported()
        }
    }
}