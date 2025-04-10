// JavaScript source code


const FrameLogic = (function () {

    var keystates = new Array(256).fill().map(x => false);
    var spaceWasDown = { value: false };

    var framenum = 0;

    var onFrame = function () {
        //console.log('why lparen why')
        framenum++;

        //just for mainChar right now, who has yrot
        if (StageData.objects[0].yrot != null) {

            var theobj = StageData.objects[0];
            theobj.isRunning = false;
            var facing = theobj.Actor ? theobj.Actor.yrot : theobj.yrot;

            if (keystates[87] && !keystates[83]) {//w key
                tryMoveObject(theobj, [Math.sin(facing) * theobj.baseSpeed * StageData.timeDelta * 0.18, 0.0, Math.cos(facing) * theobj.baseSpeed * StageData.timeDelta * 0.18]);
                theobj.isRunning = true;
            }
            if (keystates[83] && !keystates[87]) {//s key
                tryMoveObject(theobj, [Math.sin(facing) * -theobj.baseSpeed * StageData.timeDelta * 0.18, 0.0, Math.cos(facing) * -theobj.baseSpeed * StageData.timeDelta * 0.18]);
                theobj.isRunning = true;
            }

            //if (keystates[37] && !keystates[39]) {//right
            //    tryMoveObject(StageData.objects[0], [-0.07, 0.0, 0.0]);
            //}
            //if (keystates[39] && !keystates[37]) {//left
            //    tryMoveObject(StageData.objects[0], [0.07, 0.0, 0.0]);
            //}
            //if (keystates[38] && !keystates[40]) {//upkey
            //    tryMoveObject(StageData.objects[0], [0.0, 0.0, -0.07]);
            //}
            //if (keystates[40] && !keystates[38]) {//down
            //    tryMoveObject(StageData.objects[0], [0.0, 0.0, 0.07]);
            //}
            if (keystates[65] && !keystates[68]) {
                tryRotateObject(theobj, theobj.baseRotSpeed * StageData.timeDelta * 0.18, theobj.Actor);
            }
            if (keystates[68] && !keystates[65]) {
                tryRotateObject(theobj, -theobj.baseRotSpeed * StageData.timeDelta * 0.18, theobj.Actor);
            }
            if (keystates[32]) {
                if (!spaceWasDown.value) {
                    tryJump(StageData.objects[0]);
                    spaceWasDown.value = true;
                }
            }
        }
                       

        applyVeleocity();
        applyGravityAndGround();
        checkAxisAlignedCollideTriggers(StageData.objects[0]);

        if (theobj.Actor) {
            const x = 12;
            const y = 13;
            const z = 14;

            theobj.Actor.matrix[x] = theobj.matrix[x];
            theobj.Actor.matrix[y] = theobj.matrix[y];
            theobj.Actor.matrix[z] = theobj.matrix[z];
        }
    }

    var tryMoveObject = function (object, vec) {
        const x = 12;
        const y = 13;
        const z = 14;


        var probx = object.matrix[x] + vec[0];
        var proby = object.matrix[y] + vec[1];
        var probz = object.matrix[z] + vec[2];
        
        var botOffset = (object.collider ? object.collider.bot || 0.0 : 0.0);
        //console.log(probx + ', ' + proby + ', ' + probz);


        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] && StageData.objects[oo] != object && oo != 3) {
                var other = StageData.objects[oo];
                if (!other || !other.collider || !object || !object.collider || other.isAABoxTrigger || (object.isAABoxTrigger && other.id == 0)) { continue; }
                if (object.collider && object.collider.type == 'rotationlesscylinder' && other.collider && other.collider.type == 'rotationlesscylinder') {
                    var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
                    var movemag = Math.sqrt(movsquared);
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;
                    //var maxrad = (other.collider.radius + object.collider.radius);//Math.max(other.collider.radius, object.collider.radius);
                    var maxallowedrad = (other.collider.radius + object.collider.radius);
                    var maxradsquared = (other.collider.radius + object.collider.radius) * (other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    var vectorsMapToRelative = vec[0] != 0.0 ? [0, 2, 1] : [2, 0, 1];
                    var relativeVector = [movemag, 0.0, 0.0];//main, other, other; right handed system
                    if (maxallowedrad > centerdist && (Math.abs(oy - proby) < (other.collider.hheight + object.collider.hheight + botOffset + 0.0001))) {

                        //var incursionz;
                        //var incursionpoint = [ , 0.0, ];
                        ////var lineAngle = Math.atan((proby - object.matrix[y]) / (probx - object.matrix[x]));
                        ////if (probx - object.matrix[x] == 0) { lineAngle = Math.PI / 2.0; }
                        var lineAngle;
                        if (vec[0] > 0) {
                            lineAngle = Math.PI;
                        } else if (vec[0] < 0) {
                            lineAngle = 0.0;
                        } else if (vec[2] > 0) {
                            lineAngle = -Math.PI / 2.0;
                        } else if (vec[2] < 0) {
                            lineAngle = Math.PI / 2.0;
                        }
                        //var incursionpoint = [Math.abs(Math.abs(probx - ox) - Math.abs(object.collider.radius * (Math.cos(lineAngle)))), 0.0, Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle))))];
                        //var rotator = mat4.create();
                        //mat4.rotate(rotator,  // destination matrix
                        //    rotator,  // matrix to rotate
                        //    -lineAngle,   // amount to rotate in radians
                        //    [0, 1, 0]);
                        //var rotatedIncursionPoint = useYRotToGetRotatedVectors(rotator, incursionpoint);
                        //console.log(' Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle)))) ' + Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle)))));
                        //console.log('incursionpoint ' + incursionpoint);
                        //console.log('rotatedIncursionPoint ' + rotatedIncursionPoint);
                        var intersectionArcSin = Math.asin(-diffz / centerdist);//Math.asin(rotatedIncursionPoint[2] / other.collider.radius);
                        if (diffx < 0) { intersectionArcSin = Math.PI - intersectionArcSin; }
                        var tangentAngle = (Math.PI / 2.0) + intersectionArcSin;
                        var component = Math.cos(tangentAngle - lineAngle);
                        if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(Math.PI / 2.0 - lineAngle) < 0.0001) { component = -component; }

                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));
                        //console.log('bump ' + ratior + ' -- ' + diffor);

                        if (allowedmove < relativeVector[0]) {
                            //console.log('diffx : ' + diffx);
                            //console.log('tofrom: ' + (proby - object.matrix[y]) + ', ' + (probx - object.matrix[x]));
                            //console.log(component + '  ' + tangentAngle + '  ' + lineAngle + ' ' + (other.collider.radius - maxallowedrad + centerdist) + ' ++ ' + diffor + ' ++ ' + other.collider.radius);
                            //console.log('intersectionArcSin ' + Math.asin((other.collider.radius - maxallowedrad + centerdist) / other.collider.radius) + ' aka ' + intersectionArcSin);
                            //console.log('tangentAngle ' + ((Math.PI / 2.0) - intersectionArcSin) + ' aka ' + tangentAngle);
                            //console.log('lineAngle ' + Math.atan((proby - object.matrix[y]) / (probx - object.matrix[x])) + ' aka ' + lineAngle);
                            //console.log('component ' + Math.cos(tangentAngle - lineAngle) + ' aka ' + component);
                            relativeVector = [(allowedmove - [0.00001]), -component * diffor, 0.0];
                            vec[vectorsMapToRelative[0]] = Math.sign(vec[vectorsMapToRelative[0]]) * relativeVector[0];
                            vec[vectorsMapToRelative[1]] = relativeVector[1];
                            vec[vectorsMapToRelative[2]] = relativeVector[2];
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            //console.log(vec);
                        }

                        /* //this might be needed later. PLEASE KEEAAP!!
                        if (ratior <= 1 || diffor >= Math.sqrt(movsquared)) {
                            console.log('AAAAAHHH');
                            vec[0] = 0;
                            vec[1] = 0;
                            vec[2] = 0;
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                        } else {

                            if (ratior > 100) {
                                vec[0] = 0;
                                vec[1] = 0;
                                vec[2] = 0;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            } else {

                                vec[0] = vec[0] / ratior;
                                vec[1] = vec[1] / ratior;
                                vec[2] = vec[2] / ratior;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            }
                        }*/ //as noted above, DO NOT ERASE!#!
                    }
                } if (object.collider && object.collider.type == 'rotationlesscylinder' && other.collider && other.collider.type == 'yrotbox') {//if this a cyl and that a rect

                    //not yet implemented fully, still making
                    var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
                    var movemag = Math.sqrt(movsquared);
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;

                    var lineAngle;
                    if (vec[0] > 0) { lineAngle = Math.PI; } else if (vec[0] < 0) { lineAngle = 0.0; }
                    else if (vec[2] > 0) { lineAngle = -Math.PI / 2.0; } else if (vec[2] < 0) { lineAngle = Math.PI / 2.0; }

                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                        0.0, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, 0.0,
                    -other.collider.hdepth, 0.0, -other.collider.hwidth,
                        0.0, 0.0, -other.collider.hwidth,
                    other.collider.hdepth, 0.0, -other.collider.hwidth,
                    other.collider.hdepth, 0.0, 0.0,
                    ];
                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords, other.collider.invmat);
                    var quadrantsRanges = [];
                    var positiveDiffAngle = (Math.atan2(diffz, diffx) + (Math.PI * 2.0)) % (Math.PI * 2.0);
                    var mindex = 0;
                    var minval = Math.PI * 2.0;
                    var inQuad = 0;
                    for (var cc = 0; cc < 4; cc++) {
                        var angleRadians = (Math.atan2(initialrotatedboxcoords[6 * cc + 2], initialrotatedboxcoords[6 * cc + 0]) + (Math.PI * 2.0)) % (Math.PI * 2.0);
                        quadrantsRanges.push(angleRadians);
                        if (angleRadians < minval) {
                            mindex = cc;
                            minval = angleRadians;
                        }
                    }
                    var foundInQuadGreaterThanMin = false;
                    inQuad = (mindex + 4 - 1) % 4;
                    for (var bc = 0; bc < 4; bc++) {
                        var dexy = (mindex + bc) % 4;
                        if (quadrantsRanges[dexy] < positiveDiffAngle && quadrantsRanges[(dexy + 1) % 4] > positiveDiffAngle) {
                            inQuad = dexy;
                            break;
                        }
                    }
                    var centerpoint = [initialrotatedboxcoords[6 * inQuad + 3 + 0], initialrotatedboxcoords[6 * inQuad + 3 + 1], initialrotatedboxcoords[6 * inQuad + 3 + 2]];
                    var distFromCenterpoint = Math.sqrt(centerpoint[0] * centerpoint[0] + centerpoint[2] * centerpoint[2]);
                    var angleFromCenterpoint = Math.abs(positiveDiffAngle - ((Math.atan2(centerpoint[2], centerpoint[0]) + (Math.PI * 2.0)) % (Math.PI * 2.0)));
                    var myradius = distFromCenterpoint * (1.0 / (Math.cos(angleFromCenterpoint)))
                    ////console.log('quaaaadd: ' + inQuad + ' from quads: ' + quadrantsRanges);
                    ////console.log('myradius: ' + myradius);
                    ////console.log('distFromCenterpoint: ' + distFromCenterpoint);
                    ////var quadrantsRanges = [Math.asin(other.matrix[2]) ]

                    var maxallowedrad = object.collider.radius + myradius;//(other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    var vectorsMapToRelative = vec[0] != 0.0 ? [0, 2, 1] : [2, 0, 1];
                    var relativeVector = [movemag, 0.0, 0.0];//main, other, other; right handed system
                    if (maxallowedrad > centerdist && (Math.abs(oy - proby) < (other.collider.hheight + botOffset + object.collider.hheight + 0.0001))) {

                        //not finding a round intersection tangent its just the angle of the face
                        //var intersectionArcSin = Math.asin(-diffz / centerdist);
                        //if (diffx < 0) { intersectionArcSin = Math.PI - intersectionArcSin; }
                        var quadAngle = ((Math.atan2(initialrotatedboxcoords[6 * inQuad + 0 + 2] - centerpoint[2], initialrotatedboxcoords[6 * inQuad + 0 + 0] - centerpoint[0]) + (Math.PI * 2.0)) % (Math.PI * 2.0));
                        var tangentAngle = quadAngle;//(Math.PI / 2.0) + intersectionArcSin;
                        ////console.log('tangentAngle: ' + tangentAngle * 180.0 / Math.PI);
                        var component = Math.cos(tangentAngle - lineAngle);
                        ////console.log('component: ' + component);
                        //if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(Math.PI / 2.0 - lineAngle) < 0.0001) { component = -component; }
                        if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(-Math.PI / 2.0 - lineAngle) < 0.0001) { component = -component; }

                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));

                        if ((Math.abs(oy - object.matrix[y]) > (other.collider.hheight + botOffset + object.collider.hheight - 0.0001))) {
                            if (oy < object.matrix[y]) {
                                vec[1] = -(object.matrix[y] - oy - (other.collider.hheight + botOffset + object.collider.hheight + 0.0001));
                                proby = object.matrix[y] + (vec[1]);
                                object.isGrounded = true;
                                object.confirmGrounded = true;
                                object.velocity.y = 0.0;
                            } else {
                                vec[1] = other.matrix[y] - object.matrix[y] - (other.collider.hheight + botOffset + object.collider.hheight + 0.0001);
                                proby = object.matrix[y] + (vec[1]);
                                //other.isGrounded = true;
                                object.velocity.y = 0.0;
                            }
                        } else if (allowedmove < relativeVector[0] && !isNaN(component)) {
                            relativeVector = [(allowedmove - [0.00001]), -component * diffor, 0.0];
                            vec[vectorsMapToRelative[0]] = Math.sign(vec[vectorsMapToRelative[0]]) * relativeVector[0];
                            vec[vectorsMapToRelative[1]] = relativeVector[1];
                            vec[vectorsMapToRelative[2]] = relativeVector[2];
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            //console.log(object.matrix[x] + ' -- ' + object.matrix[y] + ' -- ' + object.matrix[z]);
                            //console.log(vec);
                        }
                    }

                } else if (other.collider && other.collider.type == 'yrotbox' && object.collider) {
                    //two yrotbox
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];

                    var objectOriginBeforeMove = new Array(3);
                    objectOriginBeforeMove[0] = object.matrix[x] - ox;
                    objectOriginBeforeMove[1] = object.matrix[y] - oy;
                    objectOriginBeforeMove[2] = object.matrix[z] - oz;

                    var obotOffset = (other.collider ? other.collider.bot || 0.0 : 0.0);// - other.collider.hheight;
                    var otherboxcoords = [other.collider.hdepth, obotOffset, other.collider.hwidth,
                        -other.collider.hdepth, obotOffset, other.collider.hwidth,
                        other.collider.hdepth, obotOffset, -other.collider.hwidth,
                        -other.collider.hdepth, obotOffset, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, botOffset, object.collider.hwidth,
                        -object.collider.hdepth, botOffset, object.collider.hwidth,
                        object.collider.hdepth, botOffset, -object.collider.hwidth,
                        -object.collider.hdepth, botOffset, -object.collider.hwidth,
                    ];
                    //var basisx = [boxcoords[0] - boxcoords[6], 0.0, boxcoords[2] - boxcoords[8]];
                    //var basisz = [boxcoords[0] - boxcoords[9], 0.0, boxcoords[2] - boxcoords[11]];
                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords, object.collider.invmat, 1);
                    var objectCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    //objectCoordsBeforeMove.push(object.matrix[x] - ox);
                    //objectCoordsBeforeMove.push(object.matrix[y] - oy);
                    //objectCoordsBeforeMove.push(object.matrix[z] - oz);
                    for (var irc = 0; irc < (initialrotatedboxcoords.length / 3); irc++) {
                        objectCoordsBeforeMove[irc * 3 + 0] = initialrotatedboxcoords[irc * 3 + 0] + object.matrix[x] - ox;
                        objectCoordsBeforeMove[irc * 3 + 1] = initialrotatedboxcoords[irc * 3 + 1] + object.matrix[y] - oy;
                        objectCoordsBeforeMove[irc * 3 + 2] = initialrotatedboxcoords[irc * 3 + 2] + object.matrix[z] - oz;

                        initialrotatedboxcoords[irc * 3 + 0] += probx;
                        initialrotatedboxcoords[irc * 3 + 1] += proby;
                        initialrotatedboxcoords[irc * 3 + 2] += probz;
                    }
                    for (var irc2 = 0; irc2 < (initialrotatedboxcoords.length / 3); irc2++) {
                        initialrotatedboxcoords[irc2 * 3 + 0] -= ox;
                        initialrotatedboxcoords[irc2 * 3 + 1] -= oy;
                        initialrotatedboxcoords[irc2 * 3 + 2] -= oz;
                    }
                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, initialrotatedboxcoords, other.collider.invmat);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeMove, other.collider.invmat);
                    var rotatedPreMoveboxOrigin = useYRotToGetInverseRotatedVectors(other.matrix, objectOriginBeforeMove, other.collider.invmat);
                    var blocked = false;
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    //console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                    //    + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                ////console.log('aclang clang ' + framenum);
                                blocked = false;
                                ////console.log(rotatedPreMoveboxcoords[c * 3 + 0] + ', ' + rotatedPreMoveboxcoords[c * 3 + 1] + ', ' + rotatedPreMoveboxcoords[c * 3 + 2]);

                                if (Math.abs(oy + other.collider.hheight + obotOffset - (object.matrix[y] + object.collider.hheight + botOffset)) > (other.collider.hheight + object.collider.hheight - 0.0001)) {
                                //if ((object.matrix[y] + botOffset) > (other.collider.hheight + obotOffset + oy - 0.0001)) {
                                    //console.log('base GROUNDED');
                                    if (Math.abs(oy + other.collider.hheight + obotOffset - (proby + object.collider.hheight + botOffset)) < (other.collider.hheight + object.collider.hheight + 0.0001)) {
                                        if (oy + other.collider.hheight + obotOffset < object.matrix[y] + botOffset) {
                                            vec[1] = -((object.matrix[y] + botOffset) - (oy + obotOffset) - (other.collider.hheight + other.collider.hheight + 0.0001));
                                            proby = object.matrix[y] + (vec[1]);
                                            object.isGrounded = true;
                                            object.confirmGrounded = true;
                                            object.velocity.y = 0.0;
                                            //if (object.id == 0) {
                                            //    console.log('gase 0');
                                            //}
                                        } else {
                                            vec[1] = (other.matrix[y] + obotOffset) - (object.matrix[y] + botOffset) - (object.collider.hheight + object.collider.hheight + 0.0001);
                                            proby = object.matrix[y] + (vec[1]);
                                            //other.isGrounded = true;
                                            object.velocity.y = 0.0;
                                            //console.log('gase 1');
                                        }
                                    }
                                } else {

                                    if (rotatedPreMoveboxcoords[c * 3 + 0] < (otherboxcoords[3] + .00001) && rotatedPreMoveboxcoords[c * 3 + 0] > rotatedPreMoveboxOrigin[0]) {
                                        var xincursion = rotatedboxcoords[c * 3 + 0] - otherboxcoords[3];
                                        //vec = [0, 0, 0];
                                        //console.log('base 0 ' + c + ' ' + xincursion);
                                        for (var incur = 0; incur < (rotatedboxcoords.length / 3); incur++) {
                                            rotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 0] > (otherboxcoords[0] - .00001) && rotatedPreMoveboxcoords[c * 3 + 0] < rotatedPreMoveboxOrigin[0]) {
                                        var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                        var xincursion = otherboxcoords[0] - rotatedboxcoords[c * 3 + 0];
                                        var xincursion2 = otherboxcoords[0] - rotatedboxcoords[c * 3 + 2];
                                        //console.log(rotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + rotatedboxcoords[c * 3 + 0] + ' eeyanda ' + rotatedboxcoords[c * 3 + 2] + ' mit ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                        //console.log('base 2 --' + c + ' ' + xincursion + ' ' + otherboxcoords[0]); //vec = [0, 0, 0];
                                        for (var incur2 = 0; incur2 < (rotatedboxcoords.length / 3); incur2++) {
                                            rotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                            //rotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                        }
                                        ////console.log(rotatedboxcoords[c * 3 + 0] + ', ' + rotatedboxcoords[c * 3 + 1] + ', ' + rotatedboxcoords[c * 3 + 2]);
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 2] < (otherboxcoords[8] + .00001) && rotatedPreMoveboxcoords[c * 3 + 2] > rotatedPreMoveboxOrigin[2]) {
                                        var zincursion = rotatedboxcoords[c * 3 + 2] - otherboxcoords[8];
                                        //vec = [0, 0, 0];
                                        //console.log('base 3');
                                        for (var incur3 = 0; incur3 < (rotatedboxcoords.length / 3); incur3++) {
                                            rotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 2] > (otherboxcoords[2] - .00001) && rotatedPreMoveboxcoords[c * 3 + 2] < rotatedPreMoveboxOrigin[2]) {
                                        var zincursion = otherboxcoords[2] - rotatedboxcoords[c * 3 + 2];
                                        //vec = [0, 0, 0];
                                        //console.log('base 4');
                                        for (var incur4 = 0; incur4 < (rotatedboxcoords.length / 3); incur4++) {
                                            rotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                        }
                                        blocked = true;
                                    }
                                    if (!blocked) {
                                        vec = [0, 0, 0];
                                    }
                                }
                            }
                        }
                    }


                    var otherOriginBeforeMove = new Array(3);
                    otherOriginBeforeMove[0] = -object.matrix[x] + ox;
                    otherOriginBeforeMove[1] = -object.matrix[y] + oy;
                    otherOriginBeforeMove[2] = -object.matrix[z] + oz;

                    //do other way around
                    var otherinitialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords, other.collider.invmat);
                    var otherCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    for (var irc = 0; irc < (otherinitialrotatedboxcoords.length / 3); irc++) {
                        otherCoordsBeforeMove[irc * 3 + 0] = otherinitialrotatedboxcoords[irc * 3 + 0] - object.matrix[x] + ox;
                        otherCoordsBeforeMove[irc * 3 + 1] = otherinitialrotatedboxcoords[irc * 3 + 1] - object.matrix[y] + oy;
                        otherCoordsBeforeMove[irc * 3 + 2] = otherinitialrotatedboxcoords[irc * 3 + 2] - object.matrix[z] + oz;

                        otherinitialrotatedboxcoords[irc * 3 + 0] += ox;
                        otherinitialrotatedboxcoords[irc * 3 + 1] += oy;
                        otherinitialrotatedboxcoords[irc * 3 + 2] += oz;
                    }
                    for (var irc2 = 0; irc2 < (otherinitialrotatedboxcoords.length / 3); irc2++) {
                        otherinitialrotatedboxcoords[irc2 * 3 + 0] -= probx;
                        otherinitialrotatedboxcoords[irc2 * 3 + 1] -= proby;
                        otherinitialrotatedboxcoords[irc2 * 3 + 2] -= probz;
                    }
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(object.isAABoxTrigger ? getScaleMat(object.matrix) : object.matrix, otherinitialrotatedboxcoords, object.collider.invmat);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.isAABoxTrigger ? getScaleMat(object.matrix) : object.matrix, otherCoordsBeforeMove, object.collider.invmat);
                    var orotatedPreMoveboxOrigin = useYRotToGetInverseRotatedVectors(object.isAABoxTrigger ? getScaleMat(object.matrix) : object.matrix, otherOriginBeforeMove, object.collider.invmat);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                ////console.log('kling kling2'); //vec = [0, 0, 0];



                                //check for the "edge" case
                                for (var e = 0; e < rotatedboxcoords.length / 3; e++) {
                                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                                    //if (rotatedboxcoords[e * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[e * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                                    //    if (rotatedboxcoords[e * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[e * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                    //    }
                                    //}
                                    if (rotatedPreMoveboxcoords[e * 3 + 0] >= otherboxcoords[c * 3 + 0]
                                        && rotatedboxcoords[e * 3 + 0] <= otherboxcoords[c * 3 + 0]
                                        && rotatedPreMoveboxcoords[e * 3 + 2] >= otherboxcoords[c * 3 + 2]
                                        && rotatedboxcoords[e * 3 + 2] <= otherboxcoords[c * 3 + 2]) {
                                        console.log('FALSE KUHLANG');
                                        //{
                                        blocked = false;
                                        var caseres = handleEdgeCaseCollision(object, other, oy, e, c, vec, rotatedPreMoveboxcoords, otherboxcoords, rotatedboxcoords);
                                        if (caseres.blocked) {
                                            continue;
                                        } else if (caseres.landed) {
                                            proby = caseres.proby;
                                        }

                                        //}
                                    }
                                    if (rotatedPreMoveboxcoords[e * 3 + 0] <= otherboxcoords[c * 3 + 0]
                                        && rotatedboxcoords[e * 3 + 0] >= otherboxcoords[c * 3 + 0]
                                        && rotatedPreMoveboxcoords[e * 3 + 2] <= otherboxcoords[c * 3 + 2]
                                        && rotatedboxcoords[e * 3 + 2] >= otherboxcoords[c * 3 + 2]) {
                                        console.log('FALSE KUHLANG TOO');
                                        var caseres = handleEdgeCaseCollision(object, other, oy, e, c, vec, rotatedPreMoveboxcoords, otherboxcoords, rotatedboxcoords);
                                        if (caseres.blocked) {
                                            continue;
                                        } else if (caseres.landed) {
                                            proby = caseres.proby;
                                        }
                                    }
                                    if (rotatedPreMoveboxcoords[e * 3 + 0] <= otherboxcoords[c * 3 + 0]
                                        && rotatedboxcoords[e * 3 + 0] >= otherboxcoords[c * 3 + 0]
                                        && rotatedPreMoveboxcoords[e * 3 + 2] >= otherboxcoords[c * 3 + 2]
                                        && rotatedboxcoords[e * 3 + 2] <= otherboxcoords[c * 3 + 2]) {
                                        console.log('FALSE KUHLANG TREE');
                                        var caseres = handleEdgeCaseCollision(object, other, oy, e, c, vec, rotatedPreMoveboxcoords, otherboxcoords, rotatedboxcoords);
                                        if (caseres.blocked) {
                                            continue;
                                        } else if (caseres.landed) {
                                            proby = caseres.proby;
                                        }
                                    }
                                    if (rotatedPreMoveboxcoords[e * 3 + 0] >= otherboxcoords[c * 3 + 0]
                                        && rotatedboxcoords[e * 3 + 0] <= otherboxcoords[c * 3 + 0]
                                        && rotatedPreMoveboxcoords[e * 3 + 2] <= otherboxcoords[c * 3 + 2]
                                        && rotatedboxcoords[e * 3 + 2] >= otherboxcoords[c * 3 + 2]) {
                                        console.log('FALSE KUHLANG FORE');
                                        var caseres = handleEdgeCaseCollision(object, other, oy, e, c, vec, rotatedPreMoveboxcoords, otherboxcoords, rotatedboxcoords);
                                        if (caseres.blocked) {
                                            continue;
                                        } else if (caseres.landed) {
                                            proby = caseres.proby;
                                        }
                                    }

                                    //var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, initialrotatedboxcoords);
                                    ////var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeMove);
                                    //console.log(rotatedboxcoords);
                                    //console.log(otherboxcoords);
                                    //console.log(otherinitialrotatedboxcoords);
                                    //console.log(rotatedPreMoveboxcoords);
                                }
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                var blocked = false;
                                if (Math.abs(oy + other.collider.hheight + obotOffset - (object.matrix[y] + object.collider.hheight + botOffset)) > (other.collider.hheight + object.collider.hheight - 0.0001)) {
                                    if (Math.abs(oy + other.collider.hheight + obotOffset - (proby + object.collider.hheight + botOffset)) < (other.collider.hheight + object.collider.hheight + 0.0001)) {
                                        if (oy + other.collider.hheight + obotOffset < object.matrix[y] + botOffset) {
                                            vec[1] = -((object.matrix[y] + botOffset) - (oy + obotOffset) - (other.collider.hheight + other.collider.hheight + 0.0001));
                                            proby = object.matrix[y] + (vec[1]);
                                            object.isGrounded = true;
                                            object.confirmGrounded = true;
                                            object.velocity.y = 0.0;
                                            //if(object.id == 0)
                                            //console.log('case aase 0');
                                        } else {
                                            vec[1] = (other.matrix[y] + obotOffset) - (object.matrix[y] + botOffset) - (object.collider.hheight + object.collider.hheight + 0.0001);
                                            proby = object.matrix[y] + (vec[1]);
                                            //other.isGrounded = true;
                                            object.velocity.y = 0.0;
                                            //console.log('case aase 1');
                                        }
                                    }
                                } else {
                                    if (orotatedPreMoveboxcoords[c * 3 + 0] < (objectboxcoords[3] + .00001) && orotatedPreMoveboxOrigin[0] < orotatedPreMoveboxcoords[c * 3 + 0]) {
                                        var xincursion = orotatedboxcoords[c * 3 + 0] - objectboxcoords[3];
                                        //var xincursion2 = objectboxcoords[3] - orotatedboxcoords[c * 3 + 2];
                                        //vec = [0, 0, 0];
                                        //console.log('clase 1 ' + c + ' ' + xincursion);
                                        //console.log(orotatedPreMoveboxcoords);
                                        //console.log(objectboxcoords);
                                        //console.log(orotatedboxcoords);
                                        //console.log(orotatedboxcoords[c * 3 + 0] + ' minus ' + objectboxcoords[3]);
                                        for (var incur = 0; incur < (orotatedboxcoords.length / 3); incur++) {
                                            orotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                            //if (xincursion2 <= .07) {
                                            //    orotatedboxcoords[incur * 3 + 2] += xincursion2 + .01;//yes it is a hack
                                            //}
                                        }
                                        blocked = true;
                                        //if (orotatedPreMoveboxcoords[c * 3 + 2] > 0 && orotatedPreMoveboxcoords[c * 3 + 2] < Math.abs(objectboxcoords[8] + .00001)) {
                                        //    var zincursion = orotatedboxcoords[c * 3 + 2] - Math.abs(objectboxcoords[8]);
                                        //    //vec = [0, 0, 0];
                                        //    console.log('case 3b');
                                        //    for (var incur3 = 0; incur3 < (orotatedboxcoords.length / 3); incur3++) {
                                        //        orotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                        //    }
                                        //    blocked = true;
                                        //} 
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 0] > (objectboxcoords[0] - .00001) && orotatedPreMoveboxOrigin[0] > orotatedPreMoveboxcoords[c * 3 + 0]) {
                                        var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                        var xincursion = objectboxcoords[0] - orotatedboxcoords[c * 3 + 0];
                                        var xincursion2 = objectboxcoords[0] - orotatedboxcoords[c * 3 + 2];
                                        ////console.log(orotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + orotatedboxcoords[c * 3 + 0] + ' eeyanda ' + orotatedboxcoords[c * 3 + 2] + ' mit ' + orotatedPreMoveboxcoords[c * 3 + 2]);
                                        //console.log('clase 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                        ////console.log(xincursion2);
                                        for (var incur2 = 0; incur2 < (orotatedboxcoords.length / 3); incur2++) {
                                            orotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                            //if (xincursion2 <= .07) {
                                            //    orotatedboxcoords[incur * 3 + 2] += xincursion2 + .01;//yes it is a hack
                                            //}
                                        }
                                        ////.log(orotatedboxcoords[c * 3 + 0] + ', ' + orotatedboxcoords[c * 3 + 1] + ', ' + orotatedboxcoords[c * 3 + 2]);
                                        blocked = true;
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 2] < (objectboxcoords[8] + .00001) && orotatedPreMoveboxOrigin[2] < orotatedPreMoveboxcoords[c * 3 + 2]) {
                                        var zincursion = orotatedboxcoords[c * 3 + 2] - objectboxcoords[8];
                                        //vec = [0, 0, 0];
                                        //console.log('clase 3');
                                        for (var incur3 = 0; incur3 < (orotatedboxcoords.length / 3); incur3++) {
                                            orotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 2] > (objectboxcoords[2] - .00001) && orotatedPreMoveboxOrigin[2] > orotatedPreMoveboxcoords[c * 3 + 2]) {
                                        var zincursion = objectboxcoords[2] - orotatedboxcoords[c * 3 + 2];
                                        //vec = [0, 0, 0];
                                        //console.log('clase 4');
                                        for (var incur4 = 0; incur4 < (orotatedboxcoords.length / 3); incur4++) {
                                            orotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                        }
                                        blocked = true;
                                    }
                                    if (!blocked) {
                                        vec = [0, 0, 0];
                                    }
                                }

                            }
                        }
                    }


                    if (Math.abs(oy + other.collider.hheight + obotOffset - (object.matrix[y] + object.collider.hheight + botOffset)) > (other.collider.hheight + object.collider.hheight - 0.0001)) {
                        if (Math.abs(oy + other.collider.hheight + obotOffset - (proby + object.collider.hheight + botOffset)) < (other.collider.hheight + object.collider.hheight + 0.0001)) {
                            //loop through all pairs of lines
                            for (var p = 0; p < 4; p++) {
                                for (var op = 0; op < 4; op++) {
                                    var line1 = [rotatedboxcoords[p * 3 + 0], rotatedboxcoords[p * 3 + 2], rotatedboxcoords[((p + 1) % 4) * 3 + 0], rotatedboxcoords[((p + 1) % 4) * 3 + 2]];
                                    var line2 = [otherboxcoords[op * 3 + 0], otherboxcoords[op * 3 + 2], otherboxcoords[((op + 1) % 4) * 3 + 0], otherboxcoords[((op + 1) % 4) * 3 + 2]];
                                    var hitIntersect = intersects(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1], line2[2], line2[3]);

                                    if (hitIntersect) {
                                        if (oy + other.collider.hheight + obotOffset < object.matrix[y] + botOffset) {
                                            vec[1] = -((object.matrix[y] + botOffset) - (oy + obotOffset) - (other.collider.hheight + other.collider.hheight + 0.0001));
                                            proby = object.matrix[y] + (vec[1]);
                                            object.isGrounded = true;
                                            object.confirmGrounded = true;
                                            object.velocity.y = 0.0;
                                        } else {
                                            vec[1] = other.matrix[y] + obotOffset - (object.matrix[y] + botOffset) - (object.collider.hheight + object.collider.hheight + 0.0001);
                                            proby = object.matrix[y] + (vec[1]);
                                            //other.isGrounded = true;
                                            object.velocity.y = 0.0;
                                        }
                                        //console.log('tlang tlang');
                                        //break out if hit
                                        p = 5;
                                        op = 5;
                                    }
                                }
                            }


                            
                        }
                    } 

                    var newveccoords = useYRotToGetRotatedVectors(other.matrix, rotatedboxcoords, other.collider.invmat);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords[cl * 3 + 0] += ox;
                        newveccoords[cl * 3 + 1] += oy;
                        newveccoords[cl * 3 + 2] += oz;
                    }


                    var newveccoords2 = useYRotToGetRotatedVectors(object.isAABoxTrigger ? getScaleMat(object.matrix) : object.matrix, orotatedboxcoords, object.collider.invmat);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords2[cl * 3 + 0] -= ox;
                        newveccoords2[cl * 3 + 1] -= oy;
                        newveccoords2[cl * 3 + 2] -= oz;
                    }
                    //console.log(vec[0] + ' -> ' + (vec[0] - Math.sign(vec[0]) * Math.abs((initialrotatedboxcoords[0] + ox) - newveccoords[0])));
                    //console.log(vec[1] + ' -> ' + (vec[1] - Math.sign(vec[1]) * Math.abs((initialrotatedboxcoords[1] + oy) - newveccoords[1])));
                    //console.log(vec[2] + ' -> ' + (vec[2] - Math.sign(vec[2]) * Math.abs((initialrotatedboxcoords[2] + oz) - newveccoords[2])));
                    ////console.log(vec);
                    if (blocked) {
                        ////console.log(vec[0] + ', ' + vec[1] + ', ' + vec[2]);
                        //console.log(ox + ', ' + oy + ', ' + oz);
                        //console.log(initialrotatedboxcoords[0] + ', ' + initialrotatedboxcoords[1] + ', ' + initialrotatedboxcoords[2]);
                        //console.log(newveccoords[0] + ', ' + newveccoords[1] + ', ' + newveccoords[2]);
                        //console.log(newveccoords2[0] + ', ' + newveccoords2[1] + ', ' + newveccoords2[2]);
                        ////console.log(otherinitialrotatedboxcoords[0] +  '    ' + newveccoords2[0]);
                        ////console.log(vec[0] - ((initialrotatedboxcoords[0] + ox) - newveccoords[0]) + ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]));
                        ////console.log(vec[0] - (1.0 || 1.0) * ((initialrotatedboxcoords[0] + ox) - newveccoords[0]) + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]) );

                    }
                    //console.log(initialrotatedboxcoords[0] + ',' + initialrotatedboxcoords[1] + ','  + initialrotatedboxcoords[2]);
                    //console.log(newveccoords[0] + ',' + newveccoords[1] + ',' + newveccoords[2]);
                    //console.log('---2---');
                    //console.log(otherinitialrotatedboxcoords[0] + ',' + otherinitialrotatedboxcoords[1] + ',' + otherinitialrotatedboxcoords[2]);
                    //console.log(newveccoords2[0] + ',' + newveccoords2[1] + ',' + newveccoords2[2]);
                    //console.log(ox);
                    //console.log(vec[0] + ',' + vec[1] + ','  + vec[2]);
                    vec[0] = vec[0] - (1.0 || 1.0) * ((initialrotatedboxcoords[0] + ox) - newveccoords[0]);
                    vec[1] = vec[1] - (1.0 || 1.0) * ((initialrotatedboxcoords[1] + oy) - newveccoords[1]);
                    vec[2] = vec[2] - (1.0 || 1.0) * ((initialrotatedboxcoords[2] + oz) - newveccoords[2]);
                    //console.log(other.id);
                    //console.log(vec[0]);

                    vec[0] = vec[0] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]);
                    vec[1] = vec[1] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[1] - oy) - newveccoords2[1]);
                    vec[2] = vec[2] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[2] - oz) - newveccoords2[2]);
                    ////console.log(vec[0]);
                    //console.log(vec[0] + ',' + vec[1] + ',' + vec[2]);
                    if (blocked) {
                        ////console.log(newveccoords2);
                        ////console.log(vec[0] + ', ' + vec[1] + ', ' + vec[2]);

                    }
                }
            }
        }

        for (var b = 0; b < 3; b++) {
            if (Math.abs(vec[b]) < .00001) {
                vec[b] = 0.0;
            }
        }
        //mat4.translate(object.matrix,     // destination matrix
        //    object.matrix,     // matrix to translate
        //    [vec[0], vec[1], vec[2]]);
        //console.log(object.id)
        //console.log(vec[0])
        //console.log(vec[1])
        //console.log(vec[2])
        object.matrix[x] += vec[0];
        object.matrix[y] += vec[1];
        object.matrix[z] += vec[2];
    }




    var tryMoveObjectItsCoord = function (object, vec) {
        const x = 12;
        const y = 13;
        const z = 14;

        vec = useYRotToGetRotatedVectors(object.matrix, vec, object.collider.invmat);
        var probx = object.matrix[x] + vec[0];
        var proby = object.matrix[y] + vec[1];
        var probz = object.matrix[z] + vec[2];
        var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
        //console.log(probx + ', ' + proby + ', ' + probz);


        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] && StageData.objects[oo] != object && oo != 3) {
                var other = StageData.objects[oo];
                if (other.isAABoxTrigger) {

                } else if (other.collider.type == 'rotationlesscylinder') {
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;
                    //var maxrad = (other.collider.radius + object.collider.radius);//Math.max(other.collider.radius, object.collider.radius);
                    var maxallowedrad = (other.collider.radius + object.collider.radius);
                    var maxradsquared = (other.collider.radius + object.collider.radius) * (other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    if (maxallowedrad > centerdist) {
                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));
                        console.log('bump ' + ratior + ' -- ' + diffor);
                        if (ratior <= 1 || diffor >= Math.sqrt(movsquared)) {
                            console.log('AAAAAHHH');
                            vec[0] = 0;
                            vec[1] = 0;
                            vec[2] = 0;
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                        } else {

                            if (ratior > 100) {
                                vec[0] = 0;
                                vec[1] = 0;
                                vec[2] = 0;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            } else {

                                vec[0] = vec[0] / ratior;
                                vec[1] = vec[1] / ratior;
                                vec[2] = vec[2] / ratior;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            }
                        }
                    }
                } else if (other.collider.type == 'yrotbox') {
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, other.collider.hwidth,
                    other.collider.hdepth, 0.0, -other.collider.hwidth,
                    -other.collider.hdepth, 0.0, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                    -object.collider.hdepth, 0.0, object.collider.hwidth,
                    object.collider.hdepth, 0.0, -object.collider.hwidth,
                    -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];

                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords, object.collider.invmat);
                    var objectCoordsBeforeMove = new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (initialrotatedboxcoords.length / 3); irc++) {
                        objectCoordsBeforeMove[irc * 3 + 0] = initialrotatedboxcoords[irc * 3 + 0] + object.matrix[x] - ox;
                        objectCoordsBeforeMove[irc * 3 + 1] = initialrotatedboxcoords[irc * 3 + 1] + object.matrix[y] - oy;
                        objectCoordsBeforeMove[irc * 3 + 2] = initialrotatedboxcoords[irc * 3 + 2] + object.matrix[z] - oz;

                        initialrotatedboxcoords[irc * 3 + 0] += probx;
                        initialrotatedboxcoords[irc * 3 + 1] += proby;
                        initialrotatedboxcoords[irc * 3 + 2] += probz;
                    }
                    for (var irc2 = 0; irc2 < (initialrotatedboxcoords.length / 3); irc2++) {
                        initialrotatedboxcoords[irc2 * 3 + 0] -= ox;
                        initialrotatedboxcoords[irc2 * 3 + 1] -= oy;
                        initialrotatedboxcoords[irc2 * 3 + 2] -= oz;
                    }
                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, initialrotatedboxcoords, other.collider.invmat);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeMove, other.collider.invmat);
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    //console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                    //    + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                //console.log('bclang clang ' + framenum);
                                var blocked = false;
                                //console.log(rotatedPreMoveboxcoords[c * 3 + 0] + ', ' + rotatedPreMoveboxcoords[c * 3 + 1] + ', ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                if (rotatedPreMoveboxcoords[c * 3 + 0] < (otherboxcoords[3] + .00001)) {
                                    var xincursion = rotatedboxcoords[c * 3 + 0] - otherboxcoords[3];
                                    //vec = [0, 0, 0];
                                    //console.log('crase 1 ' + c + ' ' + xincursion);
                                    for (var incur = 0; incur < (rotatedboxcoords.length / 3); incur++) {
                                        rotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 0] > (otherboxcoords[0] - .00001)) {
                                    var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                    var xincursion = otherboxcoords[0] - rotatedboxcoords[c * 3 + 0];
                                    var xincursion2 = otherboxcoords[0] - rotatedboxcoords[c * 3 + 2];
                                    //console.log(rotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + rotatedboxcoords[c * 3 + 0] + ' eeyanda ' + rotatedboxcoords[c * 3 + 2] + ' mit ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                    //console.log('crase 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                    for (var incur2 = 0; incur2 < (rotatedboxcoords.length / 3); incur2++) {
                                        rotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                        //rotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                    }
                                    //console.log(rotatedboxcoords[c * 3 + 0] + ', ' + rotatedboxcoords[c * 3 + 1] + ', ' + rotatedboxcoords[c * 3 + 2]);
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 2] < (otherboxcoords[8] + .00001)) {
                                    var zincursion = rotatedboxcoords[c * 3 + 2] - otherboxcoords[8];
                                    //vec = [0, 0, 0];
                                    //console.log('crase 3');
                                    for (var incur3 = 0; incur3 < (rotatedboxcoords.length / 3); incur3++) {
                                        rotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 2] > (otherboxcoords[2] - .00001)) {
                                    var zincursion = otherboxcoords[2] - rotatedboxcoords[c * 3 + 2];
                                    //vec = [0, 0, 0];
                                    //console.log('crase 4');
                                    for (var incur4 = 0; incur4 < (rotatedboxcoords.length / 3); incur4++) {
                                        rotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                    }
                                    blocked = true;
                                }
                                if (!blocked) {
                                    vec = [0, 0, 0];
                                }
                            }
                        }
                    }


                    //do other way around
                    var otherinitialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords, other.collider.invmat);
                    var otherCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    for (var irc = 0; irc < (otherinitialrotatedboxcoords.length / 3); irc++) {
                        otherCoordsBeforeMove[irc * 3 + 0] = otherinitialrotatedboxcoords[irc * 3 + 0] - object.matrix[x] + ox;
                        otherCoordsBeforeMove[irc * 3 + 1] = otherinitialrotatedboxcoords[irc * 3 + 1] - object.matrix[y] + oy;
                        otherCoordsBeforeMove[irc * 3 + 2] = otherinitialrotatedboxcoords[irc * 3 + 2] - object.matrix[z] + oz;

                        otherinitialrotatedboxcoords[irc * 3 + 0] += ox;
                        otherinitialrotatedboxcoords[irc * 3 + 1] += oy;
                        otherinitialrotatedboxcoords[irc * 3 + 2] += oz;
                    }
                    for (var irc2 = 0; irc2 < (otherinitialrotatedboxcoords.length / 3); irc2++) {
                        otherinitialrotatedboxcoords[irc2 * 3 + 0] -= probx;
                        otherinitialrotatedboxcoords[irc2 * 3 + 1] -= proby;
                        otherinitialrotatedboxcoords[irc2 * 3 + 2] -= probz;
                    }
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherinitialrotatedboxcoords, object.collider.invmat);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherCoordsBeforeMove, object.collider.invmat);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                console.log('kling kling'); //vec = [0, 0, 0];


                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                var blocked = false;
                                if (orotatedPreMoveboxcoords[c * 3 + 0] < (objectboxcoords[3] + .00001)) {
                                    var xincursion = orotatedboxcoords[c * 3 + 0] - objectboxcoords[3];
                                    //vec = [0, 0, 0];
                                    //console.log('case 1 ' + c + ' ' + xincursion);
                                    for (var incur = 0; incur < (orotatedboxcoords.length / 3); incur++) {
                                        orotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 0] > (objectboxcoords[0] - .00001)) {
                                    var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                    var xincursion = objectboxcoords[0] - orotatedboxcoords[c * 3 + 0];
                                    var xincursion2 = objectboxcoords[0] - orotatedboxcoords[c * 3 + 2];
                                    //console.log(orotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + orotatedboxcoords[c * 3 + 0] + ' eeyanda ' + orotatedboxcoords[c * 3 + 2] + ' mit ' + orotatedPreMoveboxcoords[c * 3 + 2]);
                                    //console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                    for (var incur2 = 0; incur2 < (orotatedboxcoords.length / 3); incur2++) {
                                        orotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                        //orotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                    }
                                    //console.log(orotatedboxcoords[c * 3 + 0] + ', ' + orotatedboxcoords[c * 3 + 1] + ', ' + orotatedboxcoords[c * 3 + 2]);
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 2] < (objectboxcoords[8] + .00001)) {
                                    var zincursion = orotatedboxcoords[c * 3 + 2] - objectboxcoords[8];
                                    //vec = [0, 0, 0];
                                    //console.log('case 3');
                                    for (var incur3 = 0; incur3 < (orotatedboxcoords.length / 3); incur3++) {
                                        orotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 2] > (objectboxcoords[2] - .00001)) {
                                    var zincursion = objectboxcoords[2] - orotatedboxcoords[c * 3 + 2];
                                    //vec = [0, 0, 0];
                                    //console.log('case 4');
                                    for (var incur4 = 0; incur4 < (orotatedboxcoords.length / 3); incur4++) {
                                        orotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                    }
                                    blocked = true;
                                }
                                if (!blocked) {
                                    vec = [0, 0, 0];
                                }

                            }
                        }
                    }


                    var newveccoords = useYRotToGetRotatedVectors(other.matrix, rotatedboxcoords, other.collider.invmat);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords[cl * 3 + 0] += ox;
                        newveccoords[cl * 3 + 1] += oy;
                        newveccoords[cl * 3 + 2] += oz;
                    }


                    var newveccoords2 = useYRotToGetRotatedVectors(object.matrix, orotatedboxcoords, object.collider.invmat);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords2[cl * 3 + 0] -= ox;
                        newveccoords2[cl * 3 + 1] -= oy;
                        newveccoords2[cl * 3 + 2] -= oz;
                    }

                    //console.log(vec);
                    vec[0] = vec[0] - (1.0 || 1.0) * ((initialrotatedboxcoords[0] + ox) - newveccoords[0]);
                    vec[1] = vec[1] - (1.0 || 1.0) * ((initialrotatedboxcoords[1] + oy) - newveccoords[1]);
                    vec[2] = vec[2] - (1.0 || 1.0) * ((initialrotatedboxcoords[2] + oz) - newveccoords[2]);

                    vec[0] = vec[0] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]);
                    vec[1] = vec[1] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[1] - oy) - newveccoords2[1]);
                    vec[2] = vec[2] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[2] - oz) - newveccoords2[2]);
                    //console.log(vec);
                }
            }
        }

        for (var b = 0; b < 3; b++) {
            if (Math.abs(vec[b]) < .00001) {
                vec[b] = 0.0;
            }
        }
        //mat4.translate(object.matrix,     // destination matrix
        //    object.matrix,     // matrix to translate
        //    [vec[0], vec[1], vec[2]]);
        object.matrix[x] += vec[0];
        object.matrix[y] += vec[1];
        object.matrix[z] += vec[2];
    }



    var tryRotateObject = function (object, rot, actor) {
        const x = 12;
        const y = 13;
        const z = 14;

        var probx = object.matrix[x];
        var proby = object.matrix[y];
        var probz = object.matrix[z];

        var botOffset = (object.collider ? object.collider.bot || 0.0 : 0.0);
        //console.log(probx + ', ' + proby + ', ' + probz);

        if (actor) {

            if (actor.yrot != null) {
                actor.yrot += rot;
            }

            mat4.rotate(actor.matrix,  // destination matrix
                actor.matrix,  // matrix to rotate
                rot,   // amount to rotate in radians
                [0, 1, 0]);

            return;
        }

        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] && StageData.objects[oo] != object && oo != 3) {
                var other = StageData.objects[oo];
                if (other.isAABoxTrigger) {

                } else if (other.collider && other.collider.type == 'rotationlesscylinder') {

                } else if (other.collider && other.collider.type == 'yrotbox') {
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, other.collider.hwidth,
                    other.collider.hdepth, 0.0, -other.collider.hwidth,
                    -other.collider.hdepth, 0.0, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                    -object.collider.hdepth, 0.0, object.collider.hwidth,
                    object.collider.hdepth, 0.0, -object.collider.hwidth,
                    -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];
                    var obotOffset = (other.collider ? other.collider.bot || 0.0 : 0.0);

                    var rotatedMatrix = mat4.create();
                    mat4.rotate(rotatedMatrix,  // destination matrix
                        object.matrix,  // matrix to rotate
                        rot,   // amount to rotate in radians
                        [0, 1, 0]);

                    //var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords);
                    var objectCoordsPostRotation = useYRotToGetRotatedVectors(rotatedMatrix, objectboxcoords, object.collider.invmat);
                    var objectCoordsBeforeRotation = useYRotToGetRotatedVectors(object.matrix, objectboxcoords, object.collider.invmat);//new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (objectCoordsPostRotation.length / 3); irc++) {
                        objectCoordsBeforeRotation[irc * 3 + 0] += object.matrix[x] - ox;
                        objectCoordsBeforeRotation[irc * 3 + 1] += object.matrix[y] - oy;
                        objectCoordsBeforeRotation[irc * 3 + 2] += object.matrix[z] - oz;

                        objectCoordsPostRotation[irc * 3 + 0] += object.matrix[x] - ox;
                        objectCoordsPostRotation[irc * 3 + 1] += object.matrix[y] - oy;
                        objectCoordsPostRotation[irc * 3 + 2] += object.matrix[z] - oz;
                    }

                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsPostRotation, other.collider.invmat);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeRotation, other.collider.invmat);
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    //console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                    //    + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                if (Math.abs(oy + obotOffset - (object.matrix[y] + botOffset)) <= (other.collider.hheight + object.collider.hheight - 0.0001)) {
                                    console.log('cclang clang ' + framenum + '  ' + object.id + ' ' + other.id);
                                    //console.log('fu' + other.isAABoxTrigger)
                                    var blocked = false;

                                    if (!blocked) {
                                        rot = 0;
                                    }
                                }
                            }
                        }
                    }


                    //do other way around
                    var otherCoordsPostRotation = useYRotToGetRotatedVectors(other.matrix, otherboxcoords, other.collider.invmat);
                    var otherCoordsBeforeRotation = useYRotToGetRotatedVectors(other.matrix, otherboxcoords, other.collider.invmat);//new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (otherCoordsPostRotation.length / 3); irc++) {
                        otherCoordsBeforeRotation[irc * 3 + 0] += -object.matrix[x] + ox;
                        otherCoordsBeforeRotation[irc * 3 + 1] += -object.matrix[y] + oy;
                        otherCoordsBeforeRotation[irc * 3 + 2] += -object.matrix[z] + oz;

                        otherCoordsPostRotation[irc * 3 + 0] += -object.matrix[x] + ox;
                        otherCoordsPostRotation[irc * 3 + 1] += -object.matrix[y] + oy;
                        otherCoordsPostRotation[irc * 3 + 2] += -object.matrix[z] + oz;
                    }
                    //console.log(ox + ', ' + object.matrix[x] + ', ' + oz + '== ' + otherCoordsPostRotation);
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(rotatedMatrix, otherCoordsPostRotation, object.collider.invmat);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherCoordsBeforeRotation, object.collider.invmat);
                    //console.log(objectboxcoords);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                if (Math.abs(oy + obotOffset - (object.matrix[y] + botOffset)) <= (other.collider.hheight + object.collider.hheight - 0.0001)) {
                                    console.log('kling kling'); //vec = [0, 0, 0];


                                    //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                    //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                    var blocked = false;

                                    if (!blocked) {
                                        rot = 0;
                                    }
                                }

                            }
                        }
                    }

                }
            }
        }

        //for (var b = 0; b < 3; b++) {
        //    if (Math.abs(vec[b]) < .00001) {
        //        vec[b] = 0.0;
        //    }
        //}
        if (object.yrot != null) {
            object.yrot += rot;
        }

        mat4.rotate(object.matrix,  // destination matrix
            object.matrix,  // matrix to rotate
            rot,   // amount to rotate in radians
            [0, 1, 0]);
    }

    var applyVeleocity = function () {
        const x = 12;
        const y = 13;
        const z = 14;
        for (var c = 0; c < StageData.objects.length; c++) {
            var object = StageData.objects[c];
            if (!object) { continue; }

            if (object.matrix && object.velocity) {
                //console.log(object.velocity.y * StageData.timeDelta * 0.12);
                //if (object.isAABoxTrigger) { console.log(object.velocity.y * StageData.timeDelta * 0.18); continue; }
                //console.log(object.velocity.y * StageData.timeDelta * 0.18)
                tryMoveObject(object, [0.0, object.velocity.y * StageData.timeDelta * 0.18, 0.0]);
            }
        }
    }

    var applyGravityAndGround = function () {
        var ground = StageData.objects[3];
        const x = 12;
        const y = 13;
        const z = 14;

        for (var i = 0; i < StageData.objects.length; i++) {
            if (i == 3) { continue; }

            var hasHit = false;

            var object = StageData.objects[i];
            if (!object || object.isActor || object.isBaked) { continue; }
            //if (object.isAABoxTrigger) { continue; }
            var velyOrig = object.velocity.y * StageData.timeDelta * 0.18;


            var obx = object.matrix[x];
            var oby = object.matrix[y];
            var obz = object.matrix[z];
            var obotOffset = (object.collider ? object.collider.bot || 0.0 : 0.0) + 0.1;
            var objectFoot = { x: obx, y: oby + obotOffset, z: obz };
            //var psuedoFoot = { x: obx, y: oby + obotOffset + 0.1, z: obz };
            var floorheight = 1000.0;

            var groundPos = new Array(ground.positions.length);
            linTransformRange(groundPos, ground.positions, ground.matrix, 0, ground.positions.length);

            var minGroundDistXYSquared = 10000000.0;
            var minGroundIndex = [];
            for (var f = 0; f < groundPos.length / 3; f++) {
                var isMin = false;
                var groundDistXYSquared1 = (groundPos[ground.indices[f * 3 + 0] * 3 + 0] - objectFoot.x) * (groundPos[ground.indices[f * 3 + 0] * 3 + 0] - objectFoot.x) +
                                            (groundPos[ground.indices[f * 3 + 0] * 3 + 2] - objectFoot.z) * (groundPos[ground.indices[f * 3 + 0] * 3 + 2] - objectFoot.z);
                var groundDistXYSquared2 = (groundPos[ground.indices[f * 3 + 1] * 3 + 0] - objectFoot.x) * (groundPos[ground.indices[f * 3 + 1] * 3 + 0] - objectFoot.x) +
                                            (groundPos[ground.indices[f * 3 + 1] * 3 + 2] - objectFoot.z) * (groundPos[ground.indices[f * 3 + 1] * 3 + 2] - objectFoot.z);
                var groundDistXYSquared3 = (groundPos[ground.indices[f * 3 + 2] * 3 + 0] - objectFoot.x) * (groundPos[ground.indices[f * 3 + 2] * 3 + 0] - objectFoot.x) +
                                            (groundPos[ground.indices[f * 3 + 2] * 3 + 2] - objectFoot.z)  * (groundPos[ground.indices[f * 3 + 2] * 3 + 2] - objectFoot.z);

                if (groundDistXYSquared1 < minGroundDistXYSquared) {
                    minGroundDistXYSquared = groundDistXYSquared1;
                    minGroundIndex = [f];
                    isMin = true;
                } else if (groundDistXYSquared1 == minGroundDistXYSquared && !isMin) { minGroundIndex.push(f); isMin = true; }
                if (groundDistXYSquared2 < minGroundDistXYSquared) {
                    minGroundDistXYSquared = groundDistXYSquared2;
                    minGroundIndex = [f];
                    isMin = true;
                } else if (groundDistXYSquared2 == minGroundDistXYSquared && !isMin) { minGroundIndex.push(f); isMin = true; }
                if (groundDistXYSquared3 < minGroundDistXYSquared) {
                    minGroundDistXYSquared = groundDistXYSquared3;
                    minGroundIndex = [f];
                    isMin = true;
                } else if (groundDistXYSquared3 == minGroundDistXYSquared && !isMin) { minGroundIndex.push(f); isMin = true; }

                var result = IsPointInTriangleIncludeY(objectFoot,
                    {
                        a: { x: groundPos[ground.indices[f * 3 + 0] * 3 + 0], y: groundPos[ground.indices[f * 3 + 0] * 3 + 1], z: groundPos[ground.indices[f * 3 + 0] * 3 + 2] },
                        b: { x: groundPos[ground.indices[f * 3 + 1] * 3 + 0], y: groundPos[ground.indices[f * 3 + 1] * 3 + 1], z: groundPos[ground.indices[f * 3 + 1] * 3 + 2] },
                        c: { x: groundPos[ground.indices[f * 3 + 2] * 3 + 0], y: groundPos[ground.indices[f * 3 + 2] * 3 + 1], z: groundPos[ground.indices[f * 3 + 2] * 3 + 2] },
                    });
                if (result.didHit) {

                    floorheight = result.hity;
                    hasHit = true;
                    //if (object.id == 0) {
                    //    console.log('hit ground');
                    //    console.log(floorheight);
                    //}
                }
            }

            //when the center is not directly over ground
            if (!hasHit && minGroundIndex.length > 0) {
                if (object.collider && object.collider.type == 'yrotbox') {
                    //console.log('stllhits');

                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                            -object.collider.hdepth, 0.0, object.collider.hwidth,
                            object.collider.hdepth, 0.0, -object.collider.hwidth,
                            -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];
                    var boxDiagonal = Math.sqrt(object.collider.hdepth * object.collider.hdepth + object.collider.hwidth * object.collider.hwidth);
                    var initialrotatedboxcoords = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
                    linTransformRange(initialrotatedboxcoords, objectboxcoords, object.matrix, 0, objectboxcoords.length);//useYRotToGetRotatedVectors(object.matrix, objectboxcoords);
                    var rotbox = initialrotatedboxcoords;
                    var boxtri1 = [rotbox[0],rotbox[1],rotbox[2],  rotbox[3],rotbox[4],rotbox[5],  rotbox[6],rotbox[7],rotbox[8]];
                    var boxtri2 = [rotbox[9],rotbox[10],rotbox[11],  rotbox[3],rotbox[4],rotbox[5],  rotbox[6],rotbox[7],rotbox[8]];

                    for (var m = 0; m < groundPos.length / 3; m++) {//(var m = 0; m < minGroundIndex.length; m++) {

                        var p1xDiff = (groundPos[ground.indices[m * 3 + 0] * 3 + 0] - objectFoot.x);
                        var p1yDiff = (groundPos[ground.indices[m * 3 + 0] * 3 + 1] - objectFoot.y);
                        var p1zDiff = (groundPos[ground.indices[m * 3 + 0] * 3 + 2] - objectFoot.z);

                        var p2xDiff = (groundPos[ground.indices[m * 3 + 1] * 3 + 0] - objectFoot.x);
                        var p2yDiff = (groundPos[ground.indices[m * 3 + 1] * 3 + 1] - objectFoot.y);
                        var p2zDiff = (groundPos[ground.indices[m * 3 + 1] * 3 + 2] - objectFoot.z);

                        var p3xDiff = (groundPos[ground.indices[m * 3 + 2] * 3 + 0] - objectFoot.x);
                        var p3yDiff = (groundPos[ground.indices[m * 3 + 2] * 3 + 1] - objectFoot.y);
                        var p3zDiff = (groundPos[ground.indices[m * 3 + 2] * 3 + 2] - objectFoot.z);

                        var p1GroundDistSquared = p1xDiff * p1xDiff + p1zDiff * p1zDiff;
                        var p2GroundDistSquared = p2xDiff * p2xDiff + p2zDiff * p2zDiff;
                        var p3GroundDistSquared = p3xDiff * p3xDiff + p3zDiff * p3zDiff;

                        var xCrossesMidd = Math.sign(p1xDiff) == Math.sign(p2xDiff) && Math.sign(p2xDiff) == Math.sign(p3xDiff);
                        var yCrossesMidd = Math.sign(p1yDiff) == Math.sign(p2yDiff) && Math.sign(p2yDiff) == Math.sign(p3yDiff);
                        var zCrossesMidd = Math.sign(p1zDiff) == Math.sign(p2zDiff) && Math.sign(p2zDiff) == Math.sign(p3zDiff);

                        if (!xCrossesMidd && !yCrossesMidd && !zCrossesMidd && (p1GroundDistSquared > boxDiagonal || p2GroundDistSquared > boxDiagonal || p3GroundDistSquared > boxDiagonal)) {
                            continue;
                        }

                        var mindex = m;//minGroundIndex[m];
                        for (var p = 0; p < 3; p++) {

                            var px = groundPos[ground.indices[m * 3 + p] * 3 + 0];
                            var py = groundPos[ground.indices[m * 3 + p] * 3 + 1];
                            var pz = groundPos[ground.indices[m * 3 + p] * 3 + 2];

                            var tri1result = IsPointInTriangleIncludeY({ x: px, y: py, z: pz },
                                {
                                    a: { x: boxtri1[0], y: boxtri1[1], z: boxtri1[2] },
                                    b: { x: boxtri1[3], y: boxtri1[4], z: boxtri1[5] },
                                    c: { x: boxtri1[6], y: boxtri1[7], z: boxtri1[8] },
                                });

                            if (tri1result.didHit) {
                                console.log(tri1result.hity);
                                floorheight = tri1result.hity;
                                hasHit = true;
                                p = 4;
                                op = 5;
                                m = groundPos.length;//minGroundIndex.length;
                                continue;
                            }
                            var tri2result = IsPointInTriangleIncludeY({ x: px, y: py, z: pz },
                                {
                                    a: { x: boxtri2[0], y: boxtri2[1], z: boxtri2[2] },
                                    b: { x: boxtri2[3], y: boxtri2[4], z: boxtri2[5] },
                                    c: { x: boxtri2[6], y: boxtri2[7], z: boxtri2[8] },
                                });

                            if (tri2result.didHit) {
                                console.log(tri2result.hity);
                                floorheight = tri2result.hity;
                                hasHit = true;
                                p = 4;
                                op = 5;
                                m = groundPos.length;//minGroundIndex.length;
                                continue;
                            }


                            for (var op = 0; op < 4; op++) {

                                var line1 = [groundPos[ground.indices[mindex * 3 + p] * 3 + 0], groundPos[ground.indices[mindex * 3 + p] * 3 + 2], groundPos[ground.indices[mindex * 3 + ((p + 1) % 3)] * 3 + 0], groundPos[ground.indices[mindex * 3 + ((p + 1) % 3)] * 3 + 2]];
                                var line2 = [initialrotatedboxcoords[op * 3 + 0], initialrotatedboxcoords[op * 3 + 2], initialrotatedboxcoords[((op + 1) % 4) * 3 + 0], initialrotatedboxcoords[((op + 1) % 4) * 3 + 2]];
                                var hitIntersect = getIntersectPoint(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1], line2[2], line2[3]);//getIntersectPoint

                                //console.log(hitIntersect);
                                //console.log(line1);
                                //console.log(line2);
                                if (hitIntersect) {
                                    //console.log('AAAHHHHHHH');
                                    //console.log(hitIntersect);

                                    var result = IsPointInTriangleIncludeY({ x: hitIntersect.x, y: objectFoot.y, z: hitIntersect.y },
                                        {
                                            a: { x: groundPos[ground.indices[mindex * 3 + 0] * 3 + 0], y: groundPos[ground.indices[mindex * 3 + 0] * 3 + 1], z: groundPos[ground.indices[mindex * 3 + 0] * 3 + 2] },
                                            b: { x: groundPos[ground.indices[mindex * 3 + 1] * 3 + 0], y: groundPos[ground.indices[mindex * 3 + 1] * 3 + 1], z: groundPos[ground.indices[mindex * 3 + 1] * 3 + 2] },
                                            c: { x: groundPos[ground.indices[mindex * 3 + 2] * 3 + 0], y: groundPos[ground.indices[mindex * 3 + 2] * 3 + 1], z: groundPos[ground.indices[mindex * 3 + 2] * 3 + 2] },
                                        });

                                    floorheight = result.hity;
                                    hasHit = true;
                                    p = 4;
                                    op = 5;
                                    m = groundPos.length;//minGroundIndex.length;
                                }
                            }
                        }
                    }//end of big m for loop
                }
            }
            if (!object.confirmGrounded) { object.confirmGrounded = true; object.isGrounded = false; }
            //if(object.id == 0)console.log(Math.abs(floorheight - objectFoot.y));
            if (Math.abs(floorheight - objectFoot.y) > 0.0001) {
                var fallLeeway = 0.01;
                if (objectFoot.y <= floorheight + 0.0001 && objectFoot.y > (floorheight - Math.abs(velyOrig) - fallLeeway)) { // + 0.0001 and
                    ////console.log('o dear itsa ' + floorheight);
                    if (floorheight < 1000) {
                        object.matrix[y] = floorheight - obotOffset;
                        object.isGrounded = true;
                        object.velocity.y = 0; //console.log('sayw ' + object.matrix[x] + ', ' + object.matrix[y] + ', '  + object.matrix[z]);
                    } else {
                        object.velocity.y -= 0.004 * StageData.timeDelta * 0.18;
                        object.confirmGrounded = false;
                    }

                } else if (object.isGrounded && Math.abs(floorheight - objectFoot.y) < 0.1) {
                    object.matrix[y] = floorheight - obotOffset;
                    ////console.log('your grunded at ' + floorheight);
                } else {
                    if (i == 80) {
                        console.log(object.isGrounded);
                        console.log(floorheight);
                        console.log(object.matrix[y]);
                    } else {
                        ////console.log('meh at ' + floorheight);
                        ////if (object.id == 0) console.log(Math.abs(floorheight - objectFoot.y));
                        object.velocity.y -= 0.004 * StageData.timeDelta * 0.18;
                    }
                    object.confirmGrounded = false;
                }
            } else if (!object.isGrounded) {
                object.velocity.y -= 0.004 * StageData.timeDelta * 0.18;
            }
            //console.log('sayw ' + object.matrix[y]);
        }
    }

    var tryJump = function (object) {
        if (object.isGrounded) {
            object.isGrounded = false;
            object.velocity.y += object.baseJump || 0.24;
        }
    }

    var handleEdgeCaseCollision = function (object, other, oy, e, c, vec, rotatedPreMoveboxcoords, otherboxcoords, rotatedboxcoords) {
        const x = 12;
        const y = 13;
        const z = 14;

        //console.log(rotatedPreMoveboxcoords[e * 3 + 0] + ', ' + rotatedPreMoveboxcoords[e * 3 + 1] + ', ' + rotatedPreMoveboxcoords[e * 3 + 2]);
        var blocked = false;
        var landed = false;
        var proby = 0;

        if ((Math.abs(oy - object.matrix[y]) > (other.collider.hheight + object.collider.hheight - 0.0001))) {
            //console.log('DASE DASE')
            landed = true;
            blocked = true;
            //if (oy < object.matrix[y]) {
            //    vec[1] = -(object.matrix[y] - oy - (other.collider.hheight + object.collider.hheight + 0.0001));
            //    proby = object.matrix[y] + (vec[1]);
            //    object.isGrounded = true;
            //    object.confirmGrounded = true;
            //    console.log('dase 0 DASE DASE');
            //    object.velocity.y = 0.0;
            //    landed = true;
            //} else {
            //    vec[1] = other.matrix[y] - object.matrix[y] - (other.collider.hheight + object.collider.hheight + 0.0001);
            //    proby = object.matrix[y] + (vec[1]);
            //    //other.isGrounded = true;
            //    console.log('dase 1 DASE DASE');
            //    object.velocity.y = 0.0;
            //    landed = true;
            //}
        } else {

            if (rotatedPreMoveboxcoords[e * 3 + 0] < (otherboxcoords[3] + .00001)) {
                var xincursion = rotatedboxcoords[e * 3 + 0] - otherboxcoords[3];
                //vec = [0, 0, 0];
                //console.log('ease 1 ' + c + ' ' + xincursion);
                for (var incur = 0; incur < (rotatedboxcoords.length / 3); incur++) {
                    rotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                }
                blocked = true;
            }
            if (rotatedPreMoveboxcoords[e * 3 + 0] > (otherboxcoords[0] - .00001)) {
                var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                var xincursion = otherboxcoords[0] - rotatedboxcoords[e * 3 + 0];
                var xincursion2 = otherboxcoords[0] - rotatedboxcoords[e * 3 + 2];
                //console.log('ease 0 ' + c + ' ' + xincursion);
                //console.log(rotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + rotatedboxcoords[e * 3 + 0] + ' eeyanda ' + rotatedboxcoords[e * 3 + 2] + ' mit ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                //console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                for (var incur2 = 0; incur2 < (rotatedboxcoords.length / 3); incur2++) {
                    rotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                    //rotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                }
                //console.log(rotatedboxcoords[e * 3 + 0] + ', ' + rotatedboxcoords[e * 3 + 1] + ', ' + rotatedboxcoords[e * 3 + 2]);
                blocked = true;
            }
            if (rotatedPreMoveboxcoords[e * 3 + 2] < (otherboxcoords[8] + .00001)) {
                var zincursion = rotatedboxcoords[e * 3 + 2] - otherboxcoords[8];
                //vec = [0, 0, 0];
                //console.log('ease 3');
                for (var incur3 = 0; incur3 < (rotatedboxcoords.length / 3); incur3++) {
                    rotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                }
                blocked = true;
            }
            if (rotatedPreMoveboxcoords[e * 3 + 2] > (otherboxcoords[2] - .00001)) {
                var zincursion = otherboxcoords[2] - rotatedboxcoords[e * 3 + 2];
                //vec = [0, 0, 0];
                //console.log('ease 4');
                for (var incur4 = 0; incur4 < (rotatedboxcoords.length / 3); incur4++) {
                    rotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                }
                blocked = true;
            }
            if (!blocked) {
                vec = [0, 0, 0];
            }
        }

        return {
            'blocked': blocked,
            'landed': landed,
            'proby': proby
        };

    }

    var checkAxisAlignedCollideTriggers = function (object) {
        const x = 12;
        const y = 13;
        const z = 14;

        var checkx = object.matrix[x];
        var checky = object.matrix[y];
        var checkz = object.matrix[z];
        var botOffset = (object.collider ? object.collider.bot || 0.0 : 0.0);
        var checkhheight = object.collider.hheight;
        var checkhwidth = Math.min(object.collider.hwidth, object.collider.hdepth);

        for (var t = 0; t < StageData.objects.length; t++) {
            var other = StageData.objects[t];
            if (!other) { continue; }
            if (!other.isAABoxTrigger || t == 0 || !other.OnTriggerCollide) { continue; }

            var ox = other.matrix[x];
            var oy = other.matrix[y];
            var oz = other.matrix[z]; 

            var oBotOffset = (other.collider ? other.collider.bot || 0.0 : 0.0);
            var oCheckhheight = other.collider.hheight;
            var oCheckhwidth = Math.min(other.collider.hwidth, other.collider.hdepth);
            //console.log(Math.abs(checkx - ox) < Math.abs(checkhwidth + oCheckhwidth));
            //console.log(Math.abs(checkz - oz) < Math.abs(checkhwidth + oCheckhwidth));
            //console.log(Math.abs((checky + botOffset) - (oy + oBotOffset))  );

            if (Math.abs(checkx - ox) < Math.abs(checkhwidth + oCheckhwidth) &&
                Math.abs(checkz - oz) < Math.abs(checkhwidth + oCheckhwidth) &&
                Math.abs((checky + botOffset) - (oy + oBotOffset)) < Math.abs(checkhheight + oCheckhheight)) {
                //console.log('do hit');
                other.OnTriggerCollide(other);
            }
        }
    }


    //credit to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    var useYRotToGetRotatedVectors = function (mat, vec3sarray, c2invBase, doLog) {
        var psize = vec3sarray.length / 3;
        var transformedArray = new Array(vec3sarray.length);

        var smat = mat4.create();
        if (c2invBase != null) {
            mat4.multiply(smat, c2invBase, mat);// = c2invBase;
        } else {
            var scal = glMatrix.vec3.create();
            mat4.getScaling(scal, mat); scal[0] = 1.0 / scal[0]; scal[1] = 1.0 / scal[1]; scal[2] = 1.0 / scal[2];
            mat4.scale(smat, mat, scal);
            //console.log(scal[2]);
        }

        for (var i = 0; i < psize; i++) {
            var vstart = i * 3;
            var rez = [vec3sarray[vstart] * smat[0] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * smat[8] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 1.0 + vec3sarray[vstart + 2] * 0.0 + 0.0,
            vec3sarray[vstart] * smat[2] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * smat[10] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * 0.0 + 1.0];
            //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
            transformedArray[i * 3] = (rez[0]);
            transformedArray[i * 3 + 1] = (rez[1]) / (rez[3]);
            transformedArray[i * 3 + 2] = (rez[2]) / (rez[3]);// + rect.top;//why is the +top even there?
        }
        //if (c2invBase != null && doLog)
        //console.log('eet: ' + transformedArray);
        return transformedArray;
    }

    //credit to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    var useYRotToGetInverseRotatedVectors = function (mat, vec3sarray, c2invBase) {
        var psize = vec3sarray.length / 3;
        var transformedArray = new Array(vec3sarray.length);

        var smat = mat4.create();
        if (c2invBase != null) {
            mat4.multiply(smat, c2invBase, mat);// = c2invBase;
        } else {
            var scal = glMatrix.vec3.create();
            mat4.getScaling(scal, mat); scal[0] = 1.0 / scal[0]; scal[1] = 1.0 / scal[1]; scal[2] = 1.0 / scal[2]; 
            mat4.scale(smat, mat, scal);
            //console.log(scal[2]);
        }

        for (var i = 0; i < psize; i++) {
            var vstart = i * 3;
            var rez = [vec3sarray[vstart] * smat[0] + vec3sarray[vstart + 1] * 0.0 + (-1.0 * vec3sarray[vstart + 2]) * smat[8] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 1.0 + vec3sarray[vstart + 2] * 0.0 + 0.0,
            (-1.0 * vec3sarray[vstart]) * smat[2] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * smat[10] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * 0.0 + 1.0];
            //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
            transformedArray[i * 3] = (rez[0]);
            transformedArray[i * 3 + 1] = (rez[1]) / (rez[3]);
            transformedArray[i * 3 + 2] = (rez[2]) / (rez[3]);// + rect.top;//why is the +top even there?
        }
        //if (c2invBase != null)
         //console.log('eet: ' + transformedArray);
        return transformedArray;
    }

    var getScaleMat = function (sourceMat) {
        var smat = mat4.create();
        var scal = glMatrix.vec3.create();
        mat4.getScaling(scal, sourceMat);
        mat4.scale(smat, smat, scal);
        return smat;
    }

    var IsPointInTriangleIncludeZ = function (point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
        var px = point.x;
        var py = point.y;
        var ax = tri.a.x || tri.a[0];
        var ay = tri.a.y || tri.a[1];
        var bx = tri.b.x || tri.b[0];
        var by = tri.b.y || tri.b[1];
        var cx = tri.c.x || tri.c[0];
        var cy = tri.c.y || tri.c[1];
        //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
        //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

        var v0 = [cx - ax, cy - ay];
        var v1 = [bx - ax, by - ay];
        var v2 = [px - ax, py - ay];

        var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
        var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
        var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
        var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        result = {};
        result.didHit = ((u >= 0) && (v >= 0) && (u + v <= 1));
        if (!result.didHit) {
            return result;
        } else {
            var startz = tri.a.z;
            var cmag = dot00;//Math.sqrt(dot00);
            var cproj = dot02 / cmag;
            var bmag = dot11;//Math.sqrt(dot11);
            var bproj = dot12 / bmag;
            result.hitz = bproj * (tri.b.z - startz) + cproj * (tri.c.z - startz) + startz; //console.log(result.hitz)
            return result;
        }
    }

    var IsPointInTriangleIncludeY = function (point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
        var px = point.x;
        var py = point.z;
        var ax = tri.a.x || tri.a[0];
        var ay = tri.a.z || tri.a[2];
        var bx = tri.b.x || tri.b[0];
        var by = tri.b.z || tri.b[2];
        var cx = tri.c.x || tri.c[0];
        var cy = tri.c.z || tri.c[2];
        //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
        //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

        var v0 = [cx - ax, cy - ay];
        var v1 = [bx - ax, by - ay];
        var v2 = [px - ax, py - ay];

        var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
        var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
        var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
        var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        result = {};
        result.didHit = ((u >= 0) && (v >= 0) && (u + v <= 1));
        if (!result.didHit) {
            return result;
        } else {
            //credit https://math.stackexchange.com/questions/28043/finding-the-z-value-on-a-plane-with-x-y-values
            var cvec = [cx - ax, cy - ay, tri.c.y - tri.a.y];
            var bvec = [bx - ax, by - ay, tri.b.y - tri.a.y];
            var cxb = [cvec[1] * bvec[2] - cvec[2] * bvec[1], cvec[2] * bvec[0] - cvec[0] * bvec[2], cvec[0] * bvec[1] - cvec[1] * bvec[0]];
            var k = cxb[0] * tri.a.x + cxb[1] * tri.a.z + cxb[2] * tri.a.y;
            try {
                result.hity = (k - (cxb[0] * px + cxb[1] * py)) / cxb[2];
            }
            catch { result.hity = tri.a.y; }
            if (isNaN(result.hity)) {
                result.hity = tri.a.y;
            }

            /*
            //var cdotb = [cvec[0] * bvec[0], cvec[1] * bvec[1], cvec[2] * bvec[2]];
            var cdotb = cvec[0] * bvec[0] + cvec[1] * bvec[1] + cvec[2] * bvec[2];
            var cfulldot = cvec[0] * cvec[0] + cvec[1] * cvec[1] + cvec[2] * cvec[2];
            var bfulldot = bvec[0] * bvec[0] + bvec[1] * bvec[1] + bvec[2] * bvec[2];
            var corth = [cvec[0] - ((cdotb) * bvec[0]) / bfulldot, cvec[1] - ((cdotb) * bvec[1]) / bfulldot, cvec[2] - ((cdotb) * bvec[2]) / bfulldot];

            var starty = tri.a.y;
            var cmag = dot00;//Math.sqrt(dot00);
            var cproj = dot02 / cmag;
            var bmag = dot11;//Math.sqrt(dot11);
            var bproj = dot12 / bmag;
            //var corth = [v0[0] - (dot01) * v1[0], v0[1] - (dot01) * v1[1], ];
            var corthproj = (corth[0] * v2[0] + corth[1] * v2[1]) / (corth[0] * corth[0] + corth[1] * corth[1]);
            result.hity = corthproj * (corth[2]) + cproj * (tri.c.y - starty) + starty; //console.log(corth)*/

            return result;
        }
    }

    //thank you Dan Fox https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function and oliverpool for the tip!
    // returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
    var intersects = function (a, b, c, d, p, q, r, s) {
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
        //todo george add check for same line
    };


    //thank you Paul Bourke http://paulbourke.net/geometry/pointlineplane/javascript.txt
    // and thanks you vbarbarosh and David Figatner on https://stackoverflow.com/questions/13937782/calculating-the-point-of-intersection-of-two-lines
    // but did rename from intersect
    // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    // Determine the intersection point of two line segments
    // Return FALSE if the lines don't intersect
    function getIntersectPoint(x1, y1, x2, y2, x3, y3, x4, y4) {

        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false
        }

        denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        // Lines are parallel
        if (denominator === 0) {
            return false
        }

        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false
        }

        // Return a object with the x and y coordinates of the intersection
        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)

        return { x, y }
    }


    return {
        keystates: keystates,
        onFrame: onFrame,
        spaceWasDown: spaceWasDown
    }
})();

