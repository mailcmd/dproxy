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

sandbox.html = `
    <text :content="$$text + '5'"></text> capo
    <table border="2">
      <tr :foreach="$$form">
        <td><text :content="$$name"></text></td>
        <td><text :content="$$value * ##value"></text></td>
      </tr>
    </table>
    
    <span class="{$$label}a" xx="hola">IF</span>
    <button onclick="[$$sum()]">
      SUM
    </button>
    <div :if="$$value % 2 == 0" :else-ref="value_mod">
      <text :content="$$value"></text> is par
    </div>
    <div :else="value_mod">
      <text :content="$$value"></text> is impar
    </div>
`;

sandbox.name = 'main';

sandbox.target = document.querySelector('#main');
