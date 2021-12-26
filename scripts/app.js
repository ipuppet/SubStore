const {
    UIKit,
    Kernel,
    Setting
} = require("./easy-jsbox")

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
            const HomeUI = require("./ui/home")
            const homeUI = new HomeUI()
            homeUI.clearCache()
            animate.actionDone()
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

module.exports = {
    run: async () => {
        const kernel = new AppKernel()
        const HomeUI = require("./ui/home")
        const homeUI = new HomeUI(kernel)
        const loadingLabel = kernel.uuid()
        $ui.render({
            views: [
                {
                    type: "spinner",
                    props: {
                        loading: true
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super).offset(-15)
                        make.width.equalTo(view.super)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: loadingLabel,
                        align: $align.center,
                        text: homeUI.nowDownload
                    },
                    layout: (make, view) => {
                        make.top.equalTo(view.prev.bottom).offset(10)
                        make.left.right.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill,
            events: {
                appeared: () => {
                    const t = setInterval(() => {
                        if (homeUI.isLoaded) {
                            clearInterval(t)
                        } else {
                            $(loadingLabel).text = homeUI.nowDownload
                        }
                    }, 100)
                }
            }
        })
        const homeView = await homeUI.getView()
        kernel.UIRender({
            views: [homeView]
        })
    }
}