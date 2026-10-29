
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('rfsready event triggered!', e);
});

// Main process
(async function(){
    // Test including all in one, html content and the datas of the sandbox
    // await KSS.include('mods/test-all-in-one.js');
    
    // Test including html content and datas separately
    await KSS.loadtpl('tpls/test.html'); // first load tpl
    await KSS.include('mods/test.js');   // then include the module
    KSS.init();
})();