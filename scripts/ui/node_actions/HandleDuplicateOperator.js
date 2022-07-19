const { Action } = require("../action")

class HandleDuplicateOperator extends Action {
    static height = 100
    static type = "Handle Duplicate Operator"
    static displayName = "HandleDuplicateOperator"

    constructor() {
        super(HandleDuplicateOperator.type, HandleDuplicateOperator.displayName)
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

module.exports = HandleDuplicateOperator
