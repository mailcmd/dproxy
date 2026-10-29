sandbox.datas = {
    hdeg: 0,
    mdeg: 0,
    sdeg: 0,
    hour: 0,
    minute: 0,
    second: 0,
    arr: [1,2,3,4,5,6,7,8,9,10,11,12],
    get_time: function(){
      const time = (new Date());
      const h = time.getHours();
      const m = time.getMinutes();
      const s = time.getSeconds();
      const hdeg = (30 * (h % 12) + m * 30 / 60) - 90;
      const mdeg = (6 * m) - 90;
      const sdeg = (6 * s) - 90;
      this.hdeg = hdeg;
      this.mdeg = mdeg;
      this.sdeg = sdeg;
      this.hour = h.toString().padStart(2, '0');
      this.minute = m.toString().padStart(2, '0');
      this.second = s.toString().padStart(2, '0');
    }
};

sandbox.name = 'clock';
sandbox.tpl = 'clock';
sandbox.target = document.body;
sandbox.oninit = function() {
    setInterval(()=>{
        this.get_time();
    }, 999);
};