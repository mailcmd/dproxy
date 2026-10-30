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
dp.metrics.cpu.loadavg[0] = 0.5;
dp.metrics.cpu.loadavg[1] = 0.2;
dp.metrics.cpu.loadavg[2] = 0.3;
dp.metrics.memory.usage = '20%';
dp.metrics.memory.free = '12.4 Gb';
dp.metrics.disk.usage = '12%';
dp.metrics.disk.free_space = '212.1 Gb';

// Single update using DProxy lib
dp.set('.metrics.disk.usage', '12%');
dp.set('.metrics.disk.free_space', '212.1 Gb');

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
