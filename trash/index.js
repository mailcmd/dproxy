const datas = {
    main: {
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
    }
};


window.addEventListener('rfsready', function(e){
    console.log('rfsready event triggered!', e);
});

KSS.add_sandbox('main', datas.main, {
    tpl: 'main',
    target: document.body
});

KSS.init();