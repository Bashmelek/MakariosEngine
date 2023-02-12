//App logic for starfield
const StarfieldDemo = (function () {
    var objects = [];

    var movemat = null;//glMatrix.mat4.create();
    var moveline = [0, 0, 0.02];
    var lastFrameTime = null;
    var numitems = 0;
    var isMobile = false;
    //this is from https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device
    //thank you!
    if (/Mobi/.test(navigator.userAgent)) {
        // mobile!
        isMobile = true;
    }
    const spawnInterval = isMobile ? 360 : 360;//360;  1440
    var nextTargetVTick = spawnInterval;
    var getSpawnPointFunc;

    var disappearingItem = function (item) {

        glMatrix.mat4.translate(item.matrix,     // destination matrix
            item.matrix,     // matrix to translate
            moveline);//currently only supports local coords

        if (!item.customprops.ageCount) {
            item.customprops.ageCount = 0;
        }
        if (item.customprops.customAlpha < 1.0) {
            item.customprops.customAlpha += StageData.timeDelta * .00004;//.0002;
            if (Makarios.UseAlphaInTextureBuffer()) {
                //console.log(item.customprops.customAlpha)
                //for (var t = 0; t < (item.textureCoordinates.length / 3); t++) {
                //    item.textureCoordinates[t * 3 + 2] = item.customprops.customAlpha;
                //    //hack, as positions = texturecoordssize
                //    Entera.buffers.textureCoordinates[item.positionsBufferStart + item.startContPosIndex + t * 3 + 2] = item.customprops.customAlpha;
                //}
            }
        }

        item.customprops.ageCount += StageData.timeDelta;//1;
        if (item.customprops.ageCount > 30000) {//6000 old ticks //30000  //1200000
            Makarios.destroy(item);
            numitems -= 1;
        }
    };

    var Init = function () {
        InitDefaultInputActions();
        StageData.ticks = 0;
        StageData.vticks = 0;
        Makarios.writeToUI('Welcome to Makarios Labs');
        Makarios.SetUseAlphaInTextureBuffer(true);
        StageData.noScroll = true;
        lastFrameTime = Date.now();


        //var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';
        //GltfConverter.getPrimitiveFromJsResource(foxloc, function (res) {
        //    console.log('!'); console.log(res);
        //    Primitives.shapes["testbox"] = res.prim;
        //    Primitives.shapes["testbox"].animations = [];
        //    if (res.animations) {
        //        for (var a = 0; a < res.animations.length; a++) {
        //            Primitives.animations.push(res.animations[a]);
        //            Primitives.shapes["testbox"].animations[res.animations[a].name] = Primitives.animations[Primitives.animations.length - 1];
        //        }
        //    }
        //});

        getSpawnPointFunc = isMobile ? getRandomSpawnPointMobile : getRandomSpawnPoint;
        //SkyboxRenderer.useSkybox = null;
        //StageData.skybox = null;

        // Makarios.instantiate(Primitives.shapes["tetrahedron"], 'grumpycss.jpg', disappearingItem, {});
        //Makarios.instantiate(Primitives.shapes["cube"], 'grumpycss.jpg', null, {});//'meeseeks can do.jpg'

        //glMatrix.mat4.translate(StageData.objects[0].matrix,     // destination matrix
        //    StageData.objects[0].matrix,     // matrix to translate
        //    [-3.5, 0.0, 0.0]);
        //glMatrix.mat4.rotate(StageData.objects[0].matrix,  // destination matrix
        //    StageData.objects[0].matrix,  // matrix to rotate
        //    .7,   // amount to rotate in radians
        //    [0, 1, 0]);

        //var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 2, 'smile1.jpg', {});
        //glMatrix.mat4.translate(obj2.matrix,     // destination matrix
        //    obj2.matrix,     // matrix to translate
        //    [3.5, 0.0, 0.0]);
        //setTimeout(function () {
        //    var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 'meeseeks can do.jpg', disappearingItem, {});
        //    glMatrix.mat4.translate(obj2.matrix,     // destination matrix
        //        obj2.matrix,     // matrix to translate
        //        [3.5, 0.0, 0.0]);
        //}, 4000);
    };

    var getRandomSpawnPoint = function () {
        return [Math.random() * 176.0 - 88.0, Math.random() * 128.0 - 64.0, -160.0];//[Math.random() * 110.0 - 55.0, Math.random() * 80.0 - 40.0, 0.70];//[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//[1 * 22.0 - 11.0, 1 * 16.0 - 8.0, -40.0];
    };
    var getRandomSpawnPointMobile = function () {
        return [Math.random() * 126.0 - 63.0, Math.random() * 63.0 - 32.0, -160.0];//[Math.random() * 110.0 - 55.0, Math.random() * 80.0 - 40.0, 0.70];//[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//[1 * 22.0 - 11.0, 1 * 16.0 - 8.0, -40.0];
    };

    var OnFrame = function () {
        //console.log(StageData.ticks % 1000);
        movemat = glMatrix.mat4.create();
        var tempy = glMatrix.mat4.create();
        glMatrix.mat4.invert(tempy, gmod);
        glMatrix.mat4.invert(movemat, gproj);
        //glMatrix.mat4.transpose(tempy, tempy);
        glMatrix.mat4.multiply(tempy, tempy, movemat);

        //var oldTime = lastFrameTime;
        //lastFrameTime = Date.now();
        //var timeDelta = lastFrameTime - oldTime;
        //Makarios.writeToUI(timeDelta);
        //console.log(timeDelta);
                                                 //-0.0004
        moveline = lin3Transform(tempy, [0.0, 0.0, -0.00006 * StageData.timeDelta]);// -0.0012]); //[0.0, 0.0, 0.2];//lin3Transform(tempy, [0.0, 0.0, -0.002]);// [0.0, 0.0, -0.002]

        if (StageData.vticks >= nextTargetVTick) {// && Date.now() > lastFrameTime + 7000) {//10  //24  //72
            nextTargetVTick += spawnInterval;
            numitems += 1;
            //console.log('created. now at ' + numitems + ' items with ticktime ' + StageData.timeDelta);
            var adjustedSpawn = getSpawnPointFunc();//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); //[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); 

            var tempmat = mat4.create();

            glMatrix.mat4.invert(tempmat, gmod);
            var spawnPoint = linTransform(tempmat, adjustedSpawn);

            var obj = Makarios.instantiate(Primitives.shapes["doubletetrahedron"], 'plainsky.jpg', disappearingItem, {}, nextTargetVTick);
            obj.customprops.customAlpha = 0.1;
            if (Makarios.UseAlphaInTextureBuffer()) {
                //console.log(item.customprops.customAlpha)
                //for (var t = 0; t < (obj.textureCoordinates.length / 3); t++) {
                //    obj.textureCoordinates[t * 3 + 2] = obj.customprops.customAlpha;
                //    //hack, as positions = texturecoordssize
                //    Entera.buffers.textureCoordinates[obj.positionsBufferStart + obj.startContPosIndex + t * 3 + 2] = obj.customprops.customAlpha;
                //}
            }

            glMatrix.mat4.translate(obj.matrix,     // destination matrix
                obj.matrix,     // matrix to translate
                spawnPoint);





            //numitems += 1;
            ////console.log('created. now at ' + numitems + ' items with ticktime ' + StageData.timeDelta);
            //var adjustedSpawn = getSpawnPointFunc();//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); //[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); 

            //var tempmat = mat4.create();

            //glMatrix.mat4.invert(tempmat, gmod);
            //var spawnPoint = linTransform(tempmat, adjustedSpawn);

            //var obj = Makarios.instantiate(Primitives.shapes["doubletetrahedron"], 'plainsky.jpg', disappearingItem, {}, nextTargetVTick);
            //obj.customprops.customAlpha = 0.1;

            //glMatrix.mat4.translate(obj.matrix,     // destination matrix
            //    obj.matrix,     // matrix to translate
            //    spawnPoint);

            //Makarios.writeToUI(Entera.getEntDebugMessage());
        }
    };

    

    return { 'Init': Init, 'OnFrame': OnFrame };
})();// JavaScript source code
