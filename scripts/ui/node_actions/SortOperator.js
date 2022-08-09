const { Action } = require("../action")

class SortOperator extends Action {
    static height = 100
    static type = "Sort Operator"
    static displayName = $l10n("SortOperator")

    constructor() {
        super(SortOperator.type, SortOperator.displayName)
    }

    getView() {
        return this.createSubView([
            {
                type: "tab",
                props: {
                    items: [$l10n("ASCENDING"), $l10n("DESCENDING"), $l10n("RANDOM")]
                },
                layout: (make, view) => {
                    make.center.equalTo(view.super)
                },
                events: {
                    ready: this.ready(sender => {
                        let args
                        switch (this.get(sender)) {
                            case "asc":
                                args = 0
                                break
                            case "desc":
                                args = 1
                                break
                            case "random":
                                args = 2
                                break
                            default:
                                break
                        }
                        sender.index = args
                    }),
                    changed: sender => {
                        let args
                        switch (sender.index) {
                            case 0:
                                args = "asc"
                                break
                            case 1:
                                args = "desc"
                                break
                            case 2:
                                args = "random"
                                break
                            default:
                                break
                        }
                        this.set(sender, args)
                    }
                }
            }
        ])
    }
}

module.exports = SortOperator
