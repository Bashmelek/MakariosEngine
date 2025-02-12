

const MakUI = (function () {

    var self = this;

    self.Zones = {
        topLeft: 1,
        topMid: 2,
        topRight: 3,
        central: 4,
        bottomLeft: 5,
        bottomMid: 6,
        bottomRight: 7
    };

    self.uiState = {};

    self.winHeight = 1080;
    self.winWidth = 810;
    self.InitGui = function(wwidth, wheight) {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);

        self.winHeight = wheight;
        self.winWidth = wwidth;
    };

    self.writeToUI = function (id, text, data, dontClear) { //pos, font
        var uiItem = self.uiState.id;
        if (uiItem == null) {
            uiItem = {};
            self.uiState.id = uiItem;
        }

        uiItem.text = text;
        uiItem.textColor = data && data.textColor ? data.textColor : '#DDBB00';


        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);
        gui.fillStyle = uiItem.textColor;//'#DDBB00';//;'yellow';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        //base was 28 for height 480 (at 4:3) so 120 - 7
        var newfontsize = (Math.floor(ui.height * 7.0 / 120.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';
        if (!pos) {
            gui.textAlign = 'center';
            //gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
            gui.fillText(text, ui.width / 2.0, ui.height / 2.1);
        } else {
            gui.textAlign = 'left';
            //gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
            gui.fillText(text, 20, 20);

        }
        uiState.hasany = true;
    };

    self.rewriteToUI = function () {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);
        gui.fillStyle = '#DDBB00';//;'yellow';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        //base was 28 for height 480 (at 4:3) so 120 - 7
        var newfontsize = (Math.floor(ui.height * 7.0 / 120.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';
        gui.textAlign = 'center';
        //gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
        gui.fillText(self.uiState.text, ui.width / 2.0, ui.height / 2.1);
        uiState.hasany = true;
    }



    return self;

})();