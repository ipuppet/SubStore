const { UIKit, ViewController, Sheet, NavigationView, NavigationBar, Kernel } = require("../libs/easy-jsbox")
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

        this.viewController = new ViewController()
    }

    async init(clearUsageCache = false) {
        try {
            if (clearUsageCache) {
                this.kernel.api.clearCache()
            }
            $(this.listId).data = await this.getData()
            this.loadUsage()
            this.kernel.tabBarController.initBackground()
        } catch (error) {
            $ui.alert(error)
            this.kernel.print(error)
        }
    }

    async getData() {
        this.subscriptions = await this.kernel.api.getSubscriptions()
        this.collections = await this.kernel.api.getCollections()

        const getName = item => {
            if (item["display-name"] && item["display-name"] !== "") {
                return item["display-name"]
            }
            return item.name
        }

        return [
            {
                title: $l10n("SUBSCRIPTION"),
                rows: this.subscriptions.map(item => ({
                    icon: item.icon ? { src: item.icon } : { symbol: "link" },
                    name: { text: getName(item) },
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
                    name: { text: getName(item) },
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
                cell.get("expire").text =
                    $l10n("EXPIRE") + ": " + new Date(Number(resp.expire) * 1000).toLocaleDateString()
                const usage = UIKit.bytesToSize(Number(resp.upload) + Number(resp.download))
                const total = UIKit.bytesToSize(resp.total)
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
        UIKit.deleteConfirm(`Are you sure you want to delete ${name}?`, async () => {
            try {
                if (isSubs) {
                    await this.kernel.api.deleteSubscription(name)
                } else {
                    await this.kernel.api.deleteCollection(name)
                }
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

    preview(name, original, processed) {
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
        const originalIdMap = {}
        original.forEach(item => {
            originalIdMap[item.id] = item
        })
        processed.forEach(item => {
            data.push({
                info: {
                    info: {
                        processed: item,
                        original: originalIdMap[item.id]
                    }
                },
                processed: { text: item.name },
                original: { text: originalIdMap[item.id].name }
            })
        })

        const navigationView = new NavigationView()
        navigationView.setView({
            type: "list",
            props: {
                rowHeight,
                data,
                template
            },
            layout: $layout.fill,
            events: {
                didSelect: (sender, indexPath, data) => {
                    const html = $file.read("assets/diff.html").string
                    const info = data.info.info
                    const sheet = new Sheet()
                    sheet
                        .setView({
                            type: "web",
                            props: {
                                html,
                                transparent: true,
                                showsProgress: false,
                                script: `diff(\`${JSON.stringify(info.original, null, 4)}\`, \`${JSON.stringify(
                                    info.processed,
                                    null,
                                    4
                                )}\`)`
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
        navigationView.navigationBarTitle(name)
        navigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
        this.viewController.push(navigationView)
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
                        let type, fromServer

                        if (info.subscriptions?.length > 0) {
                            type = "collection"
                            fromServer = await this.kernel.api.getCollection(info.name)
                        } else {
                            type = "sub"
                            fromServer = await this.kernel.api.getSubscription(info.name)
                        }
                        if (!Kernel.objectEqual(info, fromServer)) {
                            this.kernel.print("Data is modified in other clients")
                            // 数据在其他客户端进行了修改，重新获取
                            await this.init()
                        }

                        const preview = await this.kernel.api.preview(fromServer, type)
                        this.preview(info.name, preview.original, preview.processed)
                    } catch (error) {
                        this.kernel.print(error)
                        $ui.alert(error)
                    } finally {
                        loading.end()
                    }
                }
            }
        }
    }

    getNavigationView() {
        const navigationView = new NavigationView()

        if ($app.env !== $env.app) {
            navigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
            navigationView.navigationBarItems.setLeftButtons([
                {
                    symbol: "xmark",
                    tapped: () => $app.close()
                }
            ])
        }

        navigationView.navigationBarItems.setRightButtons([
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
                tapped: async () => {
                    try {
                        await this.init(true)
                        $ui.success($l10n("SUCCESS"))
                    } catch (error) {
                        $ui.alert(error)
                    }
                }
            }
        ])
        navigationView.navigationBarTitle($l10n("SUBSCRIPTION"))
        navigationView.navigationBar.setBackgroundColor(UIKit.primaryViewBackgroundColor)
        navigationView.setView(this.getListView())

        return navigationView
    }
}

module.exports = HomeUI
