// JavaScript source code
// Now create an array of positions for the square.
const WanderFox = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];

       

    var Init = function () {
        StageData.ticks = 0;
        ////SkyboxRenderer.useSkybox('skybox');//"penguins (26)");//StageData.skybox = "penguins (26)";
        OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);
        console.log(camDist);
        maxCamDist = 300.0;//global scope, plz fix
        maxZFar = 400.0;//this global too
        //camDist = 240.0;

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;
               
        var boxloc = 'SampleModels/Box/glTF-Embedded/Box.gltf';
        var minloc = 'SampleModels/Minimal.gltf';
        var rotboxloc = 'SampleModels/BoxAnimated/glTF-Embedded/BoxAnimated.gltf';
        var rottriloc = 'SampleModels/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf';
        var twotriloc = 'SampleModels/SimpleMeshes/glTF-Embedded/SimpleMeshes.gltf';
        var texloc = 'SampleModels/SimpleTxt.gltf'
        var trimorph = 'SampleModels/SimpleMorph/glTF-Embedded/SimpleMorph.gltf'
        var skelloc = 'SampleModels/SimpleSkin/glTF-Embedded/SimpleSkin.gltf'

        var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';

        GltfConverter.getPrimitiveFromJsResource(foxloc, function (res) {
            console.log('!'); console.log(res);
            Primitives.shapes["testbox"] = res.prim;
            Primitives.shapes["testbox"].animations = [];
            if (res.animations) {
                for (var a = 0; a < res.animations.length; a++) {
                    Primitives.animations.push(res.animations[a]);
                    Primitives.shapes["testbox"].animations[res.animations[a].name] = Primitives.animations[Primitives.animations.length - 1];
                }
            }
            console.log(Primitives.shapes["testbox"]);
            var ob5 = Makarios.instantiate(Primitives.shapes["testbox"], Primitives.shapes["testbox"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
            Makarios.SetAnimation(ob5, "Run");//"0"    Survey  Run
            var savematv = [ob5.matrix[3], ob5.matrix[7], ob5.matrix[11], ob5.matrix[12], ob5.matrix[13], ob5.matrix[14], ob5.matrix[15]];

            var savematv2 = [ob5.matrix[0], ob5.matrix[1], ob5.matrix[2], ob5.matrix[4], ob5.matrix[5], ob5.matrix[6], ob5.matrix[8], ob5.matrix[9], ob5.matrix[10]];

            mat4.fromScaling(ob5.matrix, [0.1, 0.1, 0.1]);
            console.log(ob5.matrix);
            //ob5.matrix[3] = savematv[0];
            //ob5.matrix[7] = savematv[1];
            //ob5.matrix[11] = savematv[2];
            //ob5.matrix[12] = savematv[3];
            //ob5.matrix[13] = savematv[4];
            //ob5.matrix[14] = savematv[5];
            //ob5.matrix[15] = savematv[6];


            ////ob5.matrix[0] = savematv2[0];
            //ob5.matrix[1] = savematv2[1];
            //ob5.matrix[2] = savematv2[2];
            //ob5.matrix[4] = savematv2[3];
            ////ob5.matrix[5] = savematv2[4];
            ////ob5.matrix[6] = savematv2[5];
            //ob5.matrix[8] = savematv2[6];
            ////ob5.matrix[9] = savematv2[7];
            ////ob5.matrix[10] = savematv2[8];

            Makarios.setCamDist(40.0);

            //ob5.matrix = objects[0].matrix;
            ////mat4.scale(ob5.matrix, 0.1, [1.0, 1.0, 1.0]);
            //mat4.fromScaling(ob5.matrix, [0.1, 0.1, 0.1]);
            //mat4.fromTranslation(ob5.matrix, [0.0, -30.1, -240.1]);

            //var modelViewMatrix = gmod;
            //if (!modelViewMatrix) {
            //    modelViewMatrix = mat4.create();

            //    // Now move the drawing position a bit to where we want to
            //    // start drawing the square.
            //    mat4.translate(modelViewMatrix,     // destination matrix
            //        modelViewMatrix,     // matrix to translate
            //        [-0.0, 0.0, -220.0]);  // amount to translate
            //    camDist = 22.0;
            //    //mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 1.9, [.3, 1, 0]);
            //}
            //gmod = modelViewMatrix;

            //setTimeout(function () {
            //    console.log('camDist');
            //    console.log(camDist);
            //    Makarios.setCamDist(240.0);
            //}, 2000);
        });
        //setTimeout(function () {
        //    console.log(Primitives.shapes["testbox"]);
        //    var ob5 = Makarios.instantiate(Primitives.shapes["testbox"], Primitives.shapes["testbox"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
        //    Makarios.SetAnimation(ob5, "Run");//"0"    Survey  Run
        //    //ob5.matrix = objects[0].matrix;
        //    console.log(ob5);
        //}, 2000);

    };

    var OnFrame = function () {
        //FrameLogic.onFrame();
    };

    //console.log(objects[0].children[0].indices)
    //console.log(objects[0].useParentMatrix)
    //console.log(objects[0].children[0].useParentMatrix)
    //return { 'objects': objects };
    return { 'Init': Init, 'OnFrame': OnFrame };
})();