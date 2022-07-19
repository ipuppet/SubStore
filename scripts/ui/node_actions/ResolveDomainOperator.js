const { Action } = require("../action")

class ResolveDomainOperator extends Action {
    static height = 100
    static type = "Resolve Domain Operator"
    static displayName = "ResolveDomainOperator"

    constructor() {
        super(ResolveDomainOperator.type, ResolveDomainOperator.displayName)
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

module.exports = ResolveDomainOperator
