const { Action } = require("../action")

class FlagOperator extends Action {
    static height = 100
    static type = "Flag Operator"
    static displayName = "FlagOperator"

    constructor() {
        super(FlagOperator.type, FlagOperator.displayName)
    }

    getView() {
        return this.createSubView([
            {
                type: "tab",
                props: {
                    items: ["Add", "Remove"]
                },
                layout: (make, view) => {
                    make.center.equalTo(view.super)
                },
                events: {
                    ready: sender => {
                        const mode = this.get(sender, "mode")
                        sender.index = mode === "remove" ? 1 : 0
                    },
                    changed: sender => {
                        const mode = sender.index === 0 ? "add" : "remove"
                        this.set(sender, "mode", mode)
                    }
                }
            }
        ])
    }
}

module.exports = FlagOperator
