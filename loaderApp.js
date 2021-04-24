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
               
        var boxloc = 'SampleModels/Box/glTF-Embedded/Box.gltf';
        var minloc = 'SampleModels/Minimal.gltf';
        var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';

        GltfConverter.getPrimitiveFromJsResource(boxloc, function (res) { console.log('!'); console.log(res); Primitives.shapes["testbox"] = res; });
        setTimeout(function () {
            console.log(Primitives.shapes["testbox"]);
            var ob5 = Makarios.instantiate(Primitives.shapes["testbox"], 'plainsky.jpg', null, {});
            //ob5.matrix = objects[0].matrix;
            console.log(ob5)
        }, 1000);

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