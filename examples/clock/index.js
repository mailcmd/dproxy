
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadtpl('tpls/clock.html');
    await KSS.include('mods/clock.js');
    KSS.init();
})();