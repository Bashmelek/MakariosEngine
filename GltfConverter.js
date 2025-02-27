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
            theprim = applyNode(object, object.nodes[primaryNodeIndex], glMatrix.mat4.create(), primaryNodeIndex, theprim, null);
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
    
    function getStringFromBufferArray(bufferarray) {
        var batchsize = 1000;
        var asString = "";

        for (var i = 0; i < bufferarray.length; i += batchsize) {
            var buffersegment = bufferarray.slice(i, i + batchsize);
            asString += String.fromCodePoint.apply(null, bufferarray);
        }

        return asString;
    }

    var applyNode = function (fullobject, node, parentmatrix, nodeIndex, newprim, parentprim) {

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
            prim.glnodeCount = node.nodeIndex;
            prim.name = node.name;
        } else {
            orginposlength = prim.positions.length;
            if (prim.glnodeCount < node.nodeIndex) {
                prim.glnodeCount = node.nodeIndex;
            }
        }
        prim.glindex = nodeIndex;
        //prim.matrix = glMatrix.mat4.create();
        var primmatrix = glMatrix.mat4.create();
        var primmatscale = null;
        var primmatrot = null;
        var primmattran = null;
        if (fullobject.skins != null && fullobject.skins.length > 0 && fullobject.skins[0] != null && fullobject.skins[0].joints != null &&
            fullobject.skins[0].joints.length > 0) {
            for (var so = 0; so < fullobject.skins[0].joints.length; so++) {
                if (fullobject.skins[0].joints[so] == prim.glindex) {
                    prim.skellindex = so;
                    var invmatIndex = fullobject.skins[0].inverseBindMatrices;
                    var invmatAcc = fullobject.accessors[invmatIndex];
                    var im = getBufferFromAccessor(fullobject, invmatAcc);

                    prim.inverseBaseMat = glMatrix.mat4.fromValues(im[(so * 16) + 0], im[(so * 16) + 1], im[(so * 16) + 2], im[(so * 16) + 3],
                        im[(so * 16) + 4], im[(so * 16) + 5], im[(so * 16) + 6], im[(so * 16) + 7],
                        im[(so * 16) + 8], im[(so * 16) + 9], im[(so * 16) + 10], im[(so * 16) + 11],
                        im[(so * 16) + 12], im[(so * 16) + 13], im[(so * 16) + 14], im[(so * 16) + 15]);
                    //console.log('prim.inverseBaseMat');
                    //console.log(prim.inverseBaseMat);
                }
            }
        }
        if (node.matrix && node.matrix[0]) {
            var m = node.matrix;
            primmatrix = glMatrix.mat4.fromValues(m[0], m[1], m[2], m[3],
                m[4], m[5], m[6], m[7],
                m[8], m[9], m[10], m[11],
                m[12], m[13], m[14], m[15]);
        }
        if (node.translation) {
            primmattran = glMatrix.mat4.create();
            glMatrix.mat4.translate(primmattran, primmattran, node.translation);
            glMatrix.mat4.translate(primmatrix, primmatrix, node.translation);
        }
        if (node.rotation) {
            primmatrot = glMatrix.mat4.create();
            glMatrix.mat4.fromQuat(primmatrot, node.rotation);
            glMatrix.mat4.multiply(primmatrix, primmatrix, primmatrot);
        }
        prim.primmatrix = primmatrix;
        prim.primmatscale = primmatscale;
        prim.primmatrot = primmatrot;
        prim.primmattran = primmattran;
        //console.log('prim.primmattran');
        //console.log(prim.primmattran);
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
                                if (!fullobject.images[imageIndex].uri) {
                                    console.log('not image uri, must user otherbuffer');  
                                    //var embimg = getBufferStringFromBufferview(fullobject, fullobj.bufferViews[fullobject.images[imageIndex].bufferView]);//getBufferFromAccessor(fullobject, pseudoAcc);
                                    var pseudoAcc = {};
                                    pseudoAcc.bufferView = fullobject.images[imageIndex].bufferView;
                                    pseudoAcc.componentType = 5121;
                                    pseudoAcc.type = "SCALAR";
                                    pseudoAcc.count = 999999999;
                                    console.log('size ' + fullobject.bufferViews[pseudoAcc.bufferView].byteLength + ' with view: ' + pseudoAcc.bufferView);
                                    //thankyou GOT 0 https://stackoverflow.com/questions/9267899/how-can-i-convert-an-arraybuffer-to-a-base64-encoded-string
                                    var asBufferArray = getBufferFromAccessor(fullobject, pseudoAcc);
                                    console.log("newly buffed out. now to TOA");
                                    //var experimentalToa = getStringFromBufferArray(asBufferArray);
                                    //console.log('experiment worked');
                                    //var preThoa = String.fromCodePoint.apply(null, asBufferArray);//fromCharCode
                                    //console.log("could pretoa:" + preThoa);
                                    //var thethoa = btoa(String.fromCodePoint.apply(null, asBufferArray));
                                    //console.log("could toa:" + thethoa);
                                    //console.log(asBufferArray);
                                    fullobject.images[imageIndex].uri = "data:image/png;base64," + btoa(getStringFromBufferArray(asBufferArray));//btoa(String.fromCodePoint.apply(null, asBufferArray));//String.fromCodePoint
                                    //console.log(fullobject.images[imageIndex].uri);
                                    //console.log(pnguri);
                                    image.src = fullobject.images[imageIndex].uri;// 'plainsky.jpg';//fullobject.images[imageIndex].uri;
                                    prim.textureUrl = fullobject.images[imageIndex].uri;// 'plainsky.jpg';//fullobject.images[imageIndex].uri;
                                    console.log('loaded otherbuffer');  
                                } else {
                                    image.src = fullobject.images[imageIndex].uri;
                                    prim.textureUrl = fullobject.images[imageIndex].uri;
                                }
                                

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
                        console.log(posAcc);
                        var posarray = getBufferFromAccessor(fullobject, posAcc);
                        //todo george put math funcs own section
                        linTransformRange(posarray, posarray, primmatrix, 0, posarray.length);
                        if (isnew) {
                            prim.positions = posarray;
                        } else {
                            prim.positions = prim.positions.concat(posarray);
                        }
                        
                        var texarray;
                        if (meshObj.primitives[0].attributes.TEXCOORD_0 != undefined && meshObj.primitives[0].attributes.TEXCOORD_0 != null) {
                            var texIndex = meshObj.primitives[0].attributes.TEXCOORD_0;
                            var texAcc = fullobject.accessors[texIndex];
                            //console.log('TEXCOORD_0');
                            texarray = getBufferFromAccessor(fullobject, texAcc);
                            //console.log('texarray');
                            //console.log(texarray);
                            for (var txi = 0; txi < texarray.length; txi++) {
                                if (txi % 3 == 2) {
                                    texarray.splice(txi, 0, 1.0);
                                } else if (txi == texarray.length - 1) {
                                    texarray.splice(txi + 1, 0, 1.0);
                                    txi = texarray.length;
                                } else if (texarray[txi] < 0) {
                                    //texarray[txi] = 1.0;
                                }
                                if (texarray[txi] < .01) { texarray[txi] = 0.0; }
                            }
                        } else {
                            texarray = new Float32Array(prim.positions.length);
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
                           // console.log(texarray);
                            prim.textureCoordinates = texarray;
                        } else {
                            //prim.textureCoordinates = prim.textureCoordinates.concat(texarray);
                            prim.textureCoordinates = texarray;
                        }

                    }
                    if (meshObj.primitives[0].indices != undefined && meshObj.primitives[0].indices != null) {
                        var inIndex = meshObj.primitives[0].indices;
                        var inAcc = fullobject.accessors[inIndex];
                        console.log(orginposlength);
                        var inarray = getBufferFromAccessor(fullobject, inAcc);
                        for (var ia = 0; ia < inarray.length; ia++) {
                            inarray[ia] += orginposlength / 3;
                        }
                        if (isnew) {
                            prim.indices = inarray;//[0, 1, 2, 1, 3, 2];// inarray;????todo
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
                    } else {
                        var normarr = calculateNorms(prim.positions, prim.indices);
                        //var normarr = new Float32Array(prim.positions.length);
                        //for (var nci = 0; nci < normarr.length; nci++) {
                        //    if (nci % 3 == 2) {
                        //        normarr[nci] = 1.0;
                        //    //} else if (tci % 3 == 1) {
                        //    //    texarray[tci] = 0.2;
                        //    }else {
                        //        normarr[nci] = 0.0;
                        //    }
                        //}
                        if (isnew) {
                            prim.vertexNormals = normarr;
                        } else {
                            prim.vertexNormals = prim.normarr.concat(normarray);
                        }
                    }

                    //skeleton attributes aka skin: JOINTS_0 and WEIGHTS_0
                    if (meshObj.primitives[0].attributes.JOINTS_0 != undefined && meshObj.primitives[0].attributes.JOINTS_0 != null) {
                        var joIndex = meshObj.primitives[0].attributes.JOINTS_0;
                        console.log(joIndex);
                        var joAcc = fullobject.accessors[joIndex];
                        console.log(joAcc);
                        var joarray = getBufferFromAccessor(fullobject, joAcc);
                        console.log('JOJOJOJO');
                        console.log(joarray);
                        if (isnew) {
                            prim.skellyjoints = joarray;
                        } else {
                            prim.skellyjoints = prim.positions.concat(joarray);
                        }
                    }
                    if (meshObj.primitives[0].attributes.WEIGHTS_0 != undefined && meshObj.primitives[0].attributes.WEIGHTS_0 != null) {
                        var weiIndex = meshObj.primitives[0].attributes.WEIGHTS_0;
                        var weiAcc = fullobject.accessors[weiIndex];
                        var weiarray = getBufferFromAccessor(fullobject, weiAcc);
                        if (isnew) {
                            prim.skellyweights = weiarray;
                        } else {
                            prim.skellyweights = prim.positions.concat(weiarray);
                        }

                    }
                }
                //add targets used for morph weights
                if (meshObj.primitives[0].targets != undefined && meshObj.primitives[0].targets != null) {
                    //
                    if (prim.morphPosArrays == null) {
                        prim.morphPosArrays = [];
                    }
                    for (var mp = 0; mp < meshObj.primitives[0].targets.length; mp++) {
                        var mpIndex = meshObj.primitives[0].targets[mp].POSITION;
                        var mpAcc = fullobject.accessors[mpIndex];
                        console.log(mpAcc);
                        var mparray = getBufferFromAccessor(fullobject, mpAcc);
                        prim.morphPosArrays.push(mparray);
                    }
                }

            }

            if (meshObj.weights && meshObj.weights.length > 0) {
                if (isnew || !prim.weights) {
                    prim.weights = meshObj.weights.slice(0);
                } else {
                    //might need extra logic for notnew
                    prim.weights = prim.weights.concat(meshObj.weights);
                }
            }
        }
        if (node.skin != undefined && node.skin != null) {
            //todo george skinning stuffing
            var skinobj = fullobject.skins[node.skin];
            prim.isSkellyHolder = true;
            //prim.skellynodes = skinobj.joints;
            prim.skeletonkey = {};
            prim.skeletonkey.skellynodes = new Array(skinobj.joints.length).fill().map(function (x, ind) {
                return {
                    glindex: skinobj.joints[ind],
                    skellindex: ind,
                    nodeobj: null,
                    skeletonid: node.skin,
                }
            });
            prim.skeletonkey.rootskellynodeindexes = null;

            prim.skeletonkey.glrootskellynodeID = fullobject.skins[node.skin].skeleton;
            if (prim.skeletonkey.glrootskellynodeID) {
                for (var sk = 0; sk < skinobj.joints.length; sk++) {
                    if (skinobj.joints[sk] == prim.skeletonkey.glrootskellynodeID) {
                        prim.skeletonkey.rootskellynodeindexes = [sk];
                    }
                }
            } else {
                //else find all joints without parent
                ////for (var sk2 = 0; sk2 < skinobj.joints.length; sk2++) {
                    //todo that thing
                    //console.log('i am the holder');
                    //console.log(prim);
                    prim.skeletonkey.rootskellynodeindexes = findRootSkeletonNodes(fullobject);
                ////}
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
                innerprim = applyNode(fullobject, fullobject.nodes[node.children[t]], glMatrix.mat4.create(), node.children[t], innerprim, prim);
                innerprim.rootID = node.children[t];
                if (innerprim.glnodeCount > prim.nodeIndex) {
                    prim.glnodeCount = innerprim.glnodeCount;
                }
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
                } else if (fullobject.animations[i].channels[c].target.path == "weights") {
                    animComp.type = Makarios.animTypeMorph;
                } else if (fullobject.animations[i].channels[c].target.path == "translation") {
                    animComp.type = Makarios.animTypeTrans;
                }
                else {
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

    //var getBufferStringFromBufferview = function(fullobj, bv) {

    //    var binary;
    //    if (fullobj.binaryBuffers[bv.buffer]) {
    //        //console.log('casey 0' + bv.buffer);
    //        //console.log(fullobj.binaryBuffers[bv.buffer]);
    //        binary = fullobj.binaryBuffers[bv.buffer];
    //    } else {
    //        var buffStart = 0;//("data:application/octet-stream;base64,").length;// 0;
    //        if (fullobj.buffers[bv.buffer].uri.startsWith("data:application/octet-stream;base64,")) {
    //            buffStart = ("data:application/octet-stream;base64,").length;
    //        } else if (fullobj.buffers[bv.buffer].uri.startsWith("data:image/png;base64,")) {
    //            buffStart = ("data:image/png;base64,").length;
    //        } else {
    //            buffStart = ("data:application/gltf-buffer;base64,").length;
    //        }

    //        //console.log(fullobj.buffers[bv.buffer].uri.substring(buffStart));
    //        fullobj.binaryBuffers[bv.buffer] = _base64ToArrayBuffer(fullobj.buffers[bv.buffer].uri.substring(buffStart));
    //        bufferstring = fullobj.binaryBuffers[bv.buffer];
    //    }

    //    var start = (bv.byteOffset || 0);
    //    var bufferSize = bv.byteLength;

    //    return binary.substring(start, bufferSize);
    //}

    var getBufferFromAccessor = function (fullobj, acc) {

        var array = new Array();
        var bv = fullobj.bufferViews[acc.bufferView];
        var binary;
        if (fullobj.binaryBuffers[bv.buffer]) {
            //console.log('casey 0' + bv.buffer);
            //console.log(fullobj.binaryBuffers[bv.buffer]);
            binary = fullobj.binaryBuffers[bv.buffer];
        } else {
            var buffStart = 0;//("data:application/octet-stream;base64,").length;// 0;
            if (fullobj.buffers[bv.buffer].uri.startsWith("data:application/octet-stream;base64,")) {
                buffStart = ("data:application/octet-stream;base64,").length;
            } else if (fullobj.buffers[bv.buffer].uri.startsWith("data:image/png;base64,")) {
                buffStart = ("data:image/png;base64,").length;
            } else {
                buffStart = ("data:application/gltf-buffer;base64,").length;
            }

            //console.log(fullobj.buffers[bv.buffer].uri.substring(buffStart));
            fullobj.binaryBuffers[bv.buffer] = _base64ToArrayBuffer(fullobj.buffers[bv.buffer].uri.substring(buffStart));
            binary = fullobj.binaryBuffers[bv.buffer];
        }
        var start = ((acc.byteOffset || 0) + (bv.byteOffset || 0));
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
                        (acc.type == "MAT4" ? 16 :
                    (acc.type == "SCALAR" ? 1 : 1)))));
            typedArray = Uint16Array;
        } else if (acc.componentType == 5126) { //FLOAT, 4 bytes
            //var floatView = new Float32Array(buffer);
            typedArray = Float32Array;
            unitSize = 4 * (acc.type == "VEC3" ? 3 :
                (acc.type == "VEC4" ? 4 :                
                    (acc.type == "VEC2" ? 2 :
                        (acc.type == "MAT4" ? 16 :
                    (acc.type == "SCALAR" ? 1 : 1)))));
        } else if (acc.componentType == 5121) { //FLOAT, 4 bytes
            //var floatView = new Float32Array(buffer);
            typedArray = Uint8Array;
            unitSize = 1 * (acc.type == "VEC3" ? 3 :
                (acc.type == "VEC4" ? 4 :
                    (acc.type == "VEC2" ? 2 :
                        (acc.type == "MAT4" ? 16 :
                            (acc.type == "SCALAR" ? 1 : 1)))));
        }
        var bufferEndSize = Math.min(bv.byteLength, acc.count * unitSize);
        var inc = bv.byteStride ? bv.byteStride : unitSize;
        var addedBytes = 0;
        //console.log(binary);
        var givenMax = null;
        var givenMin = null;
        var dodirect = acc.type == "SCALAR" && inc == unitSize && unitSize == 1;// bufferEndSize == 69874 ? true : false;
        if (dodirect) { array = new Array(bufferEndSize); }
        //array = new Array(bufferEndSize);
        var totalNumAdded = 0;
        for (var c = start; addedBytes < bufferEndSize; c += inc) {
            var valsToAdd = new typedArray(binary.slice(c, c + unitSize)).slice(0);
            var valsToAddTrue = [];
            //console.log(start);
            //console.log(c);
            //console.log(unitSize);
            //console.log(inc);

            for (var v = 0; v < valsToAdd.length; v++) {

                valsToAddTrue.push(valsToAdd[v]);
            }

            if (acc.type == "SCALAR") {
                if (givenMax == null || givenMax < valsToAddTrue[0]) {
                    givenMax = valsToAddTrue[0];
                }
                if (givenMin == null || givenMin > valsToAddTrue[0]) {
                    givenMin = valsToAddTrue[0];
                }
            }

            //array = array.concat(valsToAddTrue);
            if (dodirect) {
                for (var a = 0; a < valsToAddTrue.length; a++) {

                array[totalNumAdded + a] = valsToAddTrue[a];
                }
            }
            else { array = array.concat(valsToAddTrue); }
            //for (var a = 0; a < valsToAddTrue.length; a++) {

            //    array[totalNumAdded + a] = valsToAddTrue[a];
            //}
            totalNumAdded += valsToAddTrue.length;
            addedBytes += unitSize;
        }
        if (dodirect && bufferEndSize != totalNumAdded) {
            console.log('total predicted:' + bufferEndSize + ' and tota bytes:' + totalNumAdded);
        }
        //console.log('total predicted:' + bufferEndSize + ' and tota bytes:' + totalNumAdded);
        if (acc.type == "SCALAR" && acc.max != null && acc.max[0] != null && givenMax != null && acc.componentType == 5123) {
            var divisor = givenMax / acc.max[0];
            //console.log('EEEEEHHH');
            for (var im = 0; im < array.length; im++) {
                array[im] = array[im] / divisor;
            }
        }
        //may need to consider bufferview target
        return array;
    }

    var findRootSkeletonNodes = function (fullobj) {
        var rootskellynodes = [];
        var memoizedParents = [];
        var skinobj = fullobj.skins[0];

        for (var s = 0; s < skinobj.joints.length; s++) {
            //findRootSkeletonNodesRecursive(rootskellynodes, fullobj, memoizedParents);
            var hasParent = false;
            for (var i = 0; i < skinobj.joints.length; i++) {
                if (fullobj.nodes[i].children != null) {
                    for (var c = 0; c < fullobj.nodes[i].children.length; c++) {
                        if (fullobj.nodes[i].children[c] == skinobj.joints[s]) {
                            hasParent = true;
                        }
                    }
                }
            }
            if (!hasParent) {
                rootskellynodes.push(s);
            }
        }        

        return rootskellynodes;
    };

    var findRootSkeletonNodesRecursive = function (results, fullobj, memoizedParents) {

    };

    function calculateNorms(pos, ind) {
        var normarr = new Float32Array(pos.length);

        for (var i = 0; i < ind.length; i += 3) {

            var v1 = [pos[(i + 1) * 3 + 0] - pos[i * 3 + 0], pos[(i + 1) * 3 + 1] - pos[i * 3 + 1], pos[(i + 1) * 3 + 2] - pos[i * 3 + 2]];
            var v2 = [pos[(i + 2) * 3 + 0] - pos[i * 3 + 0], pos[(i + 2) * 3 + 1] - pos[i * 3 + 1], pos[(i + 2) * 3 + 2] - pos[i * 3 + 2]];
            var vx = [0.0, 0.0, 0.0];
            var vres = [0.0, 0.0, 0.0];
            //console.log(vres);
            glMatrix.vec3.normalize(vres, glMatrix.vec3.cross(vx, v1, v2));
            normarr[i * 3 + 0] = vres[0];
            normarr[(i + 1) * 3 + 0] = vres[0];
            normarr[(i + 2) * 3 + 0] = vres[0];

            normarr[i * 3 + 1] = vres[1];
            normarr[(i + 1) * 3 + 1] = vres[1];
            normarr[(i + 2) * 3 + 1] = vres[1];

            normarr[i * 3 + 2] = vres[2];
            normarr[(i + 1) * 3 + 2] = vres[2];
            normarr[(i + 2) * 3 + 2] = vres[2];
        }

        if (false || true) {
            var finnorm = normarr.slice(0);
            for (var c = 0; c < ind.length; c++) {
                //smooth shading
                var ishare = [];
                var newv = [0.0, 0.0, 0.0];
                //for (var s = 0; s < ind.length; s++) {
                for (var s = 0; s < ind.length; s += 3) {
                    if (ind[s] == ind[c] || ind[s + 1] == ind[c] || ind[s + 2] == ind[c] || 
                        (pos[s * 3 + 0] == pos[c * 3 + 0] && pos[s * 3 + 1] == pos[c * 3 + 1] && pos[s * 3 + 2] == pos[c * 3 + 2]) ||
                        (pos[(s + 1) * 3 + 0] == pos[c * 3 + 0] && pos[(s + 1) * 3 + 1] == pos[c * 3 + 1] && pos[(s + 1) * 3 + 2] == pos[c * 3 + 2]) ||
                        (pos[(s + 2) * 3 + 0] == pos[c * 3 + 0] && pos[(s + 2) * 3 + 1] == pos[c * 3 + 1] && pos[(s + 2) * 3 + 2] == pos[c * 3 + 2])) {
                        ishare.push(ind[s]);
                        ishare.push(ind[s + 1]);
                        ishare.push(ind[s + 2]);
                    }
                }
                for (var p = 0; p < ishare.length; p++) {
                    newv = [newv[0] + normarr[ishare[p] * 3 + 0], newv[1] + normarr[ishare[p] * 3 + 1], newv[2] + normarr[ishare[p] * 3 + 2]];
                }
                glMatrix.vec3.normalize(newv, newv);
                //for (var p2 = 0; p2 < ishare.length; p2++) {
                //    finnorm[ishare[c] * 3 + 0] = newv[0];
                //    finnorm[ishare[c] * 3 + 1] = newv[1];
                //    finnorm[ishare[c] * 3 + 2] = newv[2];
                //}
                finnorm[c * 3 + 0] = newv[0];
                finnorm[c * 3 + 1] = newv[1];
                finnorm[c * 3 + 2] = newv[2];
            }
            normarr = finnorm;
        }

        return normarr;
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

