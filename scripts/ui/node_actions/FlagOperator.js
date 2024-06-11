const { Action } = require("../action")

class FlagOperator extends Action {
    static height = 180
    static type = "Flag Operator"
    static displayName = $l10n("FlagOperator")

    constructor() {
        super(FlagOperator.type, FlagOperator.displayName)
    }

    getView() {
        return this.createSubView([
            {
                type: "label",
                props: {
                    text: $l10n("work-mode"),
                    color: $color("secondaryText")
                },
                layout: make => {
                    make.left.top.inset(10)
                }
            },
            {
                type: "tab",
                props: {
                    items: [$l10n("ADD"), $l10n("REMOVE")]
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10)
                    make.centerX.equalTo(view.super)
                },
                events: {
                    ready: this.ready(sender => {
                        const mode = this.get(sender).mode
                        sender.index = mode === "remove" ? 1 : 0
                    }),
                    changed: sender => {
                        const mode = sender.index === 0 ? "add" : "remove"
                        this.set(sender, { mode })
                    }
                }
            },
            {
                type: "label",
                props: {
                    text: "Taiwan",
                    color: $color("secondaryText")
                },
                layout: (make, view) => {
                    make.left.inset(10)
                    make.top.equalTo(view.prev.bottom).offset(20)
                }
            },
            {
                type: "tab",
                props: {
                    items: [$l10n("🇨🇳"), $l10n("🇼🇸"), $l10n("-")]
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10)
                    make.centerX.equalTo(view.super)
                },
                events: {
                    ready: this.ready(sender => {
                        let tw = this.get(sender).tw ?? "tw"
                        switch (tw) {
                            case "cn":
                                tw = 0
                                break
                            case "ws":
                                tw = 1
                                break
                            case "tw":
                                tw = 2
                                break
                        }
                        sender.index = tw
                    }),
                    changed: sender => {
                        let tw = ""
                        switch (sender.index) {
                            case 0:
                                tw = "cn"
                                break
                            case 1:
                                tw = "ws"
                                break
                            case 2:
                                tw = "tw"
                                break
                        }
                        this.set(sender, { tw })
                    }
                }
            }
        ])
    }
}

module.exports = FlagOperator
