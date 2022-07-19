const { Action } = require("../action")

class HandleDuplicateOperator extends Action {
    static height = 100
    static type = "Handle Duplicate Operator"
    static displayName = "HandleDuplicateOperator"

    constructor() {
        super(HandleDuplicateOperator.type, HandleDuplicateOperator.displayName)
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

module.exports = HandleDuplicateOperator
