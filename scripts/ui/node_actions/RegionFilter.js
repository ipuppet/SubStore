const { Action } = require("../action")

class RegionFilter extends Action {
    static height = 100
    static type = "Region Filter"
    static displayName = "RegionFilter"

    constructor() {
        super(RegionFilter.type, RegionFilter.displayName)
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

module.exports = RegionFilter
