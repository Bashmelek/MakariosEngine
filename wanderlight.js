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
const WanderLight = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];

    fsOverride = `
            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            uniform mediump float ucelStep;

            uniform sampler2D uSampler;
            uniform mediump float ucustomAlpha;

            // tyref: webglfundamentals3dpointlighting
            varying highp vec3 vPosToLight;
            varying highp vec3 vNormWorld;
            varying highp vec3 vPosToCam;

            void main(void) {
                highp vec4 texelColor = texture2D(uSampler, vec2(vTextureCoord[0], vTextureCoord[1]));// vTextureCoord);

                highp vec3 surfaceToLightDirection = normalize(vPosToLight);
                highp vec3 normWorld = normalize(vNormWorld);
                highp float pointlight = max(abs(dot(normWorld, surfaceToLightDirection)), 0.0); ////max(dot(vNormWorld, vPosToLight), abs(dot(vNormWorld, vPosToLight))); ////max(dot(vNormWorld, vPosToLight), dot(vNormWorld, vPosToLight));

                gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a * 1.0);//texelColor.a * 1.0
                gl_FragColor.rgb *= (1.0 + 1.0 * pointlight * vec3(0.4, 0.85, 1.0));

                // Just add in the specular
                highp vec3 surfaceToViewDirection = normalize(vPosToCam);
                highp vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
                highp float specular = dot(normWorld, halfVector);
                specular = abs(0.0 * specular);
                if (specular > 0.0) {
                    specular = pow(specular, 8.0);//8.0
                }
                gl_FragColor.rgb += max(1.0 * specular, 0.0);// max(1.8 * specular, 0.0);
                ////gl_FragColor.rgb = surfaceToViewDirection;
                ////gl_FragColor.r *= 10.0;
                ////gl_FragColor.g *= 10.0;

                if(ucelStep > 1.0)
                {
                    gl_FragColor = vec4(ceil(gl_FragColor[0] * ucelStep) / ucelStep, ceil(gl_FragColor[1] * ucelStep) / ucelStep, ceil(gl_FragColor[2] * ucelStep) / ucelStep, gl_FragColor[3]);
                }
            }
        `;


    vsOverride = `
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

            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            //point light
            //courtesy of thank you webglfundamentals https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html  tyref: webglfundamentals3dpointlighting
            uniform vec3 ulightWorldPos;
            varying highp vec3 vPosToLight;
            varying highp vec3 vNormWorld;
            varying highp vec3 vPosToCam;

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
            }
        `;

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
            Makarios.SetAnimation(ob5, "Survey");//"0"    Survey  Run

            mat4.fromScaling(ob5.matrix, [0.1, 0.1, 0.1]);
            console.log(ob5.matrix);


            var obplane = Makarios.instantiate(Primitives.shapes["plane"], 'plainsky.jpg', null, {});
            mat4.fromScaling(obplane.matrix, [4.0, 4.0, 4.0]);//[14.0, 4.0, 14.0]);


            var oblightdummy = Makarios.instantiate(Primitives.shapes["cube"], 'plainsky.jpg', null, {});
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

    customAttributes = [];
    customAttributes.push({
        name: 'ulightWorldPos'
    });

    return {
        'Init': Init, 'OnFrame': OnFrame,
        'customAttributes': customAttributes,
        //'customUniforms': customUniforms
    };
})();