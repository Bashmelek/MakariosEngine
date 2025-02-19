

const MakUI = (function () {

    var self = this;

    self.Zones = {
        topLeft: {
            id: 1,
            rect: { nx: 0, ny: 0, nwidth: 0.3, nheight: 0.2 },
            textAlign: 'left'
        },
        topMid: { id: 2, },
        topRight: {
            id: 3,
            rect: { nx: 0.78, ny: 0, nwidth: 0.3, nheight: 0.2 },
            textAlign: 'left'
        },
        central: { id: 4, },
        bottomLeft: { id: 5, },
        bottomMid: { id: 6, },
        bottomRight: { id: 7, },
        lowCenter: {
            id: 8,
            rect: { nx: 0.4, ny: .6, nwidth: 0.6, nheight: 0.3 },
            textAlign: 'left'
        },
    };

    self.uiState = {};

    self.winHeight = 1200;
    self.winWidth = 900;
    self.InitGui = function(wwidth, wheight) {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);

        self.winHeight = wheight;
        self.winWidth = wwidth;
    };

    self.writeObjToUI = function (id, text, data, dontClear) { //pos, font
        var uiItem = self.uiState[id];
        if (uiItem == null) {
            uiItem = {};
            self.uiState[id] = uiItem;
        }
        data = data || uiItem.data;
        uiItem.data = data;

        uiItem.text = text;
        uiItem.textColor = data && data.textColor ? data.textColor : '#DDBB00';
        console.log(data);
        console.log(uiItem.zone);
        uiItem.zone = data.zone;
        uiItem.nx = data.nx || uiItem.zone.nx;
        uiItem.ny = data.ny || uiItem.zone.ny;
        uiItem.textAlign = data.textAlign || uiItem.zone.textAlign || 'center';

        var zoneRect = uiItem.zone.rect;
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');

        //gui.clearRect(0, 0, ui.width, ui.height);
        gui.clearRect(zoneRect.nx * ui.width, zoneRect.ny * ui.height, zoneRect.nwidth * ui.width, zoneRect.nheight * ui.height);
        gui.fillStyle = uiItem.textColor;//'#DDBB00';//;'yellow';
        gui.textAlign = uiItem.textAlign;

        uiItem.x = zoneRect.nx * ui.width;
        uiItem.y = zoneRect.ny * ui.height;

        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        //base was 28 for height 480 (at 4:3) so 120 - 7
        var newfontsize = (Math.floor(ui.height * 7.0 / 240.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';

        console.log(uiItem.text);
        gui.fillText(uiItem.text, uiItem.x, uiItem.y + 2);

        uiState.hasany = true;
    };

    self.refreshUI = function () {

        for (let id in self.uiState) {
            //console.log('fresher');
            //console.log(self.uiState);
            if (!self.uiState[id].data) { continue; }
            self.writeObjToUI(id, self.uiState[id].text, null);
        }
        //const ui = document.querySelector('#uiCanvas');
        //const gui = ui.getContext('2d');
        //gui.clearRect(0, 0, ui.width, ui.height);
        //gui.fillStyle = '#DDBB00';//;'yellow';
        ////gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        ////base was 28 for height 480 (at 4:3) so 120 - 7
        //var newfontsize = (Math.floor(ui.height * 7.0 / 120.0) * 1).toString();
        //console.log(newfontsize);
        //gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        //gui.textBaseline = 'hanging';
        //gui.textAlign = 'center';
        ////gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
        //gui.fillText(self.uiState.text, ui.width / 2.0, ui.height / 2.1);
        //uiState.hasany = true;
    }



    return self;

})();