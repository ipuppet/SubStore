const { Request } = require("./easy-jsbox")

class SubStore extends Request {
    constructor(baseUrl = "") {
        super()
        this.baseUrl = baseUrl
        this.clearCache()
    }

    async request(url, method, body = {}) {
        return await super.request(url, method, body, {
            "User-Agent": "Quantumult%20X/1.0.30 (iPhone14,2; iOS 15.6)"
        })
    }

    async requestWithBaseURL(path, method, body = {}) {
        const url = this.baseUrl + path
        const resp = await this.request(url, method, body)
        if (resp?.data?.status !== "success") {
            this.removeCache(this.getCacheKey(url))
            throw new Error(`${method} ${url} [${resp.response.statusCode}] ${resp.data}`)
        }
        return resp.data.data
    }

    async getUsage(url) {
        const cache = this.getCache(url)
        if (cache) {
            return JSON.parse(cache)
        }
        const resp = await this.request(url, Request.method.head)
        const infoObj = {}
        const info = resp?.response?.headers["subscription-userinfo"]
        info?.split(";")?.forEach(item => {
            item = item.trim()
            if (item !== "") {
                const kv = item.split("=")
                infoObj[kv[0]] = kv[1]
            }
        })
        this.setCache(url, JSON.stringify(infoObj))
        return infoObj
    }

    async getSubscriptions() {
        return await this.requestWithBaseURL("/api/subs", Request.method.get)
    }

    async getSubscription(name) {
        return await this.requestWithBaseURL("/api/sub/" + name, Request.method.get)
    }

    async addSubscription(body) {
        return await this.requestWithBaseURL("/api/subs", Request.method.post, body)
    }

    async updateSubscription(name, body) {
        return await this.requestWithBaseURL("/api/sub/" + name, Request.method.patch, body)
    }

    async deleteSubscription(name) {
        return await this.requestWithBaseURL("/api/sub/" + name, Request.method.delete)
    }

    async getCollections() {
        return await this.requestWithBaseURL("/api/collections", Request.method.get)
    }

    async getCollection(name) {
        const collections = await this.getCollections()
        for (let i = 0; i < collections.length; i++) {
            const element = collections[i]
            if (element.name === name) {
                return element
            }
        }
        throw `Collection '${name}' Not Found`
    }

    async addCollection(body) {
        return await this.requestWithBaseURL("/api/collections", Request.method.post, body)
    }

    async updateCollection(name, body) {
        return await this.requestWithBaseURL("/api/collection/" + name, Request.method.patch, body)
    }

    async deleteCollection(name) {
        return await this.requestWithBaseURL("/api/collection/" + name, Request.method.delete)
    }

    async preview(body, type = "sub") {
        return await this.requestWithBaseURL("/api/preview/" + type, Request.method.post, body)
    }

    async getArtifacts() {
        return await this.requestWithBaseURL("/api/artifacts", Request.method.get)
    }

    async deleteArtifact(name) {
        return await this.requestWithBaseURL("/api/artifact/" + name, Request.method.delete)
    }

    async addArtifact(body) {
        return await this.requestWithBaseURL("/api/artifacts", Request.method.post, body)
    }

    async updateArtifact(name, body) {
        return await this.requestWithBaseURL("/api/artifact/" + name, Request.method.patch, body)
    }
}

module.exports = { SubStore }
