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


var fsOverride;
var vsOverride;
const StateOfMakarios23 = (function () {
    const mat4 = glMatrix.mat4;
    const vec3 = glMatrix.vec3;
    var objects = [];

    fsOverride = `
            precision mediump float;

            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            uniform mediump float ucelStep;
            //uniform mediump int utextureDim;//for future use

            uniform sampler2D uProjectedTexture;
            uniform sampler2D uSampler;
            uniform mediump float ucustomAlpha;
            uniform vec4 u_colorMult;//???

            // tyref: webglfundamentals3dpointlighting
            varying vec2 v_texcoord;
            varying highp vec3 vPosToLight;
            varying highp vec3 vNormWorld;
            varying highp vec3 vPosToCam;
            varying vec4 v_projectedTexcoord;

            void main(void) {
                mediump float utextureDim = 2048.0;//2048
                highp vec4 resultColor = vec4(1.0, 1.0, 1.0, 1.0);
                
                //thank you https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html tyref: fungliproc
                vec2 onePixel = vec2(1.0, 1.0) / utextureDim;

                //tyref: funglshadows
                vec3 projectedTexcoord = v_projectedTexcoord.xyz / (v_projectedTexcoord.w * 1.0);
                //from the shadow shader: gl_Position[2] * gl_Position[3] * 0.01;
                float currentDepth = projectedTexcoord.z - 0.00030;//0.0010;
                bool inRange = 
                      projectedTexcoord.x >= 0.0 &&
                      projectedTexcoord.x <= 1.0 &&
                      projectedTexcoord.y >= 0.0 &&
                      projectedTexcoord.y <= 1.0 &&
                      projectedTexcoord.x <= 1.0 &&
                      projectedTexcoord.z >= 0.0 &&
                      projectedTexcoord.z <= 1.0;

                float textureDepth = texture2D(uProjectedTexture, projectedTexcoord.xy).r;
                float interpolatedTextureVal = 0.0;
                float shadelessLight = inRange ? 1.0 : 0.00;//(inRange && textureDepth <= currentDepth) ? 0.0 : 1.0; 
                float interpCheckDepth = projectedTexcoord.z - 0.00030;//0.0010;  
                if (inRange && textureDepth <= currentDepth) {
                    shadelessLight = 0.0;
                    float leftBorder = onePixel.x * floor(projectedTexcoord.x / onePixel.x);
                    float topBorder = onePixel.y * floor(projectedTexcoord.y / onePixel.y);

                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(onePixel.x, 0.0)).r <= interpCheckDepth) ? 0.0 : abs(projectedTexcoord.x - leftBorder) / onePixel.x;//1.0;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(-onePixel.x, 0.0)).r <= interpCheckDepth) ? 0.0 : abs((leftBorder + onePixel.x) - projectedTexcoord.x)/ onePixel.x;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(0.0, onePixel.y)).r <= interpCheckDepth) ? 0.0 : abs(projectedTexcoord.y - topBorder) / onePixel.y;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(0.0, -onePixel.y)).r <= interpCheckDepth) ? 0.0 : abs((topBorder + onePixel.y) - projectedTexcoord.y) / onePixel.y;
                    
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(onePixel.x, onePixel.y)).r <= interpCheckDepth) ? 0.0 : 0.12;//abs(projectedTexcoord.x - leftBorder) / onePixel.x;//1.0;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(-onePixel.x, onePixel.y)).r <= interpCheckDepth) ? 0.0 : 0.12;//abs((leftBorder + onePixel.x) - projectedTexcoord.x)/ onePixel.x;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(onePixel.x, -onePixel.y)).r <= interpCheckDepth) ? 0.0 : 0.12;//abs(projectedTexcoord.y - topBorder) / onePixel.y;
                    interpolatedTextureVal += (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(-onePixel.x, -onePixel.y)).r <= interpCheckDepth) ? 0.0 : 0.12;//abs((topBorder + onePixel.y) - projectedTexcoord.y) / onePixel.y;

                    shadelessLight += min(pow(interpolatedTextureVal, 0.5) / 1.6, 1.0);//interpolatedTextureVal;//min(interpolatedTextureVal / 1.0, 1.0);
                }
                //else if (inRange) {
                //    shadelessLight = 0.0;
                //    float leftBorder = onePixel.x * floor(projectedTexcoord.x / onePixel.x);
                //    float topBorder = onePixel.y * floor(projectedTexcoord.y / onePixel.y);

                //    interpolatedTextureVal -= (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(onePixel.x, 0.0)).r <= interpCheckDepth) ? abs(projectedTexcoord.x - leftBorder) / onePixel.x : 0.0;//1.0;
                //    interpolatedTextureVal -= (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(-onePixel.x, 0.0)).r <= interpCheckDepth) ? abs((leftBorder + onePixel.x) - projectedTexcoord.x)/ onePixel.x : 0.0;
                //    interpolatedTextureVal -= (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(0.0, onePixel.y)).r <= interpCheckDepth) ? abs(projectedTexcoord.y - topBorder) / onePixel.y : 0.0;
                //    interpolatedTextureVal -= (texture2D(uProjectedTexture, projectedTexcoord.xy + vec2(0.0, -onePixel.y)).r <= interpCheckDepth) ? abs((topBorder + onePixel.y) - projectedTexcoord.y) / onePixel.y : 0.0;

                //    shadelessLight += min(pow(interpolatedTextureVal, 0.25) / 1.0, 1.0);
                //}

                highp vec4 texelColor = texture2D(uSampler, vec2(vTextureCoord[0], vTextureCoord[1]));// vTextureCoord);

                highp vec3 surfaceToLightDirection = normalize(vPosToLight);
                highp vec3 normWorld = normalize(vNormWorld);
                highp float pointlight = max(abs(dot(normWorld, surfaceToLightDirection)), 0.0) * 0.0; 

                resultColor = vec4(texelColor.rgb * (vLighting), texelColor.a * 1.0);
                resultColor.rgb *= (1.0 + shadelessLight + pointlight * vec3(0.4, 0.85,  1.0));
//resultColor.rgb = vec3(shadelessLight, shadelessLight,  shadelessLight);

                //testval
                ////resultColor = vec4(texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).rrr * 0.333, 1);//
                ////resultColor = vec4(currentDepth * 1.0,currentDepth * 1.0, currentDepth * 1.0,  1);//
                ////resultColor = vec4(currentDepth * 2.0 - texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).r * 1.0, currentDepth * 2.0 - texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).r * 1.0, currentDepth * 2.0 - texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).r * 1.0, 1);
                
                // Just add in the specular
                highp vec3 surfaceToViewDirection = normalize(vPosToCam);
                highp vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
                highp float specular = dot(normWorld, halfVector);
                specular = abs(0.0 * specular);
                if (specular > 0.0) {
                    specular = pow(specular, 8.0);
                }
                resultColor.rgb += max(1.0 * specular, 0.0);

                if(ucelStep > 1.0)
                {
                    resultColor = vec4(ceil(resultColor[0] * ucelStep) / ucelStep, ceil(resultColor[1] * ucelStep) / ucelStep, ceil(resultColor[2] * ucelStep) / ucelStep, resultColor[3]);
                }
                gl_FragColor = resultColor;
            }
        `;


    vsOverride = `
            precision mediump float;

            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute vec3 aTextureCoord;
            attribute float aUseParentMatrix;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            uniform mat4 uParentMatrix;
            uniform float uMatrixLevel;
            uniform vec3 uLightDirection;

            uniform mat4 uOverTextureMatrix;
            uniform mat4 uGlobalModInv;//is this really needed

            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            //point light
            //courtesy of thank you webglfundamentals https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html  tyref: webglfundamentals3dpointlighting
            uniform vec3 ulightWorldPos;
            varying highp vec3 vPosToLight;
            varying highp vec3 vNormWorld;
            varying highp vec3 vPosToCam;
            varying vec2 v_texcoord;
            varying vec4 v_projectedTexcoord;

            void main(void) {
                
                //this also courtesy of thank you webglfundamentals https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html tyref: webglfundamentals3dpointlighting
                vec3 pointWorldPos;
                mat4 worldSpaceMat = uModelViewMatrix;
                if(aUseParentMatrix < uMatrixLevel) {
                    worldSpaceMat = uParentMatrix;
                }
                mat4 worldCamMat = uProjectionMatrix * worldSpaceMat;

                if(aUseParentMatrix >= uMatrixLevel) {
                    gl_Position = uProjectionMatrix * worldSpaceMat * aVertexPosition;
                }
                else {
                    gl_Position = uProjectionMatrix * worldSpaceMat * aVertexPosition;
                }
                vTextureCoord = aTextureCoord;

                // Apply lighting effect
                highp vec3 ambientLight = vec3(0.1, 0.1, 0.1);//vec3(0.2, 0.2, 0.2);

                highp vec3 origin = vec3(0.0, 0.0, 0.0);
                highp vec3 directionalLightColor = vec3(distance(origin, vec3(worldSpaceMat[0][0], worldSpaceMat[0][1], worldSpaceMat[0][2])), distance(origin, vec3(worldSpaceMat[1][0], worldSpaceMat[1][1], worldSpaceMat[1][2])), distance(origin, vec3(worldSpaceMat[2][0], worldSpaceMat[2][1], worldSpaceMat[2][2])));
                highp vec3 directionalVector = normalize(uLightDirection);
                highp vec4 transformedNormal = uNormalMatrix  * vec4(aVertexNormal, 1.0);
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (directionalLightColor * directional) * 0.45;

                // tyref: webglfundamentals3dpointlighting
                // compute the world position of the surface
                pointWorldPos = (worldSpaceMat * aVertexPosition).xyz;
 
                // compute the vector of the surface to the light
                // and pass it to the fragment shader
                vNormWorld = mat3(worldSpaceMat) * aVertexNormal;
                vPosToLight = (worldSpaceMat * vec4(8.0, 1.4, 8.0, 1.0)).xyz - pointWorldPos;//vec4(ulightWorldPos, 1.0)).xyz - pointWorldPos;//vec4(8.0, 1.4, 8.0, 1.0)).xyz - pointWorldPos;//ulightWorldPos - surfaceWorldPosition; 
                // compute the vector of the surface to the view/camera
                // and pass it to the fragment shader
                vPosToCam = vec3(uProjectionMatrix[3][0], uProjectionMatrix[3][1], uProjectionMatrix[3][2]) - pointWorldPos;

                v_projectedTexcoord = uOverTextureMatrix * uGlobalModInv * (worldSpaceMat * aVertexPosition);

            }
        `;

    var wgl;
    customAttributes = [];
    customUniforms = [];
    var textureMatrix = mat4.create();

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
        customUniforms.push({
            name: 'ulightWorldPos',
            //loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'ulightWorldPos'),
            //frameset: function (attr, gl) {

            //    var lpoint = [0.0, 0.0, 0.0];
            //    var lightLocMat = mat4.create();
            //    mat4.invert(lightLocMat, StageData.StageLights[0].lightmat);
            //    linTransformRange(lpoint, lpoint, lightLocMat, 0, 3, null);
            //    gl.uniform3fv(attr.loc, lpoint);//[0.000 * StageData.ticks + 0.5, 0.002 * StageData.ticks, 0.0]
            //    console.log(lpoint);
            //}
        });
        customUniforms.push({
            name: 'uOverTextureMatrix',
            loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'uOverTextureMatrix'),
            frameset: function (attr, gl) {

                textureMatrix = mat4.create();

                //attempt 3
                var tempmat3 = mat4.create();

                var shadowProjScaler = ShadowShader.getProjScaler();
                mat4.translate(textureMatrix,     // destination matrix
                    StageData.StageLights[0].lightmat,     // matrix to translate
                    [0.0, -0.0, 0.0]);

                if (gmod) {
                    var lpoint = [0.0, 0.0, 0.0];
                    var modinv = mat4.create();
                    mat4.invert(modinv, gmod);
                    linTransformRange(lpoint, lpoint, modinv, 0, 3, null);
                    //console.log(lpoint);
                    var gnorm = vec3.create()
                    gnorm[0] = lpoint[0]; gnorm[1] = 0.0; gnorm[2] = lpoint[2];
                    vec3.normalize(gnorm, gnorm);

                    mat4.translate(textureMatrix,     // destination matrix
                        textureMatrix,     // matrix to translate
                        [gnorm[0] * shadowProjScaler - lpoint[0] * 1.0, 0.0, gnorm[2] * shadowProjScaler - lpoint[2] * 1.0 ]);//[lpoint[0], 0.0, lpoint[2]]);
                    //textureMatrix[12] += gnorm[0] * shadowProjScaler - lpoint[0];
                    //textureMatrix[14] -= gnorm[2] * shadowProjScaler - lpoint[2];
                                        
                    //textureMatrix[12] = lpoint[0];
                    //textureMatrix[14] = lpoint[2];
                    //textureMatrix[14] = 8;
                }

                if (StageData.defShadowProjMat && true) {
                    mat4.multiply(textureMatrix, StageData.defShadowProjMat, textureMatrix);
                } else if (gproj && true) {
                    mat4.multiply(textureMatrix, gproj, textureMatrix);
                }

                tempmat3 = mat4.create();
                mat4.translate(tempmat3,     // destination matrix
                    tempmat3,     // matrix to translate
                    [0.50, 0.50, 0.50]);
                mat4.scale(tempmat3, tempmat3, [0.5, 0.5, 0.5]);
                mat4.multiply(textureMatrix, tempmat3, textureMatrix);

                gl.uniformMatrix4fv(
                    attr.loc,
                    false,
                    textureMatrix);
            }
        });
        customUniforms.push({
            name: 'uProjectedTexture',
            loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'uProjectedTexture'),
            frameset: function (attr, gl) {
                gl.uniform1i(attr.loc, 1);
            }
        });
        customUniforms.push({
            name: 'uGlobalModInv',
            loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'uGlobalModInv'),
            frameset: function (attr, gl) {

                var modinv = mat4.create();
                if (gmod) {
                    mat4.invert(modinv, gmod);////just temp out

                    gl.uniformMatrix4fv(
                        attr.loc,
                        false,
                        modinv);
                }
            }
        });



        var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(foxloc, "testbox");

        var milktruckloc = 'SampleModels/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(milktruckloc, "milktruck");

        var caesarloc = 'SampleModels/CesiumMan/glTF-Embedded/CesiumMan.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(caesarloc, "caesar");

        isLoading = false;

    };
    
    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };

        var vmat = mat4.create();
        mat4.translate(vmat,     // destination matrix
            vmat,     // matrix to translate
            [-0.0, 0.0, -camDist]); //negative camdist
        yaw = .6;
        pitch = 0.65
        mat4.rotate(vmat, vmat, .6, [vmat[1], vmat[5], vmat[9]]);
        mat4.rotate(gmod, vmat, 0.65, [vmat[0], vmat[4], vmat[8]]);

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
        //console.log(ob7);

        var testground = {
            id: 3,
            isComposite: false,
            positions: [
                // Top face
                -194.0, 0.0, -194.0,
                -194.0, 0.0, 194.0,
                194.0, 0.0, 194.0,
                194.0, 0.0, -194.0,
            ],

            textureCoordinates: [
                // Top
                0.0, 1.0,
                1.0, 1.0,
                1.0, 0.0,
                0.0, 0.0,
            ],

            textureCoordinatesWithAlpha: [
                // Top
                0.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
            ],

            indices: [
                0, 1, 2, 0, 2, 3,
            ],

            vertexNormals: [
                // Top
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
            ]
        };

        var obplane = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});//Primitives.shapes["plane"]
        obplane.matrix = mat4.create();
        mat4.fromScaling(obplane.matrix, [194.0, 194.0, 194.0]);//[14.0, 4.0, 14.0]);
        //obplane.positions = [
        //    // Top face
        //    -194.0, 0.0, -194.0,
        //    -194.0, 0.0, 194.0,
        //    194.0, 0.0, 194.0,
        //    194.0, 0.0, -194.0,
        //]


        var oblightdummy = Makarios.instantiate(Primitives.shapes["tetrahedron"], 'plainsky.jpg', null, {});
        mat4.translate(oblightdummy.matrix, oblightdummy.matrix, [8.0, 1.4, 8.0]);

        Makarios.setCamDist(40.0);

        obFox.collider = {
            type: 'yrotbox',
            hwidth: 1,
            hdepth: 1,
            hheight: 1.0
            //type: 'rotationlesscylinder',
            //radius: 1.0,
            //hheight: 1.0
        };

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
        //console.log(lpoint);

        //if (gproj != null) {
        //    var transformedPlane = [
        //        // Top face
        //        -1.0, 0.0, -1.0,
        //        -1.0, 0.0, 1.0,
        //        1.0, 0.0, 1.0,
        //        1.0, 0.0, -1.0,
        //    ];
        //    var gProjMod = mat4.create();
        //    mat4.multiply(gProjMod, gproj, gmod);
        //    linTransformRange(transformedPlane, Primitives.shapes["plane"].positions, gProjMod, 0, 12, null);
        //    console.log(transformedPlane);
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
        'customUniforms': customUniforms
    };
})();