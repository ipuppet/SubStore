const { Sheet, Setting } = require("../libs/easy-jsbox")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class Editor {
    static listId = "list-editor"

    saveLock = false
    isNew = false
    editorData = {}
    originalName = ""

    /**
     *
     * @param {AppKernel} kernel
     */
    constructor(kernel, editorData, defaultData) {
        this.kernel = kernel

        if (editorData) {
            this.editorData = editorData
            this.originalName = editorData.name
        } else {
            this.editorData = defaultData
            this.isNew = true
        }
    }

    init() {
        this.setting = new Setting({
            name: Editor.listId,
            set: (key, value) => this.set(key, value),
            get: (key, _default = null) => this.get(key, _default),
            structure: this.settingStructure,
            userData: this.editorData
        })
        this.setting.footer = {}
        this.setting.loadConfig()

        this.editorData = this.setting.setting
    }

    set(key, value) {
        // 值未改变则直接返回
        if (value === this.get(key)) {
            return
        }

        this.editorData[key] = value
    }

    get(key, _default = null) {
        return this.editorData[key] ?? _default
    }

    present(onSave) {
        const sheet = new Sheet()
        sheet.setView(this.getListView()).addNavBar({
            title: this.isNew ? this.editorName : this.editorData.name,
            popButton: { title: "Cancel" },
            rightButtons: [
                {
                    title: $l10n("SAVE"),
                    tapped: async () => {
                        if (this.saveLock) return
                        this.saveLock = true
                        try {
                            await this.save()
                            if (typeof onSave === "function") {
                                onSave()
                            }
                            $ui.success($l10n("SAVE_SUCCESS"))
                            $delay(0.8, () => sheet.dismiss())
                        } catch (error) {
                            this.saveLock = false
                            $ui.alert(error)
                        }
                    }
                }
            ]
        })
        sheet.init().present()
    }
}

class NodeEditor extends Editor {
    static processSection = 2

    actions = []

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

    /**
     *
     * @param {AppKernel} kernel
     */
    constructor(kernel, editorData, defaultData) {
        super(kernel, editorData, defaultData)

        // 防止循环引用
        const { getActions } = require("./action")
        this.actions = getActions()
    }

    getActionIndex(type) {
        if (!this.actionIndex) {
            this.actionIndex = {}
            this.actions.forEach((action, i) => {
                this.actionIndex[action.type] = i
            })
        }

        return this.actionIndex[type]
    }

    init() {
        this.initQuickSetting()
        super.init()
    }

    initQuickSetting() {
        // editorData.process 默认空数组
        if (this.editorData.process?.length > 0) {
            for (let i = 0; i < this.editorData.process?.length; i++) {
                const item = this.editorData.process[i]
                if (item.type === "Quick Setting Operator") {
                    this.quickSettingIndex = i
                    break
                }
            }
        } else {
            this.editorData.process = []
        }

        if (this.quickSettingIndex === -1) {
            this.editorData.process.unshift(this.quickSettingDefaultValue)
            this.quickSettingIndex = 0
        }
    }

    ready() {
        // 初始化 process
        // 0 为 Quick Setting Operator
        for (let i = 1; i < this.editorData.process.length; i++) {
            const process = this.editorData.process[i]
            this.insertProcess(this.getActionIndex(process.type), process.args)
        }
    }

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        if (key.startsWith(this.quickSettingPrefix)) {
            const qkey = key.replace(this.quickSettingPrefix, "")
            this.editorData.process[this.quickSettingIndex].args[qkey] = value
        }

