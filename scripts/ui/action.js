const { Editor } = require("./editor")

class MultiSelectionForm {
    id = $text.uuid
    fontSize = 18
    fontHeight = $text.sizeThatFits({
        text: "A",
        width: this.fontSize,
        font: $font(this.fontSize)
    }).height
    circleSize = this.fontHeight / 2
    spacing = 10
    columns = 2

    static getHeight(items, columns = 2, spacing = 10, fontSize = 18) {
        const fontHeight = $text.sizeThatFits({
            text: "A",
            width: fontSize,
            font: $font(fontSize)
        }).height
        return Math.ceil(items.length / columns) * (fontHeight + spacing)
    }

    constructor(items, events) {
        this.items = items
        this.events = events
    }

    selectItems(items) {
        const sender = $(this.id)
        const dataMap = {}
        sender.data.forEach(item => {
            dataMap[item.label?.text] = item
        })
        items.forEach(item => {
            dataMap[item] = this.itemToData(item, true)
        })
        sender.data = Object.values(dataMap)
    }

    itemToData(item, select = false) {
        return {
            label: { text: item },
            select: { borderWidth: select ? this.circleSize / 3.5 : 1 }
        }
    }

    getView() {
        if (this.events.didSelect) {
            const oldDidSelect = this.events.didSelect
            this.events.didSelect = (sender, indexPath, data) => {
                const i = indexPath.item
                const all = sender.data
                if (all[i].select.borderWidth === 1) {
                    all[i].select.borderWidth = this.circleSize / 3.5
                } else {
                    all[i].select.borderWidth = 1
                }
                sender.data = all

                const selected = sender.data
                    .filter(item => {
                        if (item.select?.borderWidth !== 1) {
                            return true
                        }
                        return false
                    })
                    .map(item => item.label.text)

                oldDidSelect(sender, indexPath, data, selected)
            }
        }

        return {
            type: "matrix",
            props: {
                id: this.id,
                columns: this.columns,
                itemHeight: this.fontHeight,
                spacing: this.spacing,
                data: this.items.map(item => this.itemToData(item)),
                template: {
                    views: [
                        {
                            type: "view",
                            props: {
                                id: "select",
                                circular: true,
                                bgcolor: $color("clear"),
                                borderColor: $color("primaryText")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.left.inset(5)
                                make.size.equalTo($size(this.circleSize, this.circleSize))
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "label",
                                font: $font(this.fontSize)
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.left.inset(10 + this.circleSize)
                            }
                        }
                    ]
                }
            },
            layout: (make, view) => {
                make.size.equalTo(view.super)
                make.center.equalTo(view.super)
            },
            events: this.events
        }
    }
}

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

    #getListInfoPointer(sender) {
        let p = sender
        let max = 1000
        while (max && p !== undefined && p.id !== this.type) {
            --max
            p = p.super
        }
        return p
    }

    ready(ready) {
        return sender => {
            if (this.#getListInfoPointer(sender).hidden) {
                return
            }
            ready(sender)
        }
    }

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    set(sender, value) {
        const p = this.#getListInfoPointer(sender)

        if (p) {
            const rowInfo = p.info
            const listInfo = $(Editor.listId).info
            listInfo.process[rowInfo.uuid].args = value
            $(Editor.listId).info = listInfo
        }
    }

    get(sender, _default = null) {
        const p = this.#getListInfoPointer(sender)

        if (p) {
            const rowInfo = p.info
            const listInfo = $(Editor.listId).info
            return listInfo.process[rowInfo?.uuid]?.args ?? _default
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
    // TODO 节点操作
    const allownProcess = ["FlagOperator", "TypeFilter", "SortOperator"]
    if (actions.length === 0) {
        const list = allownProcess //$file.list("scripts/ui/node_actions") ?? []
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

module.exports = { Action, getActions, MultiSelectionForm }
