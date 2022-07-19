const { Action } = require("../action")

class RegexSortOperator extends Action {
    static height = 100
    static type = "Regex Sort Operator"
    static displayName = "RegexSortOperator"

    constructor() {
        super(RegexSortOperator.type, RegexSortOperator.displayName)
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

module.exports = RegexSortOperator