        super.set(key, value)
    }

    get(key, _default = null) {
        if (key.startsWith(this.quickSettingPrefix)) {
            const qkey = key.replace(this.quickSettingPrefix, "")
            return this.editorData.process[this.quickSettingIndex].args[qkey]
        }

        return super.get(key, _default)
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
                        value: this.editorData.name
                    },
                    {
                        icon: ["photo", "#9966FF"],
                        title: "ICON",
                        type: "input",
                        key: "icon",
                        value: this.editorData.icon
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
        const setting = $(Editor.listId)
        const savedProcess = setting.info.process

        setting.data[NodeEditor.processSection].rows.forEach(row => {
            const keys = Object.keys(row)
            for (let i = 0; i < keys.length; i++) {
                if (row[keys[i]].hidden === false) {
                    process.push(savedProcess[row[keys[i]].info.uuid])
                }
            }
        })

        return process
    }

    getData() {
        Object.keys(this.editorData).forEach(key => {
            if (key.startsWith(this.quickSettingPrefix)) {
                delete this.editorData[key]
            }
        })

        // 0 为 Quick Setting Operator
        const quick = this.editorData.process[0]
        this.editorData.process = [quick, ...this.getProcess()]
        if (this.editorData.process.length > 1 && this.editorData.process[1].type !== "Flag Operator") {
            // TODO 节点操作
            throw "Node action not supported yet"
        }

        return this.editorData
    }

    insertProcess(idx, args = {}) {
        const actionHide = {}
        this.actions.forEach(a => (actionHide[a.type] = { hidden: true }))

        const Action = this.actions[idx].class
        const insertIndex = $(Editor.listId)?.data[NodeEditor.processSection]?.rows?.length ?? 0
        const uuid = this.kernel.uuid()
        $(Editor.listId).insert({
            indexPath: $indexPath(NodeEditor.processSection, insertIndex),
            value: Object.assign(actionHide, {
                props: {
                    info: {
                        rowHeight: Action.titleBarheight + Action.height
                    }
                },
                [Action.type]: {
                    hidden: false,
                    info: {
                        index: insertIndex,
                        uuid,
                        type: Action.type,
                        args
                    }
                }
            })
        })
        const listInfo = $(Editor.listId).info
        listInfo.process[uuid] = {
            type: Action.type,
            args
        }
        $(Editor.listId).info = listInfo
    }

    getListView() {
        const listView = this.setting.getListView()
        Object.assign(listView.props, {
            info: { process: {} },
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
            ready: sender => this.ready(),
            canMoveItem: (sender, indexPath) => {
                return indexPath.section === NodeEditor.processSection
            },
            swipeEnabled: (sender, indexPath) => {
                return indexPath.section === NodeEditor.processSection
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
                            // TODO 节点操作
                            $ui.alert("Not supported yet")
                            return
                            $ui.menu({
                                items: this.actions.map(a => a.displayName ?? a.type),
                                handler: (title, idx) => {
                                    this.insertProcess(idx)
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
}

class SubscriptionEditor extends NodeEditor {
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

    static defaultData = {
        name: "",
        icon: "",
        ua: "",
        source: "remote",
        url: "",
        content: "",
        process: []
    }

    editorName = $l10n("SUBSCRIPTION")

    /**
     *
     * @param {AppKernel} kernel
     * @param {{name: string, icon: string, ua: string, source: string, url: string, content: string}|undefined} editorData
     */
    constructor(kernel, editorData) {
        super(kernel, editorData, SubscriptionEditor.defaultData)
        this.editorData["url&content"] = this.editorData.url ?? this.editorData.content
        this.initSource = SubscriptionEditor.Source[this.editorData.source]
        this.init()
    }

    set(key, value) {
        if (key === "source") {
            if (value === SubscriptionEditor.Source.remote) {
                $(this.setting.getId("url&content")).views[0].views[1].text = $l10n("URL")
            } else {
                $(this.setting.getId("url&content")).views[0].views[1].text = $l10n("CONTENT")
            }
            this.editorData["source"] = SubscriptionEditor.SourceValue(value)
        } else if (key === "url&content") {
            if (this.setting.get("source") === SubscriptionEditor.Source.remote) {
                this.editorData["url"] = value
            } else {
                this.editorData["content"] = value
            }
        } else {
            super.set(key, value)
        }
    }

    get(key, _default = null) {
        if (key === "source") {
            return SubscriptionEditor.Source[this.editorData[key] ?? 0]
        }
        if (key === "url&content") {
            if (this.setting.get("source") === SubscriptionEditor.Source.remote) {
                return this.editorData["url"]
            } else {
                return this.editorData["content"]
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

    async save() {
        delete this.editorData["url&content"]
        const data = super.getData()

        if (this.isNew) {
            await this.kernel.api.addSubscription(data)
        } else {
            await this.kernel.api.updateSubscription(this.originalName, data)
        }
    }
}

class CollectionEditor extends NodeEditor {
    static defaultData = {
        name: "",
        icon: "",
        ua: "",
        subscriptions: [],
        process: []
    }

    editorName = $l10n("COLLECTION")

    /**
     *
     * @param {AppKernel} kernel
     * @param {{name: string, icon: string, ua: string, subscriptions: Array}|undefined} editorData
     */
    constructor(kernel, editorData) {
        super(kernel, editorData, CollectionEditor.defaultData)
        this.editorData["subscriptionsString"] = this.editorData.subscriptions.join(",") ?? ""
        this.init()
    }

    get settingStructure() {
        const settingStructure = super.settingStructure
        settingStructure[0].items.push({
            icon: ["wand.and.stars", "#FF99CC"],
            title: $l10n("SUBSCRIPTION") + " " + $l10n("TIPS"),
            type: "script",
            key: "subscriptionsTips",
            value: "$ui.alert(`使用英文逗号分隔。`)"
        })
        settingStructure[0].items.push({
            icon: ["link", "#FF99CC"],
            title: $l10n("SUBSCRIPTION"),
            type: "string",
            key: "subscriptionsString"
        })
        return settingStructure
    }

    set(key, value) {
        if (key === "subscriptions") {
            this.editorData["subscriptionsString"] = value.subscriptions.join(",")
        } else {
            super.set(key, value)
        }
    }

    get(key, _default = null) {
        if (key === "subscriptions") {
            return this.editorData["subscriptionsString"]?.split(",").map(item => item.trim())
        }

        return super.get(key, _default)
    }

    async save() {
        const subscriptions = this.get("subscriptions")
        delete this.editorData["subscriptionsString"]
        const data = super.getData()
        data.subscriptions = subscriptions

        if (this.isNew) {
            await this.kernel.api.addCollection(data)
        } else {
            await this.kernel.api.updateCollection(this.originalName, data)
        }
    }
}

class ArtifactEditor extends Editor {
    static platforms = {
        items: ["Surge", "QX", "Loon", "Stash", "ShadowRocket", "Clash"],
        values: ["Surge", "QX", "Loon", "Stash", "ShadowRocket", "Clash"]
    }
    static types = {
        items: [$l10n("SUBSCRIPTION"), $l10n("COLLECTION")],
        values: ["subscription", "collection"]
    }

    static defaultData = {
        name: "",
        type: ArtifactEditor.types.values[0], // subscription, collection
        platform: ArtifactEditor.platforms.values[0], // Clash, QX, Surge, Loon, Stash
        source: "",
        sync: false
    }

    editorName = $l10n("SYNC")

    /**
     *
     * @param {AppKernel} kernel
     * @param {Object} editorData
     */
    constructor(kernel, editorData, subscriptions, collections) {
        super(kernel, editorData, ArtifactEditor.defaultData)
        this.subscriptions = subscriptions.map(v => v.name)
        this.collections = collections.map(v => v.name)
        this.init()
        this.editorData.sync = editorData?.sync ?? false
    }

    getSource() {
        const type = this.get("type")
        if (type === ArtifactEditor.types.values[0]) {
            // subscription
            return this.subscriptions
        } else if (type === ArtifactEditor.types.values[1]) {
            // collection
            return this.collections
        }

        return []
    }

    set(key, value) {
        super.set(key, value)

        if (key === "type") {
            // 更改 type 时清空 source
            super.set("source", "")
            $(this.setting.getId("source") + "-label").text = ""
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
                        value: this.editorData.name
                    },
                    {
                        icon: ["photo", "#9966FF"],
                        title: "PLATFORM",
                        type: "menu",
                        key: "platform",
                        items: ArtifactEditor.platforms.items,
                        values: ArtifactEditor.platforms.values,
                        value: this.editorData.platform
                    },
                    {
                        icon: ["photo", "#9966FF"],
                        title: "TYPE",
                        type: "menu",
                        key: "type",
                        items: ArtifactEditor.types.items,
                        values: ArtifactEditor.types.values,
                        value: this.editorData.type
                    },
                    {
                        icon: ["photo", "#9966FF"],
                        title: "SOURCE",
                        type: "menu",
                        key: "source",
                        items: () => this.getSource(),
                        values: () => this.getSource(),
                        value: this.editorData.source
                    }
                ]
            }
        ]
    }

    getListView() {
        return this.setting.getListView()
    }

    async save() {
        if (this.editorData.name === "") {
            throw "Name cannot be empty"
        }
        if (this.editorData.source === "") {
            throw "Source cannot be empty"
        }

        if (this.isNew) {
            await this.kernel.api.addArtifact(this.editorData)
        } else {
            await this.kernel.api.updateArtifact(this.originalName, this.editorData)
        }
    }
}

module.exports = { Editor, SubscriptionEditor, CollectionEditor, ArtifactEditor }
