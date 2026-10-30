function DProxy(obj, callback) {
    const _this = this;

    const set = function(fullKey, val) {
        const arrKeys = fullKey.slice(1).split('.');
        let [key, keys] = [arrKeys.pop(), arrKeys];
        const obj = keys.reduce((o, k) => {
            return o[k];
        }, this);
        obj[key] = val;
    };

    const get = function(fullKey) {
        if (fullKey == '') return this;
        if (fullKey == '.') return this;
        const arrKeys = fullKey.slice(1).split('.');
        let [key, keys] = [arrKeys.pop(), arrKeys];
        const obj = keys.reduce((o, k) => {
            return o[k];
        }, this);
        return obj[key];
    };

    const merge = function(obj, pobj, robj, bkey = '') {
        pobj = pobj ?? this.p;
        robj = robj ?? this.r;
        for (let key in obj) {
            if (robj == this.r) pobj[key]; // force a get
            if (robj[key] === undefined) continue;
            if (typeof obj[key] == 'object') {
                merge(obj[key], pobj[key], robj[key], bkey+'.'+key);
            } else {
                _this.fullKey = bkey;
                pobj[key] = obj[key];
            }
        }
    };
    
    // Generic proxy handler
    const handler = {
        get(obj, key, _) {
            // return the background real object
            if (obj == _this.mainObject && key == '_object') {
                return _this.mainObject;
            }
            // Special function set
            if (obj == _this.mainObject && key == 'set') {
                return set.bind(_this.mainProxy);
            }
            if (obj == _this.mainObject && key == 'get') {
                return get.bind(_this.mainProxy);
            }
            // Special function merge
            if (obj == _this.mainObject && key == 'merge') {
                return merge.bind({p: _this.mainProxy, r: _this.mainObject});
            }
            // Ask if it is a Proxy, return always true
            if (key == '__isProxy') return true;
            
            // clear fullKey because is the start of the chain of keys
            if (obj == _this.mainObject) _this.fullKey = '';
            
            // simulate array
            if (Object.getOwnPropertyNames(Array.prototype).includes(key) 
                && Object.keys(obj).every(n=>!isNaN(n))) {
                return Object.values(obj)[key];
            }

            // it is an object so I return a Proxy
            if (typeof obj[key] == 'object') {
                _this.fullKey += '.'+key;
                return new Proxy(obj[key], handler);
            }
            // clear fullKey because is the end of the chain of keys
            _this.fullKey = '';
            // default action
            return obj[key];
        },
        set(obj, key, val) {
            if (obj.__isProxy) {
                obj[key] = val;
            } else {
                obj[key] = val;
                _this.callback(_this.fullKey+'.'+key, val, obj);
            }
        }
    };
    
    _this.callback = callback;
    _this.fullKey = '';
    _this.mainObject = obj;
    _this.mainProxy = new Proxy(obj, handler);
    return _this.mainProxy;
}


