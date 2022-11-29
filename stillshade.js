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
const StillShade = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];

    fsOverride = `
            precision mediump float;

            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            uniform mediump float ucelStep;

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
                highp vec4 resultColor = vec4(1.0, 1.0, 1.0, 1.0);
                //tyref: funglshadows
                vec3 projectedTexcoord = v_projectedTexcoord.xyz / (v_projectedTexcoord.w * 1.0);
                //from the shadow shader: gl_Position[2] * gl_Position[3] * 0.01;
                float currentDepth = projectedTexcoord.z - 0.00001;//// * 0.11 * 0.333;//// * v_projectedTexcoord.w * 0.001;
                bool inRange = 
                      projectedTexcoord.x >= 0.0 &&
                      projectedTexcoord.x <= 1.0 &&
                      projectedTexcoord.y >= 0.0 &&
                      projectedTexcoord.y <= 1.0;
                //vec4 projectedTexColor = vec4(texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).rrr * 1.0, 1);//vec4(0.2, 0.2, texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).r * 0.37, 1);////vec4(texture2D(uProjectedTexture, projectedTexcoord.xy * 1.0).rrr * 1.0, 1);//// vec2(vTextureCoord[0], vTextureCoord[1]));//
                float projectedDepth = texture2D(uProjectedTexture, projectedTexcoord.xy).r;
                float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

                highp vec4 texelColor = texture2D(uSampler, vec2(vTextureCoord[0], vTextureCoord[1]));// vTextureCoord);

                highp vec3 surfaceToLightDirection = normalize(vPosToLight);
                highp vec3 normWorld = normalize(vNormWorld);
                highp float pointlight = max(abs(dot(normWorld, surfaceToLightDirection)), 0.0); ////max(dot(vNormWorld, vPosToLight), abs(dot(vNormWorld, vPosToLight))); ////max(dot(vNormWorld, vPosToLight), dot(vNormWorld, vPosToLight));

                resultColor = vec4(texelColor.rgb * vLighting, texelColor.a * 1.0);//texelColor.a * 1.0
                resultColor.rgb *= (1.0 + shadowLight * pointlight * vec3(0.4, 0.85, 1.0));//(1.0 + 1.0 * pointlight * vec3(0.4, 0.85, 1.0));

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
                    specular = pow(specular, 8.0);//8.0
                }
                resultColor.rgb += max(1.0 * specular, 0.0);// max(1.8 * specular, 0.0);
                ////resultColor.rgb = surfaceToViewDirection;
                ////resultColor.r *= 10.0;
                ////resultColor.g *= 10.0;

                if(ucelStep > 1.0)
                {
                    resultColor = vec4(ceil(resultColor[0] * ucelStep) / ucelStep, ceil(resultColor[1] * ucelStep) / ucelStep, ceil(resultColor[2] * ucelStep) / ucelStep, resultColor[3]);
                }
                ////vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
                ////float projectedAmount = inRange ? 1.0 : 0.0;
                ////resultColor = mix(resultColor, projectedTexColor, projectedAmount);
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
                highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);

                highp vec3 origin = vec3(0.0, 0.0, 0.0);
                highp vec3 directionalLightColor = vec3(distance(origin, vec3(worldSpaceMat[0][0], worldSpaceMat[0][1], worldSpaceMat[0][2])), distance(origin, vec3(worldSpaceMat[1][0], worldSpaceMat[1][1], worldSpaceMat[1][2])), distance(origin, vec3(worldSpaceMat[2][0], worldSpaceMat[2][1], worldSpaceMat[2][2])));
                highp vec3 directionalVector = normalize(uLightDirection);
                highp vec4 transformedNormal = uNormalMatrix  * vec4(aVertexNormal, 1.0);
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (directionalLightColor * directional);

                // tyref: webglfundamentals3dpointlighting
                // compute the world position of the surface
                pointWorldPos = (worldSpaceMat * aVertexPosition).xyz;
 
                // compute the vector of the surface to the light
                // and pass it to the fragment shader
                vNormWorld = mat3(worldSpaceMat) * aVertexNormal;
                vPosToLight = (worldSpaceMat * vec4(8.0, 1.4, 8.0, 1.0)).xyz - pointWorldPos;//ulightWorldPos - surfaceWorldPosition; ////(mat3(uParentMatrix) * vec3(4.0, -2.0, 8.0)) - pointWorldPos;
                // compute the vector of the surface to the view/camera
                // and pass it to the fragment shader
                vPosToCam = vec3(uProjectionMatrix[3][0], uProjectionMatrix[3][1], uProjectionMatrix[3][2]) - pointWorldPos;//uProjectionMatrix[12], uProjectionMatrix[13], uProjectionMatrix[14]

                v_projectedTexcoord = uOverTextureMatrix * uGlobalModInv * (worldSpaceMat * aVertexPosition);//(worldSpaceMat * aVertexPosition);//uOverTextureMatrix * (worldSpaceMat * aVertexPosition);// uOverTextureMatrix * (worldSpaceMat * aVertexPosition);//add worldSpaceMat or no?
                ////v_projectedTexcoord = uGlobalModInv * uProjectionMatrix * (worldSpaceMat * aVertexPosition);//
                //v_projectedTexcoord[2] = 0.999;//??
                ////v_projectedTexcoord[2] = v_projectedTexcoord[2] * v_projectedTexcoord[3] * 0.01;
            }
        `;

    var wgl;
    customAttributes = [];
    customUniforms = [];
    var textureMatrix = mat4.create();

    var Init = function () {
        StageData.ticks = 0;
        ////SkyboxRenderer.useSkybox('skybox');//"penguins (26)");//StageData.skybox = "penguins (26)";
        ShadowShader.setup(null, [1.0, 0.6, 1.0]);
        OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);
        console.log(camDist);
        maxCamDist = 300.0;//global scope, plz fix
        maxZFar = 400.0;//this global too

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;



        var canvas = document.getElementById("glCanvas");
        wgl = canvas.getContext("webgl");
        customUniforms.push({
            name: 'ulightWorldPos'
        });
        customUniforms.push({
            name: 'uOverTextureMatrix',
            loc: wgl.getUniformLocation(globalMainProgramInfo.program, 'uOverTextureMatrix'),
            frameset: function (attr, gl) {

                textureMatrix = mat4.create();

                //attempt 3
                var tempmat3 = mat4.create();
                //mat4.rotate(textureMatrix,  // destination matrix
                //    textureMatrix,  // matrix to rotate
                //    -3.14159,//.7,   // amount to rotate in radians
                //    [1, 0, 0]);
                ////mat4.rotate(textureMatrix,  // destination matrix
                ////    textureMatrix,  // matrix to rotate
                ////    3.14159,//.7,   // amount to rotate in radians
                ////    [0, 0, 1]);
                //mat4.translate(textureMatrix,     // destination matrix
                //    textureMatrix,     // matrix to translate
                //    [-46.0, 0.0, -28.0]);//

                /*if (gproj && true) {
                    var tempproj = mat4.create();
                    ////mat4.scale(tempproj, gproj, [0.1, 0.1, 0.1]);
                    mat4.invert(tempproj, gproj);
                    mat4.multiply(textureMatrix, textureMatrix, gproj);
                }

                ////mat4.scale(tempmat3, tempmat3, [24.0, 0.1, 24.0]);
                mat4.rotate(tempmat3,  // destination matrix
                    tempmat3,  // matrix to rotate
                    .052,//.252,//(Date.now() * .001),//-.452,//.7,   // amount to rotate in radians
                    [1, 0, 0]); //console.log(Date.now() * .01);
                mat4.rotate(tempmat3,  // destination matrix
                    tempmat3,  // matrix to rotate
                    -1.5707,//.7,   // amount to rotate in radians
                    [0, 1, 0]);
                mat4.translate(tempmat3,     // destination matrix
                    tempmat3,     // matrix to translate
                    [-44.0, -8.0, 0.0]);

                mat4.invert(tempmat3, tempmat3);
                mat4.multiply(textureMatrix, textureMatrix, tempmat3);
                */

                //attempt 4
                mat4.rotate(tempmat3,  // destination matrix
                    tempmat3,  // matrix to rotate
                    .052,//.252,//(Date.now() * .001),//-.452,//.7,   // amount to rotate in radians
                    [1, 0, 0]); //console.log(Date.now() * .01);
                mat4.rotate(tempmat3,  // destination matrix
                    tempmat3,  // matrix to rotate
                    -1.752,//-1.5707,//.7,   // amount to rotate in radians
                    [0, 1, 0]);
                mat4.translate(tempmat3,     // destination matrix
                    tempmat3,     // matrix to translate
                    [-44.0, -8.0, 0.0]);
                mat4.multiply(textureMatrix, textureMatrix, tempmat3);
                if (gproj && true) {
                    mat4.multiply(textureMatrix, gproj, textureMatrix);
                }

                tempmat3 = mat4.create();
                //mat4.translate(tempmat3,     // destination matrix
                //    tempmat3,     // matrix to translate
                //    [0.666, 0.501, 0.666]);
                mat4.translate(tempmat3,     // destination matrix
                    tempmat3,     // matrix to translate
                    [0.50, 0.50, 0.50]);
                mat4.scale(tempmat3, tempmat3, [0.5, 0.5, 0.5]);
                mat4.multiply(textureMatrix, tempmat3, textureMatrix);

                //mat4.translate(textureMatrix,     // destination matrix
                //    textureMatrix,     // matrix to translate
                //    [-140.5, 25.5, -60.5]);
                //mat4.invert(textureMatrix, textureMatrix);

                gl.uniformMatrix4fv(
                    attr.loc,
                    false,
                    textureMatrix);
                //console.log(textureMatrix);
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
                mat4.invert(modinv, gmod);////just temp out
                //mat4.translate(modinv,     // destination matrix
                //    modinv,     // matrix to translate
                //    [0.5, 0.5, 0.5]);
                //mat4.scale(modinv, modinv, [0.5, 0.5, 0.5]);
                gl.uniformMatrix4fv(
                    attr.loc,
                    false,
                    modinv);
            }
        });



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
            mat4.fromScaling(obplane.matrix, [44.0, 44.0, 44.0]);//[14.0, 4.0, 14.0]);


            var oblightdummy = Makarios.instantiate(Primitives.shapes["tetrahedron"], 'plainsky.jpg', null, {});
            mat4.translate(oblightdummy.matrix, oblightdummy.matrix, [8.0, 1.4, 8.0]);//[14.0, 4.0, 14.0]);

            //var obplane2 = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});
            //mat4.fromScaling(obplane2.matrix, [1.0, 1.0, 1.0]);//[14.0, 4.0, 14.0]);
            //mat4.translate(obplane2.matrix,     // destination matrix
            //    obplane2.matrix,     // matrix to translate
            //    [-3.5, 0.0, -6.0]);

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

    return {
        'Init': Init, 'OnFrame': OnFrame,
        'customAttributes': customAttributes,
        'customUniforms': customUniforms
    };
})();