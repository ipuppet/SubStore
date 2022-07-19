const { Action } = require("../action")

class RegexRenameOperator extends Action {
    static height = 100
    static type = "Regex Rename Operator"

    constructor(data) {
        super(RegexRenameOperator.type, data)
    }

    getView() {
        return {
            type: "view",
            views: [
                {
                    type: "label",
                    props: {
                        text: "Hello, World!",
                        align: $align.center
                    },
                    layout: function (make, view) {
                        make.center.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

module.exports = RegexRenameOperator
