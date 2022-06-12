const { UIKit } = require("../libs/easy-jsbox")

class HomeUI {
    constructor(kernel, factory) {
        this.kernel = kernel
        this.factory = factory
        this.htmlPath = "storage/dist"
        this.nowDownload = ""
        this.isLoaded = false
    }

    /**
     * 获取页面需要的静态文件
     * @param {String} html 
     */
    async getStaticFiles(html) {
        const remote = "https://sub-store.vercel.app"
        const list = html.match(/href=\/([^\s>])*[\s|>]/g).concat(html.match(/src=\/([^\s>])*[\s|>]/g))
        this.staticLength = list.length
        for (let path of list) {
            // 格式化链接
            path = path.replace(/(?:[^=]*)=([^\s>]*)[\s|>]/, "$1")
            if (path === "/favicon.ico") continue
            this.nowDownload = path.slice(path.indexOf("/", 1) + 1)
            const localPath = this.htmlPath + path
            // 文件夹不存在则创建文件夹
            const dir = localPath.slice(0, localPath.lastIndexOf("/"))
            if (!$file.exists(dir)) $file.mkdir(dir)
            // 获取信息
            const content = await $http.get(remote + path)
            const file = path.slice(path.lastIndexOf("/") + 1)
            // 替换接口
            const api = this.kernel.setting.get("advanced.api")
            if (api !== "https://sub.store" && api !== "") {
                // 检查是不是 appxxxx.js
                if (/^app\.([^\.]*).js$/.test(file)) {
                    content.data = content.data.replace("https://sub.store", api)
                }
            }
            // 保存fonts
            if (/^chunk\-vendors\.([^\.]*).css$/.test(file)) {
                let fonts = content.data.match(/\.\.\/fonts\/([^\)]*\))/g)
                if (!$file.exists(this.htmlPath + "/fonts")) $file.mkdir(this.htmlPath + "/fonts")
                for (let font of fonts) {
                    font = font.replace(/\.\.([^\)]*)\)/, "$1")
                    let contentFont = await $http.download(remote + font)
                    // 保存文件
                    $file.write({
                        data: contentFont.data,
                        path: `${this.htmlPath}${font}`
                    })
                }
            }
            // 保存文件
            $file.write({
                data: $data({ string: content.data }),
                path: localPath
            })
        }
    }

    /**
     * 获取页面html
     */
    async getIndexHtml() {
        if (!$file.exists(this.htmlPath)) {
            $file.mkdir(this.htmlPath)
        }
        let html = ""
        if (!$file.exists(`${this.htmlPath}/index.html`) || !this.isCacheValidity()) {
            const request = await $http.get("https://sub-store.vercel.app")
            html = request.data
            // 清除旧文件
            this.clearCache()
            // 获取静态文件
            await this.getStaticFiles(html)
            // 更改获取到的html内的链接
            html = html.replace(/href=\//g, `href=local://${this.htmlPath}/`)
            html = html.replace(/src=\//g, `src=local://${this.htmlPath}/`)
            $file.write({
                data: $data({ string: html }),
                path: `${this.htmlPath}/index.html`
            })
            $cache.set("updateDate", Date.now())
        } else {
            html = $file.read(`${this.htmlPath}/index.html`).string
        }
        return html
    }

    /**
     * 判断缓存是否有效
     */
    isCacheValidity() {
        const cacheLife = 1000 * 60 * 60 * 60 * Number(this.kernel.setting.get("advanced.cacheLife"))
        if ((Date.now() - Number($cache.get("updateDate") ?? 0)) < cacheLife) {
            return true
        }
        return false
    }

    /**
     * 清除缓存
     */
    clearCache() {
        // 删除旧文件
        $file.delete(this.htmlPath)
    }

    async getView() {
        const html = await this.getIndexHtml()
        this.isLoaded = true
        return {
            type: "web",
            props: {
                html: html,
                showsProgress: false,
                allowsLinkPreview: true,
                allowsNavigation: false,
                script: () => {
                    function createNode(string) {
                        const template = `<div class='child'>${string}</div>`
                        let tempNode = document.createElement('div')
                        tempNode.innerHTML = template
                        return tempNode.firstChild
                    }
                    const jsboxSettingTemplate = `<div style="position: absolute;right: 15px;top: 20px;font-size:14px;"><span>JSBox</span></div>`
                    let node = createNode(jsboxSettingTemplate)
                    node.onclick = () => {
                        $notify("jsboxSetting")
                    }
                    document.querySelector(".v-toolbar__content").appendChild(node)
                }
            },
            events: {
                jsboxSetting: () => {
                    UIKit.push({
                        views: [this.kernel.setting.getListView()],
                        title: $l10n("JSBOX_SETTING"),
                        topOffset: false
                    })
                }
            },
            layout: $layout.fill
        }
    }
}

module.exports = HomeUI