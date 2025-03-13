// JavaScript source code

const ChaosControlv0 = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];

    var keystates = new Array(256).fill().map(x => false);
    var spaceWasDown = { value: false };

    console.log("FOR CHAOS!! v0");
    
    const x = 12;
    const y = 13;
    const z = 14;
	

    var mainCharIndex = 0;

    var Init = function () {

    };

    var LevelInit = function () {

    };

    var OnFrame = function () {

        var useKeyBoard = true;

        if (typeof ChaosGamepad !== 'undefined' && ChaosGamepad.GamepadEnabled) {
            //console.log(ChaosGamepad.connectedPads[0].axes);
            //console.log(navigator.getGamepads()[0].axes);

            var lstick = ChaosGamepad.GetLStick();
            if (lstick.hasInput) {
                useKeyBoard = false;
                console.log(lstick.h, lstick.v);

                var mainguy = StageData.objects[mainCharIndex];

                mainguy.matrix[x] += lstick.h;
                mainguy.matrix[z] += lstick.v;

            }
        }



    	if (keystates[87] && !keystates[83]) {//w key

    	}
    	if (keystates[83] && !keystates[87]) {//s key

    	}

    	if (keystates[37] && !keystates[39]) {//right

    	}
    	if (keystates[39] && !keystates[37]) {//left

    	}
    	if (keystates[38] && !keystates[40]) {//upkey

    	}
    	if (keystates[40] && !keystates[38]) {//down 

    	}
    	if (keystates[65] && !keystates[68]) {//a

    	}
    	if (keystates[68] && !keystates[65]) {//d

    	}
    	if (keystates[32]) {//spacebar
    		if (!spaceWasDown.value) {

    		}
    	}
    };
	
    return { 'Init': Init, 'LevelInit': LevelInit, 'OnFrame': OnFrame };
})();