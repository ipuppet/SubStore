const { Action } = require("../action")

class RegionFilter extends Action {
    static height = 100
    static type = "Region Filter"
    static displayName = "RegionFilter"

    constructor() {
        super(RegionFilter.type, RegionFilter.displayName)
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

module.exports = RegionFilter
