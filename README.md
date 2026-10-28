# My notes

### About the name
- KSS is pronounced 'keys' (kiːz)
- KSS means "keep small and simple"
- The name of this tool/library has nothing to do with what it does, but rather with its 
  philosophy.
- I thought about naming it FARO (F*ck Angular, React and Others), but it wouldn't be fair to 
  use my little side project — which I do just for fun — as a way to vent my disdain for those 
  unnecessarily large macro-platforms. 

### Deps
- Before doing KSS I made DProxy (deep proxy) to make it possible for KSS to work the way I wanted 
  it to. I keep both as sepated libs because DProxy can be used in many other projects. 
- So, KSS depends only of DProxy.

### Special attributes
- :foreach
- :if
- :else-ref
- :else 
- :content

### Rest of attributes
- When the value of the attribute has any expression starting with '$$' it is processed by KISS.
- If the expresion is closed inside {...} it will be rendered as string.
- If the expresion is closed inside [...] it will be rendered as javascript code but NOT RUNNED.

### Var references
- $$ -> it is replaced by the context
- ## -> it is replaced by the root context


# TODO
- [ ] Load templates (includes).
- [ ] Make a way to create sandbox as small modules and integrate them in one APP.
- [ ] Check nested structures.