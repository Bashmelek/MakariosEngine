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
        console.log('doing');
        primTargeterGlobal = targetFunc;
        httpGetText(uri, convertFromString)
    };

    var convertFromString = function (gltfString) {
        console.log('gltfString');
        var asObject = JSON.parse(gltfString);
        return convertJsonToPrimitive(asObject);
    };

    var convertJsonToPrimitive = function (object) {
        var primaryNodeIndex;
        var newprim = null;
        
        //test only
        ////primaryNodeIndex = 1;

        object.binaryBuffers = [];
        var theprim = null;
        
        //for (var s = 0; s < object.scenes.length; s++) {
        for (var s = 0; s < object.scenes[0].nodes.length; s++) {
            //worry about making this an array later
            primaryNodeIndex = object.scenes[0].nodes[s];
            console.log(primaryNodeIndex);
            theprim = applyNode(object, object.nodes[primaryNodeIndex], glMatrix.mat4.create(), theprim, null);
        }
        console.log('rezults');
        console.log(theprim);
        theprim.rootID = 0;

        var animations = applyAnimations(object);
        console.log('anims are:');
        console.log(animations);

        var primcombined = { prim: theprim, animations: animations };
        primTargeterGlobal(primcombined);
        return primcombined;
    };

    var applyNode = function (fullobject, node, parentmatrix, newprim, parentprim) {

        var prim = newprim;
        var isnew = false;
        var orginposlength = 0;
        if (prim == null) {
            prim = {};
            isnew = true;
            prim.positions = [];
            prim.indices = [];
            prim.vertexNormals = [];
            prim.textureCoordinates = [];
        } else {
            orginposlength = prim.positions.length;
        }
        //prim.matrix = glMatrix.mat4.create();
        var primmatrix = glMatrix.mat4.create();
        if (node.matrix && node.matrix[0]) {
            var m = node.matrix;
            primmatrix = glMatrix.mat4.fromValues(m[0], m[1], m[2], m[3],
                m[4], m[5], m[6], m[7],
                m[8], m[9], m[10], m[11],
                m[12], m[13], m[14], m[15])
        } else if (node.translation) {
            glMatrix.mat4.translate(primmatrix, primmatrix, node.translation)
        }
        if (node.mesh != undefined && node.mesh != null) {
            //console.log('mmmmmmmmwhat');
            //console.log(node);
            var meshID = node.mesh;
            var meshObj = fullobject.meshes[meshID];
            if (meshObj.primitives && meshObj.primitives.length > 0) {
                //worry about multiple primitives later
                if (meshObj.primitives[0].attributes) {
                    if (fullobject.materials && fullobject.materials.length > 0 && meshObj.primitives[0].material != null) {
                        var material = fullobject.materials[meshObj.primitives[0].material];
                        if (material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture != null) {
                            //get the image
                            var imageIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                            if (fullobject.images[imageIndex] != null) {
                                console.log('maybe load image');
                                //const buffStart = ("data:application/octet-stream;base64,").length;
                                //thank you https://stackoverflow.com/questions/17591148/converting-data-uri-to-image-data for showing how easy datauri is
                                image = new Image();
                                image.addEventListener('load', function () {
                                    //console.log('dotry load image');
                                    //Makarios.drawImage(image);
                                    //canvas.width = image.width;
                                    //canvas.height = image.height;
                                    //context.drawImage(image, 0, 0, canvas.width, canvas.height);
                                    //resolve(context.getImageData(0, 0, canvas.width, canvas.height));
                                }, false);
                                image.src = fullobject.images[imageIndex].uri;
                                prim.textureUrl = fullobject.images[imageIndex].uri;

                                //fullobj.binaryBuffers[bv.buffer] = _base64ToArrayBuffer(fullobj.buffers[bv.buffer].uri.substring(buffStart));
                                //binary = fullobj.binaryBuffers[bv.buffer];
                            }
                        }
                    }
                    if (!prim.textureUrl) {
                        prim.textureUrl = "plainsky.jpg"
                    }
                    if (meshObj.primitives[0].attributes.POSITION != undefined && meshObj.primitives[0].attributes.POSITION != null) {
                        var posIndex = meshObj.primitives[0].attributes.POSITION;
                        var posAcc = fullobject.accessors[posIndex];
                        //console.log(posAcc);
                        var posarray = getBufferFromAccessor(fullobject, posAcc);
                        //todo george put math funcs own section
                        linTransformRange(posarray, posarray, primmatrix, 0, posarray.length);
                        if (isnew) {
                            //console.log(posarray);
                            prim.positions = posarray;
                            console.log('orig posez');
                            console.log(prim.positions);
                        } else {
                            console.log(prim.positions);
                            prim.positions = prim.positions.concat(posarray);
                            console.log('see new posez');
                            console.log(prim.positions);
                        }
                        
                        var texarray;
                        if (meshObj.primitives[0].attributes.TEXCOORD_0 != undefined && meshObj.primitives[0].attributes.TEXCOORD_0 != null) {
                            var texIndex = meshObj.primitives[0].attributes.TEXCOORD_0;
                            var texAcc = fullobject.accessors[texIndex];
                            //console.log(posAcc);
                            texarray = getBufferFromAccessor(fullobject, texAcc);
                            //console.log('texarray');
                            //console.log(texarray);
                            for (var txi = 0; txi < texarray.length; txi++) {
                                if (txi % 3 == 2) {
                                    texarray.splice(txi, 0, 1.0);
                                } else if (txi == texarray.length - 1) {
                                    texarray.splice(txi, 0, 1.0);
                                    txi = texarray.length;
                                }
                            }
                        } else {
                            texarray = new Uint16Array(prim.positions.length);
                            for (var tci = 0; tci < texarray.length; tci++) {
                                if (tci % 3 == 0) {
                                    texarray[tci] = 0.0;
                                //} else if (tci % 3 == 1) {
                                //    texarray[tci] = 0.2;
                                }else {
                                    texarray[tci] = 1.0;
                                }
                            }
                        }
                        if (isnew) {
                            prim.textureCoordinates = texarray;
                        } else {
                            //prim.textureCoordinates = prim.textureCoordinates.concat(texarray);
                            prim.textureCoordinates = texarray;
                        }

                    }
                    if (meshObj.primitives[0].attributes.NORMAL != undefined && meshObj.primitives[0].attributes.NORMAL != null) {
                        var NORMAL = meshObj.primitives[0].attributes.NORMAL;
                        var normAcc = fullobject.accessors[NORMAL];
                        //console.log(posAcc);
                        var normarray = getBufferFromAccessor(fullobject, normAcc);
                        if (isnew) {
                            prim.vertexNormals = normarray;
                        } else {
                            prim.vertexNormals = prim.vertexNormals.concat(normarray);
                        }
                        //console.log(prim.NORMAL);
                    }
                    if (meshObj.primitives[0].indices != undefined && meshObj.primitives[0].indices != null) {
                        var inIndex = meshObj.primitives[0].indices;
                        var inAcc = fullobject.accessors[inIndex];
                        //console.log(posAcc);
                        var inarray = getBufferFromAccessor(fullobject, inAcc);
                        for (var ia = 0; ia < inarray.length; ia++) {
                            inarray[ia] += orginposlength / 3;
                        }
                        if (isnew) {
                            prim.indices = inarray;
                        } else {
                            prim.indices = prim.indices.concat(inarray);
                        }
                        //console.log(prim.indices);
                    } else if (meshObj.primitives[0].attributes.POSITION != undefined && meshObj.primitives[0].attributes.POSITION != null) {
                        //trying this, thank you https://stackoverflow.com/questions/29200787/fastest-way-to-fill-uint16array-with-a-single-value
                        var i = orginposlength / 3, a = new Uint16Array(prim.positions.length / 3 - orginposlength / 3);
                        while (i < prim.positions.length / 3) a[i - orginposlength / 3] = i++;
                        if (isnew) {
                            prim.indices = a;
                        } else {
                            prim.indices = prim.indices.concat(a);
                        }
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
            var innerprim = null;
            for (var t = 0; t < node.children.length; t++) {
                //console.log('kiddo ' + t);
                innerprim = null;
                innerprim = applyNode(fullobject, fullobject.nodes[node.children[t]], glMatrix.mat4.create(), innerprim, prim);
                innerprim.rootID = node.children[t];
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
            for (var c = 0; c < fullobject.animations[i].channels.length; c++) {
                var animComp = {};
                animComp.node = fullobject.animations[i].channels[c].target.node;
                if (fullobject.animations[i].channels[c].target.path == "rotation") {
                    animComp.type = Makarios.animTypeRot;
                } else {
                    //todo George
                    animComp.type = 0;
                }

                var inIndex = fullobject.animations[i].samplers[fullobject.animations[i].channels[c].sampler].input;
                var inAcc = fullobject.accessors[inIndex];
                animComp.keytimes = getBufferFromAccessor(fullobject, inAcc);


                var outIndex = fullobject.animations[i].samplers[fullobject.animations[i].channels[c].sampler].output;
                var outAcc = fullobject.accessors[outIndex];
                animComp.keydeformations = getBufferFromAccessor(fullobject, outAcc);

                //console.log('animComp');
                //console.log(animComp);
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
                (acc.type == "VEC4" ? 4 :                
                (acc.type == "VEC2" ? 2 :
                    (acc.type == "SCALAR" ? 1 : 1))));
            typedArray = Uint16Array;
        } else if (acc.componentType == 5126) { //FLOAT, 4 bytes
            //var floatView = new Float32Array(buffer);
            typedArray = Float32Array;
            unitSize = 4 * (acc.type == "VEC3" ? 3 :
                (acc.type == "VEC4" ? 4 :                
                (acc.type == "VEC2" ? 2 :
                    (acc.type == "SCALAR" ? 1 : 1))));
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
                onLoadText(xmlhttp.responseText, xmlhttp.responseText);//?why again do i need this suddenly now
            } else if (xmlhttp.readyState == 4) {
                console.log('textloaded');
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

