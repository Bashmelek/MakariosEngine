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


    var baseTexture = null;
    var currentColorIndex = 1;


    //"rgb(191, 225, 231)" });
    //"rgb(118, 139, 143)" });
    //"rgb(236, 175, 27)" });
    //"rgb(231, 113, 208)" });
    var baseColors = [];
    baseColors.push({ r: 191, g: 225, b: 231 });
    baseColors.push({ r: 118, g: 139, b: 143 });
    baseColors.push({ r: 236, g: 175, b: 27 });
    baseColors.push({ r: 231, g: 113, b: 208 });

    var currentColors = [];
    for (var bc = 0; bc < baseColors.length; bc++) {
        currentColors.push({ r: baseColors[bc].r, g: baseColors[bc].g, b: baseColors[bc].b });
    }

    var cachedImageInfo = {};

    var layerIDs = { base: 0, eyes: 1 };//{ base: 0, face: 1, belly: 2, eyes: 3 };

    var currentSelections = [];
    var selectorItems = [];
    selectorItems[0] = [{ name: "Simple", loc: "gmodels/CatImage3_0.png" }, { name: "Spots", loc: "gmodels/CatImage3_1.png" }, { name: "Stripes", loc: "gmodels/CatImage3_2.png" }];
    selectorItems[1] = [{ name: "Simple", loc: "gmodels/CatEyes3_0.png" }, { name: "Human", loc: "gmodels/CatEyes3_1.png" }, { name: "Slit", loc: "gmodels/CatEyes3_2.png" }, { name: "Blank", loc: "gmodels/CatEyes3_3.png" }];
    //selectorItems[1] = ["Plain", "Cheeks", "Groucho"];

    for (var sel = 0; sel < selectorItems.length; sel++) {
        currentSelections[sel] = 0;
    }
    //console.log("sellout at: " + selectorItems.length);

    //var InnerGetColorAtPoint = function (imgUri, testpoint, imageScaler) {

    //}

    var GetColorAtPoint = function (imgUri, testpoint, imageScaler, callback) {

        if (cachedImageInfo[imgUri]) {
            var cui = cachedImageInfo[imgUri];

            var tx = Math.floor(testpoint.x / imageScaler);
            var ty = Math.floor(testpoint.y / imageScaler);
            var pixel = (ty * cui.w + tx % cui.w);

            console.log(cui.data[4 * pixel + 0]);
            //return { r: cui.data[4 * pixel + 0], g: cui.data[4 * pixel + 1], b: cui.data[4 * pixel + 2]}
            callback({ r: cui.data[4 * pixel + 0], g: cui.data[4 * pixel + 1], b: cui.data[4 * pixel + 2] });
        } else {

            const ui = document.createElement('canvas');//// document.querySelector('#uiCanvas');
            const gui = ui.getContext('2d');

            var checkimg = new Image();
            checkimg.onload = function () {
                ui.height = checkimg.height;
                ui.width = checkimg.width;
                gui.drawImage(checkimg, 0, 0);

                var imgData = gui.getImageData(0, 0, checkimg.width, checkimg.height);

                var tx = Math.floor(testpoint.x / imageScaler);
                var ty = Math.floor(testpoint.y / imageScaler);
                var pixel = (ty * ui.width + tx % ui.width);

                cachedImageInfo[imgUri] = { h: ui.height, w: ui.width, data: imgData.data};

                GetColorAtPoint(imgUri, testpoint, imageScaler, callback);
            }
            console.log('origurl:' + ' origTextureUrl is a long datauri');//origTextureUrl);
            checkimg.src = imgUri;
        }
    }


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

        var katloc = 'gmodels/firstCat16_newtim.gltf';
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

        //Primitives.shapes["kat"].textureUrl
        var obFox = Makarios.instantiate(Primitives.shapes["kat"], "gmodels/CatImage3_0.png", null, {});//'plainsky.jpg'  Primitives.shapes["testbox"].textureUrl "timmy"
        Makarios.SetAnimation(obFox, "IdleStand0");//"0"    Survey  Run
        //mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);
        mat4.rotate(obFox.matrix, obFox.matrix, 3.1, [obFox.matrix[1], obFox.matrix[5], obFox.matrix[9]]);//.6
        mat4.translate(obFox.matrix, obFox.matrix, [0.0, 6.4, 0.0]); 
        //initVelocity(obFox);

        UpdateMainCharTexture();


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

        var onDragThis = function (e) {

            //types
            //0: free
            //1: look
            var camType = 1;
            if (mouseisdown) {
                var xdel;
                var ydel
                if (usePointerLock > 0) {
                    xdel = (e.movementX) * 0.001;
                    ydel = (e.movementY) * 0.001;
                } else {
                    xdel = (e.clientX - lastmousedownpoint.x) * 0.001;
                    ydel = (e.clientY - lastmousedownpoint.y) * 0.001;
                    lastmousedownpoint = { x: e.clientX, y: e.clientY };
                }

                if (camType == 0) {
                    mat4.rotate(gmod, gmod, (xdel), [gmod[1], gmod[5], gmod[9]]);//[0, 1, 0]);//linTransform(gproj, [0, 1, 0]));// [0, 1, 0]);//linTransform(origmod, [0, 1, 0]));// [0, 1, 0]);
                    mat4.rotate(gmod, gmod, (ydel), [gmod[0], gmod[4], gmod[8]]);//[1, 0, 0]);//linTransform(gproj, [1, 0, 0]));// [1, 0, 0]);//linTransform(origmod, [1, 0, 0]));
                } else if (camType == 1) {
                    //var vmat = mat4.create();
                    //// Now move the drawing position a bit to where we want to
                    //// start drawing the square.
                    //mat4.translate(vmat,     // destination matrix
                    //    vmat,     // matrix to translate
                    //    [-0.0, 0.0, -camDist]); //negative camdist


                    //yaw += xdel;
                    //pitch += ydel
                    mat4.rotate(mainChar.matrix, mainChar.matrix, xdel, [0.0, 1.0, 0.0]);//[mainChar.matrix[1], mainChar.matrix[5], mainChar.matrix[9]]);
                    mat4.rotate(mainChar.matrix, mainChar.matrix, ydel, [mainChar.matrix[0], mainChar.matrix[4], mainChar.matrix[8]]);// [1.0, 0.0, 0.0]);//[mainChar.matrix[0], mainChar.matrix[4], mainChar.matrix[8]]);

                    //mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);
                    //mat4.rotate(gmod, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);
                }
            }
        };


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

        usePointerLock = 0;
        document.querySelector('#uiCanvas').addEventListener("mousedown", onJustMouseDown);
        window.addEventListener("mouseup", onJustMouseUp);
        onmousemove = onDragThis;

        var palleteClickFinisherCallBack = function (selectedColor) {
            currentColors[currentColorIndex - 1].r = selectedColor.r;
            currentColors[currentColorIndex - 1].g = selectedColor.g;
            currentColors[currentColorIndex - 1].b = selectedColor.b;

            MakUI.uiState['colorsample' + currentColorIndex].data.color = "rgb(" + selectedColor.r + ", " + selectedColor.g + ", " + selectedColor.b + ")";
            console.log("given new color to " + currentColorIndex);
            MakUI.cleanRefreshUI();
            UpdateMainCharTexture();
        }

        var paletteClickHandler = function (e) {
            //console.log('palette');

            var rect = document.querySelector('#uiCanvas').getBoundingClientRect();
            var tx = (e.clientX - rect.left);
            var ty = (e.clientY - rect.top);

            var tpoint = { x: tx - MakUI.uiState['catpallete'].x, y: ty - MakUI.uiState['catpallete'].y };
            GetColorAtPoint('gmodels/CatPallette.png', tpoint, MakUI.uiState['catpallete'].scale, palleteClickFinisherCallBack);
        }

        MakUI.drawObjToUI('catpallete', 'gmodels/CatPallette.png', { nx: .1, ny: .1, clickHandler: paletteClickHandler });

        var labelClickHandler = function (clickerID) {
            var newid = clickerID;

            return function () {
                currentColorIndex = newid;
                console.log(currentColorIndex);

                const ui = document.querySelector('#uiCanvas');
                const gui = ui.getContext('2d');
                gui.clearRect(0, 0, ui.width, ui.height);

                MakUI.uiState['buttonhighlight'].data.ny = MakUI.uiState['colorlabel' + currentColorIndex].data.ny;
                MakUI.cleanRefreshUI();
            };
        };

        var selectorArrowClickHandler = function (selID, direction) {
            //dir: 1 is right, -1 is left
            var selectorID = selID;
            var dir = direction;

            return function () {
                currentSelections[selectorID] = (currentSelections[selectorID] + dir + selectorItems[selectorID].length) % selectorItems[selectorID].length;//selectorItems[0]
                MakUI.uiState['selectorTitle' + (selectorID)].data.text = selectorItems[selectorID][currentSelections[selectorID]].name;
                MakUI.cleanRefreshUI();
                origTextureUrls[selectorID] = selectorItems[selectorID][currentSelections[selectorID]].loc;
                origImageTexmpImageLoaded = false;
                origImageTexmpImagesAll[selectorID].loaded = false;
                console.log()
                UpdateMainCharTexture(origTextureUrls[selectorID]);
            }
        };

        MakUI.drawObjToUI('colorlabel1', 'gmodels/colorLabel1.png', { nx: .1, ny: .4, clickHandler: labelClickHandler(1) });
        MakUI.drawObjToUI('colorlabel2', 'gmodels/colorLabel2.png', { nx: .1, ny: .45, clickHandler: labelClickHandler(2) });
        MakUI.drawObjToUI('colorlabel3', 'gmodels/colorLabel3.png', { nx: .1, ny: .5, clickHandler: labelClickHandler(3) });
        MakUI.drawObjToUI('colorlabel4', 'gmodels/colorLabel4.png', { nx: .1, ny: .55, clickHandler: labelClickHandler(4) });


        MakUI.drawShapeToUI('colorsample1', { nx: .16, ny: .4, nw: 0.05, nh: 0.05, color: "rgb(" + baseColors[0].r + ", " + baseColors[0].g + ", " + baseColors[0].b + ")" });
        MakUI.drawShapeToUI('colorsample2', { nx: .16, ny: .45, nw: 0.05, nh: 0.05, color: "rgb(" + baseColors[1].r + ", " + baseColors[1].g + ", " + baseColors[1].b + ")" });
        MakUI.drawShapeToUI('colorsample3', { nx: .16, ny: .5, nw: 0.05, nh: 0.05, color: "rgb(" + baseColors[2].r + ", " + baseColors[2].g + ", " + baseColors[2].b + ")" });
        MakUI.drawShapeToUI('colorsample4', { nx: .16, ny: .55, nw: 0.05, nh: 0.05, color: "rgb(" + baseColors[3].r + ", " + baseColors[3].g + ", " + baseColors[3].b + ")" });

        MakUI.drawObjToUI('buttonhighlight', 'gmodels/buttonHighlight.png', { nx: .097, ny: .394 });

        MakUI.drawShapeToUI('selectorTitle0', { nx: .16, ny: .65, nw: 0.08, nh: 0.05, text: selectorItems[0][currentSelections[0]].name, color: "rgb(180, 220, 180)" });
        MakUI.drawObjToUI('selector0LB', 'gmodels/menuarrowLeft.png', { nx: .13, ny: .655, clickHandler: selectorArrowClickHandler(0, -1) });
        MakUI.drawObjToUI('selector0RB', 'gmodels/menuarrowRight.png', { nx: .23, ny: .655, clickHandler: selectorArrowClickHandler(0, 1) });

        MakUI.drawShapeToUI('selectorTitle1', { nx: .16, ny: .72, nw: 0.08, nh: 0.05, text: selectorItems[1][currentSelections[1]].name, color: "rgb(220, 180, 180)" });
        MakUI.drawObjToUI('selector1LB', 'gmodels/menuarrowLeft.png', { nx: .13, ny: .725, clickHandler: selectorArrowClickHandler(1, -1) });
        MakUI.drawObjToUI('selector1RB', 'gmodels/menuarrowRight.png', { nx: .23, ny: .725, clickHandler: selectorArrowClickHandler(1, 1) });

        MakUI.EnableMakUIClick();

        if (!baseTexture) {
            baseTexture = mainChar.children[0].textureUrl;
            console.log(baseTexture);
        }
        console.log(mainChar);
        //const ui = document.querySelector('#uiCanvas');
        //const gui = ui.getContext('2d');
        //var loveimage = new Image();
        //loveimage.src = 'gmodels/CatPallette.png'; // can also be a remote URL e.g. http://
        //loveimage.onload = function () {
        //    gui.drawImage(loveimage, 120, 120);
        //    gameComplete = true;
        //};

        WanderProc = MainProc;
    };

    var InvertTexture = function () {


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

    var origTextureUrls = [];//"gmodels/CatImage3_0.png";
     
    //var origImageTexmpImage = null;
    //var origImageTexmpImageData = null;
    var origImageTexmpImageLoaded = false;

    var origImageTexmpImagesAll = [];
    for (var x = 0; x < selectorItems.length; x++) {
        if (x == 0 || x == 1) {
            origImageTexmpImagesAll.push({ data: null, loaded: false, img: null });
            origTextureUrls[x] = selectorItems[x][currentSelections[x]].loc;
        }
    }

    var UpdateMainCharTextureWrap = function (loadCallBack) {
        const ui = document.createElement('canvas');
        const gui = ui.getContext('2d');

        var anyUnloaded = false;
        var escape = false;
        for (var i = 0; i < origImageTexmpImagesAll.length && !escape; i++) {

            if (!origImageTexmpImagesAll[i].loaded) {
                anyUnloaded = true;
                escape = true;

                var id = i;
                origImageTexmpImagesAll[id].img = new Image();
                origImageTexmpImagesAll[id].img.onload = function () {

                    ui.height = origImageTexmpImagesAll[id].img.height;
                    ui.width = origImageTexmpImagesAll[id].img.width;
                    gui.drawImage(origImageTexmpImagesAll[id].img, 0, 0);


                    var imgData = gui.getImageData(0, 0, origImageTexmpImagesAll[id].img.width, origImageTexmpImagesAll[id].img.height);
                    ////origImageTexmpImageData = imgData;
                    ////origImageTexmpImageLoaded = true;
                    origImageTexmpImagesAll[id].loaded = true;
                    origImageTexmpImagesAll[id].data = imgData;
                    //loadCallBack();
                    UpdateMainCharTextureWrap(loadCallBack);
                }
                console.log('origurl:' + origTextureUrls[id] + ' origTextureUrl is a long datauri: ' + id);//origTextureUrl);
                origImageTexmpImagesAll[id].img.src = origTextureUrls[id];
            }

        }

        if (!escape && !anyUnloaded) {
            origImageTexmpImageLoaded = true;
            loadCallBack();
        }

    }

    var UpdateMainCharTexture = function () {
        //var origTextureUrl = "gmodels/CatImage3_0.png";////mainChar.children[0].textureUrl;

        if (!origImageTexmpImageLoaded) {
            UpdateMainCharTextureWrap(UpdateMainCharTexture);

            return;
        }

        var origImageTexmpImage = origImageTexmpImagesAll[0].img;
        const ui = document.createElement('canvas');
        const gui = ui.getContext('2d');
        ui.height = origImageTexmpImage.height;
        ui.width = origImageTexmpImage.width;
        gui.drawImage(origImageTexmpImage, 0, 0);

        //var imgData = origImageTexmpImagesAll[0].data;//origImageTexmpImageData;

        var px = 0;
        var newData = gui.createImageData(origImageTexmpImage.width, origImageTexmpImage.height);
        for (var i = 0; i < origImageTexmpImage.width * origImageTexmpImage.height; i++) {
            px = i * 4;
             
            for (var l = (origImageTexmpImagesAll.length - 1); l >= 0; l--) {

                var imgData = origImageTexmpImagesAll[l].data;

                if (px < 15) {

                    console.log(imgData.data[px + 3]);
                }
                if (imgData.data[px + 3] < 100) {
                    //skip
                } else { 
                    for (var rc = 0; rc < baseColors.length; rc++) {
                        //console.log(imgData.data[px + 3]);
                        if (imgData.data[px + 0] == baseColors[rc].r && imgData.data[px + 1] == baseColors[rc].g && imgData.data[px + 2] == baseColors[rc].b) {
                            newData.data[px + 0] = currentColors[rc].r;
                            newData.data[px + 1] = currentColors[rc].g;
                            newData.data[px + 2] = currentColors[rc].b;
                            newData.data[px + 3] = imgData.data[px + 3];
                            rc = baseColors.length;
                        } else if (rc == baseColors.length - 1) {
                            //if last one and not written, just take defaulr data.
                            newData.data[px + 0] = imgData.data[px + 0];
                            newData.data[px + 1] = imgData.data[px + 1];
                            newData.data[px + 2] = imgData.data[px + 2];
                            newData.data[px + 3] = imgData.data[px + 3];
                        }

                    }

                    l = -1;//origImageTexmpImagesAll.length;
                }
            }
        }
        gui.putImageData(newData, 0, 0);
        //image.src = ui.toDataURL("image/png");


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

            MakTextures[mainChar.children[1].textureUrl] = texture;
            mainChar.children[1].textureImage = texture;
            mainChar.children[1].textureUrl = image.src;
        };
        image.src = ui.toDataURL("image/png");


        //const ui = document.createElement('canvas');
        //const gui = ui.getContext('2d');

        //var origImageTexmpImage = new Image();
        //origImageTexmpImage.onload = function () {

        //    ui.height = origImageTexmpImage.height;
        //    ui.width = origImageTexmpImage.width;
        //    gui.drawImage(origImageTexmpImage, 0, 0);
        //    console.log(ui.height);

        //    var imgData = gui.getImageData(0, 0, origImageTexmpImage.width, origImageTexmpImage.height);

        //    var newData = gui.createImageData(origImageTexmpImage.width, origImageTexmpImage.height);
        //    for (var i = 0; i < origImageTexmpImage.width * origImageTexmpImage.height; i++) {
        //        for (var rc = 0; rc < baseColors.length; rc++) {
        //            if (imgData.data[i * 4 + 0] == baseColors[rc].r && imgData.data[i * 4 + 1] == baseColors[rc].g && imgData.data[i * 4 + 2] == baseColors[rc].b) {
        //                newData.data[i * 4 + 0] = currentColors[rc].r;
        //                newData.data[i * 4 + 1] = currentColors[rc].g;
        //                newData.data[i * 4 + 2] = currentColors[rc].b;
        //                newData.data[i * 4 + 3] = imgData.data[i * 4 + 3];
        //                rc = baseColors.length;
        //            } else if (rc == baseColors.length - 1) {
        //                //if last one and not written, just take defaulr data.
        //                newData.data[i * 4 + 0] = imgData.data[i * 4 + 0];
        //                newData.data[i * 4 + 1] = imgData.data[i * 4 + 1];
        //                newData.data[i * 4 + 2] = imgData.data[i * 4 + 2];
        //                newData.data[i * 4 + 3] = imgData.data[i * 4 + 3];
        //            }

        //        }
        //    }
        //    gui.putImageData(newData, 0, 0);
        //    image.src = ui.toDataURL("image/png");
        //    //document.body.appendChild(image);
        //}
        //console.log('origurl:' + ' origTextureUrl is a long datauri');//origTextureUrl);
        //origImageTexmpImage.src = origTextureUrl;
    }

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
        ////yaw = Math.PI - mainChar.yrot;
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

                InvertTexture();
                
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