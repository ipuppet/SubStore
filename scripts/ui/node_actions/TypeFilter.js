const { Action } = require("../action")

class TypeFilter extends Action {
    static height = 100
    static type = "Type Filter"
    static displayName = "TypeFilter"

    constructor() {
        super(TypeFilter.type, TypeFilter.displayName)
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

module.exports = TypeFilter
