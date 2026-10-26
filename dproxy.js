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
        const arrKeys = fullKey.slice(1).split('.');
        let [key, keys] = [arrKeys.pop(), arrKeys];
        const obj = keys.reduce((o, k) => {
            return o[k];
        }, this);
        return obj[key];
    };

    const merge = function(obj, pobj, robj) {
        pobj = pobj ?? this.p;
        robj = robj ?? this.r;
        //console.log('BIGMERGE', obj, pobj, robj);
        for (let key in obj) {
            //console.log('MERGE CMP', robj, key, robj[key]);
            //console.log('MERGE CMP', key, pobj[key]);
            if (robj == this.r) pobj[key];
            if (robj[key] === undefined) continue;
            //console.log('MERGE', obj, typeof obj[key], pobj, robj, key);
            if (typeof obj[key] == 'object') {
                //console.log('MERGE IN', obj[key], pobj[key], robj[key]);
                merge(obj[key], pobj[key], robj[key]);
                //console.log('MERGE BACK', obj, robj, key);
            } else {
                //console.log('MERGE SET', key, obj[key]);
                pobj[key] = obj[key];
            }
        }
        //console.log('MERGE EXIT', obj, robj);
    };
    
    // Generic proxy handler
    const handler = {
        get(obj, key, _) {
            //console.log('get', obj, key, obj[key]);
            //console.log('get', obj, _this.mainObject);
            
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
            if (key == 'forEach' && Object.keys(obj).every(n=>!isNaN(n))) {
                return Object.values(obj).forEach;
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
            // console.log('set', obj, key, val);
            if (obj.__isProxy) {
                obj[key] = val;
            } else {
                _this.callback(_this.fullKey+'.'+key, val, obj);
                obj[key] = val;
            }
        }
    };
    
    _this.callback = callback;
    _this.fullKey = '';
    _this.mainObject = obj;
    _this.mainProxy = new Proxy(obj, handler);
    return _this.mainProxy;
}


