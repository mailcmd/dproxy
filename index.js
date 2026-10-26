const container = {
    main: {
        text: 'Holas',
        value: 1,
        label: 'etiqueta',
        form: [
            {name: 'name', value: '10'},
            {name: 'pass', value: '20'}
        ]
    }
};


const cb = function(fullKey, val) {
    console.log('CALLBACK', fullKey, val);
} 

const main = new ARF('main', container.main);