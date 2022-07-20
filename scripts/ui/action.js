const { Editor } = require("./editor")

class Action {
    static offset = 10
    static titleFontSize = 16
    static titleHeight = $text.sizeThatFits({
        text: "A",
        width: this.titleFontSize,
        font: $font(this.titleFontSize)
    }).height
    static titleBarheight = this.offset + this.titleHeight

    /**
     * @type {string}
     */
    type = ""
    /**
     * @type {string}
     */
    displayName = ""

    data = {}

    constructor(type, displayName) {
        this.type = type
        this.displayName = displayName
    }

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    set(sender, key, value) {
        let p = sender
        let max = 1000
        while (max && p !== undefined && p.id !== this.type) {
            --max
            p = p.super
        }

        if (p) {
            const rowInfo = p.info
            const listInfo = $(Editor.listId).info
            listInfo.process[rowInfo.uuid].args[key] = value
            $(Editor.listId).info = listInfo
        }
    }

    get(sender, key, _default = null) {
        let p = sender
        let max = 1000
        while (max && p !== undefined && p.id !== this.type) {
            --max
            p = p.super
        }

        if (p) {
            const rowInfo = p.info
            const listInfo = $(Editor.listId).info
            return listInfo.process[rowInfo?.uuid]?.args[key] ?? _default
        }

        return _default
    }

    createSubView(views) {
        return {
            type: "view",
            views: views,
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(Action.offset / 2)
                make.width.equalTo(view.super)
                make.height.equalTo(view.super).offset(-Action.titleBarheight)
            }
        }
    }

    getTemplate() {
        const subView = this.getView()

        return {
            type: "view",
            props: {
                selectable: false,
                hidden: true,
                id: this.type
            },
            views: [
                {
                    type: "label",
                    props: {
                        text: this.displayName ?? this.type,
                        font: $font(Action.titleFontSize)
                    },
                    layout: (make, view) => {
                        make.top.left.inset(0)
                    }
                },
                {
                    type: "view",
                    props: {
                        bgcolor: $color("separatorColor")
                    },
                    layout: (make, view) => {
                        make.top.equalTo(view.prev.bottom).offset(Action.offset / 2)
                        make.width.equalTo(view.super)
                        make.height.equalTo(1)
                    }
                },
                subView
            ],
            layout: make => {
                make.edges.inset(Action.offset)
            }
        }
    }
}

const actions = []
function getActions() {
    if (actions.length === 0) {
        const list = $file.list("scripts/ui/node_actions") ?? []
        list.forEach(action => {
            action = action.replace(".js", "")
            const Class = require("./node_actions/" + action)
            actions.push({
                type: Class.type,
                displayName: Class.displayName,
                class: Class
            })
        })
    }

    return actions
}

module.exports = { Action, getActions }
