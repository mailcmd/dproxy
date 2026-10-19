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

    const merge = function(obj, robj) {
        robj = robj ?? this;
        // console.log('MERGE', obj, robj);
        for (let key in obj) {
            if (typeof obj[key] == 'object') {
                merge(obj[key], robj[key]);
            } else {
                robj[key] = obj[key];
            }
        }
    };
    
    // Generic proxy handler
    const handler = {
        get(obj, key, _) {
            // console.log('get', obj, key, obj[key]);
            if (obj == _this.mainObject && key == '_object') {
                return _this.mainObject;
            }
            if (obj == _this.mainObject && key == 'set') {
                return set.bind(_this.mainProxy);
            }
            if (obj == _this.mainObject && key == 'merge') {
                return merge.bind(_this.mainProxy);
            }
            if (key == '__isProxy') return true;
            if (typeof obj[key] == 'object') {
                _this.fullKey += '.'+key;
                return new Proxy(obj[key], handler);
            }
            _this.fullKey = '';
            return obj[key];
        },
        set(obj, key, val) {
            // console.log('set', obj, key, val);
            if (obj.__isProxy) {
                obj[key] = val;
            } else {
                _this.fullKey += '.'+key;
                cb(_this.fullKey, val);
                _this.fullKey = '';
                obj[key] = val;
            }
        }
    };
    
    _this.fullKey = '';
    _this.mainObject = obj;
    _this.mainProxy = new Proxy(obj, handler);
    return _this.mainProxy;
}


// const container = {
//     main: {
//         text: 'Hola',
//         value: 1,
//         label: 'etiqueta',
//         form: [
//             {name: 'name', value: 'cacho'},
//             {name: 'pass', value: '123456'}
//         ]
//     },
//     other: {
//         item1: {
//             text: 'text',
//             value: 'value'
//         },
//         item2: {
//             text: 'text',
//             value: 'value'
//         }
//     }
// };

// const test = {
//     other: {
//         item2: { text: 'moco' }
//     },
//     main: { form: { 1: { value: '999999' }}}
// };

// const cb = function(fullKey, val) {
//     console.log('CALLBACK', fullKey, val);
// } 

// const dp = new DProxy(container, cb);
