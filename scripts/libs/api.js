class SubStore {
    constructor(baseURL = "") {
        this.baseURL = baseURL
    }

    static get cache() {
        return $cache.get("substore.cache") ?? {}
    }

    getCache(key, _default = null) {
        const cache = SubStore.cache
        return cache[key] ?? _default
    }

    setCache(key, data) {
        if (!data || typeof data !== "string") {
            return
        }
        const cache = SubStore.cache
        cache[key] = data
        $cache.set("substore.cache", cache)
    }

    clearCache() {
        $cache.remove("substore.cache")
    }

    async #request(url, method, body = {}) {
        try {
            const resp = await $http.request({
                header: {
                    "User-Agent": "Quantumult%20X/1.0.30 (iPhone14,2; iOS 15.6)"
                },
                url,
                method,
                body
            })
            if (resp?.response?.statusCode >= 400) {
                throw new Error("http error: [" + resp.response.statusCode + "] " + resp.data.message)
            }
            return resp
        } catch (error) {
            if (error.code) {
                throw new Error("network error: [" + error.code + "] " + error.localizedDescription)
            } else {
                throw error
            }
        }
    }

    async requestWithBaseURL(path, method, body = {}) {
        const resp = await this.#request(this.baseURL + path, method, body)
        if (resp?.data?.status !== "success") {
            throw new Error(`${method} ${this.baseURL + path} [${resp.response.statusCode}] ${resp.data}`)
        }
        return resp.data.data
    }

    async getUsage(url) {
        const cache = this.getCache(url)
        if (cache) {
            return JSON.parse(cache)
        }
        const resp = await this.#request(url, "HEAD")
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
        return await this.requestWithBaseURL("/api/subs", "GET")
    }

    async getSubscription(name) {
        return await this.requestWithBaseURL("/api/sub/" + name, "GET")
    }

    async addSubscription(body) {
        return await this.requestWithBaseURL("/api/subs", "POST", body)
    }

    async updateSubscription(name, body) {
        return await this.requestWithBaseURL("/api/sub/" + name, "PATCH", body)
    }

    async deleteSubscription(name) {
        return await this.requestWithBaseURL("/api/sub/" + name, "DELETE")
    }

    async getCollections() {
        return await this.requestWithBaseURL("/api/collections", "GET")
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
        return await this.requestWithBaseURL("/api/collections", "POST", body)
    }

    async updateCollection(name, body) {
        return await this.requestWithBaseURL("/api/collection/" + name, "PATCH", body)
    }

    async deleteCollection(name) {
        return await this.requestWithBaseURL("/api/collection/" + name, "DELETE")
    }

    async preview(body, type = "sub") {
        return await this.requestWithBaseURL("/api/preview/" + type, "POST", body)
    }

    async getArtifacts() {
        return await this.requestWithBaseURL("/api/artifacts", "GET")
    }

    async deleteArtifact(name) {
        return await this.requestWithBaseURL("/api/artifact/" + name, "DELETE")
    }
}

module.exports = { SubStore }
