// JavaScript source code

/*
    ------Required to return in theGame------------
    Init
    OnFrame


    ------Optional to return in theGame------------
    customAttributes
    customUniforms

    ------Optional global variables to declare and set------------
    vsOverride
    fsOverride


*/


//var fsOverride;
//var vsOverride;
const Bash0 = (function () {
    const mat4 = glMatrix.mat4;
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    var objects = [];

    CommonShaders.InitCustomShader("0v0a");

    var wgl;
    var textureMatrix = mat4.create();

    var mainChar = null;
    var mainCharRot = null;
    baseGmod = null;
    var mousePos = { x: 0.0, y: 0.0 };


    var Init = function () {
        StageData.ticks = 0;
        SkyboxRenderer.useSkybox('skybox');
        ShadowShader.setup(null, [1.0, 0.6, 1.0]);
        OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);
        console.log(camDist);
        maxCamDist = 300.0;//global scope, plz fix
        maxZFar = 550.0;//this global too
        ShadowShader.setProjScaler(98.0);
        var initShadowProjScaler = ShadowShader.getProjScaler();

        //ortho(out, left, right, bottom, top, near, far)
        StageData.SetMainDirLight([.192, -1.752, 0.0], [0.0, 48.0, 0.0], [1.0, 1.0, 1.0]);
        StageData.defShadowProjMat = mat4.create();
        mat4.ortho(StageData.defShadowProjMat,
            -initShadowProjScaler, initShadowProjScaler, -initShadowProjScaler, initShadowProjScaler, 0.1, maxZFar + 1000);

        var shadowBoundMat = mat4.create();
        mat4.fromScaling(shadowBoundMat, [54.0, 54.0, 8.0]);
        StageData.shadowBoundBox = new Array(Primitives.shapes["cube"].positions.length);
        linTransformRange(StageData.shadowBoundBox, Primitives.shapes["cube"].positions, shadowBoundMat, 0, Primitives.shapes["cube"].positions.length, null);

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;



        var canvas = document.getElementById("glCanvas");
        wgl = canvas.getContext("webgl");

        CommonShaders.InitCustomShaderData("0v0a");

        //var timmyloc = 'gmodels/firstCat12_emb.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(timmyloc, "timmy");

        var katloc = 'gmodels/firstCat13_emb.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(katloc, "kat");

        var diamondloc = 'gmodels/diamond0.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(diamondloc, "diamond");

        //var ground01loc = 'gmodels/sampleGround01.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(ground01loc, "groundsample");
        //var defmat1 = mat4.create();
        //mat4.fromScaling(defmat1, [0.1, 0.1, 0.1]);
        //var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(foxloc, "testbox");

        //var milktruckloc = 'SampleModels/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(milktruckloc, "milktruck");

        //var caesarloc = 'SampleModels/CesiumMan/glTF-Embedded/CesiumMan.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(caesarloc, "caesar");

        isLoading = false;

    };



    var GetMainChar = function () {
        return mainChar;
    }




    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };



        yaw = Math.PI / 1.0;//.6;
        pitch = Math.PI / 12.0;//0.65




        var obChar = Makarios.instantiate(Primitives.shapes["kat"], Primitives.shapes["kat"].textureUrl, null, {});




        mainChar = obChar;

        document.querySelector('#uiCanvas').onmousemove = function (e) {
            e = e || window.event;
            mousePos = { x: e.clientX, y: e.clientY };
        }
        console.log(StageData.objects);

        gmod = mat4.create();
        mat4.translate(gmod,     // destination matrix
            gmod,     // matrix to translate
            [-0.0, 0.0, -camDist * 2.0]);
        mat4.rotate(gmod, gmod, 0.0, [gmod[1], gmod[5], gmod[9]]);//yaw
        mat4.rotate(gmod, gmod, Math.PI / 2.0, [gmod[0], gmod[4], gmod[8]]);//pitch

        WanderProc = MainProc;
    };

    var MainProc = function () {

        ChaosControlv0.OnFrame();

        //StageData.SetMainDirLight([0.5, 0.001 * StageData.ticks, 0.0], [0.0, 0.0, 18.0], [1.0, 1.0, 1.0]);
        StageData.SetMainDirLight([0.000 * StageData.ticks + 0.5, 0.0002 * StageData.ticks, 0.0], [0.0, 0.0, 144.0], [1.0, 1.0, 1.0]);//176

        var lpoint = [0.0, 0.0, 0.0];
        var lightLocMat = mat4.create();
        mat4.invert(lightLocMat, StageData.StageLights[0].lightmat);
        linTransformRange(lpoint, lpoint, lightLocMat, 0, 3, null);
        //lpoint = [-lpoint[0], -lpoint[1], -lpoint[2]];//[0.85, 0.8, 0.75];//[-lpoint[0], -lpoint[1], -lpoint[2]]
        //lpoint = [0.9, 0.9, 0.9];
        var lpointvec = vec3.create();
        lpointvec[0] = lpoint[0]; lpointvec[1] = lpoint[1]; lpointvec[2] = lpoint[2];
        vec3.normalize(lpointvec, lpointvec);
        wgl.uniform3fv(
            globalMainProgramInfo.uniformLocations.lightDirection,
            lpoint);////[0.000 * StageData.ticks + 0.5, 0.002 * StageData.ticks, 0.0]);
        //console.log(gmod);

        if (gmod && !baseGmod) {
            baseGmod = mat4.create();
            baseGmod = mat4.clone(gmod);
        }
        var qcharRot = quat.create();
        mat4.getRotation(qcharRot, mainChar.matrix);

        //var charRotMat = mat4.create();
        //fromQuat(charRotMat, qcharRot);
        //console.log((QuatToEulers(qcharRot)[1] + 360.0) % 360.0);



        /////////////////////////----------START MAIN GAME LOGIC






        /////////////////////////////////////---------END MAIN GAME LOGIC
        var basematrix = mat4.create();
        mat4.multiply(basematrix, gproj, gmod);

        var hitstuff = {};
        hitstuff.tris = [];
        hitstuff.objects = [];
        var objcount = StageData.objects.length;

        //for (var objindex = 0; objindex < objcount; objindex++) {
        //    if (!StageData.objects[objindex]) { continue; }
        //    StageData.objects[objindex].outlineColor = [1.0, 0.6, 1.0];
        //    var objmatrix = mat4.create();
        //    mat4.multiply(objmatrix, basematrix, StageData.objects[objindex].matrix);

        //    //recursiveCheckAllObjectsIfScreenPointHits(StageData.objects[objindex], null, objmatrix, [], hitstuff, { x: mousePos.x, y: mousePos.y }, [], objindex);
        //}
        //for (var hitdex = 0; hitdex < hitstuff.objects.length; hitdex++) {
        //    //console.log(hitstuff.objects[hitdex]);
        //    StageData.objects[hitstuff.objects[hitdex]].outlineColor = [1.0, 1.0, 0.1];
        //}

    };

    var WanderProc = ProcInLoading;

    var OnFrame = function () {
        //FrameLogic.onFrame();
        WanderProc();
    };

    return {
        'Init': Init, 'OnFrame': OnFrame,
        'customAttributes': customAttributes,
        'customUniforms': customUniforms,
        'GetMainChar': GetMainChar
    };
})();