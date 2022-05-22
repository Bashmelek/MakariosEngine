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

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;

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

            mat4.fromScaling(ob5.matrix, [0.1, 0.1, 0.1]);
            console.log(ob5.matrix);


            var obplane = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});
            mat4.fromScaling(obplane.matrix, [4.0, 4.0, 4.0]);

            Makarios.setCamDist(40.0);
        });

    };

    var ProcInLoading = function () {

    };

    var WanderProc = ProcInLoading;

    var OnFrame = function () {
        //FrameLogic.onFrame();
        WanderProc();
    };

    return { 'Init': Init, 'OnFrame': OnFrame };
})();