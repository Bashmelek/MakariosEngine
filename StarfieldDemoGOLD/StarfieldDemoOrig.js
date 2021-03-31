//App logic for starfield
const StarfieldDemo = (function () {
    var objects = [];

    var movemat = null;//glMatrix.mat4.create();
    var moveline = [ 0, 0, 0.02];

    var disappearingItem = function (item) {
        //var tempmat = mat4.create();
        //mat4.rotate(tempmat, tempmat, -1, [gmod[1], gmod[8], gmod[9]]);
        //console.log(tempmat, [0.0, 0.0, 0.02]));

        glMatrix.mat4.translate(item.matrix,     // destination matrix
            item.matrix,     // matrix to translate
            moveline);//currently only supports local coords
        //mat4.multiply(item.matrix, item.matrix, gproj);
        //mat4.rotate(item.matrix, item.matrix, (2.0) * 0.001, [gmod[1], gmod[5], gmod[9]]);
        //item.matrix[1] = gmod[1];
        //item.matrix[5] = gmod[5];
        //item.matrix[9] = gmod[9];
        //console.log(linTransform(gmod, [0.0, 0.0, 0.02]));
        if (!item.customprops.ageCount) {
            item.customprops.ageCount = 0;
        }
        item.customprops.ageCount += 1;
        if (item.customprops.ageCount > 6000) {
            Makarios.destroy(item);
        }
    };

    var Init = function () {
        StageData.ticks = 0;
        Makarios.writeToUI();
        /* Makarios.instantiate(Primitives.shapes["tetrahedron"], 'grumpycss.jpg', disappearingItem, {});
        Makarios.instantiate(Primitives.shapes["cube"], 'grumpycss.jpg', null, {});//'meeseeks can do.jpg'

        glMatrix.mat4.translate(StageData.objects[0].matrix,     // destination matrix
            StageData.objects[0].matrix,     // matrix to translate
            [-3.5, 0.0, 0.0]);
        glMatrix.mat4.rotate(StageData.objects[0].matrix,  // destination matrix
            StageData.objects[0].matrix,  // matrix to rotate
            .7,   // amount to rotate in radians
            [0, 1, 0]);

        //var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 2, 'smile1.jpg', {});
        //glMatrix.mat4.translate(obj2.matrix,     // destination matrix
        //    obj2.matrix,     // matrix to translate
        //    [3.5, 0.0, 0.0]);
        setTimeout(function () {
            var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 'meeseeks can do.jpg', disappearingItem, {});
            glMatrix.mat4.translate(obj2.matrix,     // destination matrix
                obj2.matrix,     // matrix to translate
                [3.5, 0.0, 0.0]);
        }, 4000);*/
    };

    var getRandomSpawnPoint = function () {
        return [Math.random() * 176.0 - 88.0, Math.random() * 128.0 - 64.0, -160.0];//[Math.random() * 110.0 - 55.0, Math.random() * 80.0 - 40.0, 0.70];//[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//[1 * 22.0 - 11.0, 1 * 16.0 - 8.0, -40.0];
    };

    var OnFrame = function () {
        //console.log(StageData.ticks % 1000);
        movemat = glMatrix.mat4.create();
        var tempy = glMatrix.mat4.create();
        glMatrix.mat4.invert(tempy, gmod);
        glMatrix.mat4.invert(movemat, gproj);
        //glMatrix.mat4.transpose(tempy, tempy);
        glMatrix.mat4.multiply(tempy, tempy, movemat);
        //glMatrix.mat4.multiply(movemat, gproj, gmod);
        //moveline = lin3Transform(movemat, [0.0, 0.0, 0.002]);

        ////glMatrix.mat4.multiply(tempy, gproj, gmod);//mat4.multiply(movemat, gproj, gmod);
        ////glMatrix.mat4.invert(tempy, tempy);
        //glMatrix.mat4.invert(movemat, gmod);
        //moveline = linTransform(movemat, [0.0, 0.0, -0.002]);//[0.0, 0.0, 0.2];

        moveline = lin3Transform(tempy, [0.0, 0.0, -0.0004]);// -0.0012]); //[0.0, 0.0, 0.2];//lin3Transform(tempy, [0.0, 0.0, -0.002]);// [0.0, 0.0, -0.002]


        //glMatrix.mat4.multiply(tempy, gproj, gmod);
        //moveline = lin3Transform(tempy, moveline);

        if (StageData.ticks % 72 == 0) {//10  //24
            //console.log('innit it');
            //console.log(moveline);
            //console.log(tempy);
            ////if (StageData.objects[3]) {
            ////    var otemp = glMatrix.mat3.create();
            ////    glMatrix.mat3.fromMat4(otemp, tempy);
            ////    glMatrix.mat3.invert(otemp, otemp);
            ////    var vt;// = [0.0, 0.0, 0.2];
            ////    vt = lin3TransformMat3(otemp, moveline);
            ////    console.log(tempy);
            ////    console.log(otemp);
            ////    console.log(vt);
            ////}
            //console.log(moveline);
            //glMatrix.mat4.multiply(movemat, gproj, gmod);
            //console.log(lin3Transform(movemat, moveline));
            //var tempmat = mat4.create();
            //mat4.rotate(tempmat, tempmat, 1, [gmod[1], gmod[8], gmod[9]]);
            //console.log(linTransform(mat4.create(), [0.0, 0.0, 0.02]));
            //glMatrix.mat4.multiply(tempy, gproj, gmod);
            //var inversedProj = glMatrix.mat3.create();
            //glMatrix.mat3.fromMat4(inversedProj, tempy);
            //glMatrix.mat3.invert(inversedProj, inversedProj);
            var adjustedSpawn = getRandomSpawnPoint();//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); //[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); 
            
            //console.log(adjustedSpawn);
            //glMatrix.mat4.multiply(movemat, gproj, gmod);
            var tempmat = mat4.create();
            glMatrix.mat4.invert(tempmat, gmod);
            var spawnPoint = linTransform(tempmat, adjustedSpawn);// linTransform(tempy, getRandomSpawnPoint());
            //spawnPoint[0] -= moveline[0] * 500.0;
            //spawnPoint[1] -= moveline[1] * 500.0;
            //spawnPoint[2] -= moveline[2] * 500.0;
            //console.log(spawnPoint);
            var obj = Makarios.instantiate(Primitives.shapes["doubletetrahedron"], 'plainsky.jpg', disappearingItem, {});
            //glMatrix.mat4.multiply(obj.matrix, gproj, obj.matrix);
            //var quat = [];
            //glMatrix.mat4.getRotation(quat, tempy);
            //glMatrix.mat4.fromRotationTranslation(obj.matrix, quat, adjustedSpawn);

            glMatrix.mat4.translate(obj.matrix,     // destination matrix
                obj.matrix,     // matrix to translate
                spawnPoint);
        }
    };

    

    return { 'Init': Init, 'OnFrame': OnFrame };
})();// JavaScript source code
