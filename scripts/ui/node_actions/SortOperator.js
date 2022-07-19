const { Action } = require("../action")

class SortOperator extends Action {
    static height = 100
    static type = "Sort Operator"
    static displayName = "SortOperator"

    constructor() {
        super(SortOperator.type, SortOperator.displayName)
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

module.exports = SortOperator
