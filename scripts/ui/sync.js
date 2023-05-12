const { UIKit, NavigationView, NavigationBar } = require("../libs/easy-jsbox")
const { ArtifactEditor } = require("./editor")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class SyncUI {
    saveLock = false
    artifacts = []

    /**
     * @param {AppKernel} kernel
     */
    constructor(kernel) {
        this.kernel = kernel
        this.listId = "sync-list"
        this.rowHeight = 90
        this.rowEdge = 10
    }

    async init() {
        try {
            $(this.listId).data = await this.getData()
        } catch (error) {
            $ui.alert(error)
            this.kernel.print(error)
        }
    }

    async getData() {
        this.artifacts = await this.kernel.api.getArtifacts()

        const typeL10n = t => (t === "subscription" ? $l10n("SUBSCRIPTION") : $l10n("COLLECTION"))
        const getName = item => {
            if (item["displayName"] && item["displayName"] !== "") {
                return item["displayName"]
            }
            return item.name
        }

        return [
            {
                rows: this.artifacts.map(item => {
                    const path = `assets/icon/${item?.platform?.toLocaleLowerCase()}.png`
                    let image
                    if ($file.exists(path)) {
                        image = $image(path, path.replace(".png", ".dark.png"))
                    } else {
                        image = $image("assets/icon/unknow.png", "assets/icon/unknow.dark.png")
                    }
                    return {
                        icon: { image },
                        name: { text: getName(item) },
                        type: { text: typeL10n(item.type) },
                        source: { text: item.source },
                        updated: { text: item.updated ? new Date(item.updated).toLocaleString() : $l10n("NO_SYNC") },
                        sync: { info: item, on: item.sync ?? false }
                    }
                })
            }
        ]
    }

    async newArtifactEditor(data = undefined) {
        const subscriptions = await this.kernel.api.getSubscriptions()
        const collections = await this.kernel.api.getCollections()

        const editor = new ArtifactEditor(this.kernel, data, subscriptions, collections)

        editor.present(() => {
            // 保存完成后刷新页面
            this.init()
        })
    }

    async syncAllArtifacts() {
        await this.kernel.api.syncAllArtifacts()
        this.init()
    }

    async syncArtifact(name) {
        await this.kernel.api.syncArtifact(name)
        this.init()
    }

    deleteArtifact(name) {
        this.kernel.deleteConfirm(`Are you sure you want to delete ${name}?`, async () => {
            try {
                await this.kernel.api.deleteArtifact(name)
                this.init()
            } catch (error) {
                $ui.alert(error)
                this.kernel.print(error)
            }
        })
    }

    async updateArtifact(name, data) {
        if (this.saveLock) {
            throw "Please wait for other tasks to be completed"
        }
        this.saveLock = true
        try {
            await this.kernel.api.updateArtifact(name, data)
            await this.init()
        } catch (error) {
            $ui.alert(error)
            throw error
        } finally {
            this.saveLock = false
        }
    }

    get listTemplate() {
        return {
            views: [
                {
                    type: "image",
                    props: {
                        id: "icon"
                    },
                    layout: make => {
                        make.left.top.inset(this.rowEdge)
                        make.size.equalTo(this.rowHeight - this.rowEdge * 2)
                    }
                },
                {
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                id: "name",
                                font: $font("bold", 18)
                            },
                            layout: (make, view) => {
                                make.top.inset(this.rowEdge)
                                const size = $text.sizeThatFits({
                                    text: "A",
                                    width: 18,
                                    font: $font("bold", 18)
                                })
                                make.height.equalTo(size.height)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "type",
                                lines: 0,
                                color: $color("lightGray"),
                                font: $font(14)
                            },
                            layout: (make, view) => {
                                make.top.equalTo(view.prev.bottom).offset(5)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "source",
                                color: $color("lightGray"),
                                font: $font(14)
                            },
                            layout: (make, view) => {
                                make.top.equalTo(view.prev)
                                make.left.equalTo(view.prev.right).offset(10)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "updated",
                                color: $color("lightGray"),
                                font: $font(14)
                            },
                            layout: (make, view) => {
                                make.top.equalTo(view.prev.bottom).offset(5)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.left.equalTo(view.prev.right).offset(this.rowEdge)
                        make.width.equalTo(UIKit.windowSize.width - this.rowHeight - this.rowEdge * 2)
                    }
                },
                {
                    type: "view",
                    views: [
                        {
                            type: "switch",
                            props: { id: "sync" },
                            events: {
                                changed: async sender => {
                                    // 锁定按钮，防止重复点击
                                    sender.userInteractionEnabled = false
                                    sender.alpha = 0.5
                                    try {
                                        const info = sender.info
                                        info.sync = sender.on
                                        await this.updateArtifact(info.name, info)
                                    } catch (error) {
                                        sender.on = !sender.on
                                    } finally {
                                        // 解锁
                                        sender.userInteractionEnabled = true
                                        sender.alpha = 1
                                    }
                                }
                            },
                            layout: make => {
                                make.right.bottom.inset(0)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                text: $l10n("SYNC"),
                                font: $font(16)
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.prev)
                                make.right.equalTo(view.prev.left).offset(-this.rowEdge)
                            }
                        }
                    ],
                    layout: make => {
                        make.right.bottom.inset(10)
                        // 至少开关大小，否则无法点击
                        make.size.equalTo($size(50, 30))
                    }
                }
            ]
        }
    }

    get listActions() {
        return [
            {
                // 删除
                title: " " + $l10n("DELETE") + " ", // 防止JSBox自动更改成默认的删除操作
                color: $color("red"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).sync.info
                    this.deleteArtifact(info.name)
                }
            },
            {
                title: $l10n("EDIT"),
                color: $color("#33CC33"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).sync.info
                    this.newArtifactEditor(info)
                }
            },
            {
                title: $l10n("SYNC"),
                color: $color("#fcba03"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).sync.info
                    this.syncArtifact(info.name)
                }
            }
        ]
    }

    getListView() {
        return {
            type: "list",
            props: {
                id: this.listId,
                rowHeight: this.rowHeight,
                data: [],
                template: this.listTemplate,
                actions: this.listActions
            },
            layout: $layout.fill,
            events: {
                ready: () => this.init()
            }
        }
    }

    getNavigationView() {
        const navigationView = new NavigationView()

        if ($app.env !== $env.app) {
            navigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
        }

        navigationView.navigationBarItems.setRightButtons([
            {
                symbol: "plus.circle",
                tapped: () => {
                    this.newArtifactEditor()
                }
            },
            {
                symbol: "arrow.clockwise",
                tapped: async () => {
                    try {
                        await this.init()
                        $ui.success($l10n("SUCCESS"))
                    } catch (error) {
                        $ui.alert(error)
                    }
                }
            },
            {
                symbol: "icloud.and.arrow.up",
                tapped: async () => {
                    try {
                        await this.syncAllArtifacts()
                        $ui.success($l10n("SUCCESS"))
                    } catch (error) {
                        $ui.alert(error)
                    }
                }
            }
        ])
        navigationView.navigationBarTitle($l10n("SYNC"))
        navigationView.navigationController.navigationBar.setBackgroundColor(UIKit.primaryViewBackgroundColor)
        navigationView.setView(this.getListView())

        return navigationView
    }
}

module.exports = SyncUI
