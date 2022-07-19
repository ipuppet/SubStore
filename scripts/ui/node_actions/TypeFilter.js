const { Action } = require("../action")

class TypeFilter extends Action {
    static height = 100
    static type = "Type Filter"
    static displayName = "TypeFilter"

    constructor() {
        super(TypeFilter.type, TypeFilter.displayName)
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

module.exports = TypeFilter
