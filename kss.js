Array.prototype.remove = function(i) {return this.splice(i, 1)};

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function KSS(object, root_element) {
    const _this = this;
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // GETs
    ////////////////////////////////////////////////////////////////////////////////////////
    const get_foreachs = function(elem) {
        return elem.querySelectorAll(':not(template) [\\:foreach]:not(template)');
    };
    
    const get_ifs = function(elem) {
        return elem.querySelectorAll(':not(template) [\\:if]:not(template)');
    };
    
    const get_texts = function(elem) {
        return elem.querySelectorAll(':not(template) text');
    };
    
    const get_attributes = function(elem) {
        return [...elem.querySelectorAll(':not(template) *')].map( el => {
            return Object.values(el.attributes)
                .filter(a => a.value.match(/[\{|\[](.*(\$\$|\#\#).+?)[\}|\]]/))
                .map(a => [{attr: a.localName, elem: el, value: a.value}][0]);
        }).flat();
    };
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Tools
    ////////////////////////////////////////////////////////////////////////////////////////
    const kss_push = function(object, key, item) {
        object[key] = object[key] ?? [];
        object[key].push(item);
    };
    
    const kss_eval = function(expr, context) {
        expr = expr
            .replaceAll(/\$\$(.+?)( |\(|\)|$)/g, (_1, m, _2) => {
                const value = deep_proxy.get(context+'.'+m);
                if (typeof value == 'string') {
                    return "'"+value+"'";
                } else {
                    return value;
               }
            })
            .replaceAll(/\#\#(.+?)( |\(|\)|$)/g, (_1, m, _2) => {
                const value = deep_proxy.get('.'+m);
                if (typeof value == 'string') {
                    return "'"+value+"'";
                } else {
                    return value;
               }
            });
        try {
            return eval(expr);
        } catch(e) {
            console.warn(`KSS_ERROR: problems evaluating the expression '${expr}' context '${context}'`, e);
            return '';
        }
    };

    const kss_run = function(expr, context) {
        expr = expr
            .match(/\[(.+)\]/)[1]
            .replace(/\$\$/g, '')
            .replace(/\#\#/g, 'this.');
            
        const fun = new Function('context', `
            with (context) {
                ${expr};
            }
        `);
        fun.bind(_this.deep_proxy)(_this.deep_proxy.get(context));
    };
    ////////////////////////////////////////////////////////////////////////////////////////
    // Processors
    ////////////////////////////////////////////////////////////////////////////////////////
    const process_foreach = function(elem, parent, context) {
        const loopvar = elem.getAttribute(':foreach')
            .replace(/\$\$/g, context+'.')
            .replace(/\#\#/g, '.');
        const tpl = document.createElement('TEMPLATE');
        tpl.setAttribute(':foreach', loopvar);
        elem.removeAttribute(':foreach');
        tpl.innerHTML = elem.outerHTML;
        elem.before(tpl);
        elem.remove();
        kss_push(_this.renderizable_objects, loopvar, {
            type: 'foreach',
            elem: tpl,
            parent: parent,
            context: context
        });
    };

    const process_if = function(elem, parent, context) {
        let expr = elem.getAttribute(':if');
        const keys = [];
        expr.matchAll(/\$\$(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });
        expr.matchAll(/\#\#(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.push(key);
        });
        
        const else_ref = elem.getAttribute(':else-ref');
        const if_tpl = document.createElement('TEMPLATE');
        if_tpl.setAttribute(':if', expr);
        elem.removeAttribute(':if');
        elem.removeAttribute(':else-ref');
        if_tpl.innerHTML = elem.outerHTML;
        elem.before(if_tpl);
        keys.forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'if',
                elem: if_tpl,
                parent: parent,
                context: context,
                value: 'true'
            });
        });
        elem.remove();
        
        if (else_ref) {
            elem = document.querySelector('[\\:else="'+else_ref+'"]');
            const else_tpl = document.createElement('TEMPLATE');
            else_tpl.setAttribute(':if', '!('+expr+')');
            elem.removeAttribute(':else');
            else_tpl.innerHTML = elem.outerHTML;
            elem.before(else_tpl);
            keys.forEach( key => {
                kss_push(_this.renderizable_objects, key, {
                    type: 'if',
                    elem: else_tpl,
                    parent: parent,
                    context: context,
                    value: 'false'
                });
            });
            elem.remove();
        }
        
    };
    
    const process_attr = function(attr, parent, context) {
        const keys = [];
        attr.value.matchAll(/\$\$(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });
        attr.value.matchAll(/\#\#(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.push(key);
        });

        keys.forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'attr',
                elem: attr.elem,
                attr: attr.attr,
                expr: attr.value,
                parent: parent,
                context: context
            });
        });
    };
    
    const process_text = function(elem, parent, context) {
        const expr = elem.getAttribute(':content');
        const keys = [];
        expr.matchAll(/\$\$(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });
        expr.matchAll(/\#\#(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.push(key);
        });

        keys.forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'text',
                elem: elem,
                parent: parent,
                context: context
            });
        });
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // renderers
    ////////////////////////////////////////////////////////////////////////////////////////
    const render_foreach = function(foreach_obj) {
        const loopvar = foreach_obj.elem.getAttribute(':foreach');
        const iterator_key = loopvar.replace(/\$\$/g, foreach_obj.context+'.');
        const iterator = deep_proxy.get(iterator_key);
        try {
            for (const i in iterator) {
                const item = iterator[i];
                const el = foreach_obj.elem.content.children[0].cloneNode(true);
                foreach_obj.elem.parentNode.lastElementChild.after(el);
                refresh(el, iterator_key+'.'+i);
            }
        } catch(e) {
            console.warn(`KSS_ERROR: '${iterator}' key is not an iterable object`);
        }
    };
    
    const render_if = function(if_obj) {
        const expr = if_obj.elem.getAttribute(':if');
        if (kss_eval(expr, if_obj.context)) {
            if (!if_obj.elem.nextElementSibling ||
                if_obj.elem.nextElementSibling.getAttribute(':if') != if_obj.value) {
                const el = if_obj.elem.content.children[0].cloneNode(true);
                el.setAttribute(':if', if_obj.value);
                if_obj.elem.after(el);
                refresh(el, if_obj.context);
            }
        } else {
            if (if_obj.elem.nextElementSibling &&
                if_obj.elem?.nextElementSibling.getAttribute(':if') == if_obj.value) 
                if_obj.elem.nextElementSibling.remove();
        }
    };
    
    const render_attr = function(attr_obj) {
        if (attr_obj.expr.match(/\[(.+)\]/)) {
            attr_obj.elem.kss_runner = attr_obj.elem.kss_runner ?? {};
            attr_obj.elem.kss_runner[attr_obj.attr] = {
                context: attr_obj.context,
                expr: attr_obj.expr,
                kss: _this
            };
            attr_obj.elem.setAttribute(attr_obj.attr, "KSS.run('"+attr_obj.attr+"', this)");
        } else {
            const value = kss_eval(attr_obj.expr, attr_obj.context);
            attr_obj.elem.setAttribute(attr_obj.attr, value);
        }
    };

    const render_text = function(text_obj) {
        const expr = text_obj.elem.getAttribute(':content');
        text_obj.elem.innerHTML = kss_eval(expr, text_obj.context);
    };

    ////////////////////////////////////////////////////////////////////////////////////////
    // Main processes
    ////////////////////////////////////////////////////////////////////////////////////////
    /*
    1- Process foreach (inside process if before)
    2- Process if (inside process foreach before)
    3- Process attributes (skip templates)
    3- Process nodes (skip templates)
    */
    
    const process = function(elem, context) {
        get_foreachs(elem).forEach(fe => process_foreach(fe, elem, context));
        get_ifs(elem).forEach(i => process_if(i, elem, context));
        get_attributes(elem).forEach(a => process_attr(a, elem, context));
        get_texts(elem).forEach(n => process_text(n, elem, context));
    };
    
    const render_by_elem = function(elem) {
        for (const k in _this.renderizable_objects) {
            _this.renderizable_objects[k].forEach( (obj,i) => {
                if (!obj.elem.isConnected) {
                    _this.renderizable_objects[k].remove(i);
                    return;
                }
                if (obj.parent != elem) return;
                
                if (obj.type == 'foreach') render_foreach(obj);
                if (obj.type == 'if') render_if(obj);
                if (obj.type == 'attr') render_attr(obj);
                if (obj.type == 'text') render_text(obj);
            });
        }
    };
    
    const render_by_key = function(key) {
        (_this.renderizable_objects[key] ?? []).forEach( (obj,i) => {
            if (!obj.elem.isConnected) {
                _this.renderizable_objects[key].remove(i);
                return;
            }

            if (obj.type == 'foreach') render_foreach(obj);
            if (obj.type == 'if') render_if(obj);
            if (obj.type == 'attr') render_attr(obj);
            if (obj.type == 'text') render_text(obj);
        });
    };
    
    const refresh = function(elem, context) {
        process(elem, context);
        render_by_elem(elem);
    };
    
    ///////////////////////////////////////////////////////////////////////////////////////
    this.init = function() {
        refresh(this.sandboxed_element, '');
    };

    this.sandboxed_element = root_element;
    this.renderizable_objects = {};
    
    const deep_proxy = new DProxy(object, render_by_key);
    this.merge = deep_proxy.merge;
    this.set = deep_proxy.set;
    this.get = deep_proxy.get;
    this.deep_proxy = deep_proxy;
    this.run = kss_run;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Statics props and methods
