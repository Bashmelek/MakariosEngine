﻿// JavaScript source code

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
const BashNegBlock = (function () {
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

        var katloc = 'gmodels/firstCat15_newtim.gltf';
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


    var totalGems = 0;
    var collectedGems = 0;
    var currentGemMessage = "";
    var isGemMessageShowing = false;
    var gemMessageCountdown = 0;
    var gameComplete = false;

    var GetMainChar = function () {
        return mainChar;
    }


    function initVelocity(obj) {
        obj.isGrounded = true,
            obj.confirmGrounded = true,
            obj.velocity = {
                y: 0.0
            };
    };

    var HomePlateOnEnter = function (geminst) {
        if (collectedGems == totalGems && !gameComplete) {
            const ui = document.querySelector('#uiCanvas');
            const gui = ui.getContext('2d');
            //with a little thanks to https://stackoverflow.com/questions/8977369/drawing-png-to-a-canvas-element-not-showing-transparency thank you!
        }
    };

    var GemOnPickup = function (geminst) {
        
        console.log('picked up gem +1');
        collectedGems++;
        //MakUI.writeObjToUI('prompt', 'picked up gem +1', null);
        MakUI.writeObjToUI('status', 'Gems: ' + collectedGems + '/' + totalGems, null);
        Makarios.destroy(geminst);

    };

    var GemSpin = function (geminst) {
        //const x = 12;
        //const y = 13;
        //const z = 14;

        var gemmat = geminst.matrix;

        //fix for weird drift issue?
        var oldx = gemmat[12];
        var oldz = gemmat[14];

        if (gemmat[5] != 1.0) {
            mat4.rotate(gemmat, gemmat, geminst.gem.spin2 || .02, [0.0, 1.0, 0.0]);
            // mat4.rotate(gemmat, gemmat, geminst.gem.spin1 || .02, [gemmat[1], gemmat[5], gemmat[9]]);
        }
        mat4.rotate(gemmat, gemmat, geminst.gem.spin1 || .02, [gemmat[1], gemmat[5], gemmat[9]]);
        gemmat[12] = oldx;
        gemmat[14] = oldz;
        //mat4.rotate(gemmat, gemmat, pitch, [vmat[0], vmat[4], vmat[8]]);
    };

    var MakeGemInst = function (textureOverride) {
        var gemInst = Makarios.instantiate(Primitives.shapes["diamond"], textureOverride || 'plainsky.jpg', GemSpin, {});//Primitives.shapes["plane"]  pplane
        gemInst.matrix = mat4.create();
        gemInst.isAABoxTrigger = true;
        initVelocity(gemInst);
        gemInst.collider = {
            type: 'yrotbox',
            hwidth: 1.0,
            hdepth: 1.0,
            hheight: 2.0,
            bot: -1.5
        };
        gemInst.OnTriggerCollide = GemOnPickup;
        gemInst.gem = {};
        gemInst.gem.spin1 = .02;
        gemInst.gem.spin2 = .02;
        totalGems++;

        return gemInst;
    }

    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };

        //var vmat = mat4.create();
        //mat4.translate(vmat,     // destination matrix
        //    vmat,     // matrix to translate
        //    [-0.0, 0.0, -camDist]); //negative camdist
        yaw = Math.PI / 1.0;//.6;
        pitch = Math.PI / 12.0;//0.65
        //mat4.rotate(vmat, vmat, Math.PI, [vmat[1], vmat[5], vmat[9]]);//.6
        //mat4.rotate(gmod, vmat, Math.PI / 12.0, [vmat[0], vmat[4], vmat[8]]);//0.65


        //var obFox = Makarios.instantiate(Primitives.shapes["kat"], Primitives.shapes["kat"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        //Makarios.SetAnimation(obFox, "IdleStand0");//"0"    Survey  Run
        ////mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);
        //mat4.translate(obFox.matrix, obFox.matrix, [0.0, 6.4, 0.0]);
        //initVelocity(obFox);


        var obEmpty = Makarios.instantiate(Primitives.shapes["empty"], null, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        mat4.translate(obEmpty.matrix, obEmpty.matrix, [0.0, 6.4, 0.0]);

        //var obEmpty = Makarios.instantiate(Primitives.shapes["empty"], null, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        //mat4.translate(obEmpty.matrix, obEmpty.matrix, [0.0, 6.4, 0.0]);
        //obEmpty.isAABoxTrigger = true;
        //initVelocity(obEmpty);

        /*

        var obFox = Makarios.instantiate(Primitives.shapes["testbox"], Primitives.shapes["testbox"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
        Makarios.SetAnimation(obFox, "Survey");//"0"    Survey  Run
        mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);

        var ob6 = Makarios.instantiate(Primitives.shapes["milktruck"], Primitives.shapes["milktruck"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
        //Makarios.SetAnimation(ob6, "Survey");//"0"    Survey  Run
        //mat4.fromScaling(ob6.matrix, [0.1, 0.1, 0.1]);
        mat4.translate(ob6.matrix, ob6.matrix, [-8.0, 0.0, 8.0]);
        mat4.rotate(ob6.matrix, ob6.matrix, Math.PI / 2.0, [ob6.matrix[0], ob6.matrix[4], ob6.matrix[8]]);

        var ob7 = Makarios.instantiate(Primitives.shapes["caesar"], Primitives.shapes["caesar"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl
        //console.log(Primitives.shapes["caesar"].animations);
        Makarios.SetAnimation(ob7, "0");//"0"    Survey  Run
        //mat4.rotate(ob7.matrix, ob7.matrix, 0.65, [vmat[0], vmat[4], vmat[8]]);
        mat4.translate(ob7.matrix, ob7.matrix, [-16.0, 0.0, -10.4]);
        mat4.rotate(ob7.matrix, ob7.matrix, -Math.PI / 2.0, [ob7.matrix[0], ob7.matrix[4], ob7.matrix[8]]);
        mat4.scale(ob7.matrix, ob7.matrix, [12.0, 12.0, 12.0]);


        */
        var block1 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});//bprim
        glMatrix.mat4.translate(block1.matrix,     // destination matrix
            block1.matrix,     // matrix to translate
            [-24.0, 28.0, 64.0]);
        mat4.scale(block1.matrix, block1.matrix, [8.0, 18.0, 28.0])
        initVelocity(block1);
        block1.collider = {
            type: 'yrotbox',
            hwidth: 28.0,
            hdepth: 8.0,
            hheight: 18.0,
            bot: -18.0
        };

        var block2 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(block2.matrix,     // destination matrix
            block2.matrix,     // matrix to translate
            [24.0, 28.0, 64.0]);
        mat4.scale(block2.matrix, block2.matrix, [8.0, 18.0, 28.0])
        initVelocity(block2);
        block2.collider = {
            type: 'yrotbox',
            hwidth: 28.0,
            hdepth: 8.0,
            hheight: 18.0,
            bot: -18.0
        };

        //var obplane = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});//Primitives.shapes["plane"]  pplane
        var obplane = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});//Primitives.shapes["plane"]  pplane
        obplane.matrix = mat4.create();
        mat4.translate(obplane.matrix,     // destination matrix
            obplane.matrix,     // matrix to translate
            [0, -1.0, -8.0]);
        //mat4.scale(obplane.matrix, obplane.matrix, [1.0, 1.0, 1.0]);// [14.0, 4.0, 14.0]);
        mat4.scale(obplane.matrix, obplane.matrix, [92.0, 144.0, 172.0]);//[140.0, 194.0, 260.0]


        //var obEmpty = Makarios.instantiate(Primitives.shapes["empty"], null, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        //mat4.translate(obEmpty.matrix, obEmpty.matrix, [0.0, 6.4, 0.0]);
        //obEmpty.isAABoxTrigger = true;
        //initVelocity(obEmpty);
        var obFox = Makarios.instantiate(Primitives.shapes["kat"], Primitives.shapes["kat"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        Makarios.SetAnimation(obFox, "IdleStand0");//"0"    Survey  Run
        //mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);
        mat4.translate(obFox.matrix, obFox.matrix, [0.0, 6.4, 0.0]);
        obFox.isActor = true;
        //initVelocity(obFox);

        var block3 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(block3.matrix,     // destination matrix
            block3.matrix,     // matrix to translate
            [0.0, 64.0, 64.0]);
        mat4.scale(block3.matrix, block3.matrix, [36.0, 8.0, 28.0])
        initVelocity(block3);
        block3.collider = {
            type: 'yrotbox',
            hdepth: 36.0,
            hheight: 8.0,
            bot: -8.0,
            hwidth: 28.0
        };


        var step1 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(step1.matrix,     // destination matrix
            step1.matrix,     // matrix to translate
            [40.0, 4.0, -120.0]);
        mat4.scale(step1.matrix, step1.matrix, [24.0, 2.0, 24.0])
        initVelocity(step1);
        step1.collider = {
            type: 'yrotbox',
            hdepth: 24.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 24.0
        };
        var step2 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        glMatrix.mat4.translate(step2.matrix,     // destination matrix
            step2.matrix,     // matrix to translate
            [40.0, 12.0, -132.0]);
        mat4.scale(step2.matrix, step2.matrix, [12.0, 2.0, 12.0])
        initVelocity(step2);
        step2.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 12.0
        };
        var step3 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(step3.matrix,     // destination matrix
            step3.matrix,     // matrix to translate
            [40.0, 20.0, -136.0]);
        mat4.scale(step3.matrix, step3.matrix, [8.0, 2.0, 8.0])
        initVelocity(step3);
        step3.collider = {
            type: 'yrotbox',
            hdepth: 8.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 8.0
        };
        var step4 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlesteel.jpg', null, {});
        glMatrix.mat4.translate(step4.matrix,     // destination matrix
            step4.matrix,     // matrix to translate
            [8.0, 30.0, -136.0]);
        mat4.scale(step4.matrix, step4.matrix, [32.0, 2.0, 4.0])
        initVelocity(step4);
        step4.collider = {
            type: 'yrotbox',
            hdepth: 32.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 4.0
        };
        var col1 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        glMatrix.mat4.translate(col1.matrix,     // destination matrix
            col1.matrix,     // matrix to translate
            [-18.0, 16.0, -136.0]);
        mat4.scale(col1.matrix, col1.matrix, [6.0, 6.0, 6.0])
        initVelocity(col1);
        col1.collider = {
            type: 'yrotbox',
            hdepth: 6.0,
            hheight: 6.0,
            bot: -6.0,
            hwidth: 6.0
        };

        var col3 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlesteel.jpg', null, {});
        glMatrix.mat4.translate(col3.matrix,     // destination matrix
            col3.matrix,     // matrix to translate
            [54.0, 16.0, -20.0]);
        mat4.rotate(col3.matrix, col3.matrix, -3.0 * Math.PI / 4.0, [col3.matrix[1], col3.matrix[5], col3.matrix[9]]);
        mat4.scale(col3.matrix, col3.matrix, [6.0, 6.0, 6.0])
        initVelocity(col3);
        col3.collider = {
            type: 'yrotbox',
            hdepth: 6.0,
            hheight: 6.0,
            bot: -6.0,
            hwidth: 6.0
        };
        //col3.isAABoxTrigger = true;

        var col2 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(col2.matrix,     // destination matrix
            col2.matrix,     // matrix to translate
            [54.0, 18.0, -50.0]);
        mat4.rotate(col2.matrix, col2.matrix, -Math.PI / 1.0, [col2.matrix[1], col2.matrix[5], col2.matrix[9]]);
        mat4.scale(col2.matrix, col2.matrix, [6.0, 6.0, 6.0])
        initVelocity(col2);
        col2.collider = {
            type: 'yrotbox',
            hdepth: 6.0,
            hheight: 6.0,
            bot: -6.0,
            hwidth: 6.0
        };

        var step00 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        glMatrix.mat4.translate(step00.matrix,     // destination matrix
            step00.matrix,     // matrix to translate
            [-70.0, 4.0, -102.0]);
        mat4.rotate(step00.matrix, step00.matrix, -Math.PI / 2.0, [step00.matrix[1], step00.matrix[5], step00.matrix[9]]);
        mat4.scale(step00.matrix, step00.matrix, [12.0, 2.0, 12.0])
        initVelocity(step00);
        step00.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 12.0
        };
        step00.isBaked = true;

        var step01 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(step01.matrix,     // destination matrix
            step01.matrix,     // matrix to translate
            [0.0, 4.0, 178.0]);
        mat4.rotate(step01.matrix, step01.matrix, -Math.PI / 2.0, [step01.matrix[1], step01.matrix[5], step01.matrix[9]]);
        mat4.scale(step01.matrix, step01.matrix, [12.0, 2.0, 12.0])
        initVelocity(step01);
        step01.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 12.0
        };
        step01.isBaked = true;



        var step0a = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        glMatrix.mat4.translate(step0a.matrix,     // destination matrix
            step0a.matrix,     // matrix to translate
            [-12.0, 8.0, 202.0]);
        mat4.rotate(step0a.matrix, step0a.matrix, 1.4 * -Math.PI / 2.0, [step0a.matrix[1], step0a.matrix[5], step0a.matrix[9]]);
        mat4.scale(step0a.matrix, step0a.matrix, [12.0, 2.0, 12.0])
        initVelocity(step0a);
        step0a.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 12.0
        };
        step0a.isBaked = true;

        var step02 = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/gentlegraydark.jpg', null, {});
        glMatrix.mat4.translate(step02.matrix,     // destination matrix
            step02.matrix,     // matrix to translate
            [-30.0, 12.0, 226.0]);
        mat4.rotate(step02.matrix, step02.matrix, 1.8 * -Math.PI / 2.0, [step02.matrix[1], step02.matrix[5], step02.matrix[9]]);
        mat4.scale(step02.matrix, step02.matrix, [12.0, 2.0, 12.0])
        initVelocity(step02);
        step02.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 12.0
        };
        step02.isBaked = true;

        var step03 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        var tempstep = step03;
        glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
            tempstep.matrix,     // matrix to translate
            [-70.0, 16.0, 232.0]);
        mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        mat4.scale(tempstep.matrix, tempstep.matrix, [12.0, 2.0, 28.0])
        initVelocity(tempstep);
        tempstep.collider = {
            type: 'yrotbox',
            hdepth: 12.0,
            hheight: 2.0,
            bot: -2.0,
            hwidth: 28.0
        };
        tempstep.isBaked = true;

        //var step04 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step04;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-126.0, 16.0, 206.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [36.0, 2.0, 12.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 36.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 12.0
        //};
        //tempstep.isBaked = true;

        //var step05 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step05;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-150.0, 16.0, 106.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [80.0, 2.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 80.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step06 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step06;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-190.0, 24.0, 66.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [120.0, 24.0, 2.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 120.0,
        //    hheight: 24.0,
        //    bot: -24.0,
        //    hwidth: 2.0
        //};
        //tempstep.isBaked = true;

        //var step07 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step07;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-110.0, 24.0, 66.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [120.0, 24.0, 2.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 120.0,
        //    hheight: 24.0,
        //    bot: -24.0,
        //    hwidth: 2.0
        //};
        //tempstep.isBaked = true;

        //var step08 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step08;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-150.0, 4.0, -14.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [40.0, 2.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 40.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step09 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step09;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-150.0, 4.0, 28.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [2.0, 12.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 2.0,
        //    hheight: 12.0,
        //    bot: -12.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step10 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step10;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-150.0, 4.0, 10.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [2.0, 12.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 2.0,
        //    hheight: 12.0,
        //    bot: -12.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step11 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step11;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-150.0, 16.0, -48.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [60.0, 2.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 60.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step12 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step12;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-210.0, 9.0, -14.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [40.0, 2.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 40.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step13 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step13;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-216.0, 12.0, -14.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [40.0, 2.0, 40.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 40.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 40.0
        //};
        //tempstep.isBaked = true;

        //var step14 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step14;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-98.0, 10.0, -118.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [12.0, 2.0, 36.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 12.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 36.0
        //};
        //tempstep.isBaked = true;

        //var step15 = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        //tempstep = step15;
        //glMatrix.mat4.translate(tempstep.matrix,     // destination matrix
        //    tempstep.matrix,     // matrix to translate
        //    [-212.0, 16.0, -80.0]);
        //mat4.rotate(tempstep.matrix, tempstep.matrix, -Math.PI / 2.0, [tempstep.matrix[1], tempstep.matrix[5], tempstep.matrix[9]]);
        //mat4.scale(tempstep.matrix, tempstep.matrix, [12.0, 2.0, 12.0])
        //initVelocity(tempstep);
        //tempstep.collider = {
        //    type: 'yrotbox',
        //    hdepth: 12.0,
        //    hheight: 2.0,
        //    bot: -2.0,
        //    hwidth: 12.0
        //};
        //tempstep.isBaked = true;



        var startplat = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
        glMatrix.mat4.translate(startplat.matrix,     // destination matrix
            startplat.matrix,     // matrix to translate
            [0.0, 1.2, 0.0]);
        mat4.scale(startplat.matrix, startplat.matrix, [6.0, 1.0, 6.0])
        initVelocity(startplat);
        startplat.collider = {
            type: 'yrotbox',
            hdepth: 6.0,
            hheight: 1.0,
            bot: -1.0,
            hwidth: 6.0
        };
        var hometrig = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/plainsapphire.jpg', null, {});
        glMatrix.mat4.translate(hometrig.matrix,     // destination matrix
            hometrig.matrix,     // matrix to translate
            [0.0, 4.6, 0.0]);
        mat4.scale(hometrig.matrix, hometrig.matrix, [6.1, 0.1, 6.1])
        initVelocity(hometrig);
        hometrig.collider = {
            type: 'yrotbox',
            hdepth: 6.1,
            hheight: 0.1,
            bot: -0.1,
            hwidth: 6.1
        };
        hometrig.isAABoxTrigger = true;
        hometrig.OnTriggerCollide = HomePlateOnEnter;



        var d0 = MakeGemInst('gmodels/plainrosepink.jpg');
        glMatrix.mat4.translate(d0.matrix,     // destination matrix
            d0.matrix,     // matrix to translate
            [14.0, 2.0, 16.0]);

        var d1 = MakeGemInst('gmodels/plainrubyred.jpg');
        glMatrix.mat4.translate(d1.matrix,     // destination matrix
            d1.matrix,     // matrix to translate
            [-14.0, 2.0, 26.0]);
        mat4.rotate(d1.matrix, d1.matrix, .92, [1.0, 0.0, 0.0]);//.6
        d1.gem.spin2 = 0.01;

        var d2 = MakeGemInst('gmodels/plainsapphire.jpg');
        glMatrix.mat4.translate(d2.matrix,     // destination matrix
            d2.matrix,     // matrix to translate
            [-24.0, 2.0, -26.0]);
        mat4.rotate(d2.matrix, d2.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d2.gem.spin2 = 0.028;

        var d3 = MakeGemInst('gmodels/plaintopaz.jpg');
        glMatrix.mat4.translate(d3.matrix,     // destination matrix
            d3.matrix,     // matrix to translate
            [-20.0, 18.0, -136.0]);
        mat4.rotate(d3.matrix, d3.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d3.gem.spin2 = 0.028;

        var d4 = MakeGemInst('gmodels/plainrubyred.jpg');
        glMatrix.mat4.translate(d4.matrix,     // destination matrix
            d4.matrix,     // matrix to translate
            [-40.0, 2.0, -136.0]);
        mat4.rotate(d4.matrix, d4.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d4.gem.spin2 = 0.028;

        var d5 = MakeGemInst('gmodels/plainrosepink.jpg');
        glMatrix.mat4.translate(d5.matrix,     // destination matrix
            d5.matrix,     // matrix to translate
            [36.0, 32.0, -136.0]);
        mat4.rotate(d5.matrix, d5.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d5.gem.spin2 = 0.028;

        var d6 = MakeGemInst('gmodels/plainsapphire.jpg');
        glMatrix.mat4.translate(d6.matrix,     // destination matrix
            d6.matrix,     // matrix to translate
            [24.0, 24.0, 100.0]);
        mat4.rotate(d6.matrix, d6.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d6.gem.spin2 = 0.028;

        var d6a = MakeGemInst('gmodels/plainrubyred.jpg');
        glMatrix.mat4.translate(d6a.matrix,     // destination matrix
            d6a.matrix,     // matrix to translate
            [-24.0, 24.0, 100.0]);
        mat4.rotate(d6a.matrix, d6a.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d6a.gem.spin2 = 0.028;

        var d7 = MakeGemInst('gmodels/plaintopaz.jpg');
        glMatrix.mat4.translate(d7.matrix,     // destination matrix
            d7.matrix,     // matrix to translate
            [-22.0, 24.0, 202.0]);
        mat4.rotate(d7.matrix, d7.matrix, .42, [1.0, 0.0, 0.0]);//.6
        d7.gem.spin2 = 0.028;

        var d8 = MakeGemInst('gmodels/plainrosepink.jpg');
        var tgem = d8;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [42.0, 32.0, -148.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d9 = MakeGemInst('gmodels/plaintopaz.jpg');
        var tgem = d9;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [54.5, 24.0, -130.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d10 = MakeGemInst('gmodels/plainrubyred.jpg');
        var tgem = d10;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [67.5, 2.0, -25.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .22, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d11 = MakeGemInst('gmodels/plainsapphire.jpg');
        var tgem = d11;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [36.8, 24.0, 64.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d12 = MakeGemInst('gmodels/plainrosepink.jpg');
        var tgem = d12;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [-36.8, 24.0, 64.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d13 = MakeGemInst('gmodels/plaintopaz.jpg');
        var tgem = d13;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [-70.0, 24.0, 232.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d14 = MakeGemInst('gmodels/plainrubyred.jpg');
        var tgem = d14;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [-9.0, 2.0, -136.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d15 = MakeGemInst('gmodels/plainsapphire.jpg');
        var tgem = d15;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [-18.0, 18.0, -146.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;

        var d16 = MakeGemInst('gmodels/plainrosepink.jpg');
        var tgem = d16;
        glMatrix.mat4.translate(tgem.matrix,     // destination matrix
            tgem.matrix,     // matrix to translate
            [24.5, 12.0, -136.0]);
        mat4.rotate(tgem.matrix, tgem.matrix, .42, [1.0, 0.0, 0.0]);//.6
        tgem.gem.spin2 = 0.028;



        Makarios.setCamDist(24.0);//40.0

        var foxinvBase = mat4.create();
        mat4.fromScaling(foxinvBase, [1.0, 1.0, 1.0]);
        mat4.invert(foxinvBase, foxinvBase);
        obEmpty.collider = {
            type: 'yrotbox',
            hwidth: 1.0,
            hdepth: 1.0,
            hheight: 1.0,
            bot: -2.0, //-1.0
            invmat: foxinvBase,
            //type: 'rotationlesscylinder',
            //radius: 1.0,
            //hheight: 1.0
        };
        obFox.triggerBoxes = [];

        //obFox.Actor.TrueObject = obEmpty;
        obEmpty.Actor = obFox;
        initVelocity(obEmpty);
        mainChar = obEmpty;
        mainChar.objBaseMat = mat4.clone(obEmpty.matrix);
        mainChar.yrot = 0.0;
        mainChar.Actor.yrot = 0.0;
        mainChar.baseSpeed = 0.24;
        mainChar.baseJump = 0.24;
        mainChar.baseRotSpeed = 0.02;//0.05
        mainChar.isRunning = false;

        var promptdata = {
            zone: MakUI.Zones.topLeft,
            nx: 2,
            ny: 2,

        };
        MakUI.writeObjToUI('prompt', 'Find the gems!', promptdata);
        var statusdata = {
            zone: MakUI.Zones.topRight,
            nx: 2,
            ny: 2,

        };
        MakUI.writeObjToUI('status', 'Gems: ' + collectedGems + '/' + totalGems, statusdata);

        document.querySelector('#uiCanvas').onmousemove = function (e) {
            e = e || window.event;
            mousePos = { x: e.clientX, y: e.clientY };
        }
        console.log(StageData.objects);

        WanderProc = MainProc;
    };

    var MainProc = function () {

        FrameLogic.onFrame();
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

        var vmat = mat4.create();
        mat4.translate(vmat,     // destination matrix
            baseGmod,     // matrix to translate
            [-0.0, 0.0, 0.0]);
        yaw = Math.PI - mainChar.Actor.yrot;
        mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);//.6
        mat4.rotate(vmat, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);
        mat4.translate(gmod,     // destination matrix
            vmat,     // matrix to translate
            [-mainChar.matrix[12], -mainChar.matrix[13], -mainChar.matrix[14]]);

        if (mainChar.isRunning == true) {
            Makarios.SetAnimation(mainChar.Actor, "walkCasual");
        } else {
            Makarios.SetAnimation(mainChar.Actor, "IdleStand0");
        } 

        //if mainchar is fallen, pick them back up
        if (StageData.objects[0] && StageData.objects[0].matrix[13] < -200.0) {
            console.log('fallen');
            var playerchar = StageData.objects[0];
            playerchar.matrix = mat4.create();
            mat4.translate(playerchar.matrix, playerchar.matrix, [0.0, 6.4, -0.0]);
            initVelocity(mainChar); 
            //mainChar.yrot = 0.0;
            //mainChar.Actor.yrot = 0.0;
        }

        var basematrix = mat4.create();
        mat4.multiply(basematrix, gproj, gmod);

        var hitstuff = {};
        hitstuff.tris = [];
        hitstuff.objects = [];
        var objcount = StageData.objects.length;

        for (var objindex = 0; objindex < objcount; objindex++) {
            if (!StageData.objects[objindex]) { continue; }
            StageData.objects[objindex].outlineColor = [1.0, 0.6, 1.0];
            var objmatrix = mat4.create();
            mat4.multiply(objmatrix, basematrix, StageData.objects[objindex].matrix);

            //recursiveCheckAllObjectsIfScreenPointHits(StageData.objects[objindex], null, objmatrix, [], hitstuff, { x: mousePos.x, y: mousePos.y }, [], objindex);
        }
        for (var hitdex = 0; hitdex < hitstuff.objects.length; hitdex++) {
            //console.log(hitstuff.objects[hitdex]);
            StageData.objects[hitstuff.objects[hitdex]].outlineColor = [1.0, 1.0, 0.1];
        }

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