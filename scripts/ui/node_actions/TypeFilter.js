const { Action, MultiSelectionForm } = require("../action")

class TypeFilter extends Action {
    static type = "Type Filter"
    static displayName = "TypeFilter"

    static types = ["vmess", "ssr", "ss", "trojan", "vless", "http", "snell", "socks5"]
    static height = MultiSelectionForm.getHeight(TypeFilter.types)

    constructor() {
        super(TypeFilter.type, TypeFilter.displayName)
    }

    getView() {
        const form = new MultiSelectionForm(TypeFilter.types, {
            ready: this.ready(sender => {
                const args = this.get(sender, [])
                form.selectItems(args)
            }),
            didSelect: (sender, indexPath, data, selected) => {
                this.set(sender, selected)
            }
        })

        return this.createSubView([form.getView()])
    }
}

module.exports = TypeFilter
