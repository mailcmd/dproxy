# My notes

### Observations
- KSS is pronounced 'keys' (kiːz)
- KSS means "keep small and simple"
- The name of this tool/library has nothing to do with what it does, but rather with its 
  philosophy.

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