const datas = {
    main: {
        text: 'Holas',
        value: 1,
        label: 'etiqueta',
        form: {
            a: {name: 'pass', value: '20'},
            b: {name: 'name', value: '10'},
        }
    }
};


window.addEventListener('arfready', function(e){
    console.log('arfready event triggered!', e);
});

ARF.add_sandbox('main', datas.main, {
    tpl: 'main',
    target: document.body
});

ARF.init();