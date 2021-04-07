//App logic for starfield
const StarfieldDemo = (function () {
    var objects = [];

    var movemat = null;//glMatrix.mat4.create();
    var moveline = [ 0, 0, 0.02];

    var disappearingItem = function (item) {

        glMatrix.mat4.translate(item.matrix,     // destination matrix
            item.matrix,     // matrix to translate
            moveline);//currently only supports local coords

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

    var OnFrame = function () {
        //console.log(StageData.ticks % 1000);
        movemat = glMatrix.mat4.create();
        var tempy = glMatrix.mat4.create();
        glMatrix.mat4.invert(tempy, gmod);
        glMatrix.mat4.invert(movemat, gproj);
        //glMatrix.mat4.transpose(tempy, tempy);
        glMatrix.mat4.multiply(tempy, tempy, movemat);

        moveline = lin3Transform(tempy, [0.0, 0.0, -0.0004]);// -0.0012]); //[0.0, 0.0, 0.2];//lin3Transform(tempy, [0.0, 0.0, -0.002]);// [0.0, 0.0, -0.002]

        if (StageData.ticks % 72 == 0) {//10  //24

            var adjustedSpawn = getRandomSpawnPoint();//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); //[0.01 * 22.0 - 11.0, 0.0 * 16.0 - 8.0, .40];//lin3TransformMat3(inversedProj, getRandomSpawnPoint()); 

            var tempmat = mat4.create();

            glMatrix.mat4.invert(tempmat, gmod);
            var spawnPoint = linTransform(tempmat, adjustedSpawn);

            var obj = Makarios.instantiate(Primitives.shapes["doubletetrahedron"], 'plainsky.jpg', disappearingItem, {});

            glMatrix.mat4.translate(obj.matrix,     // destination matrix
                obj.matrix,     // matrix to translate
                spawnPoint);
        }
    };

    

    return { 'Init': Init, 'OnFrame': OnFrame };
})();// JavaScript source code
