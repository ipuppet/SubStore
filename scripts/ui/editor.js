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

    /**
     * @param {AppKernel} kernel
     */
    constructor(kernel, editorContent = {}) {
        this.kernel = kernel
        this.editorContent = editorContent
        this.settingView = new Setting({
            set: (key, value) => this.#set(key, value),
            get: (key, _default = null) => this.#get(key, _default)
        })
    }

    #set(key, value) {
        if (key === "source") {
            if (value === Editor.SOURCE.remote) {
                $(this.settingView.getId("url&content")).views[0].views[1].text = $l10n("URL")
            } else {
                $(this.settingView.getId("url&content")).views[0].views[1].text = $l10n("CONTENT")
            }
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

    getListView() {
        const listView = this.settingView.getListView(
            [
                {
                    title: "GENERAL",
                    items: [
                        {
                            icon: ["location.fill", "#FF9900"],
                            title: "NAME",
                            type: "input",
                            key: "name",
                            value: this.editorContent.name
                        },
                        {
                            icon: ["location.fill", "#FF9900"],
                            title: "ICON",
                            type: "input",
                            key: "icon",
                            value: this.editorContent.icon
                        },
                        {
                            icon: ["location.fill", "#FF9900"],
                            title: "SOURCE",
                            type: "tab",
                            key: "source",
                            items: ["REMOTE", "LOCAL"],
                            value: Editor.SOURCE[this.editorContent.source]
                        },
                        {
                            icon: ["location.fill", "#FF9900"],
                            title: Editor.SOURCE[this.editorContent.source] === 0 ? "URL" : "CONTENT",
                            type: "string",
                            key: "url&content"
                        },
                        {
                            icon: ["location.fill", "#FF9900"],
                            title: "UA",
                            type: "string",
                            key: "ua"
                        }
                    ]
                }
            ],
            {}
        )

        listView.props.data.push({
            title: $l10n("NODE_ACTIONS"),
            rows: [
                {
                    type: "label",
                    props: {
                        text: "Hello, World!",
                        align: $align.center
                    },
                    layout: function (make, view) {
                        make.center.equalTo(view.super)
                    }
                },
                {
                    type: "button",
                    props: {
                        title: $l10n("ADD_ACTION")
                    },
                    events: {
                        // TODO 添加节点操作
                        tapped: sender => {}
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
                tapped: () => {
                    console.log("aaa")
                }
            }
        })
        sheet.init().present()
    }
}

module.exports = Editor
