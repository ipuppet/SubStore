const { ViewController, Sheet, Kernel, TabBarController, Setting } = require("./libs/easy-jsbox")
const { SubStore } = require("./libs/api")
const HomeUI = require("./ui/home")

/**
 * @typedef {AppKernel} AppKernel
 */
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
        this.initComponents()
    }

    get host() {
        return this.setting.get("advanced.api", "https://sub.store")
    }

    deleteConfirm(message, conformAction) {
        $ui.alert({
            title: message,
            actions: [
                {
                    title: $l10n("DELETE"),
                    style: $alertActionType.destructive,
                    handler: () => {
                        conformAction()
                    }
                },
                { title: $l10n("CANCEL") }
            ]
        })
    }

    bytesToSize(bytes) {
        if (bytes === 0) return "0 B"
        const k = 1024,
            sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
            i = Math.floor(Math.log(bytes) / Math.log(k))

        return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i]
    }

    initComponents() {
        this.api = new SubStore(this.host)
        this.tabBarController = new TabBarController()
        this.viewController = new ViewController()
        this.homeUI = new HomeUI(this)
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        this.setting.method.readme = animate => {
            const content = $file.read("/README.md").string
            const sheet = new Sheet()
            sheet
                .setView({
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                })
                .init()
                .present()
        }

        this.setting.method.export = animate => {
            animate.actionStart()
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("COPY_TO_CLIPBOARD")],
                handler: (title, idx) => {
                    $http.get({
                        url: `${this.host}/api/storage`,
                        handler: resp => {
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
                finished: cancelled => {
                    if (cancelled) animate.actionCancel()
                }
            })
        }

        this.setting.method.import = animate => {
            animate.actionStart()
            const recoverAction = data => {
                try {
                    let message
                    if (typeof data === "string") {
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
                                                setTimeout(() => {
                                                    $addin.restart()
                                                }, 1000)
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
                finished: cancelled => {
                    if (cancelled) animate.actionCancel()
                }
            })
        }
    }
}

class AppUI {
    static renderMainUI() {
        const kernel = new AppKernel()
        const buttons = {
            home: {
                icon: "link",
                title: $l10n("SUBSCRIPTION")
            },
            setting: {
                icon: "gear",
                title: $l10n("SETTING")
            }
        }

        const homePageController = kernel.homeUI.getPageController()
        kernel.viewController.setRootPageController(homePageController)
        kernel.tabBarController
            .setPages({
                home: homePageController.getPage(),
                setting: kernel.setting.getPageView()
            })
            .setCells({
                home: buttons.home,
                setting: buttons.setting
            })

        kernel.UIRender(kernel.tabBarController.generateView().definition)
    }

    static renderUnsupported() {
        $intents.finish("不支持在此环境中运行")
        $ui.render({
            views: [
                {
                    type: "label",
                    props: {
                        text: "不支持在此环境中运行",
                        align: $align.center
                    },
                    layout: $layout.fill
                }
            ]
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
