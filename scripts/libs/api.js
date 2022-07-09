class SubStore {
    constructor(baseURL = "") {
        this.baseURL = baseURL
    }

    getCache(key, _default = null) {
        const cache = $cache.get("substore.cache." + key)
        if (cache) {
            return cache
        }
        return _default
    }

    setCache(key, data) {
        if (!data || typeof data !== "string") {
            return
        }
        $cache.set("substore.cache." + key, data)
    }

    removeCache(key) {
        $cache.remove("substore.cache." + key)
    }

    clearCache() {
        $cache.clear()
    }

    async #request(url, method, body = {}) {
        try {
            const resp = await $http.request({
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
            throw new Error("http error: [" + resp.response.statusCode + "] " + resp.data.message)
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

    async addSubscription(body) {
        return await this.requestWithBaseURL("/api/subs", "POST", body)
    }

    async deleteSubscription(name) {
        return await this.requestWithBaseURL("/api/sub/" + name, "DELETE")
    }

    async getCollections() {
        return await this.requestWithBaseURL("/api/collections", "GET")
    }

    async addCollection(body) {
        return await this.requestWithBaseURL("/api/collections", "POST", body)
    }

    async deleteCollection(name) {
        return await this.requestWithBaseURL("/api/collection/" + name, "DELETE")
    }
}

module.exports = { SubStore }
