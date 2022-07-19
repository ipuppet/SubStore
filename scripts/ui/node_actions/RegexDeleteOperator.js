const { Action } = require("../action")

class RegexDeleteOperator extends Action {
    static height = 100
    static type = "Regex Delete Operator"
    static displayName = "RegexDeleteOperator"

    constructor() {
        super(RegexDeleteOperator.type, RegexDeleteOperator.displayName)
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

module.exports = RegexDeleteOperator
