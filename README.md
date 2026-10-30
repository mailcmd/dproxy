# DProxy-js 
## What is this?
It is a javascript class to manage deep nested proxy. 

## How it works?

*index.html*
```html
<!DOCTYPE html>
<html>
<head>
  <title>DProxy Test</title>
</head>
<body>
    <b>CPU:</b>
    <span metric-id=".metrics.cpu.usage"></span> -
    <span metric-id=".metrics.cpu.loadavg.0"></span>
    <span metric-id=".metrics.cpu.loadavg.1"></span>
    <span metric-id=".metrics.cpu.loadavg.2"></span>
    <br/>
    <b>MEMORY:</b>
    <span metric-id=".metrics.memory.usage"></span> -
    <span metric-id=".metrics.memory.free"></span>
    <br/>
    <b>DISK:</b>
    <span metric-id=".metrics.disk.usage"></span> -
    <span metric-id=".metrics.disk.free_space"></span>

    <script src="dproxy.js"></script>
    <script src="index.js"></script>
</body>    
</html>

```

*index.js*
```javascript
const datas = {
    metrics: {
        cpu: {
            usage: 0,
            loadavg: [0, 0, 0]
        },
        memory: {
            usage: 0,
            free: 0
        },
        disk: {
            usage: 0,
            free_space: 0
        }
    }
};

const callback = function(key, value) {
    console.log('DProxy SET:', key, value);
    document.querySelector('[metric-id="'+key+'"]').innerHTML = value;
};

const dp = new DProxy(datas, callback)

// Single updates
dp.metrics.cpu.usage = '40%';
// CONSOLE OUTPUT -> DProxy SET: .metrics.cpu.usage 40%
dp.metrics.cpu.loadavg[0] = 0.5;
// CONSOLE OUTPUT -> DProxy SET: .metrics.cpu.loadavg.0 0.5
dp.metrics.cpu.loadavg[1] = 0.2;
// CONSOLE OUTPUT -> DProxy SET: .metrics.cpu.loadavg.1 0.2
dp.metrics.cpu.loadavg[2] = 0.3;
// CONSOLE OUTPUT -> DProxy SET: .metrics.cpu.loadavg.2 0.3
dp.metrics.memory.usage = '20%';
// CONSOLE OUTPUT -> DProxy SET: .metrics.memory.usage 20%
dp.metrics.memory.free = '12.4 Gb';
// CONSOLE OUTPUT -> DProxy SET: .metrics.memory.free 12.4 Gb
dp.metrics.disk.usage = '12%';
// CONSOLE OUTPUT -> DProxy SET: .metrics.disk.usage 12%
dp.metrics.disk.free_space = '212.1 Gb';
// CONSOLE OUTPUT -> DProxy SET: .metrics.disk.free_space 212.1 Gb

// Single update using DProxy lib
dp.set('.metrics.disk.usage', '12%');
// CONSOLE OUTPUT -> DProxy SET: .metrics.disk.usage 12%
dp.set('.metrics.disk.free_space', '212.1 Gb');
// CONSOLE OUTPUT -> DProxy SET: .metrics.disk.free_space 212.1 Gb


// Or partial bundle update
dp.merge({
    metrics: {
        cpu: {
            usage: '80%'
        },
        memory: {
            usage: '21%'
        }
    }
});
// CONSOLE OUTPUT ->
//   DProxy SET: .metrics.cpu.usage 80% 
//   DProxy SET: .metrics.memory.usage 21% 


```

