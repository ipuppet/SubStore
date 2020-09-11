class HomeUI {
    constructor(kernel, factory) {
        this.kernel = kernel
        this.factory = factory
        if (!$file.exists("/assets/dist")) {
            $file.mkdir("/assets/dist")
        }
    }

    async getStaticFiles(html) {
        const remote = "https://sub-store.vercel.app"
        const local = "/assets/dist"
        let list = html.match(/href=\/([^\s>])*[\s|>]/g).concat(html.match(/src=\/([^\s>])*[\s|>]/g))
        for (let path of list) {
            // 格式化链接
            path = path.replace(/(?:[^=]*)=([^\s>]*)[\s|>]/, "$1")
            if (path === "/favicon.ico") continue
            let localPath = local + path
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

    // 检查是否删除旧文件
    static isClearStatics() {
        if (!$cache.get("updateDate")) {
            $cache.set("updateDate", new Date().getTime())
            return false
        }
        if (new Date().getTime() - $cache.get("updateDate") > 1000 * 60 * 60) {
            $cache.set("updateDate", new Date().getTime())
            return true
        }
        return false
    }

    static clearCache() {
        // 删除旧文件
        $file.delete("/assets/dist/css")
        $file.delete("/assets/dist/js")
        $file.delete("/assets/dist/fonts")
    }

    async getViews() {
        if (HomeUI.isClearStatics()) {
            HomeUI.clearCache()
        }
        let request = await $http.get("https://sub-store.vercel.app")
        let html = request.data
        await this.getStaticFiles(html)
        // 更改获取到的html内的链接
        html = html.replace(/href=\//g, "href=local://assets/dist/")
        html = html.replace(/src=\//g, "src=local://assets/dist/")
        return [{
            type: "web",
            props: {
                html: html,
                opaque: false
            },
            layout: (make, view) => {
                make.top.equalTo(view.super.safeAreaTop)
                make.width.equalTo(view.super)
                make.bottom.equalTo(view.super.safeAreaBottom).offset(-50)
            }
        }]
    }
}

module.exports = HomeUI