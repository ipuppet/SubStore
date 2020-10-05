class HomeUI {
    constructor(kernel, factory) {
        this.kernel = kernel
        this.factory = factory
        if (!$file.exists("/assets/dist")) {
            $file.mkdir("/assets/dist")
        }
    }

    /**
     * 获取页面需要的静态文件
     * @param {String} html 
     */
    async getStaticFiles(html) {
        const remote = "https://sub-store.vercel.app"
        const local = "/assets/dist"
        let list = html.match(/href=\/([^\s>])*[\s|>]/g).concat(html.match(/src=\/([^\s>])*[\s|>]/g))
        for (let path of list) {
            // 格式化链接
            path = path.replace(/(?:[^=]*)=([^\s>]*)[\s|>]/, "$1")
            if (path === "/favicon.ico") continue
            let localPath = local + path
            // 目录不存在则从网络获取，存在则无事发生
            if (!$file.exists(localPath)) {
                // 文件夹不存在则创建文件夹
                let dir = localPath.slice(0, localPath.lastIndexOf("/"))
                if (!$file.exists(dir)) $file.mkdir(dir)
                // 获取信息
                let content = await $http.get(remote + path)
                let file = path.slice(path.lastIndexOf("/") + 1)
                // 检查是不是QX
                if (this.kernel.setting.get("advanced.environment") === 0) {
                    // 检查是不是 appxxxx.js
                    if (/^app\.([^\.]*).js$/.test(file)) {
                        content.data = content.data.replace("https://sub.store", "http://localhost:9999")
                    }
                }
                // 保存fonts
                if (/^chunk\-vendors\.([^\.]*).css$/.test(file)) {
                    let fonts = content.data.match(/\.\.\/fonts\/([^\)]*\))/g)
                    if (!$file.exists(local + "/fonts")) $file.mkdir(local + "/fonts")
                    for (let font of fonts) {
                        font = font.replace(/\.\.([^\)]*)\)/, "$1")
                        let contentFont = await $http.download(remote + font)
                        // 保存文件
                        $file.write({
                            data: contentFont.data,
                            path: `${local}${font}`
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
    }

    /**
     * 获取页面html
     */
    async getIndexHtml() {
        let html
        if (!$file.exists("/assets/dist/index.html")) {
            let request = await $http.get("https://sub-store.vercel.app")
            $file.write({
                data: $data({ string: request.data }),
                path: "/assets/dist/index.html"
            })
            html = request.data
        } else {
            html = $file.read("/assets/dist/index.html").string
        }
        // 获取静态文件
        await this.getStaticFiles(html)
        // 更改获取到的html内的链接
        html = html.replace(/href=\//g, "href=local://assets/dist/")
        html = html.replace(/src=\//g, "src=local://assets/dist/")
        return html
    }

    /**
     * 检查缓存是否过期
     */
    isClearStatics() {
        if (!$cache.get("updateDate")) {
            $cache.set("updateDate", new Date().getTime())
            return false
        }
        if (new Date().getTime() - $cache.get("updateDate") > 1000 * 60 * 60 * 60 * this.kernel.setting.get("advanced.cacheLife")) {
            $cache.set("updateDate", new Date().getTime())
            return true
        }
        return false
    }

    /**
     * 清除缓存
     */
    static clearCache() {
        // 删除旧文件
        $file.delete("/assets/dist/css")
        $file.delete("/assets/dist/js")
        $file.delete("/assets/dist/fonts")
        $file.delete("/assets/dist/index.html")
    }

    async getView() {
        let html = await this.getIndexHtml()
        return {
            type: "web",
            props: {
                html: html,
                opaque: false,
                allowsNavigation: false,
                script: () => {
                    function createNode(string) {
                        const template = `<div class='child'>${string}</div>`
                        let tempNode = document.createElement('div')
                        tempNode.innerHTML = template
                        return tempNode.firstChild
                    }
                    let index = document.querySelector(".v-list--dense").childElementCount
                    let item = `<div tabindex="${index}" class="v-list-item v-list-item--link theme--dark"><div class="v-list-item__action"><i aria-hidden="true" class="v-icon notranslate material-icons theme--dark">settings</i></div><div class="v-list-item__content"><div class="v-list-item__title">JSBox Setting</div></div></div>`
                    let node = createNode(item)
                    node.onclick = () => {
                        $notify("jsboxSetting")
                    }
                    document.querySelector(".v-list--dense").append(node)
                }
            },
            events: {
                jsboxSetting: () => {
                    this.factory.setting()
                }
            },
            layout: $layout.fill
        }
    }
}

module.exports = HomeUI