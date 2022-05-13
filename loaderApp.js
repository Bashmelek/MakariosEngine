// JavaScript source code
// Now create an array of positions for the square.
const TryLoadingPrim = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];

       

    var Init = function () {
        StageData.ticks = 0;
        ////SkyboxRenderer.useSkybox('skybox');//"penguins (26)");//StageData.skybox = "penguins (26)";
        ////OutlineRenderer.setup();
        ////Makarios.setStepsForCelShading(4.0);
        maxCamDist = 200.0;//global scope, plz fix
        maxZFar = 300.0;//this global too
               
        var boxloc = 'SampleModels/Box/glTF-Embedded/Box.gltf';
        var minloc = 'SampleModels/Minimal.gltf';
        var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';
        var rotboxloc = 'SampleModels/BoxAnimated/glTF-Embedded/BoxAnimated.gltf';
        var rottriloc = 'SampleModels/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf';
        var twotriloc = 'SampleModels/SimpleMeshes/glTF-Embedded/SimpleMeshes.gltf';
        var texloc = 'SampleModels/SimpleTxt.gltf'
        var trimorph = 'SampleModels/SimpleMorph/glTF-Embedded/SimpleMorph.gltf'
        var skelloc = 'SampleModels/SimpleSkin/glTF-Embedded/SimpleSkin.gltf'

        GltfConverter.getPrimitiveFromJsResource(skelloc, function (res) {
            console.log('!'); console.log(res);
            Primitives.shapes["testbox"] = res.prim;
            Primitives.shapes["testbox"].animations = [];
            if (res.animations) {
                for (var a = 0; a < res.animations.length; a++) {
                    Primitives.animations.push(res.animations[a]);
                    Primitives.shapes["testbox"].animations[res.animations[a].name] = Primitives.animations[Primitives.animations.length - 1];
                }
            }
        });
        setTimeout(function () {
            console.log(Primitives.shapes["testbox"]);
            var ob5 = Makarios.instantiate(Primitives.shapes["testbox"], Primitives.shapes["testbox"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
            Makarios.SetAnimation(ob5, "0");//"0"    Survey  Run
            //ob5.matrix = objects[0].matrix;
            console.log(ob5);
        }, 2000);

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