// JavaScript source code


//very much thankyou https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
const ChaosGamepad = (function () {

    var self = this; 

    self.GamepadEnabled = false;

    const DIRTYPE_OMNI = 0;
    const DIRTYPE_8WAY = 1;
    const DIRTYPE_4WAY = 2;

    const NORM_NONE = 0;
    const NORM_MAX1 = 1;

    self.InputSettings = {
        deadzoneThreshold: 0.16,
        dirType: DIRTYPE_OMNI,
        normalization: NORM_MAX1
    };

    self.GetLStick = function () {
        var pad = navigator.getGamepads()[0];
        var stickstate = {
            v: navigator.getGamepads()[0].axes[1],// * -1.0,
            h: navigator.getGamepads()[0].axes[0],
            hasInput: true
        }

        if (self.InputSettings.dirType == DIRTYPE_OMNI) {
            //left and up are -1; h first than v 
            if (Math.abs(stickstate.h) < self.InputSettings.deadzoneThreshold) {
                stickstate.h = 0.0;
            }
            if (Math.abs(stickstate.v) < self.InputSettings.deadzoneThreshold) {
                stickstate.v = 0.0;
            }
            if (stickstate.v == 0.0 && stickstate.h == 0.0) {
                stickstate.hasInput = false;
            } 
        }


        if (self.InputSettings.normalization == NORM_MAX1) {
            var len = stickstate.v * stickstate.v + stickstate.h * stickstate.h;
            if (len > 1.0) {
                var divider = Math.sqrt(len);
                stickstate.h = stickstate.h / divider;
                stickstate.v = stickstate.v / divider;
            }
        }

        return stickstate;
    }

    self.connectedPads = [];

    self.OnConnection = function (event, isConnected) {
        var gamepad = event.gamepad;

        if (isConnected) {
            connectedPads[gamepad.index] = gamepad;
        } else {
            delete connectedPads[gamepad.index];
        }

        var anyPads = true;
        for (var p = 0; p < connectedPads.length; p++) {
            if (connectedPads[p]) {
                anyPads = true;
            }
        }
        self.GamepadEnabled = anyPads;

        //var foundIndex = -1;

        //if (isConnected) {
        //    for (var i = 0; i < connectedPads.length; i++) {

        //    }
        //}
    };

    window.addEventListener("gamepadconnected", (e) => {
        console.log(
            "Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index,
            e.gamepad.id,
            e.gamepad.buttons.length,
            e.gamepad.axes.length
        );
        self.OnConnection(e, true);
    }); 




    return self;
})();