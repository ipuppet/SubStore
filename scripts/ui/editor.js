const { Sheet, Setting } = require("../libs/easy-jsbox")
const { getActions } = require("./action")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class Editor {
    isNew = false
    editorContent = {}

    quickSettingPrefix = "quick."
    quickSettingIndex = -1
    quickSettingItems = ["DEFAULT", "ENABLE", "DISABLE"]
    quickSettingArgs = ["DEFAULT", "ENABLED", "DISABLED"]
    quickSettingDefaultValue = {
        type: "Quick Setting Operator",
        args: {
            useless: this.quickSettingArgs[2],
            udp: this.quickSettingArgs[0],
            scert: this.quickSettingArgs[0],
            tfo: this.quickSettingArgs[0],
            "vmess aead": this.quickSettingArgs[0]
        }
    }

    processSection = 2

    /**
     *
     * @param {AppKernel} kernel
     */
    constructor(kernel) {
        this.kernel = kernel
        this.actions = getActions()
    }

    init(editorContent = {}) {
        // editorContent.process 默认空数组
        if (editorContent.process?.length > 0) {
            for (let i = 0; i < editorContent.process?.length; i++) {
                const item = editorContent.process[i]
                if (item.type === "Quick Setting Operator") {
                    this.quickSettingIndex = i
                    break
                }
            }
        } else {
            editorContent.process = []
        }

        if (this.quickSettingIndex === -1) {
            editorContent.process.unshift(this.quickSettingDefaultValue)
            this.quickSettingIndex = 0
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

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        if (key.startsWith(this.quickSettingPrefix)) {
            const qkey = key.replace(this.quickSettingPrefix, "")
            this.editorContent.process[this.quickSettingIndex].args[qkey] = value
        }

        this.editorContent[key] = value
    }

    get(key, _default = null) {
        if (key.startsWith(this.quickSettingPrefix)) {
            const qkey = key.replace(this.quickSettingPrefix, "")
            return this.editorContent.process[this.quickSettingIndex].args[qkey]
        }

        return this.editorContent[key] ?? _default
    }

    get singleKV() {
        return {
            comment: "init process",
            key: "process",
            value: [this.quickSettingDefaultValue]
        }
    }

    get quickSettingStructure() {
        // 默认值在 init 函数生成
        const quickSetting = (title, key) => ({
            title,
            key: this.quickSettingPrefix + key,
            type: "tab",
            items: this.quickSettingItems,
            values: this.quickSettingArgs
        })

        return {
            title: $l10n("COMMON_SETTINGS"),
            items: [
                {
                    title: "USELESS_NODES",
                    type: "tab",
                    key: this.quickSettingPrefix + "useless",
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
            },
            this.quickSettingStructure
        ]
    }

    get settingTemplate() {
        const views = []

        this.actions.forEach(action => {
            const a = new action.class()
            views.push(a.getTemplate())
        })

        return {
            type: "view",
            views: views,
            layout: $layout.fill
        }
    }

    getProcess() {
        const process = []
        const setting = $(this.setting.name)

        let cellIndex = 0
        let cellView = setting.cell($indexPath(this.processSection, cellIndex))

        while (cellView) {
            let cell = {}
            const views = cellView.views[0].views
            for (let i = 0; i < views.length; i++) {
                const item = views[i]
                if (item.hidden === false) {
                    cell = item
                    break
                }
            }
            process.push(cell.info)
            // 下一个 cellView
            cellView = setting.cell($indexPath(this.processSection, ++cellIndex))
        }

        return process
    }

    getData() {
        Object.keys(this.editorContent).forEach(key => {
            if (key.startsWith(this.quickSettingPrefix)) {
                delete this.editorContent[key]
            }
        })

        const process = this.getProcess()

        this.editorContent.process = process

        return this.editorContent
    }

    getListView() {
        const listView = this.setting.getListView()
        Object.assign(listView.props, {
            template: this.settingTemplate,
            reorder: true,
            crossSections: false,
            actions: [
                {
                    title: "delete"
                }
            ]
        })
        Object.assign(listView.events, {
            canMoveItem: (sender, indexPath) => {
                return indexPath.section === this.processSection
            },
            swipeEnabled: (sender, indexPath) => {
                return indexPath.section === this.processSection
            }
        })

        listView.props.data.push({
            title: $l10n("NODE_ACTIONS"),
            rows: []
        })
        listView.props.data.push({
            rows: [
                {
                    type: "button",
                    props: {
                        title: $l10n("ADD_ACTION")
                    },
                    events: {
                        tapped: sender => {
                            $ui.menu({
                                items: this.actions.map(a => a.type),
                                handler: (title, idx) => {
                                    const actionHide = {}
                                    this.actions.forEach(a => (actionHide[a.type] = { hidden: true }))

                                    const Action = this.actions[idx].class
                                    const index = $(this.setting.name)?.data[this.processSection]?.rows?.length ?? 0
                                    $(this.setting.name).insert({
                                        indexPath: $indexPath(this.processSection, index),
                                        value: Object.assign(actionHide, {
                                            props: {
                                                info: {
                                                    rowHeight: Action.titleBarheight + Action.height
                                                }
                                            },
                                            [Action.type]: { hidden: false }
                                        })
                                    })
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
        const data = super.getData()

        //this.editorContent.process.unshift(this.quickSettingOperator)
        if (this.isNew) {
            //this.kernel.api.addSubscription(this.editorContent)
        }
        console.log(data)
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
