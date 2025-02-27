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


var fsOverride;
var vsOverride;
const Suleiman = (function () {
    const mat4 = glMatrix.mat4;
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
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
            //uniform vec3 uAmbientLight;
            uniform vec4 uObjectBrightness;
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
                highp vec3 ambientLight = vec3(0.01, 0.01, 0.01);//vec3(0.16, 0.16, 0.16);//vec3(0.2, 0.2, 0.2);  uAmbientLight;//

                highp vec3 origin = vec3(0.0, 0.0, 0.0);
                highp vec3 directionalLightColor = vec3(distance(origin, vec3(worldSpaceMat[0][0], worldSpaceMat[0][1], worldSpaceMat[0][2])), distance(origin, vec3(worldSpaceMat[1][0], worldSpaceMat[1][1], worldSpaceMat[1][2])), distance(origin, vec3(worldSpaceMat[2][0], worldSpaceMat[2][1], worldSpaceMat[2][2])));
                highp vec3 directionalVector = normalize(uLightDirection);
                highp vec4 transformedNormal = uNormalMatrix  * vec4(aVertexNormal, 1.0);
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);//2.8;//max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (vec3(1.0, 1.0, 1.0) * directional) * 0.28;//directionalLightColor *

                // tyref: webglfundamentals3dpointlighting
                // compute the world position of the surface
                pointWorldPos = (worldSpaceMat * aVertexPosition).xyz;
                
                if(uObjectBrightness.w > 0.0) {

                    vLighting = vLighting + uObjectBrightness.w * uObjectBrightness.xyz;
                }
 
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

    var mainChar = null;
    var mainCharRot = null;
    baseGmod = null;
    var mousePos = { x: 0.0, y: 0.0 };

    var uObjectBrightness = {};
    var currentObjectBrightness = [0.0, 0.0, 0.0, 0.0];

    var soundPlayer;

    var Init = function () {
        StageData.ticks = 0;
        SkyboxRenderer.useSkybox('skybox');
        ShadowShader.setup(null, [1.0, 0.6, 1.0]);
        //OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);

        GiongNoi.InitGiongNoi();
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
        uObjectBrightness = {
            name: 'uObjectBrightness',
            loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'uObjectBrightness'),
            frameset: function (attr, gl) {

                //var light = [0.5, 0.5, 0.5, 1.0];//[-4.51, -2.51, 0.01, 1.0];
                //gl.uniform4fv(attr.loc, light);//[0.000 * StageData.ticks + 0.5, 0.002 * StageData.ticks, 0.0]
            },
            perojbset: function (attr, gl, obj) {

                var val = [0.0, 0.0, 0.0, 0.0];
                if (obj.id == SuleimanState.selectedObjectID) {
                    val = [0.3, 0.3, 0.3, Math.min(1.0, 0.12 * SuleimanState.lightTimer)];
                } else if (obj.id == 1 && SuleimanState.isListening) {
                    val = [0.4, 0.4, 0.4, 1.0];
                } else if (obj.id == 1 && SuleimanState.isFailing) {
                    val = [0.5, 0.0, 0.0, 1.0];
                }
                if (currentObjectBrightness[0] != val[0] || currentObjectBrightness[0] != val[1] ||
                    currentObjectBrightness[0] != val[2] || currentObjectBrightness[0] != val[3]) { 

                    gl.uniform4fv(attr.loc, val);//[0.000 * StageData.ticks + 0.5, 0.002 * StageData.ticks, 0.0]
                    currentObjectBrightness = val;
                }
            }
        }
        customUniforms.push(uObjectBrightness);
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

                if (gmod && baseGmod) {
                    var vmod = mat4.create();
                    mat4.translate(vmod,     // destination matrix
                        baseGmod,     // matrix to translate
                        [-0.0, 0.0, 0.0]);
                    mat4.rotate(vmod, vmod, yaw, [vmod[1], vmod[5], vmod[9]]);//.6
                    mat4.rotate(vmod, vmod, pitch, [vmod[0], vmod[4], vmod[8]]);


                    var lpoint = [0.0, 0.0, 0.0];
                    var modinv = mat4.create();
                    mat4.invert(modinv, vmod);
                    linTransformRange(lpoint, lpoint, modinv, 0, 3, null);
                    //console.log(lpoint);
                    var gnorm = vec3.create()
                    gnorm[0] = lpoint[0]; gnorm[1] = 0.0; gnorm[2] = lpoint[2];
                    vec3.normalize(gnorm, gnorm);

                    /* shadow shader set for mainchar position
                    mat4.translate(textureMatrix,     // destination matrix
                        textureMatrix,     // matrix to translate
                        [gnorm[0] * shadowProjScaler - lpoint[0] * 1.0 - mainChar.matrix[12], 0.0 - mainChar.matrix[13], gnorm[2] * shadowProjScaler - lpoint[2] * 1.0 - mainChar.matrix[14]]);//[lpoint[0], 0.0, lpoint[2]]);
                    //textureMatrix[12] += gnorm[0] * shadowProjScaler - lpoint[0];
                    //textureMatrix[14] -= gnorm[2] * shadowProjScaler - lpoint[2];
                    textureMatrix[14] -= shadowProjScaler;
                    */
                                        
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


        customPerObjectUniforms = [];
        for (var cu = 0; cu < customUniforms.length; cu++) {
            if (customUniforms[cu].perojbset) {
                customPerObjectUniforms.push(customUniforms[cu]);
            }
        }

        //var tonecloc = 'SFX/MusicBoxC1.mp3';
        //Makarios.preloadAudioFromUrl(tonecloc, "startc");

        var tonecsloc = 'SFX/MusicBoxCs1.mp3';
        Makarios.preloadAudioFromUrl(tonecsloc, "tonecs");
        var tonecloc = 'SFX/MusicBoxC1.mp3';
        Makarios.preloadAudioFromUrl(tonecloc, "tonec");
        var tonecsloc = 'SFX/MusicBoxCs1.mp3';
        Makarios.preloadAudioFromUrl(tonecsloc, "tonecs");
        var tonedloc = 'SFX/MusicBoxD1.mp3';
        Makarios.preloadAudioFromUrl(tonedloc, "toned");
        var tonedsloc = 'SFX/MusicBoxDs1.mp3';
        Makarios.preloadAudioFromUrl(tonedsloc, "toneds");
        var toneeloc = 'SFX/MusicBoxE1.mp3';
        Makarios.preloadAudioFromUrl(toneeloc, "tonee");
        var tonefloc = 'SFX/MusicBoxF1.mp3';
        Makarios.preloadAudioFromUrl(tonefloc, "tonef");
        var tonefsloc = 'SFX/MusicBoxFs1.mp3';
        Makarios.preloadAudioFromUrl(tonefsloc, "tonefs");
        var tonegloc = 'SFX/MusicBoxG1.mp3';
        Makarios.preloadAudioFromUrl(tonegloc, "toneg");
        var tonegsloc = 'SFX/MusicBoxGs1.mp3';
        Makarios.preloadAudioFromUrl(tonegsloc, "tonegs");
        var tonealoc = 'SFX/MusicBoxA1.mp3';
        Makarios.preloadAudioFromUrl(tonealoc, "tonea");
        var toneasloc = 'SFX/MusicBoxAs1.mp3';
        Makarios.preloadAudioFromUrl(toneasloc, "toneas");
        var tonebloc = 'SFX/MusicBoxB1.mp3';
        Makarios.preloadAudioFromUrl(tonebloc, "toneb");

        var tonebloc = 'SFX/defeatsmol.mp3';
        Makarios.preloadAudioFromUrl(tonebloc, "defeat");


        var sb1loc = 'gmodels/suleimanb1.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb1loc, "sb1");
        var sb2loc = 'gmodels/suleimanb2.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb2loc, "sb2");
        var sb3loc = 'gmodels/suleimanb3.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb3loc, "sb3");
        var sb4loc = 'gmodels/suleimanb4.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb4loc, "sb4");
        var sb5loc = 'gmodels/suleimanb5.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb5loc, "sb5");
        var sb6loc = 'gmodels/suleimanb6.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb6loc, "sb6");
        var sb7loc = 'gmodels/suleimanb7.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb7loc, "sb7");
        var sb8loc = 'gmodels/suleimanb8.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb8loc, "sb8");
        var sb9loc = 'gmodels/suleimanb9.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb9loc, "sb9");
        var sb10loc = 'gmodels/suleimanb10.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb10loc, "sb10");
        var sb11loc = 'gmodels/suleimanb11.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb11loc, "sb11");
        var sb12loc = 'gmodels/suleimanb12.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sb12loc, "sb12");

        var sbStartloc = 'gmodels/suleimanbStart.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sbStartloc, "sbstart");
        var sulstatusloc = 'gmodels/suleimanStatusLight.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sulstatusloc, "sulstatus");
        var sulBoxLoc = 'gmodels/suleimanBox.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(sulBoxLoc, "sulbox");

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


    var lastScore = 0;
    var highScore = 0;
    var speedFactor = 1.0;

    var sulButtons = [];

    var SuleimanState = {
        isGameOn: false,
        currentObjBrightness: 0.0,
        selectedObjectID: null,
        countdownTimer: 0,
        lightTimer: 0,
        isPrompting: false,
        isListening: false,
        sequence: [],
        currentScore: 0,
        SeqCounter: 0,
        isCoolingDown: false,
        isFailing: false
    };


    var BeginGameOver = function () {

        //turn failure light one
        //SuleimanState.selectedObjectID = 1;
        soundPlayer.playSoundFromSelf("defeat", 1600);

        SuleimanState.isFailing = true;
        SuleimanState.isListening = false;
        SuleimanState.isCoolingDown = false;
        SuleimanState.isPrompting = false;
        SuleimanState.isGameOn = false;

        SuleimanState.countdownTimer = 180;
    };

    var UpdateGameSpeedFactor = function () {
        var subtractor = 0.0;
        if (SuleimanState.currentScore > 3) {
            subtractor = Math.min(.15, (SuleimanState.currentScore * 1.0 - 4.0) * 0.01);
            console.log(subtractor);
        }
        speedFactor = (0.65 - subtractor);//Math.max(0.03 * SuleimanState.currentScore, 0.35));
    }

    var StartButtonClicked = function (startbuttonInst) {

        //soundPlayer.playSoundFromSelf("tonec", 400);
        if (!SuleimanState.isGameOn && !SuleimanState.isFailing) {
            SuleimanState.sequence = [];
            SuleimanState.selectedObjectID = null;
            SuleimanState.isPrompting = true;
            SuleimanState.isListening = false;
            SuleimanState.isCoolingDown = false;
            SuleimanState.isFailing = false;
            SuleimanState.currentScore = 0;
            SuleimanState.SeqCounter = 0;
            SuleimanState.lightTimer = 0;
            SuleimanState.countdownTimer = 120;
            speedFactor = 1.0;
            SuleimanState.isGameOn = true;
        }
    };

    var SulButtonClicked = function (sulbuttoninst) {
        //console.log(sulbuttoninst.sul.id);
        //console.log(SuleimanState.sequence[SuleimanState.SeqCounter]);
        var sulid = sulbuttoninst.sul.id;
        if (SuleimanState.isListening) {

            SuleimanState.lightTimer = 0;
            SuleimanState.isCoolingDown = false;
            SuleimanState.selectedObjectID = sulbuttoninst.id;
            SuleimanState.countdownTimer = 50;

            if (SuleimanState.SeqCounter >= SuleimanState.sequence.length) {
                console.log("TOO MANNYY");
                SuleimanState.isGameOn = false;
                BeginGameOver();
            } else if (sulid == sulButtons[SuleimanState.sequence[SuleimanState.SeqCounter]].sul.id) {
                soundPlayer.playSoundFromSelf(sulbuttoninst.sul.tone, 400);
                SuleimanState.SeqCounter++;
            } else {
                console.log("FAAAIILED");
                SuleimanState.isGameOn = false;
                BeginGameOver();
            }
        } else if (SuleimanState.isPrompting) {
            SuleimanState.isGameOn = false;
            BeginGameOver();
        }
    }

    var MakeSulBottonInst = function (textureOverride, tonename, overrideShade) {
        var shapename = overrideShade || "cube";
        var sulbuttonInst = Makarios.instantiate(Primitives.shapes[shapename], textureOverride || 'gmodels/plainsapphire.jpg', null, {});
        sulbuttonInst.matrix = mat4.create();''
        //mat4.translate(obButton0.matrix, obButton0.matrix, [-3.0, 3.0, 0.0]);
        sulbuttonInst.sul = {
            id: sulButtons.length,
        };
        sulbuttonInst.sul.tone = tonename;
        sulbuttonInst.OnObjectClick = SulButtonClicked;//function (objinst) { console.log(objinst.sul.id); };
        sulButtons.push(sulbuttonInst);

        return sulbuttonInst;
    }
    
    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };

        soundPlayer = GiongNoi.createSingleSourceAudioObject();

        //this sets the camera
        /*
        var vmat = mat4.create();
        mat4.translate(vmat,     // destination matrix
            vmat,     // matrix to translate
            [-0.0, 0.0, -camDist]); //negative camdist
        yaw = Math.PI / 4.0;//.6;
        pitch = 0.0;//Math.PI / 12.0;//0.65
        mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);//.6
        mat4.rotate(gmod, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);//0.65
        */


        var obStartButton = Makarios.instantiate(Primitives.shapes["sbstart"], 'gmodels/startButton.jpg', null, {});
        obStartButton.OnObjectClick = StartButtonClicked;//function (objinst) { console.log(objinst.sul.id); };


        var waitingLight = Makarios.instantiate(Primitives.shapes["sulstatus"], 'plainsky.jpg', null, {});
        //mat4.translate(waitingLight.matrix, waitingLight.matrix, [0.0, -1.50, 0.0]);
        //mat4.scale(waitingLight.matrix, waitingLight.matrix, [1.0, 0.20, 1.0])

        var gameBox = Makarios.instantiate(Primitives.shapes["sulbox"], 'gmodels/offwhite.jpg', null, {});
        //var failureLight = Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/plainrubyred.jpg', null, {});
        //mat4.translate(failureLight.matrix, failureLight.matrix, [0.0, 1.50, 0.0]);
        //mat4.scale(failureLight.matrix, failureLight.matrix, [1.0, 0.20, 1.0])


        var obButton0 = MakeSulBottonInst('gmodels/plainsapphire.jpg', "tonec", "sb1");//Makarios.instantiate(Primitives.shapes["cube"], 'gmodels/plainsapphire.jpg', null, {});
        var obButton1 = MakeSulBottonInst('gmodels/oj.jpg', "tonecs", "sb2");
        var obButton2 = MakeSulBottonInst('gmodels/pastelGreen.jpg', "toned", "sb3");
        //mat4.translate(obButton0.matrix, obButton0.matrix, [-3.0, 3.0, 0.0]);
        //obButton0.sul = {
        //    id:0,
        //};
        //obButton0.OnObjectClick = function (objinst) { console.log(objinst.sul.id); };
        //sulButtons.push(obButton0);

        var obButton3 = MakeSulBottonInst('gmodels/plainrubyred.jpg', "toneds", "sb4");
        var obButton4 = MakeSulBottonInst('gmodels/lime.jpg', "tonee", "sb5");
        var obButton5 = MakeSulBottonInst('gmodels/periwinkle.jpg', "tonef", "sb6");
        //mat4.translate(obButton1.matrix, obButton1.matrix, [-3.0, -3.0, 0.0]);
        //mat4.translate(obButton1.matrix, obButton1.matrix, [0.0, 0.0, 6.0]);

        var obButton6 = MakeSulBottonInst('gmodels/deepjade.jpg', "tonefs", "sb7");
        var obButton7 = MakeSulBottonInst('gmodels/purple.jpg', "toneg", "sb8");
        var obButton8 = MakeSulBottonInst('gmodels/plainrosepink.jpg', "tonegs", "sb9");
        //mat4.translate(obButton2.matrix, obButton2.matrix, [3.0, 3.0, 0.0]);
        var obButton9 = MakeSulBottonInst('gmodels/plaintopaz.jpg', "tonea", "sb10");
        var obButton10 = MakeSulBottonInst('gmodels/magenta.jpg', "toneas", "sb11");
        var obButton11 = MakeSulBottonInst('gmodels/robinegg.jpg', "toneb", "sb12");
        //mat4.translate(obButton3.matrix, obButton3.matrix, [3.0, -3.0, 0.0]);



        SuleimanState.selectedObjectID = 0;

        //obButton1.sul = {
        //    id: 1,
        //};
        //sulButtons.push(obButton1);
        //obStartButton.matrix = 
        //Makarios.SetAnimation(obFox, "IdleStand0");//"0"    Survey  Run
        //mat4.fromScaling(obFox.matrix, [0.1, 0.1, 0.1]);
        //mat4.translate(obFox.matrix, obFox.matrix, [0.0, 6.4, 0.0]);
        //initVelocity(obFox);



        Makarios.setCamDist(24.0);//40.0



        var promptdata = {
            zone: MakUI.Zones.topLeft,
            nx: 2,
            ny: 2,

        };
        MakUI.writeObjToUI('prompt', 'Last Score: -', promptdata);
        var statusdata = {
            zone: MakUI.Zones.topRight,
            nx: 2,
            ny: 2,

        };
        MakUI.writeObjToUI('status', 'High Score: -', statusdata);

        document.querySelector('#uiCanvas').onmousemove = function (e) {
            e = e || window.event;
            mousePos = { x: e.clientX, y: e.clientY };
        }
        console.log(StageData.objects);

        useSimpleTouchAsClick = true;
        EnableClickActions();

        SuleimanProc = MainProc;
    };

    var MainProc = function () {

        //FrameLogic.onFrame(); 
        StageData.SetMainDirLight([0.000 * 40.0 + 0.5, 0.0002 * 40.0, 0.0], [0.0, 0.0, 144.0], [1.0, 1.0, 1.0]);

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
            lpoint); 

        if (gmod && !baseGmod) {
            baseGmod = mat4.create();
            baseGmod = mat4.clone(gmod);
        }


        SuleimanState.countdownTimer--;
        SuleimanState.lightTimer++;

        if (SuleimanState.countdownTimer <= 0) {
            if (SuleimanState.isPrompting) {

                if (!SuleimanState.isCoolingDown) {
                    SuleimanState.isCoolingDown = true;
                    SuleimanState.selectedObjectID = null;
                    SuleimanState.countdownTimer = 18.0;// * speedFactor;

                } else if (SuleimanState.SeqCounter < SuleimanState.currentScore) {
                    var currentPrompt = SuleimanState.sequence[SuleimanState.SeqCounter];

                    SuleimanState.lightTimer = 0;
                    SuleimanState.selectedObjectID = sulButtons[currentPrompt].id;
                    soundPlayer.playSoundFromSelf(StageData.objects[SuleimanState.selectedObjectID].sul.tone, 400);
                    //console.log(SuleimanState.selectedObjectID);
                    SuleimanState.SeqCounter++;
                    SuleimanState.isCoolingDown = false;
                    SuleimanState.countdownTimer = 60.0 * Math.pow(speedFactor, 1.5);
                } else if (SuleimanState.SeqCounter == SuleimanState.currentScore) {
                    var min = 0;
                    var max = sulButtons.length - 1;
                    var rander = Math.floor(Math.random() * (max - min + 1)) + min;

                    SuleimanState.sequence.push(rander);
                    SuleimanState.lightTimer = 0;
                    SuleimanState.selectedObjectID = sulButtons[rander].id;
                    soundPlayer.playSoundFromSelf(StageData.objects[SuleimanState.selectedObjectID].sul.tone, 400);
                    //console.log(SuleimanState.selectedObjectID);
                    SuleimanState.SeqCounter++;
                    SuleimanState.isCoolingDown = false;
                    SuleimanState.countdownTimer = 60.0 * Math.pow(speedFactor, 1.5);
                } else {
                    console.log("now you go");
                    SuleimanState.selectedObjectID = null;
                    SuleimanState.SeqCounter = 0;
                    SuleimanState.isPrompting = false;
                    SuleimanState.isListening = true;
                    SuleimanState.isCoolingDown = false;
                    SuleimanState.countdownTimer = 300.0;
                }
            } else if (SuleimanState.isListening) {
                if (!SuleimanState.isCoolingDown) {
                    SuleimanState.isCoolingDown = true;
                    if (SuleimanState.SeqCounter == SuleimanState.sequence.length) {
                        SuleimanState.countdownTimer = 30.0 * speedFactor;
                    } else {
                        SuleimanState.countdownTimer = 180.0 * speedFactor;
                    }
                    SuleimanState.selectedObjectID = null;
                } else if (SuleimanState.SeqCounter == SuleimanState.sequence.length) {

                    console.log("their move");
                    SuleimanState.selectedObjectID = null;
                    SuleimanState.isCoolingDown = false;
                    console.log(SuleimanState.sequence);
                    SuleimanState.currentScore++;
                    UpdateGameSpeedFactor();
                    SuleimanState.SeqCounter = 0;
                    SuleimanState.isPrompting = true;
                    SuleimanState.isListening = false;
                    SuleimanState.countdownTimer = 16.0;
                } else {
                    console.log("TIMEZ UP!!");
                    SuleimanState.isCoolingDown = false;
                    SuleimanState.isGameOn = false;
                    SuleimanState.isPrompting = false;
                    SuleimanState.isListening = false;
                    BeginGameOver();
                }

            } else if (SuleimanState.isFailing) {
                if (!SuleimanState.isCoolingDown) {
                    console.log("FAIL STEP 1")
                    SuleimanState.isCoolingDown = true;
                    SuleimanState.countdownTimer = 150;
                    SuleimanState.selectedObjectID = null;
                } else {
                    console.log("FAIL STEP 2")
                    //completeFailing
                    lastScore = SuleimanState.currentScore;
                    if (lastScore > highScore) {
                        highScore = lastScore;
                        MakUI.writeObjToUI('prompt', 'Last Score: ' + lastScore + '  !NEW RECORD!', null);
                        MakUI.writeObjToUI('status', 'High Score: ' + highScore, null);
                    } else {
                        MakUI.writeObjToUI('prompt', 'Last Score: ' + lastScore, null);
                    }

                    SuleimanState.isFailing = false;
                    SuleimanState.selectedObjectID = 0;
                    SuleimanState.isCoolingDown = false;
                }
            }
        }


        var basematrix = mat4.create();
        mat4.multiply(basematrix, gproj, gmod); 
    };

    var SuleimanProc = ProcInLoading;

    var OnFrame = function () {
        //FrameLogic.onFrame();
        SuleimanProc();
    };

    return {
        'Init': Init, 'OnFrame': OnFrame,
        'customAttributes': customAttributes,
        'customUniforms': customUniforms
    };
})();