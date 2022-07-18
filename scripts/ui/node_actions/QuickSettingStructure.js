const Action = require("./action")

class QuickSettingStructure extends Action {
    constructor(data) {
        super(data)
        this.name = "Quick Setting Operator"
        this.initSetting()
    }

    get settingStructure() {
        const Items = ["DEFAULT", "ENABLE", "DISABLE"]
        const Args = ["DEFAULT", "ENABLED", "DISABLED"]

        const quickSetting = (title, key) => ({
            title,
            key,
            type: "tab",
            items: Items,
            values: Args,
            value: Args[0]
        })

        return [
            {
                items: [
                    {
                        title: "USELESS_NODES",
                        type: "tab",
                        key: "useless",
                        items: ["RETAIN", "REMOVE"],
                        values: ["DISABLED", "ENABLED"],
                        value: "DISABLED"
                    },
                    quickSetting("UDP_RELAY", "udp"),
                    quickSetting("SKIP_TLS_VERIFY", "scert"),
                    quickSetting("TCP_FAST_OPEN", "tfo"),
                    quickSetting("VMESS_AEAD", "vmess aead")
                ]
            }
        ]
    }

    getView() {
        //const view = this.setting.getListView()
        const view = {
            type: "view",
            props: {
                info: {
                    rowHeight: 200
                }
            },
            views: [
                {
                    type: "label",
                    props: {
                        bgcolor: $color("red"),
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

        return view
    }
}

module.exports = QuickSettingStructure
