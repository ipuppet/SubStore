const { Setting } = require("../../libs/easy-jsbox")

class Action {
    /**
     * @type {string}
     */
    name = ""

    data = {}

    constructor(data) {
        this.data = data
    }

    initSetting() {
        this.setting = new Setting({
            set: (key, value) => this.set(key, value),
            get: (key, _default = null) => this.get(key, _default),
            structure: this.settingStructure,
            userData: this.data
        })
        this.setting.footer = {}
        this.setting.loadConfig()

        this.data = this.setting.setting
    }

    set(key, value) {
        this.data[key] = value
    }

    get(key, _default = null) {
        return this.data[key] ?? _default
    }

    get settingStructure() {
        return []
    }
}

module.exports = Action
