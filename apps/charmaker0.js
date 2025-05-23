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
const Charmaker0 = (function () {
    const mat4 = glMatrix.mat4;
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    var objects = [];

    CommonShaders.InitCustomShader("noShadowv0");

    var wgl;
    var textureMatrix = mat4.create();

    var mainChar = null;
    var mainCharRot = null;
    baseGmod = null;
    var mousePos = { x: 0.0, y: 0.0 };


    var Init = function () {
        StageData.ticks = 0;
        ////SkyboxRenderer.useSkybox('skybox');
        ////ShadowShader.setup(null, [1.0, 0.6, 1.0]);
        ////OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);
        //console.log(camDist);
        maxCamDist = 300.0;//global scope, plz fix
        maxZFar = 550.0;//this global too
        //ShadowShader.setProjScaler(98.0);
        //var initShadowProjScaler = ShadowShader.getProjScaler();

        //ortho(out, left, right, bottom, top, near, far)
        StageData.SetMainDirLight([.192, -1.752, 0.0], [0.0, 48.0, 0.0], [1.0, 1.0, 1.0]);
        //StageData.defShadowProjMat = mat4.create();
        //mat4.ortho(StageData.defShadowProjMat,
        //    -initShadowProjScaler, initShadowProjScaler, -initShadowProjScaler, initShadowProjScaler, 0.1, maxZFar + 1000);

        //var shadowBoundMat = mat4.create();
        //mat4.fromScaling(shadowBoundMat, [54.0, 54.0, 8.0]);
        //StageData.shadowBoundBox = new Array(Primitives.shapes["cube"].positions.length);
        //linTransformRange(StageData.shadowBoundBox, Primitives.shapes["cube"].positions, shadowBoundMat, 0, Primitives.shapes["cube"].positions.length, null);

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;



        var canvas = document.getElementById("glCanvas");
        wgl = canvas.getContext("webgl");

        CommonShaders.InitCustomShaderData("noShadowv0");

        //var timmyloc = 'gmodels/firstCat12_emb.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(timmyloc, "timmy");

        var katloc = 'gmodels/firstCat15_newtim.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(katloc, "kat");

        var diamondloc = 'gmodels/diamond0.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(diamondloc, "diamond"); 

        isLoading = false;

    };



    var keystates = new Array(256).fill().map(x => false);
    var justSpaced = false;

    var GetMainChar = function () {
        return mainChar;
    } 

    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };

        var vmat = mat4.create();
        mat4.translate(vmat,     // destination matrix
            vmat,     // matrix to translate
            [-0.0, 0.0, -camDist]); //negative camdist
        yaw = Math.PI / 1.0;//.6;
        pitch = Math.PI / 12.0;//0.65 


        var obFox = Makarios.instantiate(Primitives.shapes["kat"], Primitives.shapes["kat"].textureUrl, null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        Makarios.SetAnimation(obFox, "IdleStand0");//"0"    Survey  Run
        //mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);
        mat4.rotate(obFox.matrix, obFox.matrix, 3.1, [obFox.matrix[1], obFox.matrix[5], obFox.matrix[9]]);//.6
        mat4.translate(obFox.matrix, obFox.matrix, [0.0, 6.4, 0.0]); 
        //initVelocity(obFox);


        Makarios.setCamDist(12.0);

        mainChar = obFox;
        mainChar.yrot = 0.0;
        Makarios.SetAnimation(mainChar, "IdleStand0");

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

        document.querySelector('#uiCanvas').onmousemove = function (e) {
            e = e || window.event;
            mousePos = { x: e.clientX, y: e.clientY };
        } 


        window.addEventListener("keydown", function (e) {
            //thankyou https://stackoverflow.com/questions/22559830/html-prevent-space-bar-from-scrolling-page
            if (e.keyCode == 32 && e.target == document.body) {
                e.preventDefault();
            }
            keystates[e.keyCode] = true;
            //keycount = 0;
        });
        window.addEventListener("keyup", function (e) {
            keystates[e.keyCode] = false;
            if (e.keyCode == 32) {
                justSpaced = false;
                //console.log('uppnathim');
            }
            //var county = keycount;
            //console.log(county);
        });

        WanderProc = MainProc;
    };

    var MainProc = function () {
         
        //StageData.SetMainDirLight([0.000 * StageData.ticks + 0.5, 0.0002 * StageData.ticks, 0.0], [0.0, 0.0, 144.0], [1.0, 1.0, 1.0]);//176

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
        yaw = Math.PI - mainChar.yrot;
        mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);//.6
        mat4.rotate(vmat, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);
        mat4.translate(gmod,     // destination matrix
            vmat,     // matrix to translate
            [-mainChar.matrix[12], -mainChar.matrix[13], -mainChar.matrix[14]]);

         /**************** Start Custom Logic Main ****************/



        if (keystates[32]) {
            if (!justSpaced) {
                console.log('spaced');
                justSpaced = true;

                var origTextureUrl = mainChar.children[0].textureUrl;
                //console.log(mainChar.children[0].textureImage)
                //console.log(mainChar.children[0].textureUrl)
                //console.log(mainChar)
                //var origSource = origTexture.src;//will be a datauri


                const texture = wgl.createTexture();
                wgl.bindTexture(wgl.TEXTURE_2D, texture);

                // Because images have to be download over the internet
                // they might take a moment until they are ready.
                // Until then put a single pixel in the texture so we can
                // use it immediately. When the image has finished downloading
                // we'll update the texture with the contents of the image.
                const level = 0;
                const internalFormat = wgl.RGBA;
                const width = 1;
                const height = 1;
                const border = 0;
                const srcFormat = wgl.RGBA;
                const srcType = wgl.UNSIGNED_BYTE;
                const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
                wgl.texImage2D(wgl.TEXTURE_2D, level, internalFormat,
                    width, height, border, srcFormat, srcType,
                    pixel);

                const image = new Image();
                //image.crossOrigin = "anonymous";
                image.onload = function () {
                    //console.log(url);
                    MakTextures[mainChar.children[0].textureUrl] = null;

                    wgl.bindTexture(wgl.TEXTURE_2D, texture);
                    wgl.texImage2D(wgl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);

                    // WebGL1 has different requirements for power of 2 images
                    // vs non power of 2 images so check if the image is a
                    // power of 2 in both dimensions.
                    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                        // Yes, it's a power of 2. Generate mips.
                        wgl.generateMipmap(wgl.TEXTURE_2D);
                    } else {
                        // No, it's not a power of 2. Turn off mips and set
                        // wrapping to clamp to edge
                        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_S, wgl.CLAMP_TO_EDGE);
                        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_T, wgl.CLAMP_TO_EDGE);
                        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MIN_FILTER, wgl.LINEAR);
                    }


                    console.log("settext new");
                    MakTextures[mainChar.children[0].textureUrl] = texture;
                    mainChar.children[0].textureImage = texture;
                    mainChar.children[0].textureUrl = image.src;
                };



                const ui = document.createElement('canvas');//// document.querySelector('#uiCanvas');
                const gui = ui.getContext('2d');

                var origImageTexmpImage = new Image();
                origImageTexmpImage.onload = function () {

                    ui.height = origImageTexmpImage.height;
                    ui.width = origImageTexmpImage.width;
                    gui.drawImage(origImageTexmpImage, 0, 0);
                    console.log(ui.height);

                    var imgData = gui.getImageData(0, 0, origImageTexmpImage.width, origImageTexmpImage.height);
                    console.log("spaceimages");

                    var newData = gui.createImageData(origImageTexmpImage.width, origImageTexmpImage.height);
                    for (var i = 0; i < origImageTexmpImage.width * origImageTexmpImage.height; i++) {//data.length
                        newData.data[i * 4 + 0] = 255.0 - imgData.data[i * 4 + 0];// 255.0 * 0.65;//data[i][0];
                        newData.data[i * 4 + 1] = 255.0 - imgData.data[i * 4 + 1];// 255.0 * 1.0;//data[i][1];
                        newData.data[i * 4 + 2] = 255.0 - imgData.data[i * 4 + 2];// 255.0 * 1.0;//data[i][2];
                        newData.data[i * 4 + 3] = imgData.data[i * 4 + 3];// 255.0 * 1.0;//data[i][3];
                    }
                    gui.putImageData(newData, 0, 0);
                    image.src = ui.toDataURL("image/png");
                    //document.body.appendChild(image);
                }
                console.log('origurl:' + ' origTextureUrl is a long datauri');//origTextureUrl);
                origImageTexmpImage.src = origTextureUrl;

                
            }
        } 




         /****************** End Custom Logic Main **************/



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