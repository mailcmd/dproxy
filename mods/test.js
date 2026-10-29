sandbox.datas = {
        text: 'Holas',
        value: 1,
        sum: function() {
            this.value++;
        },
        label: 'etiqueta',
        form: {
            a: {name: 'pass', value: '20'},
            b: {name: 'name', value: '10'},
        }
};
sandbox.tpl = 'main';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');
