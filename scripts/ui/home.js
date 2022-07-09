const { UIKit, PageController } = require("../libs/easy-jsbox")
const Editor = require("./editor")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class HomeUI {
    subscriptions = []
    collections = []

    /**
     * @param {AppKernel} kernel
     */
    constructor(kernel) {
        this.kernel = kernel
        this.listId = "subscription-list"
        this.rowHeight = 90
        this.rowEdge = 10
    }

    async init(clearCache = false) {
        try {
            const list = $(this.listId)
            list.data = []
            if (clearCache) {
                this.kernel.api.clearCache()
            }
            list.data = await this.getData()
            this.loadUsage()
        } catch (error) {
            this.kernel.print(error)
        }
    }

    async getData() {
        try {
            this.subscriptions = await this.kernel.api.getSubscriptions()
            this.collections = await this.kernel.api.getCollections()

            const data = [
                {
                    title: $l10n("SUBSCRIPTION"),
                    rows: this.subscriptions.map(item => ({
                        icon: {},
                        name: { text: item.name },
                        usage: { hidden: false },
                        expire: { hidden: false },
                        contains: { hidden: true },
                        info: { info: item }
                    }))
                },
                {
                    title: $l10n("COLLECTION"),
                    rows: this.collections.map(item => ({
                        icon: {},
                        name: { text: item.name },
                        usage: { hidden: true },
                        expire: { hidden: true },
                        contains: {
                            hidden: false,
                            text: $l10n("CONTAINS_SUBS") + ": " + item.subscriptions.join(", ")
                        },
                        info: { info: item }
                    }))
                }
            ]
            return data
        } catch (error) {
            $ui.error(error)
            this.kernel.print(error)
        }
    }

    loadUsage(clearCache = false) {
        if (clearCache) {
            this.kernel.api.clearCache()
        }
        try {
            const list = $(this.listId)
            this.subscriptions.forEach(async (item, index) => {
                const resp = await this.kernel.api.getUsage(item.url)
                const cell = list.cell($indexPath(0, index))
                cell.get("expire").text = $l10n("EXPIRE") + ": " + new Date(Number(resp.expire) * 1000).toLocaleDateString()
                const usage = this.kernel.bytesToSize(Number(resp.upload) + Number(resp.download))
                const total = this.kernel.bytesToSize(resp.total)
                cell.get("usage").text = $l10n("USAGE") + ": " + `${usage} / ${total}`
            })
        } catch (error) {
            this.kernel.print(error)
        }
    }

    newEditor(editorContent) {
        return new Editor(this.kernel, editorContent)
    }

    addSubscription() {}

    deleteSubscription(name, isSubs) {
        this.kernel.deleteConfirm(`Are you sure you want to delete ${name}?`, async () => {
            try {
                if (isSubs) {
                    await this.kernel.api.deleteSubscription(name)
                } else {
                    await this.kernel.api.deleteCollection(name)
                }
                this.init()
            } catch (error) {
                $ui.error(error)
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
                        id: "icon",
                        symbol: "link"
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
                                id: "contains",
                                lines: 0,
                                color: $color("lightGray"),
                                font: $font(14)
                            },
                            layout: (make, view) => {
                                make.width.equalTo(view.super)
                                make.top.equalTo(view.prev.bottom).offset(5)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "usage",
                                color: $color("lightGray"),
                                font: $font(14)
                            },
                            layout: (make, view) => {
                                make.top.equalTo(view.prev.prev.bottom).offset(5)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "expire",
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
                    type: "button",
                    props: {
                        id: "info",
                        bgcolor: $color("clear"),
                        contentEdgeInsets: 10,
                        symbol: "square.on.square"
                    },
                    events: {
                        tapped: sender => {
                            const info = sender.info
                            let t = `${this.kernel.host}/download`
                            if (info.subscriptions) {
                                t += "/collection"
                            }
                            $clipboard.text = `${t}/${info.name}`
                            $ui.success($l10n("SUCCESS"))
                        }
                    },
                    layout: make => {
                        make.right.top.inset(0)
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
                    this.deleteSubscription(info.name, indexPath.section === 0)
                }
            },
            {
                title: $l10n("EDIT"),
                color: $color("green"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).info.info
                    const editor = this.newEditor(info)
                    editor.present()
                }
            }
        ]
    }

    getListView() {
        return {
            // 剪切板列表
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
                ready: () => this.init(),
                didSelect: (sender, indexPath, data) => {
                    // TODO 差异预览
                    const info = data.info.info
                    const editor = this.newEditor(info)
                    editor.present()
                }
            }
        }
    }

    getPageController() {
        const pageController = new PageController()
        pageController.navigationItem.setTitle($l10n("SUBSCRIPTION")).setRightButtons([
            {
                symbol: "plus.circle",
                tapped: () => this.addSubscription()
            },
            {
                symbol: "arrow.clockwise",
                tapped: () => this.init()
            }
        ])
        pageController.navigationController.navigationBar.setBackgroundColor(UIKit.primaryViewBackgroundColor)
        pageController.setView(this.getListView())
        return pageController
    }
}

module.exports = HomeUI
