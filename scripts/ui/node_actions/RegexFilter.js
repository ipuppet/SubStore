const { Action } = require("../action")

class RegexFilter extends Action {
    static height = 100
    static type = "RegexFilter"

    constructor(data) {
        super(RegexFilter.type, data)
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

module.exports = RegexFilter
