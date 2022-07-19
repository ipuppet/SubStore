const { Action } = require("../action")

class SortOperator extends Action {
    static height = 100
    static type = "Sort Operator"
    static displayName = "SortOperator"

    constructor() {
        super(SortOperator.type, SortOperator.displayName)
    }

    getView() {
        return this.createSubView([
            {
                type: "view",
                views: [
                    {
                        type: "label",
                        props: {
                            text: "Hello, World!",
                            align: $align.center
                        },
                        layout: $layout.fill
                    }
                ],
                layout: $layout.fill
            }
        ])
    }
}

module.exports = SortOperator
