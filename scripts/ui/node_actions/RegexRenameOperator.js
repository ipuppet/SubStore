const { Action } = require("../action")

class RegexRenameOperator extends Action {
    static height = 100
    static type = "Regex Rename Operator"
    static displayName = "RegexRenameOperator"

    constructor() {
        super(RegexRenameOperator.type, RegexRenameOperator.displayName)
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

module.exports = RegexRenameOperator
