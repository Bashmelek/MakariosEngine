
//"Entera" is greek for intestines. Like "entrails"
//
//this will be the messy "guts" of memory

const Entera = (function () {

    var contigua = [];
    var firstContiguum = null;

    var globobjects = [];

    var positions = [];
    var textureCoordinates = [];
    var indices = [];
    var vertexNormals = [];
    var useParentMatrix = [];

    var buffers = {
        positions: [],
        textureCoordinates: [],
        indices: [],
        vertexNormals: [],
        useParentMatrix: [],
        isBuffered: false
    }






    var firstAvailableIndex = 0;

    var createAvailabilityObject = function () {

        return {
            availabilityChain: { 'first': null },
            firstAvailableIndex: 0,
            contiguum : null,
            contiguumIndex : null
        };
    };



    var globalAvailabilityContainer;// = createAvailabilityObject();//{ 'first': null };
    var setNextAvailableIndex = function (holderObj) {
        var avail;
        var theHeld;
        if (!holderObj) {
            avail = globalAvailabilityContainer;
            theHeld = globobjects;//globalAvailabilityContainer.contiguum.flatobjects;
        } else {
            avail = holderObj.availabilityContainer;
            theHeld = holderObj.children;
        }
        var chainToUse = avail.availabilityChain;
        var oldFirst = avail.firstAvailableIndex;
        var newFirst = theHeld.length;

        //if (chainToUse.first && chainToUse.first.val < newFirst) {
        //    newFirst = chainToUse.first.val;
        //    chainToUse.first = chainToUse.first.next;
        //}
        //if (!holderObj) { //we will program for general case later
        //    for (var c = globalAvailabilityContainer.contiguumIndex; c < contigua.length; c++) {
        //        if (contigua[c].end + 1 == newFirst) {
        //            globalAvailabilityContainer.contiguum = contigua[c];
        //            globalAvailabilityContainer.contiguumIndex = c;
        //            c = contigua.length;
        //            //console.log(globalAvailabilityContainer.contiguum);
        //        }
        //    }
        //}

        if (firstContiguum.start > 0) {
            avail.firstAvailableIndex = firstContiguum.start - 1;
        } else {
            avail.firstAvailableIndex = firstContiguum.end + 1;
        }
        //console.log('jext to jill: ' + globalAvailabilityContainer.firstAvailableIndex);

        //avail.firstAvailableIndex = newFirst;
        //console.log('fisrt');
        //console.log(globalAvailabilityContainer.firstAvailableIndex);
        //set contiguum and its index
    };


    var splitContiguum = function (inst, cont, flatindex, prec, contIndex) {
        var avail;
        if (!inst.parent) {
            avail = globalAvailabilityContainer;
        } else {
            avail = globalAvailabilityContainer; //parent.availabilityContainer;
        }
        var chainToUse = avail.availabilityChain;
        //console.log('errrk');
        var oldindex = inst.gindex;
        //console.log(cont);
        //console.log(cont.flatobjects);
        cont.flatobjects[inst.cindex] = null;//cindex
        globobjects[oldindex] = null;
        //if (firstContiguum.start > 0) {
        //    avail.firstAvailableIndex = firstContiguum.start - 1;
        //} else {
        //    avail.firstAvailableIndex = firstContiguum.end + 1;
        //}
        /*
        if (!chainToUse.first || chainToUse.first.val > oldindex) {
            chainToUse.first = { 'val': oldindex, 'next': chainToUse.first };
            firstAvailableIndex = oldindex;
            avail.firstAvailableIndex = oldindex;
        } else {
            var searching = true;
            var currentLink = chainToUse.first;
            while (searching) {
                if (!currentLink.next) {
                    searching = false;
                    currentLink.next = { 'val': oldindex, 'next': null };
                } else if (currentLink.next.val > oldindex) {
                    searching = false;
                    currentLink.next = { 'val': oldindex, 'next': currentLink.next };
                }
                currentLink = currentLink.next;
            }
        } */

        var splitdex = inst.cindex;
        var positionsCountTracker = 0;
        var texturesCountTracker = 0;
        var indicesCountTracker = 0;
        var vertexNormalsCountTracker = 0;
        var useParentCountTracker = 0;

        var newc1 = null;
        var newc2 = null;
        console.log('removing...' + inst.cindex + ' from starts with ' + cont.start + ' is global ' + inst.gindex + ' and contindex is ' + contIndex);
        if (contIndex > 1) {
            //for (var ci = 0; ci < contigua.length; ci++) {
            //    console.log('cont of id ' + ci + ' starts with ' + cont[ci].start + ' ends with ' + cont[ci].end);
            //}
        }

        //
        if(inst.cindex != cont.flatobjects.length - 1) {
            newc2 = createContiguum(inst.gindex + 1, cont.end - inst.gindex, cont.next);
            //console.log('meere starts at ' + newc2.start);
            newc2.end = cont.end;

            //console.log(cont.flatobjects);
            //console.log(cont.flatobjects.slice(splitdex + 1)[0]);
            newc2.flatobjects = cont.flatobjects.slice(splitdex + 1);
            //console.log(newc2.flatobjects[0]);
            newc2.positions = cont.positions.slice(inst.positionsBufferStart + inst.positions.length);
            newc2.textureCoordinates = cont.textureCoordinates.slice(inst.textureCoordinatesBufferStart + inst.textureCoordinates.length);
            newc2.indices = cont.indices.slice(inst.indicesBufferStart + inst.indices.length);
            newc2.vertexNormals = cont.vertexNormals.slice(inst.vertexNormalsBufferStart + inst.vertexNormals.length);
            newc2.useParentMatrix = cont.useParentMatrix.slice(inst.useParentMatrixBufferStart + inst.useParentMatrix.length);
            positionsCountTracker = newc2.flatobjects[0].positionsBufferStart;
            texturesCountTracker = newc2.flatobjects[0].textureCoordinatesBufferStart;
            indicesCountTracker = newc2.flatobjects[0].indicesBufferStart;
            vertexNormalsCountTracker = newc2.flatobjects[0].vertexNormalsBufferStart;
            useParentCountTracker = newc2.flatobjects[0].useParentMatrixBufferStart;
            var newcindex = newc2.flatobjects[0].cindex;

            for (var n = 0; n < newc2.flatobjects.length; n++) {
                newc2.flatobjects[n].cindex -= newcindex;
                newc2.flatobjects[n].positionsBufferStart -= positionsCountTracker;
                newc2.flatobjects[n].textureCoordinatesBufferStart -= texturesCountTracker;
                newc2.flatobjects[n].indicesBufferStart -= indicesCountTracker;
                newc2.flatobjects[n].vertexNormalsBufferStart -= vertexNormalsCountTracker;
                newc2.flatobjects[n].useParentMatrixBufferStart -= useParentCountTracker;
            }

            ////newc2.positions = cont.positions.slice(inst.positions.length);
            ////newc2.textureCoordinates = cont.textureCoordinates.slice(inst.textureCoordinates.length);
            ////newc2.indices = cont.indices.slice(inst.indices.length);
            ////newc2.vertexNormals = cont.vertexNormals.slice(inst.vertexNormals.length);
            ////newc2.useParentMatrix = cont.useParentMatrix.slice(inst.useParentMatrix.length);
            //console.log(splitdex + 1);
            //console.log(newc2.flatobjects);
            if (inst.cindex != 0) {
                if (prec) {
                    prec.next = newc2;
                }
                //console.log('scase 1');
                //contigua[contIndex] = newc2;
            } else {
                if (firstContiguum == cont) {
                    //console.log('scase 44444');
                    contigua[contIndex] = newc2;
                    firstContiguum = newc2;
                    //console.log(contIndex);
                    //console.log(contigua[0]);
                    //console.log(newc2.flatobjects[1]);
                    globalAvailabilityContainer.contiguum = newc2;
                    globalAvailabilityContainer.contiguumIndex = 0;
                } else {
                    //if first, but distant one before it?
                    //console.log('scase 005 ');
                    //console.log(inst.cindex);
                    //console.log(cont.flatobjects.length);

                    contigua[contIndex] = newc2;
                    if (prec) {
                        prec.next = newc2;
                    }
                }
            }
            //console.log(newc2.flatobjects[0]);
        }

        //
        if (inst.cindex != 0) {
            newc1 = createContiguum(cont.start, inst.cindex, newc2);
            //console.log('thissere starts at ' + newc1.start);
            newc1.end = inst.gindex - 1;

            newc1.flatobjects = cont.flatobjects.slice(0, splitdex);
            newc1.positions = cont.positions.slice(0, inst.positionsBufferStart);
            newc1.textureCoordinates = cont.textureCoordinates.slice(0, inst.textureCoordinatesBufferStart);
            newc1.indices = cont.indices.slice(0, inst.indicesBufferStart);
            newc1.vertexNormals = cont.vertexNormals.slice(0, inst.vertexNormalsBufferStart);
            newc1.useParentMatrix = cont.useParentMatrix.slice(0, inst.useParentMatrixBufferStart);

            if (prec) {
                prec.next = newc1;
            }
            if (inst.cindex != cont.flatobjects.length - 1) {
                newc1.next = newc2;//cont.next;
                console.log('scase 20');
                contigua.splice(contIndex, 1, newc1, newc2);
            } else {
                newc1.next = cont.next;
                console.log('scase 303');
                contigua[contIndex] = newc1;
            }
            if (firstContiguum == cont) {
                firstContiguum = newc1;
                contigua[0] = newc1;
                globalAvailabilityContainer.contiguum = newc1;
                globalAvailabilityContainer.contiguumIndex = 0;
            }
            //console.log(newc1.flatobjects[0]);
            //console.log('next to fill: ' + globalAvailabilityContainer.firstAvailableIndex);
        } else if (inst.cindex == cont.flatobjects.length - 1) {
            //if index = 0 and it is the last one. 
            //ie if it is the only one of this cont
            if (prec) {
                prec.next = cont.next;
            }
            if (firstContiguum == cont) {
                if (cont.next) {
                    console.log('scase 60 0');
                    contigua[0] = cont.next;
                    globalAvailabilityContainer.contiguum = cont.next;
                    globalAvailabilityContainer.contiguumIndex = 0;
                } else {//there none?
                    console.log('scase 777')
                    contigua[0] = createContiguum();
                    globalAvailabilityContainer.contiguum = contigua[0];
                    globalAvailabilityContainer.contiguumIndex = 0;
                    firstContiguum = contigua[0];
                    //console.log('next to fill: ' + globalAvailabilityContainer.firstAvailableIndex);
                }
            } else {
                console.log('scase 8__')
                contigua.splice(contIndex, 1);
            }
        }


        if (firstContiguum.start > 0) {
            globalAvailabilityContainer.firstAvailableIndex = firstContiguum.start - 1;
        } else {
            globalAvailabilityContainer.firstAvailableIndex = firstContiguum.end + 1;
        }
        //console.log('next to fill better: ' + globalAvailabilityContainer.firstAvailableIndex);
                
    };

    var linkBufferArrays = function () {
        //console.log('linking up');
        //if (contigua.length > 1) {
        //    //console.log('cccase many');
        //    positions = contigua[0].positions;
        //    textureCoordinates = contigua[0].textureCoordinates;
        //    indices = contigua[0].indices;
        //    vertexNormals = contigua[0].vertexNormals;
        //    useParentMatrix = contigua[0].useParentMatrix;
        //} else {
        //    //console.log('cccase unuoo');
        //    positions = contigua[0].positions.slice(0);
        //    textureCoordinates = contigua[0].textureCoordinates.slice(0);
        //    indices = contigua[0].indices.slice(0);
        //    vertexNormals = contigua[0].vertexNormals.slice(0);
        //    useParentMatrix = contigua[0].useParentMatrix.slice(0);
        //}

        positions = [];
        textureCoordinates = [];
        indices = [];
        vertexNormals = [];
        useParentMatrix = [];

        //var countything = 0;
        ////for (var tt = 0; tt < 1000000; tt++) {
        ////    countything += (tt + Date.now());
        ////}
        //console.log(countything);

        //console.log(contigua);
        var cIndicesBufferCount = 0;
        var objIndicesSoFar = 0;
        var objPositionsSoFar = 0;
        var posOffsetDiff = 0;
        var i;
        //console.log('this many conts ' + contigua.length);

        for (var c = 0; c < contigua.length; c++) {
            ////if (c != 0) {
                positions = positions.concat(contigua[c].positions);
                textureCoordinates = textureCoordinates.concat(contigua[c].textureCoordinates);
                indices = indices.concat(contigua[c].indices);
                vertexNormals = vertexNormals.concat(contigua[c].vertexNormals);
                useParentMatrix = useParentMatrix.concat(contigua[c].useParentMatrix);
            ////} //else { continue; }
            //for (var pb = 0; pb < contigua[c].positions.length; pb++) {
            //    positions.push(contigua[c].positions[pb]);
            //}
            //for (var tb = 0; tb < contigua[c].textureCoordinates.length; tb++) {
            //    textureCoordinates.push(contigua[c].textureCoordinates[tb]);
            //}
            //for (var ib = 0; ib < contigua[c].indices.length; ib++) {
            //    indices.push(contigua[c].indices[ib]);
            //}
            //for (var vb = 0; vb < contigua[c].vertexNormals.length; vb++) {
            //    vertexNormals.push(contigua[c].vertexNormals[vb]);
            //}
            //for (var ub = 0; ub < contigua[c].useParentMatrix.length; ub++) {
            //    useParentMatrix.push(contigua[c].useParentMatrix[ub]);
            //}

            i = 0;
            for (i = 0; i < contigua[c].flatobjects.length; i++) {
                var currentFlatObject = contigua[c].flatobjects[i];
                if (currentFlatObject == null) {
                    console.log('c:' + c + ' i: ' + i);
                    console.log(contigua[c].flatobjects);
                }
                var indexOffsetNumber = currentFlatObject.indicesBufferStart + cIndicesBufferCount;
                currentFlatObject.indexOffset = (indexOffsetNumber) * 2;

                posOffsetDiff = 0;
                var parPosLength = 0;
                if (currentFlatObject.parent) {
                    posOffsetDiff = 168;//contigua[c].flatobjects[i].positionsBufferStart + contigua[c].
                    parPosLength = currentFlatObject.parent.positions.length;
                }
                for (var x = 0; x < currentFlatObject.indices.length; x++) {
                    if (posOffsetDiff != 0 && currentFlatObject.indices[x] < (currentFlatObject.parent.positions.length / 3)) {
                        //use parents offset
                        indices[x + indexOffsetNumber] += ((objPositionsSoFar - posOffsetDiff) / 3);
                        //console.log(indices[x + indexOffsetNumber]);
                    } else {
                        //use own offset
                        indices[x + indexOffsetNumber] += ((objPositionsSoFar - parPosLength) / 3);
                    }
                }
                objPositionsSoFar += currentFlatObject.positions.length;
            }
            cIndicesBufferCount += contigua[c].indices.length;
        }
        //console.log(122);
        //console.log(indices);
        //console.log(positions);

        buffers.isBuffered = false;
        buffers.positions = positions;
        buffers.textureCoordinates = textureCoordinates;
        buffers.indices = indices;
        buffers.vertexNormals = vertexNormals;
        buffers.useParentMatrix = useParentMatrix;

        console.log(indices.length);
        if (contigua.length > 2) {
            console.log('error maybe with this many conts ' + contigua.length);
            for (var ci = 0; ci < contigua.length; ci++) {
                console.log('cont of id ' + ci + ' starts with ' + contigua[ci].start + ' ends with ' + contigua[ci].end + 'blegn ' + contigua[ci].indices.length);
            }
            console.log(indices);
            console.log(indices[indices.length - 1]);
        }
        if (firstContiguum != contigua[0] || globalAvailabilityContainer.contiguum != firstContiguum || globalAvailabilityContainer.contiguumIndex != 0 ) {
            console.log('evil evil error');
        }
    };


    var createContiguum = function (startIndex, length, nextc) {
        var newc = {
            start: (startIndex || 0),
            end: (startIndex || 0) + ((length || 0) - 1),
            next: nextc,

            flatobjects: [],
            positionStart: 0,

            positions: [],
            textureCoordinates: [],
            indices: [],
            vertexNormals: [],
            useParentMatrix: []
        };

        return newc;
    };

    var joinContigua = function (c1, c2) {
        if (true) {//(c1.end == c2.start - 1) {
            //combine
            var c1LastObj = c1.flatobjects[c1.flatobjects.length - 1];

            var newc = {
                start: (c1.start || 0),
                end: (c2.end || (c1.start || -1)),
                next: c2.next,

                flatobjects: c1.flatobjects.concat(c2.flatobjects),

                positions: c1.positions.concat(c2.positions),
                textureCoordinates: c1.textureCoordinates.concat(c2.textureCoordinates),
                indices: c1.indices.concat(c2.indices),
                vertexNormals: c1.vertexNormals.concat(c2.vertexNormals),
                useParentMatrix: c1.useParentMatrix.concat(c2.useParentMatrix)
            };

            var searching = true;
            var prev = null;
            var currCont = contigua[0];
            while (searching) {
                if (currCont.next == c1) {
                    prev = currCont;
                    searching = false;
                } else if (currCont.next == null) {
                    searching = false;
                } else {
                    currCont = currCont.next;
                }
            }

            for (var i = 0; i < c2.flatobjects.length; i++) {
                //c2.flatobjects[i].cindex = i + c1.flatobjects.length;

                c2.flatobjects[i].positionsBufferStart += c1LastObj.positionsBufferStart + c1LastObj.positions.length;
                c2.flatobjects[i].textureCoordinatesBufferStart += c1LastObj.textureCoordinatesBufferStart + c1LastObj.textureCoordinates.length;
                c2.flatobjects[i].indicesBufferStart += c1LastObj.indicesBufferStart + c1LastObj.indices.length;
                c2.flatobjects[i].vertexNormalsBufferStart += c1LastObj.vertexNormalsBufferStart + c1LastObj.vertexNormals.length;
                c2.flatobjects[i].useParentMatrixBufferStart += c1LastObj.useParentMatrixBufferStart + c1LastObj.useParentMatrix.length;

                c2.flatobjects[i].cindex += (c1LastObj.cindex + 1);
            }

            if (prev) {
                prev.next = newc;
            } else if (c1 == firstContiguum) {
                firstContiguum = newc;
            }
            //if (newc.start == 0) {
            //    firstContiguum = newc;
            //}

            return newc;
        }
        console.log('BAD BAD ERROR');
        return null;
    };

    var handleNewObj = function (obj, index) {
        var timestart = Date.now();

        if (!obj.parent || true) {
            var cont = globalAvailabilityContainer.contiguum;
            //console.log(globalAvailabilityContainer.firstAvailableIndex);
            //console.log(cont.end);
            if (globalAvailabilityContainer.firstAvailableIndex == cont.end + 1) {
                //console.log('case push');
                //console.log(cont.positions);
                //console.log('case rezzy');

                cont.end += 1;

                obj.cindex = cont.flatobjects.length;
                obj.gindex = globalAvailabilityContainer.firstAvailableIndex;//cont.start + obj.cindex;
                //console.log(obj.cindex);

                cont.flatobjects.push(obj);
                //globobjects.
                obj.positionsBufferStart = cont.positions.length;
                obj.textureCoordinatesBufferStart = cont.textureCoordinates.length;
                obj.indicesBufferStart = cont.indices.length;
                obj.vertexNormalsBufferStart = cont.vertexNormals.length;
                obj.useParentMatrixBufferStart = cont.useParentMatrix.length;

                cont.positions = cont.positions.concat(obj.positions);
                cont.textureCoordinates = cont.textureCoordinates.concat(obj.textureCoordinates);
                cont.indices = cont.indices.concat(obj.indices);
                cont.vertexNormals = cont.vertexNormals.concat(obj.vertexNormals);
                cont.useParentMatrix = cont.useParentMatrix.concat(obj.useParentMatrix);

                if (cont.next != null && cont.end == cont.next.start - 1) {
                    //combine
                    contigua.splice(globalAvailabilityContainer.contiguumIndex, 2, joinContigua(cont, cont.next));
                    //the current contiguum is different, but the index is going to be the same
                    globalAvailabilityContainer.contiguum = contigua[globalAvailabilityContainer.contiguumIndex];
                    firstContiguum = contigua[0];
                }
            } else if (globalAvailabilityContainer.firstAvailableIndex == 0) {
                //console.log('case wooly');

                if ((cont.start - 1) == globalAvailabilityContainer.firstAvailableIndex) {

                    cont.start -= 1;
                } else {
                    var oldcont = cont;
                    cont = createContiguum(0, 1, oldcont);
                    contigua.splice(0, 0, cont);
                }

                obj.cindex = 0;
                obj.gindex = 0;

                cont.flatobjects.splice(0, 0, obj);
                //globobjects.
                obj.positionsBufferStart = 0;
                obj.textureCoordinatesBufferStart = 0;
                obj.indicesBufferStart = 0;
                obj.vertexNormalsBufferStart = 0;
                obj.useParentMatrixBufferStart = 0;

                cont.positions = obj.positions.concat(cont.positions);
                cont.textureCoordinates = obj.textureCoordinates.concat(cont.textureCoordinates);
                cont.indices = obj.indices.concat(cont.indices);
                cont.vertexNormals = obj.vertexNormals.concat(cont.vertexNormals);
                cont.useParentMatrix = obj.useParentMatrix.concat(cont.useParentMatrix);

                if (cont.flatobjects.length > 1) {
                    for (var co = 1; co < cont.flatobjects.length; co++) {
                        cont.flatobjects[co].cindex += 1;
                        cont.flatobjects[co].positionsBufferStart += obj.positions.length;
                        cont.flatobjects[co].textureCoordinatesBufferStart += obj.textureCoordinates.length;
                        cont.flatobjects[co].indicesBufferStart += obj.indices.length;
                        cont.flatobjects[co].vertexNormalsBufferStart += obj.vertexNormals.length;
                        cont.flatobjects[co].useParentMatrixBufferStart += obj.useParentMatrix.length;
                    }
                }

            } else if (globalAvailabilityContainer.firstAvailableIndex == cont.start - 1) {
                console.log('case yaboba');
                cont.start -= 1;

                obj.cindex = 0;
                obj.gindex = cont.start;
                //console.log(obj.cindex);

                cont.flatobjects.splice(0, 0, obj);
                //globobjects.
                obj.positionsBufferStart = 0;
                obj.textureCoordinatesBufferStart = 0;
                obj.indicesBufferStart = 0;
                obj.vertexNormalsBufferStart = 0;
                obj.useParentMatrixBufferStart = 0;

                cont.positions = obj.positions.concat(cont.positions);
                cont.textureCoordinates = obj.textureCoordinates.concat(cont.textureCoordinates);
                cont.indices = obj.indices.concat(cont.indices);
                cont.vertexNormals = obj.vertexNormals.concat(cont.vertexNormals);
                cont.useParentMatrix = obj.useParentMatrix.concat(cont.useParentMatrix);

                if (cont.flatobjects.length > 1) {
                    for (var fo = 1; fo < cont.flatobjects.length; fo++) {
                        cont.flatobjects[fo].cindex += 1;
                        cont.flatobjects[fo].positionsBufferStart += obj.positions.length;
                        cont.flatobjects[fo].textureCoordinatesBufferStart += obj.textureCoordinates.length;
                        cont.flatobjects[fo].indicesBufferStart += obj.indices.length;
                        cont.flatobjects[fo].vertexNormalsBufferStart += obj.vertexNormals.length;
                        cont.flatobjects[fo].useParentMatrixBufferStart += obj.useParentMatrix.length;
                    }
                }
            } else {
                console.log('case other');
                console.log(globalAvailabilityContainer.firstAvailableIndex);
                console.log(cont);
                return;
            }
        }

        globobjects[globalAvailabilityContainer.firstAvailableIndex] = obj;
        setNextAvailableIndex(null);//obj.parent); parenting?
        linkBufferArrays();
        //console.log(Date.now() - timestart);
        //console.log(obj);
        //console.log(globalAvailabilityContainer.firstAvailableIndex);
    };

    var handleRemovingObj = function (obj) {
        var flatindex = obj.gindex;//still needs to generalize for with children

        var holdingCont = null;
        var beforeHolding = null;
        var contIndex = null;
        //console.log('getting cont for ' + flatindex);
        for (var i = 0; i < contigua.length; i++) {
            //console.log('start ' + contigua[i].start + ' and end ' + contigua[i].end);
            if (contigua[i].start <= flatindex && contigua[i].end >= flatindex) {
                holdingCont = contigua[i];
                contIndex = i;
                i = contigua.length;
            } else {
                beforeHolding = contigua[i];
            }
        }
        if (holdingCont == null) {
            beforeHolding = null;
        }
        //console.log(holdingCont);
        splitContiguum(obj, holdingCont, flatindex, beforeHolding, contIndex);
        var timestart = performance.now();
        linkBufferArrays();

        var timespend = performance.now() - timestart;
        if (timespend > 6.0) {
            console.log('dangerously long time of ' + timespend);
        }
    };

    var preInit = function () {
        contigua[0] = createContiguum();
        globalAvailabilityContainer = createAvailabilityObject();
        globalAvailabilityContainer.contiguum = contigua[0];
        globalAvailabilityContainer.contiguumIndex = 0;
        firstContiguum = contigua[0];
        //console.log(contigua[0].end);
        //console.log('end ');
    };

    preInit();

    return {
        'handleNewObj': handleNewObj,
        'handleRemovingObj': handleRemovingObj,

        'buffers': buffers
    };
})();
