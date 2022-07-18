const { Sheet, Setting } = require("../libs/easy-jsbox")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class Editor {
    isNew = false
    editorContent = {}

    /**
     *
     * @param {AppKernel} kernel
     */
    constructor(kernel) {
        this.kernel = kernel
    }

    init(editorContent = {}) {
        if (editorContent.process?.length > 0) {
            for (const iterator of editorContent.process) {
                if (iterator.type === "Quick Setting Operator") {
                    Object.assign(editorContent, iterator.args ?? {})
                    break
                }
            }
        }

        this.setting = new Setting({
            set: (key, value) => this.set(key, value),
            get: (key, _default = null) => this.get(key, _default),
            structure: this.settingStructure,
            userData: editorContent
        })
        this.setting.footer = {}
        this.setting.loadConfig()

        this.editorContent = this.setting.setting
    }

    get singleKV() {
        return {
            comment: "init process",
            key: "process",
            value: []
        }
    }

    get quickSettingStructure() {
        const Items = ["DEFAULT", "ENABLE", "DISABLE"]
        const Args = ["DEFAULT", "ENABLED", "DISABLED"]

        const quickSetting = (title, key) => ({
            title,
            key,
            type: "tab",
            items: Items,
            values: Args,
            value: Args[0]
        })

        return {
            title: $l10n("COMMON_SETTINGS"),
            items: [
                {
                    title: "USELESS_NODES",
                    type: "tab",
                    key: "useless",
                    items: ["RETAIN", "REMOVE"],
                    values: ["DISABLED", "ENABLED"],
                    value: "DISABLED"
                },
                quickSetting("UDP_RELAY", "udp"),
                quickSetting("SKIP_TLS_VERIFY", "scert"),
                quickSetting("TCP_FAST_OPEN", "tfo"),
                quickSetting("VMESS_AEAD", "vmess aead")
            ]
        }
    }

    get settingStructure() {
        return [
            {
                title: "GENERAL",
                items: [
                    {
                        icon: ["square.and.pencil", "#FF33CC"],
                        title: "NAME",
                        type: "input",
                        key: "name",
                        value: this.editorContent.name
                    },
                    {
                        icon: ["photo", "#9966FF"],
                        title: "ICON",
                        type: "input",
                        key: "icon",
                        value: this.editorContent.icon
                    },
                    {
                        icon: ["person.crop.circle", "#000000"],
                        title: "UA",
                        type: "string",
                        key: "ua"
                    }
                ].concat(this.singleKV)
            }
            //this.quickSettingStructure
        ]
    }

    /**
     *
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        this.editorContent[key] = value
    }

    get(key, _default = null) {
        return this.editorContent[key] ?? _default
    }

    getListView() {
        const listView = this.setting.getListView()

        listView.props.data.push({
            title: $l10n("NODE_ACTIONS"),
            rows: [
                {
                    type: "view",
                    props: {
                        id: "sadf",
                        info: {
                            rowHeight: 50
                        }
                    },
                    views: [
                        {
                            type: "button",
                            props: {
                                title: $l10n("ADD_ACTION")
                            },
                            events: {
                                // TODO 添加节点操作
                                tapped: sender => {
                                    return
                                    const Action = require("./node_actions/QuickSettingStructure")
                                    const action = new Action({})

                                    const length = $(this.setting.name)?.data[1]?.rows?.length ?? 0
                                    $(this.setting.name).insert({
                                        indexPath: $indexPath(1, length),
                                        value: action.getView()
                                    })

                                    return
                                    $ui.menu({
                                        items: ["QuickSettingOperator"],
                                        handler: (title, idx) => {
                                            const Action = require("./node_actions/QuickSettingStructure")
                                            const action = new Action({})

                                            //console.log($(this.setting.name).data)

                                            const data = $(this.setting.name).data
                                            data[1].rows.push(action.getView())

                                            $(this.setting.name).data = data
                                        }
                                    })
                                }
                            },
                            layout: (make, view) => {
                                make.size.equalTo(view.super)
                            }
                        }
                    ],
                    layout: $layout.fill
                }
            ]
        })

        return listView
    }

    present() {
        const sheet = new Sheet()
        sheet.setView(this.getListView()).addNavBar({
            title: this.editorContent.name,
            popButton: {
                title: $l10n("SAVE"),
                tapped: () => this.save()
            }
        })
        sheet.init().present()
    }
}

class SubscriptionEditor extends Editor {
    static Source = {
        remote: 0,
        local: 1
    }
    static SourceValue(source) {
        const keys = Object.keys(SubscriptionEditor.Source)
        for (let i = 0; i < keys.length; ++i) {
            if (SubscriptionEditor.Source[keys[i]] === source) {
                return keys[i]
            }
        }
    }

    editorContent = {
        name: "",
        icon: "",
        ua: "",
        source: "remote",
        url: "",
        content: "",
        process: []
    }

    /**
     *
     * @param {AppKernel} kernel
     * @param {{name: string, icon: string, ua: string, source: string, url: string, content: string}|undefined} editorContent
     */
    constructor(kernel, editorContent) {
        super(kernel)
        if (!editorContent) {
            editorContent = this.editorContent
            this.isNew = true
        }
        editorContent["url&content"] = editorContent.url ?? editorContent.content
        this.initSource = SubscriptionEditor.Source[editorContent.source]
        this.init(editorContent)
    }

    set(key, value) {
        if (key === "source") {
            if (value === SubscriptionEditor.Source.remote) {
                $(this.setting.getId("url&content")).views[0].views[1].text = $l10n("URL")
            } else {
                $(this.setting.getId("url&content")).views[0].views[1].text = $l10n("CONTENT")
            }
            this.editorContent["source"] = SubscriptionEditor.SourceValue(value)
        } else if (key === "url&content") {
            if (this.setting.get("source") === SubscriptionEditor.Source.remote) {
                this.editorContent["url"] = value
            } else {
                this.editorContent["content"] = value
            }
        } else {
            super.set(key, value)
        }
    }

    get(key, _default = null) {
        if (key === "source") {
            return SubscriptionEditor.Source[this.editorContent[key] ?? 0]
        }
        if (key === "url&content") {
            if (this.setting.get("source") === SubscriptionEditor.Source.remote) {
                return this.editorContent["url"]
            } else {
                return this.editorContent["content"]
            }
        }
        return super.get(key, _default)
    }

    get settingStructure() {
        const settingStructure = super.settingStructure
        settingStructure[0].items = settingStructure[0].items.concat([
            {
                icon: ["location.fill", "#FFCC33"],
                title: "SOURCE",
                type: "tab",
                key: "source",
                items: ["REMOTE", "LOCAL"],
                value: this.initSource
            },
            {
                icon: ["link", "#FF99CC"],
                title: this.initSource === SubscriptionEditor.Source.remote ? "URL" : "CONTENT",
                type: "string",
                key: "url&content"
            }
        ])
        return settingStructure
    }

    save() {
        delete this.editorContent["url&content"]

        //this.editorContent.process.unshift(this.quickSettingOperator)
        if (this.isNew) {
            //this.kernel.api.addSubscription(this.editorContent)
        }
        console.log(this.editorContent)
    }
}

class CollectionEditor extends Editor {
    editorContent = {
        name: "",
        icon: "",
        ua: "",
        subscriptions: [],
        process: []
    }

    /**
     *
     * @param {AppKernel} kernel
     * @param {{name: string, icon: string, ua: string, subscriptions: Array}|undefined} editorContent
     */
    constructor(kernel, editorContent) {
        super(kernel)
        if (!editorContent) {
            editorContent = this.editorContent
            this.isNew = true
        }
        this.init(editorContent)
    }

    get settingStructure() {
        const settingStructure = super.settingStructure
        settingStructure[0].items.push({
            icon: ["link", "#FF99CC"],
            title: "subscriptions",
            type: "string",
            key: "subscriptions"
        })
        return settingStructure
    }

    save() {
        console.log(this.editorContent)
    }
}

module.exports = { SubscriptionEditor, CollectionEditor }
