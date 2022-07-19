const { Action } = require("../action")

class FlagOperator extends Action {
    static height = 100
    static type = "Flag Operator"

    constructor() {
        super(FlagOperator.type)
    }

    getView() {
        return this.createSubView([
            {
                type: "label",
                props: {
                    text: "Hello, World!",
                    align: $align.center
                },
                layout: function (make, view) {
                    make.center.equalTo(view.super)
                },
                events: {
                    tapped: sender => {
                        sender.text = "aaa"
                        this.set(sender, "a", "b")
                        this.set(sender, "q", "q")
                    }
                }
            }
        ])
    }
}

module.exports = FlagOperator
