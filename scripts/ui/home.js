const { UIKit, PageController, Sheet, NavigationItem } = require("../libs/easy-jsbox")
const { SubscriptionEditor, CollectionEditor } = require("./editor")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class HomeUI {
    static EditorType = {
        Subscription: 0,
        Collection: 1
    }
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

    async init(clearUsageCache = false) {
        try {
            const list = $(this.listId)
            list.data = []
            if (clearUsageCache) {
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
                        icon: item.icon ? { src: item.icon } : { symbol: "link" },
                        name: { text: item.name },
                        usage: {
                            hidden: false,
                            text: item.source === "local" ? $l10n("LOCAL_SUBSCRIPTION") : ""
                        },
                        expire: { hidden: false },
                        contains: { hidden: true },
                        info: { info: item }
                    }))
                },
                {
                    title: $l10n("COLLECTION"),
                    rows: this.collections.map(item => ({
                        icon: item.icon ? { src: item.icon } : { symbol: "link" },
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
                if (item.source === "local") {
                    return
                }
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

    newEditor(type, data = undefined) {
        let editor
        if (type === HomeUI.EditorType.Subscription) {
            // SubscriptionEditor
            editor = new SubscriptionEditor(this.kernel, data)
        } else {
            // CollectionEditor
            editor = new CollectionEditor(this.kernel, data)
        }
        editor.present(() => {
            // 保存完成后刷新页面，不需要刷新 Usage 缓存
            this.init()
        })
    }

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
                color: $color("#33CC33"),
                handler: (sender, indexPath) => {
                    const info = sender.object(indexPath).info.info
                    this.newEditor(indexPath.section, info)
                }
            }
        ]
    }

    async preview(name, original, processed) {
        const html = $file.read("assets/diff.html").string
        const fontSize = 16
        const fontHeight = $text.sizeThatFits({
            text: "A",
            width: fontSize,
            font: $font(fontSize)
        }).height
        const rowHeight = fontSize * 2 + this.rowEdge * 5

        const indexTemplate = (id, color, labelProps = {}) => {
            return {
                type: "view",
                props: { info: { preview: true } },
                views: [
                    {
                        type: "view",
                        props: { bgcolor: color },
                        layout: (make, view) => {
                            make.left.inset(this.rowEdge)
                            make.centerY.equalTo(view.super)
                            make.size.equalTo(10)
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: id,
                            font: $font(fontSize),
                            ...labelProps
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.prev.right).offset(this.rowEdge)
                        }
                    }
                ],
                layout: (make, view) => {
                    if (view.prev?.info?.preview) {
                        make.top.equalTo(view.prev.bottom).offset(this.rowEdge)
                    } else {
                        make.top.inset(this.rowEdge * 2)
                    }
                    make.left.inset(this.rowEdge)
                    make.height.equalTo(fontHeight)
                }
            }
        }
        const template = {
            views: [
                {
                    props: { id: "info" }
                },
                indexTemplate("processed", $color("#33CC33")),
                indexTemplate("original", $color("red"), {
                    textColor: $color("lightGray")
                })
            ]
        }

        let data = []
        for (let i = processed.length - 1; i >= 0; --i) {
            data.push({
                info: {
                    info: {
                        processed: processed[i],
                        original: original[i]
                    }
                },
                processed: { text: processed[i].name },
                original: { text: original[i].name }
            })
        }

        const pageController = new PageController()
        pageController.setView({
            type: "list",
            props: {
                rowHeight: rowHeight,
                data: data.reverse(),
                template: template
            },
            layout: $layout.fill,
            events: {
                didSelect: (sender, indexPath, data) => {
                    const info = data.info.info
                    const sheet = new Sheet()
                    sheet
                        .setView({
                            type: "web",
                            props: {
                                html,
                                transparent: true,
                                showsProgress: false,
                                script: `diff(\`${JSON.stringify(info.original, null, 4)}\`, \`${JSON.stringify(info.processed, null, 4)}\`)`
                            },
                            layout: $layout.fill
                        })
                        .addNavBar({
                            title: "Diff"
                        })
                    sheet.init().present()
                }
            }
        })
        pageController.navigationItem.setTitle(name).setLargeTitleDisplayMode(NavigationItem.largeTitleDisplayModeNever)
        this.kernel.viewController.push(pageController)
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
                ready: () => this.init(),
                didSelect: async (sender, indexPath, data) => {
                    const loading = UIKit.loading()
                    loading.start()
                    try {
                        const info = data.info.info
                        const preview = await this.kernel.api.preview(info)
                        this.preview(info.name, preview.original, preview.processed)
                    } catch (error) {
                        this.kernel.print(error)
                        $ui.error(error)
                    } finally {
                        loading.end()
                    }
                }
            }
        }
    }

    getPageController() {
        const pageController = new PageController()
        pageController.navigationItem.setTitle($l10n("SUBSCRIPTION")).setRightButtons([
            {
                symbol: "plus.circle",
                menu: {
                    pullDown: true,
                    asPrimary: true,
                    items: [
                        {
                            title: $l10n("SUBSCRIPTION"),
                            handler: () => {
                                this.newEditor(HomeUI.EditorType.Subscription)
                            }
                        },
                        {
                            title: $l10n("COLLECTION"),
                            handler: () => {
                                this.newEditor(HomeUI.EditorType.Collection)
                            }
                        }
                    ]
                }
            },
            {
                symbol: "arrow.clockwise",
                tapped: () => this.init(true)
            }
        ])
        pageController.navigationController.navigationBar.setBackgroundColor(UIKit.primaryViewBackgroundColor)
        pageController.setView(this.getListView())
        return pageController
    }
}

module.exports = HomeUI
