

const MakUI = (function () {

    var self = this;

    self.uiItemType = {
        text: 0,
        image: 1
    };

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

        uiItem.uiItemType = self.uiItemType.text;
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
        var newfontsize = (Math.floor(ui.height * (uiItem.fontsize || 7.0) / 240.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';

        console.log(uiItem.text);

        //thankyou Gabriele https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
        var lineheight = (uiItem.fontsize || 7.0) * 4.0;//24;
        var tlines = (uiItem.text + '').split('\n');
        for (var i = 0; i < tlines.length; i++) {
            //c.fillText(lines[i], x, y + (i * lineheight));
            gui.fillText(tlines[i], uiItem.x, uiItem.y + 2 + (i * lineheight));
        }
         

        uiState.hasany = true;
    };

    self.drawObjToUI = function (id, src, data, dontClear) { //pos, font
        var uiItem = self.uiState[id];
        if (uiItem == null) {
            uiItem = {};
            self.uiState[id] = uiItem;
        }
        data = data || uiItem.data;
        uiItem.data = data;

        var givensrc = src || data.src;
        if (!uiItem.src || uiItem.src != givensrc) {
            var sourceImage = new Image();
            sourceImage.src = givensrc;// 'gmodels/CatPallette.png'; //
            uiItem.isLoaded = false;
            uiItem.sourceImage = sourceImage;//'gmodels/CatPallette.png'; // can also be a remote URL e.g. http://
            uiItem.src = givensrc;
        }

        uiItem.uiItemType = self.uiItemType.image; 

        uiItem.clickHandler = data.clickHandler;
        if (data.clickHandler) {
            uiItem.isClickable = true;
        }

        uiItem.nx = data.nx || uiItem.nx;
        uiItem.ny = data.ny || uiItem.ny;
        //uiItem.textAlign = data.textAlign || uiItem.zone.textAlign || 'center';


        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');

        uiItem.x = uiItem.nx * ui.width;
        uiItem.y = uiItem.ny * ui.height; 
        uiItem.scale = (ui.width / 1200.0);
         

        //console.log(uiItem.x);
        //console.log(ui.width);

        if (!uiItem.isLoaded) {
            uiItem.sourceImage.onload = function () {
                uiItem.nheight = uiItem.sourceImage.naturalHeight;
                uiItem.nwidth = uiItem.sourceImage.naturalWidth;
                uiItem.height = uiItem.sourceImage.naturalHeight * (uiItem.scale);
                uiItem.width = uiItem.sourceImage.naturalWidth * (uiItem.scale);

                gui.drawImage(uiItem.sourceImage, uiItem.x, uiItem.y, uiItem.sourceImage.naturalWidth * (uiItem.scale), uiItem.sourceImage.naturalHeight * (uiItem.scale));
                uiItem.isLoaded = true;
            };
        } else {
            uiItem.nheight = uiItem.sourceImage.naturalHeight;
            uiItem.nwidth = uiItem.sourceImage.naturalWidth;
            uiItem.height = uiItem.sourceImage.naturalHeight * (uiItem.scale);
            uiItem.width = uiItem.sourceImage.naturalWidth * (uiItem.scale);

            gui.drawImage(uiItem.sourceImage, uiItem.x, uiItem.y, uiItem.sourceImage.naturalWidth * (uiItem.scale), uiItem.sourceImage.naturalHeight * (uiItem.scale));
        }


        uiState.hasany = true;
    };

    self.refreshUI = function () {

        for (let id in self.uiState) {
            //console.log('fresher');
            //console.log(self.uiState);
            if (!self.uiState[id].data) { continue; }
            if (self.uiState[id].uiItemType == self.uiItemType.text) {
                self.writeObjToUI(id, self.uiState[id].text, null);
            } else if (self.uiState[id].uiItemType == self.uiItemType.image) {
                self.drawObjToUI(id, self.uiState[id].src, null);
            }
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








    const uiCanvas = document.querySelector('#uiCanvas');

    self.makUIClickEnabled = false;
    var useSimpleTouchAsClick = false;
    var ghostClickEventDisabled = false;
    self.EnableMakUIClick = function() {
        if (self.makUIClickEnabled) { return; }
        self.makUIClickEnabled = true;

        var clickHandler = function (e) {
            //console.log("ui click");
            //const ui = document.querySelector('#uiCanvas');//uiCanvas
            if (e.target != uiCanvas) { return; }
            e.preventDefault(); 

            var matrices = [];
            var basematrix = mat4.create();
            mat4.multiply(basematrix, gproj, gmod);
            matrices.push(basematrix);

            var hitui = {};

            for (let id in self.uiState) {
                if (!self.uiState[id].data || !self.uiState[id].isClickable) { continue; }
                if (self.uiState[id].uiItemType == self.uiItemType.text) {
                    //
                } else if (self.uiState[id].uiItemType == self.uiItemType.image) {

                    //{ x: e.clientX, y: e.clientY }
                    var uiItem = self.uiState[id];
                    //console.log(uiItem);
                    //console.log(e.clientX);
                    //console.log(e.clientY);

                    var h = uiItem.height;
                    var w = uiItem.width;
                    var x = uiItem.x;
                    var y = uiItem.y;
                    var rect = document.querySelector('#uiCanvas').getBoundingClientRect();

                    var tx = (e.clientX - rect.left);
                    var ty = (e.clientY - rect.top);

                    if (tx >= x && tx <= x + w &&
                        ty >= y && ty <= y + h) {

                        uiItem.clickHandler();

                        break;
                    }
                }
            }

        }

        window.addEventListener("click", clickHandler);

        if (useSimpleTouchAsClick) {
            window.addEventListener("touchstart", function (e) {

                //thankyou Slashback https://stackoverflow.com/questions/20225153/preventing-ghost-click-when-binding-touchstart-and-click
                if (!ghostClickEventDisabled && e.type == 'touchstart') {
                    ghostClickEventDisabled = true;
                    window.removeEventListener("click", clickHandler);
                }
                //const ui = document.querySelector('#uiCanvas');//uiCanvas
                if (e.target != uiCanvas) { return; }

                e.preventDefault();
                mouseisdown = true;
                currentTouch = e.changedTouches[0];                
            });

        }
    }





    return self;

})();