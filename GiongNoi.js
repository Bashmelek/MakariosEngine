
//much thankyou to https://web.dev/articles/webaudio-intro

const GiongNoi = (function () {

    var self = this;
    self.soundContext;
    self.AudioAssets = {};

    self.InitGiongNoi = function () {
        try {
            soundContext = new AudioContext();
        }
        catch (e) {
            alert('Web Audio API is not supported in this browser because it stinks!!');
        }
    }

    //var giongTargeterGlobal = function () { };
    self.createSingleSourceAudioObject = function () {
        var ssObject = {};
        //ssObject.source = soundContext.createBufferSource(); // creates a sound source
        ssObject.gainNode = null;

        ssObject.playSoundFromSelf = function (name, duration) {
            ssObject.gainNode = soundContext.createGain();
            ssObject.gainNode.gain.value = 0.4; // 10 %
            ssObject.gainNode.connect(soundContext.destination);

            if (ssObject.source) {
                ssObject.source.stop(0);
            }
            ssObject.source = soundContext.createBufferSource();
            ssObject.source.buffer = AudioAssets[name];
            


            // tell the source which sound to play
            console.log(ssObject.source);
            ssObject.gainNode.gain.cancelScheduledValues(soundContext.currentTime);
            // now, make sure to set a "scheduling checkpoint" of the current value
            ssObject.gainNode.gain.setValueAtTime(ssObject.gainNode.gain.value, soundContext.currentTime);
            // NOW, set the ramp
            ssObject.gainNode.gain.linearRampToValueAtTime(1, soundContext.currentTime + 1.1);


            ssObject.source.connect(ssObject.gainNode);
            //source.connect(soundContext.destination);       // connect the source to the context's destination (the speakers)
            ssObject.source.start(0);                          // play the source now

            if (duration && duration > 0.0) {
                setTimeout(function () {  

                    ssObject.gainNode.gain.cancelScheduledValues(soundContext.currentTime);
                    // now, make sure to set a "scheduling checkpoint" of the current value
                    ssObject.gainNode.gain.setValueAtTime(ssObject.gainNode.gain.value, soundContext.currentTime);
                    // NOW, set the ramp
                    ssObject.gainNode.gain.linearRampToValueAtTime(0.0, soundContext.currentTime + 0.9);


                    ssObject.source.connect(ssObject.gainNode);
                    console.log("gainchange");
                    setTimeout(function () {

                    }, duration);
                }, duration);
            }
        }


        return ssObject;
    }

    self.playSound = function (name) {
        var gainNode = soundContext.createGain();
        gainNode.gain.value = 0.2; // 10 %
        gainNode.connect(soundContext.destination);

        var source = soundContext.createBufferSource(); // creates a sound source
        source.buffer = AudioAssets[name];                    // tell the source which sound to play
        console.log(source);

        gainNode.gain.cancelScheduledValues(soundContext.currentTime);
        // now, make sure to set a "scheduling checkpoint" of the current value
        gainNode.gain.setValueAtTime(gainNode.gain.value, soundContext.currentTime);
        // NOW, set the ramp
        gainNode.gain.linearRampToValueAtTime(1, soundContext.currentTime + 1.1);

        source.connect(gainNode);
        //source.connect(soundContext.destination);       // connect the source to the context's destination (the speakers)
        source.start(0);                          // play the source now
    }


    self.loadSound = function (url, name, targetFunc) {
        var giongTargeter = targetFunc;


        var request = new XMLHttpRequest();
        request.open('GET', 'SFX/MusicBoxC1.mp3', true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function () {
            soundContext.decodeAudioData(request.response, function (buffer) {
                self.AudioAssets[name] = buffer;
                giongTargeter();
            }, function () { /*eat the error*/console.log("COULD NOT LOAD SOUNDS: " + url); });
        }
        request.send();
    }




    return self;

})();