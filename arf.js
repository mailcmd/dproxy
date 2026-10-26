Array.prototype.remove = function(i) {return this.splice(i, 1)};

function _LIB() {
    ////////////////////////////////////////////////////////////////////////////////////////
    // GETs
    ////////////////////////////////////////////////////////////////////////////////////////
    this.get_foreachs = function(elem) {
        return elem.querySelectorAll(':not(template) [foreach]:not(template)');
    };
    
    this.get_ifs = function(elem) {
        return elem.querySelectorAll(':not(template) [if]:not(template)');
    };
    
    this.get_texts = function(elem) {
        return elem.querySelectorAll(':not(template) text');
    };
    
    this.get_attributes = function(elem) {
        return Object.values(elem.attributes).filter(a => a.value.match(/\{(.*\$\$.+?)\}/));
    };
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Tools
    ////////////////////////////////////////////////////////////////////////////////////////
    this.push = function(object, key, item) {
        object[key] = object[key] ?? [];
        object[key].push(item);
    };
    
    return this;
}

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function ARF(arf_id, object) {
    const _this = this;
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Tools
    ////////////////////////////////////////////////////////////////////////////////////////
    const arf_eval = function(expr, context) {
        expr = expr.replaceAll(/\$\$(.+?)( |$)/g, (_1, m, _2) => {
            const value = _this.dp.get(context+'.'+m);
            if (typeof value == 'string') {
                return "'"+value+"'";
            } else {
                return value;
           }
        });
        return eval(expr);
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processors
    ////////////////////////////////////////////////////////////////////////////////////////
    const process_foreach = function(elem, parent, context) {
        const loopvar = elem.getAttribute('foreach').replace(/\$\$/g, context+'.')
        const tpl = document.createElement('TEMPLATE');
        tpl.setAttribute('foreach', loopvar);
        elem.removeAttribute('foreach');
        tpl.innerHTML = elem.outerHTML;
        elem.before(tpl);
        elem.remove();
        lib.push(_this.objects, loopvar, {
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
            lib.push(_this.objects, key, {
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
                lib.push(_this.objects, key, {
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
    
    const process_text = function(elem, parent, context) {
        let expr = elem.getAttribute('value');
        const matchs = expr.matchAll(/\$\$(.+?)( |$)/g).toArray();
        const keys = [];
        matchs.forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });

        keys.forEach( key => {
            lib.push(_this.objects, key, {
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
    const render_foreach = function(foreach_obj, key, value) {
        const loopvar = foreach_obj.elem.getAttribute('foreach');
        const iterator = loopvar.replace(/\$\$/g, foreach_obj.context+'.');
        _this.dp.get(iterator).forEach((item, i) => {
            const el = foreach_obj.elem.content.children[0].cloneNode(true);
            foreach_obj.elem.after(el);
            process(el, el, iterator+'.'+i);
            render(el);
        });
    };
    
    const render_if = function(if_obj, key, value) {
        const expr = if_obj.elem.getAttribute('if');
        if (arf_eval(expr, if_obj.context)) {
            if (!if_obj.elem.nextElementSibling ||
                if_obj.elem.nextElementSibling.getAttribute('arf-if') != if_obj.value) {
                const el = if_obj.elem.content.children[0].cloneNode(true);
                el.setAttribute('arf-if', if_obj.value);
                if_obj.elem.after(el);
                process(el, el, if_obj.context);
                render(el);
            }
        } else {
            if (if_obj.elem.nextElementSibling &&
                if_obj.elem?.nextElementSibling.getAttribute('arf-if') == if_obj.value) 
                if_obj.elem.nextElementSibling.remove();
        }
    };

    const render_text = function(text_obj, key, value) {
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
    
    const process = function(elem, parent, context) {
        lib.get_foreachs(elem).forEach(fe => process_foreach(fe, parent, context));
        lib.get_ifs(elem).forEach(i => process_if(i, parent, context));
        // attrs
        lib.get_texts(elem).forEach(n => process_text(n, parent, context));
    };
    
    const render = function(elem) {
        for (const k in _this.objects) {
            _this.objects[k].forEach( (obj,i) => {
                if (!obj.elem.isConnected) {
                    _this.objects[k].remove(i);
                    return;
                }
                if (obj.parent != elem) return;
                
                if (obj.type == 'text') render_text(obj, k);
                if (obj.type == 'if') render_if(obj, k);
                if (obj.type == 'foreach') render_foreach(obj, k);
            });
        }
    };
    
    const init = function() {
        process(_this.container, _this.container, '');
        render(_this.container);
    };
    
    ///////////////////////////////////////////////////////////////////////////////////////
    const lib = new _LIB();
    this.id = arf_id;
    this.container = document.querySelector('[arf-id="'+this.id+'"]');

    this.objects = {};

    this.dp = new DProxy(object, console.log);
    
    init();
}

