const { UIKit, PageController } = require("../libs/easy-jsbox")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class SyncUI {
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

        return [
            {
                rows: this.artifacts.map(item => ({
                    icon: { symbol: "link" }, // TODO platform icon
                    name: { text: item.name },
                    type: { text: typeL10n(item.type) },
                    source: { text: item.source },
                    updated: { text: item.updated ? new Date(item.updated).toLocaleString() : $l10n("NO_SYNC") },
                    info: { info: item }
                }))
            }
        ]
    }

    newSyncEditor(data = undefined) {
        $ui.alert("Not supported yet")
    }

    deleteSync(name) {
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
                    type: "switch",
                    props: {
                        hidden: true, // TODO 定时
                        id: "info"
                    },
                    events: {
                        changed: sender => {
                            const status = sender.on
                            const info = sender.info
                            console.log(info)
                        }
                    },
                    layout: make => {
                        make.right.bottom.inset(10)
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
                    const info = sender.object(indexPath).info.info
                    this.deleteSync(info.name)
                }
            },
            {
                title: $l10n("EDIT"),
                color: $color("#33CC33"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).info.info
                    this.newSyncEditor(info)
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
                data: this.subscriptions,
                template: this.listTemplate,
                actions: this.listActions
            },
            layout: $layout.fill,
            events: {
                ready: () => this.init()
            }
        }
    }

    getPageController() {
        const pageController = new PageController()
        pageController.navigationItem.setTitle($l10n("SYNC")).setRightButtons([
            {
                symbol: "plus.circle",
                tapped: () => {
                    this.newSyncEditor()
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
            }
        ])
        pageController.navigationController.navigationBar.setBackgroundColor(UIKit.primaryViewBackgroundColor)
        pageController.setView(this.getListView())
        return pageController
    }
}

module.exports = SyncUI
