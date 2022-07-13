const { Sheet, Setting } = require("../libs/easy-jsbox")

/**
 * @typedef {import("../app").AppKernel} AppKernel
 */

class Editor {
    static SOURCE = {
        remote: 0,
        local: 1
    }
    editorContent = {}
    isNew = false

    /**
     * @param {AppKernel} kernel
     */
    constructor(kernel, editorContent = {}, isNew = false) {
        this.kernel = kernel
        this.isNew = isNew
        editorContent["url&content"] = editorContent.url ?? editorContent.content
        this.settingView = new Setting({
            set: (key, value) => this.#set(key, value),
            get: (key, _default = null) => this.#get(key, _default),
            structure: this.settingStructure,
            userData: editorContent
        })
        this.settingView.footer = {}
        this.settingView.loadConfig()
        this.editorContent = this.settingView.setting
    }

    #set(key, value) {
        if (key === "source") {
            if (value === Editor.SOURCE.remote) {
                $(this.settingView.getId("url&content")).views[0].views[1].text = $l10n("URL")
            } else {
                $(this.settingView.getId("url&content")).views[0].views[1].text = $l10n("CONTENT")
            }
            // 根据值反推键名
            const keys = Object.keys(Editor.SOURCE)
            for (let i = 0; i < keys.length; ++i) {
                if (Editor.SOURCE[keys[i]] === value) {
                    this.editorContent["source"] = keys[i]
                    break
                }
            }
        } else if (key === "url&content") {
            if (this.settingView.get("source") === Editor.SOURCE.remote) {
                this.editorContent["url"] = value
            } else {
                this.editorContent["content"] = value
            }
        } else {
            this.editorContent[key] = value
        }
    }

    #get(key, _default = null) {
        if (key === "source") {
            return Editor.SOURCE[this.editorContent[key] ?? 0]
        }
        if (key === "url&content") {
            if (this.settingView.get("source") === Editor.SOURCE.remote) {
                return this.editorContent["url"]
            } else {
                return this.editorContent["content"]
            }
        }
        return this.editorContent[key] ?? _default
    }

    save() {
        this.editorContent
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
                        icon: ["location.fill", "#FFCC33"],
                        title: "SOURCE",
                        type: "tab",
                        key: "source",
                        items: ["REMOTE", "LOCAL"],
                        value: Editor.SOURCE[this.editorContent.source]
                    },
                    {
                        icon: ["link", "#FF99CC"],
                        title: Editor.SOURCE[this.editorContent.source] === 0 ? "URL" : "CONTENT",
                        type: "string",
                        key: "url&content"
                    },
                    {
                        icon: ["person.crop.circle", "#000000"],
                        title: "UA",
                        type: "string",
                        key: "ua"
                    }
                ]
            },
            {
                title: $l10n("COMMON_SETTINGS"),
                items: [
                    {
                        title: "USELESS_NODES",
                        type: "tab",
                        key: "uselessNodes",
                        items: ["RETAIN", "REMOVE"],
                        value: 0
                    },
                    {
                        title: "UDP_RELAY",
                        type: "tab",
                        key: "udpRelay",
                        items: ["DEFAULT", "ENABLE", "DISABLE"],
                        value: 0
                    },
                    {
                        title: "SKIP_TLS_VERIFY",
                        type: "tab",
                        key: "skipTLSVerify",
                        items: ["DEFAULT", "ENABLE", "DISABLE"],
                        value: 0
                    },
                    {
                        title: "TCP_FAST_OPEN",
                        type: "tab",
                        key: "TCPFastOpen",
                        items: ["DEFAULT", "ENABLE", "DISABLE"],
                        value: 0
                    },
                    {
                        title: "VMESS_AEAD",
                        type: "tab",
                        key: "vmessAEAD",
                        items: ["DEFAULT", "ENABLE", "DISABLE"],
                        value: 0
                    }
                ]
            }
        ]
    }

    getListView() {
        const listView = this.settingView.getListView()

        listView.props.data.push({
            title: $l10n("NODE_ACTIONS"),
            rows: [
                {
                    type: "button",
                    props: {
                        title: $l10n("ADD_ACTION")
                    },
                    events: {
                        // TODO 添加节点操作
                        tapped: sender => {
                            $ui.alert("Not support yet")
                        }
                    },
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

module.exports = Editor
