Array.prototype.remove = function(i) {return this.splice(i, 1)};

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function ARF(object, root_element) {
    const _this = this;
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // GETs
    ////////////////////////////////////////////////////////////////////////////////////////
    const get_foreachs = function(elem) {
        return elem.querySelectorAll(':not(template) [foreach]:not(template)');
    };
    
    const get_ifs = function(elem) {
        return elem.querySelectorAll(':not(template) [if]:not(template)');
    };
    
    const get_texts = function(elem) {
        return elem.querySelectorAll(':not(template) text');
    };
    
    const get_attributes = function(elem) {
        return [...elem.querySelectorAll(':not(template) *')].map( el => {
            return Object.values(el.attributes)
                .filter(a => a.value.match(/\{(.*\$\$.+?)\}/))
                .map(a => [{attr: a.localName, elem: el, value: a.value}][0]);
        }).flat();
    };
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Tools
    ////////////////////////////////////////////////////////////////////////////////////////
    const arf_push = function(object, key, item) {
        object[key] = object[key] ?? [];
        object[key].push(item);
    };
    
    const arf_eval = function(expr, context) {
        expr = expr.replaceAll(/\$\$(.+?)( |$)/g, (_1, m, _2) => {
            const value = deep_proxy.get(context+'.'+m);
            if (typeof value == 'string') {
                return "'"+value+"'";
            } else {
                return value;
           }
        });
        return eval(expr);
    };

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processors
    ////////////////////////////////////////////////////////////////////////////////////////
    const process_foreach = function(elem, parent, context) {
        const loopvar = elem.getAttribute('foreach').replace(/\$\$/g, context+'.');
        const tpl = document.createElement('TEMPLATE');
        tpl.setAttribute('foreach', loopvar);
        elem.removeAttribute('foreach');
        tpl.innerHTML = elem.outerHTML;
        elem.before(tpl);
        elem.remove();
        arf_push(_this.renderizable_objects, loopvar, {
            type: 'foreach',
            elem: tpl,
            parent: parent,
            context: context
        });
    };

    const process_if = function(elem, parent, context) {
        let expr = elem.getAttribute('if');
        const matchs = expr.matchAll(/\$\$(.+?) /g).toArray();
        const keys = [];
        matchs.forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });
        
        const else_ref = elem.getAttribute('else-ref');
        const if_tpl = document.createElement('TEMPLATE');
        if_tpl.setAttribute('if', expr);
        elem.removeAttribute('if');
        elem.removeAttribute('else-ref');
        if_tpl.innerHTML = elem.outerHTML;
        elem.before(if_tpl);
        keys.forEach( key => {
            arf_push(_this.renderizable_objects, key, {
                type: 'if',
                elem: if_tpl,
                parent: parent,
                context: context,
                value: 'true'
            });
        });
        elem.remove();
        
        if (else_ref) {
            elem = document.querySelector('[else="'+else_ref+'"]');
            const else_tpl = document.createElement('TEMPLATE');
            else_tpl.setAttribute('if', '!('+expr+')');
            elem.removeAttribute('else');
            else_tpl.innerHTML = elem.outerHTML;
            elem.before(else_tpl);
            keys.forEach( key => {
                arf_push(_this.renderizable_objects, key, {
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
        const matchs = attr.value.matchAll(/\$\$(.+?)( |$)/g).toArray();
        const keys = [];
        matchs.forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });

        keys.forEach( key => {
            arf_push(_this.renderizable_objects, key, {
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
        let expr = elem.getAttribute('value');
        const matchs = expr.matchAll(/\$\$(.+?)( |$)/g).toArray();
        const keys = [];
        matchs.forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });

        keys.forEach( key => {
            arf_push(_this.renderizable_objects, key, {
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
        const loopvar = foreach_obj.elem.getAttribute('foreach');
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
            console.warn(`ARF_ERROR: '${iterator}' key is not an iterable object`);
        }
    };
    
    const render_if = function(if_obj) {
        const expr = if_obj.elem.getAttribute('if');
        if (arf_eval(expr, if_obj.context)) {
            if (!if_obj.elem.nextElementSibling ||
                if_obj.elem.nextElementSibling.getAttribute('arf-if') != if_obj.value) {
                const el = if_obj.elem.content.children[0].cloneNode(true);
                el.setAttribute('arf-if', if_obj.value);
                if_obj.elem.after(el);
                refresh(el, if_obj.context);
            }
        } else {
            if (if_obj.elem.nextElementSibling &&
                if_obj.elem?.nextElementSibling.getAttribute('arf-if') == if_obj.value) 
                if_obj.elem.nextElementSibling.remove();
        }
    };
    
    const render_attr = function(attr_obj) {
        const value = arf_eval(attr_obj.expr, attr_obj.context);
        attr_obj.elem.setAttribute(attr_obj.attr, value);
    };

    const render_text = function(text_obj) {
        const expr = text_obj.elem.getAttribute('value');
        text_obj.elem.innerHTML = arf_eval(expr, text_obj.context);
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
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Statics props and methods
///////////////////////////////////////////////////////////////////////////////////////////////
ARF.sandboxes = {};

ARF.add_sandbox = function(name, data_object, elem) {
    let root_elem; 
    if (typeof(elem) == 'string') {
        root_elem = document.querySelector('[arf-id="'+elem+'"]');
    } else if (elem?.tpl) {
        const tpl = document.querySelector('[arf-tpl-id="'+elem.tpl+'"]');
        root_elem = document.createElement('arf-sandbox');
        root_elem.setAttribute('arf-id', name);
        root_elem.append(tpl.cloneNode(true).content);
        elem.target.append(root_elem);
    } else {
        root_elem = elem;
    }

    if (!root_elem.isConnected || !root_elem?.querySelectorAll) {
        console.warn(`ARF_ERROR: Sandbox '${name}': '${elem}' is not a reference to a valid DOM element!`);
        return;
    }
    ARF.sandboxes[name] = {
        sb: new ARF(data_object, root_elem),
        name: name,
        data_object: data_object, 
        elem: root_elem
    };
};

ARF.get = function(name) {
    return ARF.sandboxes[name];
};

ARF.getSandbox = function(name) {
    return ARF.sandboxes[name].sb;
};

ARF.init = function() {
    Object.values(ARF.sandboxes).forEach( c => c.sb.init() );
    const arfReadyEvent = new CustomEvent('arfready', { detail: { arfsandboxes: ARF.sandboxes } });
    window.dispatchEvent(arfReadyEvent);
};
