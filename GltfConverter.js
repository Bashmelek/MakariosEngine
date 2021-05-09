// JavaScript source code



const GltfConverter = (function () {

    //thank you user Goran.it of https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
    var _base64ToArrayBuffer = function(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        ////console.log(bytes);
        ////console.log(bytes.buffer);
        return bytes.buffer;
    }

    var primTargeterGlobal = function () { };
    var getPrimitiveFromJsResource = function (uri, targetFunc) {
        primTargeterGlobal = targetFunc;
        httpGetText(uri, convertFromString)
    };

    var convertFromString = function (gltfString) {
        //console.log(gltfString);
        var asObject = JSON.parse(gltfString);
        return convertJsonToPrimitive(asObject);
    };

    var convertJsonToPrimitive = function (object) {
        var primaryNodeIndex;
        var newprim = {};

        for (var s = 0; s < object.scenes.length; s++) {
            //worry about making this an array later
            primaryNodeIndex = object.scenes[s].nodes[0];
        }
        //test only
        ////primaryNodeIndex = 1;

        object.binaryBuffers = [];
        var theprim = applyNode(object, object.nodes[primaryNodeIndex], glMatrix.mat4.create(), newprim, null);
        theprim.rootID = 0;

        var animations = applyAnimations(object);

        var primcombined = { prim: theprim, animations: animations };
        primTargeterGlobal(primcombined);
        return primcombined;
    };

    var applyNode = function (fullobject, node, parentmatrix, newprim, parentprim) {

        var prim = {};
        prim.positions = [];
        prim.indices = [];
        prim.vertexNormals = [];
        prim.textureCoordinates = [];
        prim.matrix = glMatrix.mat4.create();
        if (node.matrix && node.matrix[0]) {
            var m = node.matrix;
            prim.matrix = glMatrix.mat4.fromValues(m[0], m[1], m[2], m[3],
                                m[4], m[5], m[6], m[7],
                                m[8], m[9], m[10], m[11],
                m[12], m[13], m[14], m[15])
        }
        if (node.mesh != undefined && node.mesh != null) {
            //console.log('mmmmmmmmwhat');
            //console.log(node);
            var meshID = node.mesh;
            var meshObj = fullobject.meshes[meshID];
            if (meshObj.primitives && meshObj.primitives.length > 0) {
                //worry about multiple primitives later
                if (meshObj.primitives[0].attributes) {
                    if (meshObj.primitives[0].attributes.POSITION != undefined && meshObj.primitives[0].attributes.POSITION != null) {
                        var posIndex = meshObj.primitives[0].attributes.POSITION;
                        var posAcc = fullobject.accessors[posIndex];
                        //console.log(posAcc);
                        prim.positions = getBufferFromAccessor(fullobject, posAcc);
                        prim.textureCoordinates = [
                            // Front
                            0.0, 1.0,//mess up numba 1 face if first says 1.0
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0,
                            // Back
                            0.0, 1.0,
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0,
                            // Top
                            0.0, 1.0,
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0,
                            // Bottom
                            0.0, 1.0,
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0,
                            // Right
                            0.0, 1.0,
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0,
                            // Left
                            0.0, 1.0,
                            1.0, 1.0,
                            1.0, 0.0,
                            0.0, 0.0
                        ];
                        //console.log(prim.positions);
                    }
                    if (meshObj.primitives[0].attributes.NORMAL != undefined && meshObj.primitives[0].attributes.NORMAL != null) {
                        var NORMAL = meshObj.primitives[0].attributes.NORMAL;
                        var normAcc = fullobject.accessors[NORMAL];
                        //console.log(posAcc);
                        prim.vertexNormals = getBufferFromAccessor(fullobject, normAcc);
                        //console.log(prim.NORMAL);
                    }
                    if (meshObj.primitives[0].indices != undefined && meshObj.primitives[0].indices != null) {
                        var inIndex = meshObj.primitives[0].indices;
                        var inAcc = fullobject.accessors[inIndex];
                        //console.log(posAcc);
                        prim.indices = getBufferFromAccessor(fullobject, inAcc);
                        //console.log(prim.indices);
                    } else if (meshObj.primitives[0].attributes.POSITION != undefined && meshObj.primitives[0].attributes.POSITION != null) {
                        //trying this, thank you https://stackoverflow.com/questions/29200787/fastest-way-to-fill-uint16array-with-a-single-value
                        var i = 0, a = new Uint16Array(prim.positions.length / 3);
                        while (i < prim.positions.length / 3) a[i] = i++;
                        prim.indices = a;
                        console.log('autofilled with');
                        console.log(prim.positions.length / 3);
                        console.log(prim.indices);
                    }
                }

            }
        }

        if (parentprim) {
            prim.parent = parentprim;
            parentprim.children.push(prim);
        }
        prim.children = [];

        if (node.children) {
            for (var t = 0; t < node.children.length; t++) {
                //console.log('kiddo ' + t);
                var childnode = applyNode(fullobject, fullobject.nodes[node.children[t]], glMatrix.mat4.create(), newprim, prim);
                childnode.rootID = node.children[t];
            }
        }

        return prim;
    };

    var applyAnimations = function (fullobject) {
        console.log('innus 1us');
        console.log(fullobject);
        if (!fullobject.animations) {
            return;
        }

        console.log('innus 2us');
        var anims = [];

        for (var i = 0; i < fullobject.animations.length; i++) {
            var animation = {};
            animation.name = fullobject.animations[i].name || i.toString();
            animation.components = [];
            for (var c = 0; c < fullobject.animations[i].channels; c++) {
                var animComp = {};
                animComp.node = fullobject.animations[i].channels[c].target.node;
                animComp.type = fullobject.animations[i].channels[c].target.path;

                var inIndex = fullobject.animations[i].samplers[fullobject.animations[i].channels[c].sampler].input;
                var inAcc = fullobject.accessors[inIndex];
                anim.keytimes = getBufferFromAccessor(fullobject, inAcc);


                var outIndex = fullobject.animations[i].samplers[fullobject.animations[i].channels[c].sampler].output;
                var outAcc = fullobject.accessors[outIndex];
                anim.keytimes = getBufferFromAccessor(fullobject, outAcc);

                animation.components.push(animComp);
            }

            console.log(animation);
            anims.push(animation);
        }

        return anims;
    };

    var getBufferFromAccessor = function (fullobj, acc) {

        var array = new Array();
        var bv = fullobj.bufferViews[acc.bufferView];
        var binary;
        if (fullobj.binaryBuffers[bv.buffer]) {
            binary = fullobj.binaryBuffers[bv.buffer];
        } else {
            const buffStart = ("data:application/octet-stream;base64,").length;
            fullobj.binaryBuffers[bv.buffer] = _base64ToArrayBuffer(fullobj.buffers[bv.buffer].uri.substring(buffStart));
            binary = fullobj.binaryBuffers[bv.buffer];
        }
        var start = (acc.byteOffset + bv.byteOffset);
        //var numBytes = bv.byteLength;

        var unitSize = 1;
        ////var bufferEndSize = Math.min(bv.byteLength;
        ////console.log(bufferEndSize);
        var typedArray;
        if (acc.componentType == 5123) {//UNSIGNED_SHORT, 2 bytes
            //var intView = new Int32Array(buffer);
            unitSize = 2 * (acc.type == "VEC3" ? 3 :
                (acc.type == "SCALAR" ? 1 : 1));
            typedArray = Uint16Array;
        } else if (acc.componentType == 5126) { //FLOAT, 4 bytes
            //var floatView = new Float32Array(buffer);
            typedArray = Float32Array;
            unitSize = 4 * (acc.type == "VEC3" ? 3 :
                (acc.type == "SCALAR" ? 1 : 1));
        }
        var bufferEndSize = Math.min(bv.byteLength, acc.count * unitSize);
        var inc = bv.byteStride ? bv.byteStride : unitSize;
        var addedBytes = 0;
        //console.log(binary);
        for (var c = start; addedBytes < bufferEndSize; c += inc) {
            var valsToAdd = new typedArray(binary.slice(c, c + unitSize)).slice(0);
            var valsToAddTrue = [];
            for (var v = 0; v < valsToAdd.length; v++) {
                valsToAddTrue.push(valsToAdd[v]);
            }

            array = array.concat(valsToAddTrue);
            addedBytes += unitSize;
        }

        //may need to consider bufferview target
        return array;
    }



    //with a little help from https://stackoverflow.com/questions/10642289/return-html-content-as-a-string-given-url-javascript-function
    function httpGetText(theUrl, onLoadText) {
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            console.log('huh? http says ' + xmlhttp.readyState + ' ' + xmlhttp.status);
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                //console.log(xmlhttp.responseText);
                //return xmlhttp.responseText;
            } else if (xmlhttp.readyState == 4) {
                onLoadText(xmlhttp.responseText, xmlhttp.responseText);
            }
        }
        xmlhttp.open("GET", theUrl, false);
        xmlhttp.send();
    };
    //console.log(httpGetText('SampleModels/Box/glTF-Embedded/Box.gltf'));
    //httpGetText('SampleModels/Box/glTF-Embedded/Box.gltf', function (text) { console.log(text); })
    ////getPrimitiveFromJsResource('SampleModels/Box/glTF-Embedded/Box.gltf');

    return { 'getPrimitiveFromJsResource': getPrimitiveFromJsResource };
})()