///////////////////////////////////////////////////////////////////////////////////////////////
KSS.sandboxes = {};

KSS.run = function(attr, elem) {
    const runner = elem.kss_runner[attr];
    runner.kss.run(runner.expr, runner.context);
};

KSS.add_sandbox = function(name, data_object, elem) {
    let root_elem; 
    if (typeof(elem) == 'string') {
        root_elem = document.querySelector('[kss-id="'+elem+'"]');
    } else if (elem?.tpl) {
        const tpl = document.querySelector('[kss-tpl-id="'+elem.tpl+'"]');
        root_elem = document.createElement('kss-sandbox');
        root_elem.setAttribute('kss-id', name);
        root_elem.append(tpl.cloneNode(true).content);
        elem.target.append(root_elem);
    } else {
        root_elem = elem;
    }

    if (!root_elem.isConnected || !root_elem?.querySelectorAll) {
        console.warn(`KSS_ERROR: Sandbox '${name}': '${elem}' is not a reference to a valid DOM element!`);
        return;
    }
    KSS.sandboxes[name] = {
        sb: new KSS(data_object, root_elem),
        name: name,
        data_object: data_object, 
        elem: root_elem
    };
};

KSS.get = function(name) {
    return KSS.sandboxes[name];
};

KSS.getSandbox = function(name) {
    return KSS.sandboxes[name].sb;
};

KSS.init = function() {
    Object.values(KSS.sandboxes).forEach( c => c.sb.init() );
    const kssReadyEvent = new CustomEvent('kssready', { detail: { ksssandboxes: KSS.sandboxes } });
    window.dispatchEvent(kssReadyEvent);
};
