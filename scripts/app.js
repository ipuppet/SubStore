const { Kernel, TabBarController, NavigationBar, Setting } = require("./libs/easy-jsbox")
const { SubStore } = require("./libs/api")
const HomeUI = require("./ui/home")
const SyncUI = require("./ui/sync")

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
        this.backupPathICloud = "drive://SubStore/.backup.json.icloud"
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

    initComponents() {
        this.api = new SubStore(this.host)
        this.tabBarController = new TabBarController()
        this.homeUI = new HomeUI(this)
        this.syncUI = new SyncUI(this)
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        this.setting.method.export = animate => {
            animate.start()
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("COPY_TO_CLIPBOARD")],
                handler: (title, idx) => {
                    $http.get({
                        url: `${this.host}/api/storage`,
                        handler: resp => {
                            if (resp.error) {
                                $ui.alert($l10n("EXPORT_ERROR"))
                                animate.cancel()
                            } else {
                                const data = JSON.parse(resp.data)
                                switch (idx) {
                                    case 0:
                                        $drive.save({
                                            data: $data({ string: data }),
                                            name: this.backupPath.slice(this.backupPath.lastIndexOf("/") + 1),
                                            handler: success => {
                                                if (success) {
                                                    animate.done()
                                                } else {
                                                    animate.cancel()
                                                }
                                            }
                                        })
                                        break
                                    case 1:
                                        $file.write({
                                            data: $data({ string: data }),
                                            path: this.backupPath
                                        })
                                        animate.done()
                                        break
                                    case 2:
                                        $clipboard.text = data
                                        animate.done()
                                        break
                                }
                            }
                        }
                    })
                },
                finished: cancelled => {
                    if (cancelled) animate.cancel()
                }
            })
        }

        this.setting.method.import = animate => {
            animate.start()
            const recoverAction = data => {
                try {
                    if (typeof data === "string") {
                        data = JSON.parse(data)
                    }
                    let message = ""
                    const keyL10n = {
                        subs: "单个订阅",
                        collections: "组合订阅",
                        artifacts: "同步配置",
                        settings: "设置",
                        rules: "规则"
                    }
                    try {
                        if (data.schemaVersion === "2.0") {
                            Object.keys(data).forEach(key => {
                                if (Array.isArray(data[key])) {
                                    message += `\n\n${keyL10n[key]}:\n`
                                    message += data[key].map(v => v.name).join("\n")
                                } else if (typeof data[key] === "object") {
                                    message += `\n\n${keyL10n[key]}:\n`
                                    message += Object.keys(data[key])
                                        .map(k => `${k}: ${data[key][k]}`)
                                        .join("\n")
                                }
                            })
                        } else {
                            let subList = Object.keys(data.subs)
                            let collectionList = Object.keys(data.collections)
                            message = "单个订阅:\n"
                            message += subList.join("\n")
                            message += "\n组合订阅:\n"
                            message += collectionList.join("\n")
                        }
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
                                                animate.cancel()
                                            } else {
                                                // 完成动画
                                                animate.done()
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
                                    animate.cancel()
                                }
                            }
                        ]
                    })
                } catch (error) {
                    $ui.alert(error)
                    animate.cancel()
                    return
                }
            }
            $ui.menu({
                items: [$l10n("CHOOSE_FILE"), $l10n("DEFAULT_FILE"), $l10n("MANUAL_INPUT")],
                handler: async (title, idx) => {
                    if (idx === 0) {
                        $drive.open({
                            handler: data => {
                                recoverAction(data?.string)
                            }
                        })
                    } else if (idx === 1) {
                        if ($file.exists(this.backupPath) || $file.exists(this.backupPathICloud)) {
                            let data
                            if ($file.exists(this.backupPathICloud)) {
                                data = await $file.download(this.backupPathICloud).string
                            } else {
                                data = $file.read(this.backupPath).string
                            }
                            recoverAction(data)
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
                    if (cancelled) animate.cancel()
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
            sync: {
                icon: "arrow.triangle.2.circlepath",
                title: $l10n("SYNC")
            },
            setting: {
                icon: "gear",
                title: $l10n("SETTING")
            }
        }

        const settingNavigationView = kernel.setting.getNavigationView()
        if ($app.env !== $env.app) {
            settingNavigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
        }

        const pages = {
            home: kernel.homeUI.getNavigationView().getPage(),
            sync: kernel.syncUI.getNavigationView().getPage(),
            setting: settingNavigationView.getPage()
        }
        const cells = {
            home: buttons.home,
            sync: buttons.sync,
            setting: buttons.setting
        }

        kernel.setting.setEvent("onSet", key => {
            if (key === "ui.sync") {
                $delay(0.3, () => $addin.restart())
            }
        })
        if (kernel.setting.get("ui.sync")) {
            delete pages.sync
            delete cells.sync
        }

        kernel.tabBarController.setPages(pages).setCells(cells)

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
        if ($app.env === $env.app || $app.env === $env.today) {
            AppUI.renderMainUI()
        } else {
            AppUI.renderUnsupported()
        }
    }
}
