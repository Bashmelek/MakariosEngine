const mat4 = glMatrix.mat4;
const mat3 = glMatrix.mat3;
const vec3 = glMatrix.vec3;
const Quaternion = glMatrix.quat;

var MakTextures = {};

const fsSource = `
            //varying lowp vec4 vColor;
            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            uniform mediump float ucelStep;

            uniform sampler2D uSampler;
            uniform mediump float ucustomAlpha;
            //uniform mediump float urandomSeed1;

            void main(void) {
                highp vec4 texelColor = texture2D(uSampler, vec2(vTextureCoord[0], vTextureCoord[1]));// vTextureCoord);
                
                //mediump float alphaToUse =  texelColor.a * ucustomAlpha;

                gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a * vTextureCoord[2]);//texelColor.a * 1.0

//                if(urandomSeed1 > 1.0){
//                highp float randy1 = mod((texelColor[0] + texelColor[1] + texelColor[2] + vTextureCoord[0] + vTextureCoord[1]) * urandomSeed1, 20.0);// / 12.0; 
//                if(randy1 > 10.0)
//                {
//                    randy1 -= 20.0;
//                }
//    randy1 = min(0.2, randy1 / 320.0);
//gl_FragColor[0] += randy1;
//gl_FragColor[1] += randy1;
//gl_FragColor[2] += randy1;
//}
                if(ucelStep > 1.0)
                {
                    //ugly with most textures...needs a better way but good enough for now
                    //gl_FragColor = vec4(1.0, 1.0, 0.0, texelColor.a);;//
                    gl_FragColor = vec4(ceil(gl_FragColor[0] * ucelStep) / ucelStep, ceil(gl_FragColor[1] * ucelStep) / ucelStep, ceil(gl_FragColor[2] * ucelStep) / ucelStep, gl_FragColor[3]);
                }
            }
        `;

// Vertex shader program
const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            //attribute vec4 aVertexColor;
            attribute vec3 aTextureCoord;
            attribute float aUseParentMatrix;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            uniform mat4 uParentMatrix;
            uniform float uMatrixLevel;
            uniform vec3 uLightDirection;

            //varying lowp vec4 vColor;
            varying highp vec3 vTextureCoord;
            varying highp vec3 vLighting;

            void main(void) {
                if(aUseParentMatrix >= uMatrixLevel) {
                    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;//aVertexPosition;//uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                }
                else {
                    gl_Position = uProjectionMatrix * uParentMatrix * aVertexPosition;//aVertexPosition;//uProjectionMatrix * uParentMatrix * aVertexPosition;
                }

                vTextureCoord = aTextureCoord;

                // Apply lighting effect
                highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);

                highp vec3 origin = vec3(0.0, 0.0, 0.0);
                highp vec3 directionalLightColor = vec3(distance(origin, vec3(uModelViewMatrix[0][0], uModelViewMatrix[0][1], uModelViewMatrix[0][2])), distance(origin, vec3(uModelViewMatrix[1][0], uModelViewMatrix[1][1], uModelViewMatrix[1][2])), distance(origin, vec3(uModelViewMatrix[2][0], uModelViewMatrix[2][1], uModelViewMatrix[2][2])));
                highp vec3 directionalVector = normalize(uLightDirection);// normalize(vec3(0.85, 0.8, 0.75));
                highp vec4 transformedNormal = uNormalMatrix  * vec4(aVertexNormal, 1.0);
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (directionalLightColor * directional);
            }
        `;


//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //adding these detaches and deletes as per 1. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_vertex_attributes
    // and 2. https://stackoverflow.com/questions/9113154/proper-way-to-delete-glsl-shader
    // and further 3. https://www.khronos.org/opengl/wiki/GLSL_Object
    // ...it is a good thing to do after linking
    // just, as always, test andcheck against other platforms, mobile might give an issue according to the stackoverflow comment in 2
    gl.detachShader(shaderProgram, vertexShader);
    gl.detachShader(shaderProgram, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


var ggl = {};
////var gtextureCoordBuffer = {};
var globalMainProgramInfo = {};
var uiState = { hasany: false };
var halfheight = 240;
var halfwidth = 320;
var bufferHolder = {
    positionBuffer: null,
    textureCoordBuffer: null,
    indexBuffer: null,
    normalBuffer: null,
    useParentMatrixBuffer: null
};

var performanceStats = {
    consecutiveSlowObjDraws : 0
}


function initBuffers(gl) {
    ggl = gl;
    // Create a buffer for the square's positions.
    if (bufferHolder.positionBuffer == null) {
        bufferHolder.positionBuffer = gl.createBuffer();
    }
    const positionBuffer = bufferHolder.positionBuffer;

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    //const positions = ObjData.positions;
    var positions = []; /*
    for (var pobs = 0; pobs < StageData.objects.length; pobs++) {
        if (!StageData.objects[pobs]) { continue; }
        var oldcount = positions.length;
        positions = positions.concat(StageData.objects[pobs].positions);
        for (var pobsi = 0; pobsi < StageData.objects[pobs].children.length; pobsi++) {
            positions = positions.concat(StageData.objects[pobs].children[pobsi].positions);
        }
    } */

    //console.log(positions);
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(Entera.buffers.positions),
        gl.STATIC_DRAW);
    //console.log(Entera.positions.length);

    if (!bufferHolder.textureCoordBuffer) {
        bufferHolder.textureCoordBuffer = gl.createBuffer();
    }
    const textureCoordBuffer = bufferHolder.textureCoordBuffer;
    ////gtextureCoordBuffer = textureCoordBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    var textureCoordinates = []; /*
    for (var tobs = 0; tobs < StageData.objects.length; tobs++) {
        if (!StageData.objects[tobs]) { continue; }
        var oldcount = textureCoordinates.length;
        textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].textureCoordinates);
        for (var tobsi = 0; tobsi < StageData.objects[tobs].children.length; tobsi++) {
            textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].children[tobsi].textureCoordinates);
        }
    } */

    var textBuffer = Entera.buffers.textureCoordinates;
    if (Makarios.UseAlphaInTextureBuffer()) {
        textBuffer = getTextureCoordsWithAlpha(textBuffer, StageData.objects);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textBuffer),
        gl.STATIC_DRAW);


    if (!bufferHolder.indexBuffer) {
        bufferHolder.indexBuffer = gl.createBuffer();
    }
    const indexBuffer = bufferHolder.indexBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    var indices = [];
    var oldcount = 0;
    var startdex = 0;
    /*
    for (var obs = 0; obs < StageData.objects.length; obs++) {
        if (!StageData.objects[obs]) { continue; }
        startdex = indices.length;
        //console.log('olde is ' + oldcount);
        StageData.objects[obs].bufferOffset = startdex * 2;
        indices = indices.concat(StageData.objects[obs].indices);
        for (var cobsi = 0; cobsi < StageData.objects[obs].children.length; cobsi++) {
            StageData.objects[obs].children[cobsi].bufferOffset = indices.length * 2;
            indices = indices.concat(StageData.objects[obs].children[cobsi].indices);
        }
        for (var obsi = startdex; obsi < indices.length; obsi++) {
            indices[obsi] += oldcount / 3;
        }
        for (var oobsi = 0; oobsi < StageData.objects[obs].children.length; oobsi++) {
            oldcount += StageData.objects[obs].children[oobsi].positions.length;
        }
        oldcount += StageData.objects[obs].positions.length;
    } */ //console.log('indz be:'); console.log(indices);


    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint32Array(Entera.buffers.indices), gl.STATIC_DRAW);


    if (!bufferHolder.normalBuffer) {
        bufferHolder.normalBuffer = gl.createBuffer();
    }
    const normalBuffer = bufferHolder.normalBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    //const vertexNormals = ObjData.vertexNormals;
    var vertexNormals = [];
    /*
    for (var vobs = 0; vobs < StageData.objects.length; vobs++) {
        if (!StageData.objects[vobs]) { continue; }
        var oldcount = vertexNormals.length;
        vertexNormals = vertexNormals.concat(StageData.objects[vobs].vertexNormals);
        for (var vobsi = 0; vobsi < StageData.objects[vobs].children.length; vobsi++) {
            vertexNormals = vertexNormals.concat(StageData.objects[vobs].children[vobsi].vertexNormals);
        }
    }*/

    //vertexNormals = vertexNormals.concat(vertexNormals);
    //console.log(Entera.buffers.vertexNormals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Entera.buffers.vertexNormals),
        gl.STATIC_DRAW);


    if (!bufferHolder.useParentMatrixBuffer) {
        bufferHolder.useParentMatrixBuffer = gl.createBuffer();
    }
    const useParentMatrixBuffer = bufferHolder.useParentMatrixBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, useParentMatrixBuffer);

    //const vertexNormals = ObjData.vertexNormals;
    var useParentMatrix = [];
    /*
    for (var pmobs = 0; pmobs < StageData.objects.length; pmobs++) {
        if (!StageData.objects[pmobs]) { continue; }
        var oldcount = useParentMatrix.length;
        useParentMatrix = useParentMatrix.concat(StageData.objects[pmobs].useParentMatrix);
        for (var pmobsi = 0; pmobsi < StageData.objects[pmobs].children.length; pmobsi++) {
            useParentMatrix = useParentMatrix.concat(StageData.objects[pmobs].children[pmobsi].useParentMatrix);
        }
    }*/

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Entera.buffers.useParentMatrix),
        gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
        normal: normalBuffer,
        useParentMatrix: useParentMatrixBuffer,

        positionData: positions,
        normalData: vertexNormals,
        indexData: indices,
        useParentData: useParentMatrix,
    };
}

function getTextureCoordsWithAlpha(source, objects) {
    var dest = source.slice(0);

    for (var oj = 0; oj < objects.length; oj++) {
        if (!objects[oj] || !objects[oj].customprops || objects[oj].customprops.customAlpha == null) { continue; };
        //console.log('text');
        getTextureCoordsWithAlphaRecursive(dest, source, objects[oj]);
    }

    return dest;
}

function getTextureCoordsWithAlphaRecursive(dest, source, currentObj) {
    var psize = (currentObj.positionsBufferStart + currentObj.startContPosIndex + currentObj.textureCoordinates.length) / 3;
    for (var i = (currentObj.positionsBufferStart + currentObj.startContPosIndex) / 3; i < psize; i++) {
        dest[i * 3 + 2] = currentObj.customprops.customAlpha;
    }

    if (currentObj.children && currentObj.children.length) {
        for (var oj = 0; oj < currentObj.children.length; oj++) {
            if (!currentObj.children[oj]) { continue; };
            getTransformedPositionBufferRecursive(dest, source, currentObj.children[oj]);
        }
    }
}


//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {

    if (MakTextures[url]) { return MakTextures[url] };

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

    const image = new Image();
    //image.crossOrigin = "anonymous";
    image.onload = function () {
        //console.log(url);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    //console.log('url');
    //console.log(url);
    image.src = url;

    MakTextures[url] = texture;

    return texture;
}



//can't remember where i got this :(
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}


var blah = 6.0;
var cubeRotation = 0.0;
var rez2 = [0, 0, 0, 0];
var gproj;
var gmod;
var mainLight;
var xrot = [1.0, 0.0, 0.0];
var yrot = [0.0, 1.0, 0.0];
var dir = [0.0, 0.0, -1.0];
var updir = [0.0, 1.0, 0.0];
var camDist;
var maxCamDist = 70.0;
var maxZFar = 160.0;

//Debug specials
var FREEZE = false;
var SLOWDOWN = 1.0;

function drawScene(gl, programInfo, buffers) {  //deltaTime
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = maxZFar;
    var projectionMatrix = gproj;
    if (!projectionMatrix) {
        projectionMatrix = mat4.create();

        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);
    }


    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    var modelViewMatrix = gmod;
    if (!modelViewMatrix) {
        modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        mat4.translate(modelViewMatrix,     // destination matrix
            modelViewMatrix,     // matrix to translate
            [-0.0, 0.0, -22.0]);  // amount to translate
        camDist = 22.0;
        //mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 1.9, [.3, 1, 0]);
    }

    if (StageData.skybox || false) {
        SkyboxRenderer.drawSkybox(dir, xrot, yrot, modelViewMatrix, projectionMatrix);//(projectionMatrix, modelViewMatrix);
        gl.useProgram(programInfo.program);
    }

    const normalMatrix = mat4.create();

    mat4.translate(normalMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, 0.0]);
    mat4.invert(normalMatrix, normalMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    //mat4.invert(normalMatrix, modelViewMatrix);
    //mat4.transpose(normalMatrix, normalMatrix);


    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3;  // pull out 3 values x,y,z, per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);//console.log(buffers.position[0])
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the normals from
    // the normal buffer into the vertexNormal attribute.
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal);
    }

    // tell webgl how to pull out the texture coordinates from buffer
    if (!Entera.buffers.isBuffered)
    {
        const num = 3; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    // tell webgl how to pull out the answer to whether to use parent matrix from buffer
    if (!Entera.buffers.isBuffered)
    {
        const num = 1; // every coordinate composed of 1 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.useParentMatrix);
        gl.vertexAttribPointer(programInfo.attribLocations.useParentMatrix, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.useParentMatrix);

        console.log('rebuffee');
    }

    // Tell WebGL which indices to use to index the vertices
    if (!Entera.buffers.isBuffered) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        Entera.buffers.isBuffered = true;
    }




    if (typeof OutlineRenderer !== 'undefined') {
        OutlineRenderer.drawOutline(modelViewMatrix, projectionMatrix, Entera.buffers.positions, Entera.buffers.vertexNormals, Entera.buffers.indices, Entera.buffers.useParentMatrix, StageData.objects);
        gl.useProgram(programInfo.program); //return;
    }
    if (typeof ShadowShader !== 'undefined') {
        var shadowProjectionMat = StageData.defShadowProjMat || projectionMatrix;
        ShadowShader.drawShadowsToTexture(modelViewMatrix, shadowProjectionMat, Entera.buffers.positions, Entera.buffers.indices, Entera.buffers.useParentMatrix, StageData.objects, StageData.StageLights, Entera.buffers.textureCoordinates);
        gl.useProgram(programInfo.program); //return;
    }


    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);


    // Set the shader uniforms
    ////var fullproj = mat4.create();
    ////mat4.multiply(fullproj, projectionMatrix, modelViewMatrix);//gproj, gmod
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);//projectionMatrix


    //console.log('proj rock be:');
    //console.log(fullproj);

    //gl.uniformMatrix4fv(
    //    programInfo.uniformLocations.normalMatrix,
    //    false,
    //    normalMatrix);

    //if (StageData.objects[2] && !StageData.objects[2].textureImage) {
    //    const texture3 = loadTexture(gl, 'smile1.jpg');//png?
    //    StageData.objects[2].textureImage = texture3;
    //}


    //must be after gl.useProgram for the shader program, otherwise "location not for current program"
    //see https://stackoverflow.com/questions/14413713/webgl-invalid-operation-uniform1i-location-not-for-current-program
    if (!mainLight) {
        mainLight = glMatrix.vec3.create();//[0.85, 0.8, 0.75];//glMatrix.vec3.create();
        mainLight[0] = 0.85; mainLight[1] = 0.8; mainLight[2] = 0.75;
        gl.uniform3fv(
            programInfo.uniformLocations.lightDirection,
            mainLight);
    }


    gl.uniformMatrix4fv(
        programInfo.uniformLocations.parentMatrix,
        false,
        modelViewMatrix);
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(programInfo.uniformLocations.matrixLevel, 0.0);

    //initialized, but really should just be once ever
    gl.uniform1f(programInfo.uniformLocations.ucustomAlpha, 1.0);

    ////singleCallRenderScene(gl, programInfo, StageData.objects, buffers) 
    //gl.uniform1f(programInfo.uniformLocations.urandomSeed1, Math.floor(Math.random() * 1000.0));
    if (!Makarios.IsGPUTrash()) {
        var perfStart = performance.now();
        RenderObjects(gl, programInfo, StageData.objects, modelViewMatrix /*mat4.create()*/ /*modelViewMatrix*/, 0.0, { offsetval: 0, alpha: 1.0 }, mat4.create());
        var performanceResult = performance.now() - perfStart;
        if (performanceResult > 30) {
            performanceStats.consecutiveSlowObjDraws += 1;
            if (performanceStats.consecutiveSlowObjDraws > 50 && Makarios.IsMobileDetected()) {
                Makarios.SetGPULevel(0);
            }
        } else {
            performanceStats.consecutiveSlowObjDraws = 0;
        }
    } else {
        singleCallRenderScene(gl, programInfo, StageData.objects, buffers);
    }

    gproj = projectionMatrix;
    gmod = modelViewMatrix;
}

function RenderObjects(gl, programInfo, objects, parentmatrix, depth, dataHolder, baseMatrixForNorm) {

    var parentDataSet = false;

    for (var oj = 0; oj < objects.length; oj++) {
        if (!objects[oj]) { continue; };
        //const normalMatrix = mat4.create();
        //mat4.invert(normalMatrix, parentmatrix);
        //mat4.transpose(normalMatrix, normalMatrix);
        //if (depth > 0.0) { console.log(' : )'); }

        var mat0 = mat4.create();
        mat4.multiply(mat0,     // destination matrix
            parentmatrix,     // matrix to translate
            objects[oj].matrix);
        //gl.uniformMatrix4fv(
        //    programInfo.uniformLocations.modelViewMatrix,
        //    false,
        //    depth > 0.0 ? mat0 : mat0);

        var thisMatForNorm = mat4.create();
        var nMat = mat4.create();
        var scal = glMatrix.vec3.create();
        mat4.getScaling(scal, objects[oj].matrix); scal[0] = 1.0 / scal[0]; scal[1] = 1.0 / scal[1]; scal[2] = 1.0 / scal[2];
        //scal[0] = 1.0 / Math.min(scal[0], scal[1], scal[2]);
        //scal[1] = 1.0 / Math.min(scal[0], scal[1], scal[2]);
        //scal[2] = 1.0 / Math.min(scal[0], scal[1], scal[2]);
        mat4.scale(nMat, objects[oj].matrix, scal);

        mat4.multiply(thisMatForNorm,     // destination matrix
            baseMatrixForNorm,     // matrix to translate
            nMat);
        //var scal = glMatrix.vec3.create();
        //mat4.getScaling(scal, thisMatForNorm); scal[0] = 1.0 / scal[0]; scal[1] = 1.0 / scal[1]; scal[2] = 1.0 / scal[2];
        //mat4.scale(thisMatForNorm, thisMatForNorm, scal);

        mat4.invert(nMat, thisMatForNorm);
        mat4.transpose(nMat, nMat);
        //gl.uniformMatrix4fv(
        //    programInfo.uniformLocations.normalMatrix,
        //    false,
        //    nMat);

        //modelViewMatrix
        //gl.uniformMatrix4fv(
        //    programInfo.uniformLocations.normalMatrix,
        //    false,
        //    normalMatrix);
        //gl.uniformMatrix4fv(
        //    programInfo.uniformLocations.parentMatrix,
        //    false,
        //    parentmatrix);

        //// Tell WebGL we want to affect texture unit 0
        //gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        if (!objects[oj].textureImage && objects[oj].textureUrl) {
            //console.log(objects[oj]);
            objects[oj].textureImage = loadTexture(gl, objects[oj].textureUrl);
        }
        gl.bindTexture(gl.TEXTURE_2D, objects[oj].textureImage);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        var alphaToUse = objects[oj].customprops.customAlpha || 1.0;
        if (alphaToUse != dataHolder.alpha) {
            if (alphaToUse != 1.0) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            } else {
                gl.disable(gl.BLEND);
            }
            gl.uniform1f(programInfo.uniformLocations.ucustomAlpha, alphaToUse);
        }

        //gl.uniform1f(programInfo.uniformLocations.matrixLevel, depth);
        if (objects[oj].indices.length > 0)
        {
            //if (!parentDataSet) {
            //    parentDataSet = true;
            //    gl.uniformMatrix4fv(
            //        programInfo.uniformLocations.parentMatrix,
            //        false,
            //        parentmatrix);
            //    //console.log(objects[oj].children[0]);
            //    gl.uniform1f(programInfo.uniformLocations.matrixLevel, depth);
            //}

            gl.uniformMatrix4fv(
                programInfo.uniformLocations.modelViewMatrix,
                false,
                depth > 0.0 ? mat0 : mat0);
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.normalMatrix,
                false,
                nMat);

            //console.log(ext);
            const vertexCount = objects[oj].indices.length;//36;
            const type = gl.UNSIGNED_INT;//gl.UNSIGNED_INT; //gl.UNSIGNED_SHORT;//gl.UNSIGNED_INT;
            const offset = objects[oj].indexOffset;////objects[oj].bufferOffset; //offsetHolder.val;//objects[oj].bufferOffset; //console.log('offset is:' + objects[oj].bufferOffset)
            dataHolder.offsetval += objects[oj].indices.length * 4;//2;
            //console.log(offset);
            //console.log(objects[oj]);
            //if (StageData.ticks % 50 == 0) { console.log('offset is:' + objects[oj].bufferOffset); }
            //console.log(offset * 2);
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset * 2);
            //gl.drawElements(gl.LINES, vertexCount, type, offset);
        }

        if (objects[oj].children && objects[oj].children.length > 0) {
            //gl.uniformMatrix4fv(
            //    programInfo.uniformLocations.parentMatrix,
            //    false,
            //    mat0);
            ////console.log(objects[oj].children[0]);
            //gl.uniform1f(programInfo.uniformLocations.matrixLevel, depth + 1.0);
            RenderObjects(gl, programInfo, objects[oj].children, mat0, depth + 1.0, dataHolder, thisMatForNorm);
            //gl.uniform1f(programInfo.uniformLocations.matrixLevel, depth);
            //gl.uniformMatrix4fv(
            //    programInfo.uniformLocations.parentMatrix,
            //    false,
            //    parentmatrix);
        }
    }
}

function singleCallRenderScene(gl, programInfo, objects, buffers) {
    var transformedPositions = getTransformedPositionBuffer(Entera.buffers.positions, objects);
    if (buffers.position == null) {
        buffers.position = gl.createBuffer();
    }
    //console.log(Entera.buffers.positions)
    //console.log(transformedPositions)
    //otherpositionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    //console.log(transformedPositions);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(transformedPositions),
        gl.STATIC_DRAW);
    {
        const numComponents = 3;  // pull out 3 values x,y,z, per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);//console.log(buffers.position[0])
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }
    var mat0 = mat4.create();
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        mat0);
    var thisMatForNorm = mat4.create();
    var nMat = mat4.create();
    mat4.invert(nMat, thisMatForNorm);
    mat4.transpose(nMat, nMat);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        nMat);
    //if (!objects && objects.length > 1) {
    //    if (!objects[0].textureImage) {
    //        objects[0].textureImage = loadTexture(gl, "plainsky.jpg");
    //    }
    //    gl.bindTexture(gl.TEXTURE_2D, objects[0].textureImage);
    //}
    var textureImagey = loadTexture(gl, "plainsky.jpg");
    gl.bindTexture(gl.TEXTURE_2D, textureImagey);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
    {
        //const vertexCount = objects[oj].indices.length;//36;
        const type = gl.UNSIGNED_INT;//gl.UNSIGNED_SHORT;
        //const offset = objects[oj].indexOffset;////objects[oj].bufferOffset; //offsetHolder.val;//objects[oj].bufferOffset; //console.log('offset is:' + objects[oj].bufferOffset)
        //dataHolder.offsetval += objects[oj].indices.length * 2;
        //console.log(offset);
        //console.log(objects[oj]);
        //if (StageData.ticks % 50 == 0) { console.log('offset is:' + objects[oj].bufferOffset); }
        gl.drawElements(gl.TRIANGLES, Entera.buffers.indices.length, type, 0);
        //gl.drawElements(gl.LINES, vertexCount, type, offset);
    }
}

function getTransformedPositionBuffer(source, objects) {
    var dest = source.slice(0);

    for (var oj = 0; oj < objects.length; oj++) {
        if (!objects[oj]) { continue; };
        getTransformedPositionBufferRecursive(dest, source, objects[oj]);
    }

    return dest;
}

function getTransformedPositionBufferRecursive(dest, source, currentObj) {
    linTransformRange(dest, source, currentObj.matrix, currentObj.positionsBufferStart + currentObj.startContPosIndex, currentObj.positionsBufferStart + currentObj.startContPosIndex + currentObj.positions.length, currentObj)

    if (currentObj.children && currentObj.children.length) {
        for (var oj = 0; oj < currentObj.children.length; oj++) {
            if (!currentObj.children[oj]) { continue; };
            getTransformedPositionBufferRecursive(dest, source, currentObj.children[oj]);
        }
    }
}



//shoutout credit to https://stackoverflow.com/questions/13870677/resize-viewport-canvas-according-to-browser-window-size for this!
function resizeCanvas() {
    const canvas = document.querySelector('#glCanvas');
    const ui = document.querySelector('#uiCanvas');//uiCanvas
    ui.style.backgroundColor = 'initial';

    //4:3 ratio
    //basewidth: 640 4
    //baseheight: 480 3
    var weightedWidth = Math.min(window.innerWidth * 0.7, 0.9 * window.innerHeight * 4.0 / 3.0);
    var weightedHeight = Math.min(window.innerHeight * 0.9, 0.7 * window.innerWidth * 3.0 / 4.0);

    //var width = canvas.clientWidth;
    //var height = canvas.clientHeight;
    if (canvas.width != weightedWidth ||
        canvas.height != weightedHeight || true) {
        console.log('sizer up!');
        canvas.width = weightedWidth;//width;
        canvas.height = weightedHeight;// height;
        // in this case just render when the window is resized.
        //render();

        halfheight = weightedHeight / 2;
        halfwidth = weightedWidth / 2;

        //console.log(halfwidth + ', ' + halfheight);
    }
    if (ui.width != weightedWidth ||
        ui.height != weightedHeight || true) {
        ui.width = weightedWidth;//width;
        ui.height = weightedHeight;//height;
        if (uiState.hasany) {
            Makarios.rewriteToUI();
        }
    }

}

window.addEventListener('resize', resizeCanvas);

function addCustomProgramLocations(gl) {
    if (theGame && (theGame.customAttributes != null || theGame.customUniforms != null)) {
        if (theGame.customAttributes != null && theGame.customAttributes.length > 0) {
            for (var a = 0; a < theGame.customAttributes.length; a++) {

            }
        }

        if (theGame.customUniforms != null && theGame.customUniforms.length > 0) {
            for (var u = 0; u < theGame.customUniforms.length; u++) {
                if (theGame.customUniforms[u] && theGame.customUniforms[u].frameset) {
                    theGame.customUniforms[u].frameset(theGame.customUniforms[u], gl);
                }
            }
        }
    }
}




function main() {
    const canvas = document.querySelector('#glCanvas');
    const ui = document.querySelector('#uiCanvas');//uiCanvas

    const gl = canvas.getContext("webgl");
    const gui = ui.getContext('2d'); console.log('gui is as ' + gui);

    if (gl === null) {
        alert('DERE NO GEE ELL! YA BROWZER NEEDZ SUM SAHPPORT!!');
        return;
    }
    //thank you q9f and ratchet freak https://computergraphics.stackexchange.com/questions/3637/how-to-use-32-bit-integers-for-element-indices-in-webgl-1-0
    var ext = gl.getExtension('OES_element_index_uint');
    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    var vsSourceTrue = vsSource;
    if (typeof vsOverride != 'undefined') {
        vsSourceTrue = vsOverride;
    }

    var fsSourceTrue = fsSource;
    if (typeof fsOverride != 'undefined') {
        fsSourceTrue = fsOverride;
    }

    const mainShaderProgram = initShaderProgram(gl, vsSourceTrue, fsSourceTrue);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    const programInfo = {
        program: mainShaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(mainShaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(mainShaderProgram, 'aTextureCoord'),
            vertexNormal: gl.getAttribLocation(mainShaderProgram, 'aVertexNormal'),
            useParentMatrix: gl.getAttribLocation(mainShaderProgram, 'aUseParentMatrix'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(mainShaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(mainShaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(mainShaderProgram, 'uSampler'),
            //urandomSeed1: gl.getUniformLocation(mainShaderProgram, 'urandomSeed1'),
            ucustomAlpha: gl.getUniformLocation(mainShaderProgram, 'ucustomAlpha'),
            ucelStep: gl.getUniformLocation(mainShaderProgram, 'ucelStep'),
            normalMatrix: gl.getUniformLocation(mainShaderProgram, 'uNormalMatrix'),
            parentMatrix: gl.getUniformLocation(mainShaderProgram, 'uParentMatrix'),
            matrixLevel: gl.getUniformLocation(mainShaderProgram, 'uMatrixLevel'),
            lightDirection: gl.getUniformLocation(mainShaderProgram, 'uLightDirection'),
        },
    };
    addCustomProgramLocations();
    globalMainProgramInfo = programInfo;
    const buffers = initBuffers(gl);
    resizeCanvas();

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    var textures = [];

    console.log('startergo');
    theGame.Init();

    // Load texture
    //const texture = loadTexture(gl, 'grumpycss.jpg');//png?
    //const texture2 = loadTexture(gl, 'meeseeks can do.jpg');//png?
    //const texture3 = loadTexture(gl, 'smile1.jpg');//png?
    //textures = [texture, texture2];

    //StageData.objects[0].textureImage = texture;
    //StageData.objects[1].textureImage = texture2;
    ////ObjData.objects[0].children[0].textureImage = texture;
    ////ObjData.objects[2].textureImage = texture3;

    // Draw the scene
    ////drawScene(gl, programInfo, buffers);
    var then = 0;

    //gui.clearRect(0, 0, ui.width, ui.height);
    //gui.fillStyle = 'green';
    //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);
    //gui.font = 'bold small-caps 24px serif';
    //gui.textBaseline = 'hanging';
    //gui.fillText('Slayer', 540, 10);

    //var renderdummy = function() {
    //    requestAnimationFrame(renderdummy);
    //};
    // Draw the scene repeatedly
    function render(now) {
        //now *= 0.00004;  // convert to seconds
        //const deltaTime = now - then;
        //then = now;

        //credit to gman at https://stackoverflow.com/questions/13870677/resize-viewport-canvas-according-to-browser-window-size
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        var buffers = initBuffers(gl);

        //globalMainProgramInfo = programInfo;
        addCustomProgramLocations(gl);
        drawScene(gl, programInfo, buffers);//deltaTime

        requestAnimationFrame(render);
        //credit thank you https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        //gui.clearRect(0, 0, ui.width, ui.height);
        //gui.fillStyle = 'green';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);
        //gui.font = 'bold small-caps 24px serif';
        //gui.textBaseline = 'hanging';
        //gui.fillText('Slayer', 540, 10);

        //position: positionBuffer,
        //textureCoord: textureCoordBuffer,
        //indices: indexBuffer,
        //normal: normalBuffer,
        //useParentMatrix: useParentMatrixBuffer,

        //gl.deleteBuffer(buffers.position);
        //gl.deleteBuffer(buffers.textureCoord);
        //gl.deleteBuffer(buffers.indices);
        //gl.deleteBuffer(buffers.normal);
        ////gl.bindBuffer(gl.ARRAY_BUFFER, null);
        ////gl.bindBuffer(gl.ARRAY_BUFFER, buffers.useParentMatrix);
        //gl.deleteBuffer(buffers.useParentMatrix);
        ////gl.bindBuffer(gl.ARRAY_BUFFER, null);

        buffers.positions = null;
        buffers.normalData = vertexNormals = null;
        buffers.indexData = indices = null;
        buffers.useParentData = useParentMatrix = null;

        buffers = null;
    }
    requestAnimationFrame(render);

    //Important! We used to use FrameLogic within perframelogicm1.js
    ////setInterval(FrameLogic.onFrame, 15);
    //now we use theGame
    var lastFrameTime = Date.now();
    setInterval(function () {
        StageData.ticks += 1;

        var oldTime = lastFrameTime;
        lastFrameTime = Date.now();
        StageData.timeDelta = lastFrameTime - oldTime;
        if (StageData.timeDelta > 500) {
            StageData.timeDelta = 500;
        }
        StageData.vticks += StageData.timeDelta;

        theGame.OnFrame();
        //console.log('click');
        for (var c = 0; c < StageData.objects.length; c++) {
            processObjectOnFrame(StageData.objects[c]);
            //if (StageData.objects[c]) {
            //    if (StageData.objects[c].ObjectOnFrame) {
            //        StageData.objects[c].ObjectOnFrame(StageData.objects[c]);
            //    }
            //    UpdateObjAnimation(StageData.objects[c]);
            //    if (StageData.objects[c] && StageData.objects[c].children) {
            //        for (var i = 0; i < StageData.objects[c].children.length; i++) {
            //            if (!StageData.objects[c].children[i]) { continue; }
            //            if (StageData.objects[c].children[i].ObjectOnFrame) {
            //                StageData.objects[c].children[i].ObjectOnFrame(StageData.objects[c].children[i]);
            //            }
            //            UpdateObjAnimation(StageData.objects[c].children[i]);
            //        }
            //    }
            //}
        }
        //console.log(StageData.objects.length);
        var k = 0;
        for (k = 0; k < StageData.objects.length; k++) {
            if (!StageData.objects[k]) { continue; }
            processSkeletalAnimationsComplete(StageData.objects[k]);
        }
        for (k = 0; k < StageData.objects.length; k++) {
            if (!StageData.objects[k]) { continue; }
            resetSkeletalAnimationsComplete(StageData.objects[k]);
        }

    }, 14);

}

window.onload = main;

var mouseisdown = false;
var isdragging = false;
var dragstartpoint = { x: 0, y: 0 };
var lastmousedownpoint = { x: 0, y: 0 };

//thank you https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API for teaching me how to do this
//and https://stackoverflow.com/questions/6837198/handling-camera-style-mouse-movement-in-javascript-enabling-continuous-mouse-mo#:~:text=The%20issue%3A%20in%20Javascript%2C%20the%20only%20way%20to,mousepad%20in%20any%20direction%20and%20it%20always%20works.
//and https://stackoverflow.com/questions/36903442/js-pointer-lock
// for pointing me the way
var usePointerLock = 1;

function processObjectOnFrame(obj) {
    if (obj) {
        if (obj.ObjectOnFrame) {
            obj.ObjectOnFrame(obj);
        }
        UpdateObjAnimation(obj);
        if (obj.children) {
            for (var i = 0; i < obj.children.length; i++) {
                processObjectOnFrame(obj.children[i]);
                //if (!obj.children[i]) { continue; }
                //if (obj.children[i].ObjectOnFrame) {
                //    obj.children[i].ObjectOnFrame(obj.children[i]);
                //}
                //UpdateObjAnimation(obj.children[i]);
            }
        }
    }
}

function processSkeletalAnimationsComplete(obj) {
    if (obj.skeletonkey) {
        processSkeletalAnimation_Holder(obj, obj.skeletonkey);
    }
    for (var i = 0; i < obj.children.length; i++) {        
        //console.log('lfs');
        processSkeletalAnimationsComplete(obj.children[i]);
    }
}

function processSkeletalAnimation_Holder(obj, thekey) {
    //console.log(obj.prim.skeletonkey.rootskellynodeindexes);
    for (var i = 0; i < obj.prim.skeletonkey.rootskellynodeindexes.length; i++) {
        //console.log(obj.prim.skeletonkey.rootskellynodeindexes[i]);
        //console.log(obj.prim.skeletonkey.skellynodes[0]);
        ////console.log(obj.skeletonkey.skellynodes[obj.prim.skeletonkey.rootskellynodeindexes[i]].glindex + ' isroot');
        setupSkeletalAnimationMatrix(obj, obj.skeletonkey.skellynodes[obj.prim.skeletonkey.rootskellynodeindexes[i]].nodeobj, thekey, mat4.create(), mat4.create());
    }
    applySkeletalMatrixTransforms(obj, thekey)
}

function setupSkeletalAnimationMatrix(rootobj, obj, thekey, invmat, poschain) {// transmat) {
    //is this right at all?? todo george

    //strategy 4. here we go and good luck!
    var newcomp = mat4.clone(poschain);

    obj.skellmatrix = mat4.create();

    if (obj.applyanimtran) {
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.mattran);
        mat4.multiply(newcomp, newcomp, obj.mattran);
    } else if (obj.prim.primmattran) {
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.prim.primmattran);
        mat4.multiply(newcomp, newcomp, obj.prim.primmattran);
    }
    if (obj.applyanimrot) {
        //console.log(obj.currentAnimation);
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.matrot);
        mat4.multiply(newcomp, newcomp, obj.matrot);
    } else if (obj.prim.primmatrot) {
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.prim.primmatrot);
        mat4.multiply(newcomp, newcomp, obj.prim.primmatrot);
    }
    if (obj.applyanimscale) {
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.matscale);
        mat4.multiply(newcomp, newcomp, obj.matscale);
    } else if (obj.prim.primmatscale) {
        mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.prim.primmatscale);
        mat4.multiply(newcomp, newcomp, obj.prim.primmatscale);
    }
    mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.prim.inverseBaseMat);
    mat4.multiply(obj.skellmatrix, poschain, obj.skellmatrix);


    //old way abridged
    //mat4.multiply(obj.skellmatrix, obj.skellmatrix, obj.prim.inverseBaseMat);// transmat);
    //mat4.multiply(obj.skellmatrix, obj.skellmatrix, transmat);
    //var invinv = mat4.create();
    //mat4.invert(invinv, obj.prim.inverseBaseMat);
    //mat4.multiply(obj.skellmatrix, invinv, obj.skellmatrix);

    for (var i = 0; i < obj.children.length; i++) {
        setupSkeletalAnimationMatrix(rootobj, obj.children[i], thekey, obj.prim.inverseBaseMat, newcomp);
    }
}

function applySkeletalMatrixTransforms(obj, thekey) {
    //console.log(obj.startContPosIndex);
    //console.log(obj.positionsBufferStart);
    //for (var pp = 0; pp < obj.prim.positions.length; pp++) {
    //    Entera.buffers.positions[obj.positionsBufferStart + pp] = obj.prim.positions[pp];
    //}
    //linTransformRangeWithOffsetsForSkeletonMat3(Entera.buffers.positions, Entera.buffers.positions, obj.startContPosIndex, obj.startContPosIndex + obj.positions.length, obj.positionsBufferStart,
    //    obj.skeletonkey, obj.prim.skellyjoints, obj.prim.skellyweights);
    //console.log(obj.positionsBufferStart);
    linTransformRangeWithOffsetsForSkeletonMat3(Entera.buffers.positions, Entera.buffers.positions, obj.startContPosIndex + obj.positionsBufferStart, obj.startContPosIndex + obj.positionsBufferStart + obj.positions.length, obj.startContPosIndex + obj.positionsBufferStart,
        obj.skeletonkey, obj.prim.skellyjoints, obj.prim.skellyweights);
}


function resetSkeletalAnimationsComplete(obj) {
    if (obj.skeletonkey) {
        resetSkeletalAnimation_Holder(obj, obj.skeletonkey);
    }
    for (var i = 0; i < obj.children.length; i++) {
        resetSkeletalAnimationsComplete(obj.children[i]);
    }
}

function resetSkeletalAnimation_Holder(obj, thekey) {
    for (var i = 0; i < obj.prim.skeletonkey.rootskellynodeindexes.length; i++) {
        resetSkeletalAnimationItems(obj, obj.skeletonkey.skellynodes[obj.prim.skeletonkey.rootskellynodeindexes[i]].nodeobj, thekey);
    }
}

function resetSkeletalAnimationItems(rootobj, obj, thekey) {

    obj.applyanimscale = 0;
    obj.applyanimrot = 0;
    obj.applyanimtran = 0;
    for (var i = 0; i < obj.children.length; i++) {
        resetSkeletalAnimationItems(rootobj, obj.children[i], thekey);
    }
}

function onJustMouseDown(e) {
    if (usePointerLock == 1) {
        const canvas = document.querySelector('#glCanvas');
        canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock;

        canvas.requestPointerLock();
    }
    mouseisdown = true;
    dragstartpoint = { x: e.clientX, y: e.clientY };
    lastmousedownpoint = { x: e.clientX, y: e.clientY };
}

function onJustMouseUp(e) {
    if (usePointerLock == 1) {
        document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock;
        // Attempt to unlock
        document.exitPointerLock();
    }
    mouseisdown = false;
}


var currentTouch = null;
//and thank you https://stackoverflow.com/questions/12485085/prevent-scrolling-on-mobile-browser-without-preventing-input-focusing
//for reminding me to follow documentation and use preventDefault()
function onJustTouchDown(e) {
    e.preventDefault();
    mouseisdown = true;
    currentTouch = e.changedTouches[0];

    dragstartpoint = { x: currentTouch.pageX, y: currentTouch.pageY };
    lastmousedownpoint = { x: currentTouch.pageX, y: currentTouch.pageY };
}

function onJustTouchUp(e) {
    currentTouch = null;
    mouseisdown = false;
}



window.addEventListener("keydown", function (e) {
    FrameLogic.keystates[e.keyCode] = true;
})
window.addEventListener("keyup", function (e) {
    if (typeof FrameLogic == 'undefined') { return; }
    FrameLogic.keystates[e.keyCode] = false;
    if (e.keyCode == 32) {
        FrameLogic.spaceWasDown.value = false;
        console.log('uppnathim');
    }
})


function onCamChange() {
    if (typeof ShadowShader !== 'undefined' && gproj && StageData.defShadowProjMat) {
        var transformedPlane = [
            // Top face
            -1.0, 0.0, -1.0,
            -1.0, 0.0, 1.0,
            1.0, 0.0, 1.0,
            1.0, 0.0, -1.0,
        ];
        var gProjMod = mat4.create();
        mat4.multiply(gProjMod, gproj, gmod);
        linTransformRange(transformedPlane, Primitives.shapes["plane"].positions, gProjMod, 0, 12, null);
        //console.log(transformedPlane);
        var tp = transformedPlane;
        var maxProjectedDist = 0.005;
        for (var i = 0; i < 9; i += 3) {
            var dsquared = (tp[i + 0] - tp[i + 3]) * (tp[i + 0] - tp[i + 3]) +
                (tp[i + 1] - tp[i + 4]) * (tp[i + 1] - tp[i + 4]) +
                (tp[i + 2] - tp[i + 5]) * (tp[i + 2] - tp[i + 5]);
            var d = Math.sqrt(dsquared);
            if (d > maxProjectedDist) {
                maxProjectedDist = d;
            }
        }
        var scaling = 8.0 / maxProjectedDist;
        ShadowShader.setProjScaler(scaling);//44.0;// scaling;
        console.log(scaling);
        mat4.ortho(StageData.defShadowProjMat,
            -scaling, scaling, -scaling / 2.0, scaling / 2.0, 0.1, maxZFar + 1000);//maxZFar


        var shadowBoundMat = mat4.create();
        mat4.fromScaling(shadowBoundMat, [54.0, 54.0, 8.0]);
        StageData.shadowBoundBox = new Array(Primitives.shapes["cube"].positions.length);
        linTransformRange(StageData.shadowBoundBox, Primitives.shapes["cube"].positions, shadowBoundMat, 0, Primitives.shapes["cube"].positions.length, null);
        linTransformRange(StageData.shadowBoundBox, StageData.shadowBoundBox, gProjMod, 0, Primitives.shapes["cube"].positions.length, null);

        var maxShadowBound = -100.0;
        var minShadowBound = 100.0;
        var sb = StageData.shadowBoundBox;
        for (var i = 2; i < StageData.shadowBoundBox.length; i += 3) {
            var zd = sb[i];
            if (zd > maxShadowBound) {
                maxShadowBound = zd;
            }
            if (zd < minShadowBound) {
                minShadowBound = zd;
            }
        }
        //console.log(minShadowBound + ' to ' + maxShadowBound);
        //if (minShadowBound < 0.8) {
        //    console.log(StageData.shadowBoundBox);
        //}
    }
}



function recursiveCheckAllObjectsIfScreenPointHits(object, parent, itsfullmatrix, inheritedcoords, hitstuff, testpoint, inheritedTextCoordsList, rootobjindex) {

    var tricount = object.indices.length / 3;

    var parentcoords = parent && parent.positions ? parent.positions : [];
    var properCoords = [];

    properCoords = getAllScreenCoords(itsfullmatrix, object.positions);
    var screencoords = inheritedcoords.concat(properCoords);

    var beenhit = false;
    var myhittris = [];
    for (var c = 0; c < tricount; c++) {
        //if ((StageData.vticks % 180) == 0)
        //console.log(testpoint.x + ', ' + testpoint.y + '  >  [{' + screencoords[object.indices[c * 3 + 0] * 3 + 0] + ',' + screencoords[object.indices[c * 3 + 0] * 3 + 1] + '}, ' +
        //    screencoords[object.indices[c * 3 + 1] * 3 + 0] + ',' + screencoords[object.indices[c * 3 + 1] * 3 + 1] + '},' +
        //    screencoords[object.indices[c * 3 + 2] * 3 + 0] + ',' + screencoords[object.indices[c * 3 + 2] * 3 + 1] + '}]');

        var rez = IsPointInTriangleIncludeZ(testpoint, {
            a: { x: screencoords[object.indices[c * 3 + 0] * 3 + 0], y: screencoords[object.indices[c * 3 + 0] * 3 + 1], z: screencoords[object.indices[c * 3 + 0] * 3 + 2] },
            b: { x: screencoords[object.indices[c * 3 + 1] * 3 + 0], y: screencoords[object.indices[c * 3 + 1] * 3 + 1], z: screencoords[object.indices[c * 3 + 1] * 3 + 2] },
            c: { x: screencoords[object.indices[c * 3 + 2] * 3 + 0], y: screencoords[object.indices[c * 3 + 2] * 3 + 1], z: screencoords[object.indices[c * 3 + 2] * 3 + 2] },
        })
        if (rez.didHit) {
            hitstuff.tris.push({ triid: c, z: rez.hitz });
            myhittris.push({ triid: c, z: rez.hitz });


            //console.log('hit: ' + object.id.toString() + ' at ' + rez.hitz.toString() + ' ' + c.toString())
            //console.log({
            //    a: { x: screencoords[object.indices[c * 3 + 0] * 3 + 0], y: screencoords[object.indices[c * 3 + 0] * 3 + 1] },
            //    b: { x: screencoords[object.indices[c * 3 + 1] * 3 + 0], y: screencoords[object.indices[c * 3 + 1] * 3 + 1] },
            //    c: { x: screencoords[object.indices[c * 3 + 2] * 3 + 0], y: screencoords[object.indices[c * 3 + 2] * 3 + 1] },
            //});
            if (!beenhit && rootobjindex != null) {
                //console.log(rootobjindex);
                hitstuff.objects.push(rootobjindex);//object.id);
                beenhit = true;
            }
        }


    }

    if (beenhit) {
        //get closest one in clip space aka normalized device coordinates ndc
        var lowestztri = { triid: 0, z: 9999.0 };
        for (var zt = 0; zt < myhittris.length; zt++) {
            if (lowestztri.z > myhittris[zt].z) {//&& myhittris[zt].triid < object.indices.length / 3
                lowestztri = myhittris[zt];
            }
        }

        //var lowest
        if (lowestztri.z != 9999.0 && object.indices[lowestztri.triid * 3] >= (parentcoords.length / 3.0)) {
            if (inheritedTextCoordsList.length > 0) {
                var indexToUse = (object.indices[lowestztri.triid * 3 + 0]) * 2;
                var coordsCount = 0;
                for (var it = 0; it < inheritedTextCoordsList.length; it++) {
                    if ((indexToUse - coordsCount) % 3 == 2) { continue; }//added for vec3 textcoords with alpha
                    if (coordsCount + inheritedTextCoordsList[it].length <= indexToUse) {
                        coordsCount += inheritedTextCoordsList[it].length;
                    } else {
                        inheritedTextCoordsList[it][indexToUse - coordsCount] = inheritedTextCoordsList[it][indexToUse - coordsCount] == 1.0 ? 0.0 : 1.0;
                        it = inheritedTextCoordsList.length - 1;
                    }
                }
            } else {
                object.textureCoordinates[(object.indices[lowestztri.triid * 3 + 0]) * 2] = object.textureCoordinates[(object.indices[lowestztri.triid * 3 + 0]) * 2] == 1.0 ? 0.0 : 1.0;
            }

            //don't need to rebind anymore, because we do this all the time yeah?
            ////console.log('flippeditfor ' + lowestztri.triid + 'z: ' + lowestztri.z);
            ////console.log('moreinfo: ' + (lowestztri.triid * 3 + 0) + 'z: ' + ((object.indices[lowestztri.triid * 3 + 0]) * 2));
            ////console.log(object.vertexNormals[(object.indices[lowestztri.triid * 3 + 0]) * 3 + 0] + ", " + object.vertexNormals[(object.indices[lowestztri.triid * 3 + 0]) * 3 + 1] + ", " + object.vertexNormals[(object.indices[lowestztri.triid * 3 + 0]) * 3 + 2]);
            var lpoint = [0.0, 0.0, 0.0];
            var lightLocMat = mat4.create();
            mat4.invert(lightLocMat, StageData.StageLights[0].lightmat);
            linTransformRange(lpoint, lpoint, lightLocMat, 0, 3, null);
            ////console.log(lpoint);
        }
    }

    if (object.children) {
        for (var kid = 0; kid < object.children.length; kid++) {
            var kidmatrix = mat4.create();
            mat4.multiply(kidmatrix, itsfullmatrix, object.children[kid].matrix);
            //hmmm need something for chain of parents to support changing their textures?
            var nextInheritedTextCoords = inheritedTextCoordsList.slice(0);
            nextInheritedTextCoords.push(object.textureCoordinates);
            recursiveCheckAllObjectsIfScreenPointHits(object.children[kid], object, kidmatrix, properCoords, hitstuff, testpoint, nextInheritedTextCoords, rootobjindex)
        }
    }

}

var pitch = 0.0;
var yaw = 0.0;

function onDrag(e) {

    //the good code
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
            var vmat = mat4.create();
            // Now move the drawing position a bit to where we want to
            // start drawing the square.
            mat4.translate(vmat,     // destination matrix
                vmat,     // matrix to translate
                [-0.0, 0.0, -camDist]); //negative camdist
            //mat4.rotate(gmod, gmod, (e.clientY - lastmousedownpoint.y) * 0.001, [gmod[0], gmod[4], gmod[8]]);
            yaw += xdel;
            pitch += ydel
            mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);
            mat4.rotate(gmod, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);

            //mat4.rotate(gmod, gmod, (e.clientY - lastmousedownpoint.y) * 0.001, [gmod[0], gmod[4], gmod[8]]);
        }
    }
}


function onTouchDrag(e) {
    //types
    //0: free
    //1: look
    var camType = 1;
    if (mouseisdown) {
        var xdel;
        var ydel;
        var latestTouch = e.changedTouches[0];

        xdel = (latestTouch.pageX - lastmousedownpoint.x) * 0.001;
        ydel = (latestTouch.pageY - lastmousedownpoint.y) * 0.001;
        lastmousedownpoint = { x: latestTouch.pageX, y: latestTouch.pageY };
        //console.log(currentTouch);

        if (camType == 0) {
            mat4.rotate(gmod, gmod, (xdel), [gmod[1], gmod[5], gmod[9]]);
            mat4.rotate(gmod, gmod, (ydel), [gmod[0], gmod[4], gmod[8]]);
        } else if (camType == 1) {
            var vmat = mat4.create();
            // Now move the drawing position a bit to where we want to
            // start drawing the square.
            mat4.translate(vmat,     // destination matrix
                vmat,     // matrix to translate
                [-0.0, 0.0, -22.0]);
            yaw += xdel;
            pitch += ydel
            mat4.rotate(vmat, vmat, yaw, [vmat[1], vmat[5], vmat[9]]);
            mat4.rotate(gmod, vmat, pitch, [vmat[0], vmat[4], vmat[8]]);
        }
    }
}

var defaultInputsInitiated = false;
function InitDefaultInputActions() {
    if (defaultInputsInitiated) { return; }
    //if (!overrideDefaultInputActions) {
        onmousemove = onDrag;
        document.querySelector('#uiCanvas').addEventListener("touchmove", onTouchDrag, false);


        //preemptive thanks to https://stackoverflow.com/questions/43714880/do-dom-events-work-with-pointer-lock
        //for the firefox workaround and the rightclick issue
        //will have to implement
        //also thanks https://stackoverflow.com/questions/43928704/mouse-down-event-not-working-on-canvas-control-in-my-wpf-application for the hint
        //regarding which elemet to add the listener
        document.querySelector('#uiCanvas').addEventListener("mousedown", onJustMouseDown);
        window.addEventListener("mouseup", onJustMouseUp);
        //thank you https://developer.mozilla.org/en-US/docs/Web/API/Touch_events for showing me this
        document.querySelector('#uiCanvas').addEventListener("touchstart", onJustTouchDown, false);
        document.querySelector('#uiCanvas').addEventListener("touchend", onJustTouchUp, false);
        document.querySelector('#uiCanvas').addEventListener("touchcancel", onJustTouchUp, false);

        window.addEventListener("wheel", function (event) {

            if (StageData.noScroll) { return; }

            var scrollDiff = event.deltaY * 0.01;

            var oldDist = camDist;
            camDist += scrollDiff;

            if (camDist < 2.0) {
                camDist = 2.0;
            } else if (camDist > maxCamDist) {
                camDist = maxCamDist;
            }

            var distDel = camDist - oldDist;
            if (distDel == 0.0) {
                return;
            }

            gmod[14] -= distDel;
            onCamChange();
        });


        window.addEventListener("click", function (e) {

            var matrices = [];
            var basematrix = mat4.create();
            mat4.multiply(basematrix, gproj, gmod);
            matrices.push(basematrix);

            var hittris = [];
            var hitstuff = {};
            hitstuff.tris = [];
            hitstuff.objects = [];
            var objcount = StageData.objects.length;

            for (var objindex = 0; objindex < objcount; objindex++) {
                if (!StageData.objects[objindex]) { continue; }
                var objmatrix = mat4.create();
                mat4.multiply(objmatrix, basematrix, StageData.objects[objindex].matrix);

                recursiveCheckAllObjectsIfScreenPointHits(StageData.objects[objindex], null, objmatrix, [], hitstuff, { x: e.clientX, y: e.clientY }, [], objindex);
            }
        });
    //}
}


function getAllScreenCoords(mat, vec3sarray) {
    var psize = vec3sarray.length / 3;
    var transformedArray = new Array(vec3sarray.length);
    var rect = document.querySelector('#glCanvas').getBoundingClientRect();

    for (var i = 0; i < psize; i++) {
        var vstart = i * 3;
        var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * mat[4] + vec3sarray[vstart + 2] * mat[8] + 1.0 * mat[12],
        vec3sarray[vstart] * mat[1] + vec3sarray[vstart + 1] * mat[5] + vec3sarray[vstart + 2] * mat[9] + 1.0 * mat[13],
        vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * mat[6] + vec3sarray[vstart + 2] * mat[10] + 1.0 * mat[14],
        vec3sarray[vstart] * mat[3] + vec3sarray[vstart + 1] * mat[7] + vec3sarray[vstart + 2] * mat[11] + 1.0 * mat[15]];
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        transformedArray[i * 3] = halfwidth + halfwidth * (rez[0] / rez[3]) + rect.left;
        transformedArray[i * 3 + 1] = halfheight - halfheight * (rez[1] / rez[3]) + rect.top;
        transformedArray[i * 3 + 2] = (rez[2] / rez[3]);// + rect.top;//why is the +top even there?
    }

    return transformedArray;
}


function linTransform(mat, vec3sarray) {
    var psize = vec3sarray.length / 3;
    var transformedArray = new Array(vec3sarray.length);

    for (var i = 0; i < psize; i++) {
        var vstart = i * 3;
        var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * mat[4] + vec3sarray[vstart + 2] * mat[8] + 1.0 * mat[12],
        vec3sarray[vstart] * mat[1] + vec3sarray[vstart + 1] * mat[5] + vec3sarray[vstart + 2] * mat[9] + 1.0 * mat[13],
        vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * mat[6] + vec3sarray[vstart + 2] * mat[10] + 1.0 * mat[14],
        vec3sarray[vstart] * mat[3] + vec3sarray[vstart + 1] * mat[7] + vec3sarray[vstart + 2] * mat[11] + 1.0 * mat[15]];
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        transformedArray[i * 3] = (rez[0]);
        transformedArray[i * 3 + 1] = (rez[1]);
        transformedArray[i * 3 + 2] = (rez[2]);// + rect.top;//why is the +top even there?
    }
    //console.log('eet: ' + transformedArray);
    return transformedArray;
}

function linTransformRange(dest, source, mat, rangeStart, rangeEndExclusive, testobj) {
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive);
    var psize = rangeEndExclusive / 3;
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive)

    for (var i = (rangeStart / 3); i < psize; i++) {
        var vstart = i * 3;
        var rez = [source[vstart] * mat[0] + source[vstart + 1] * mat[4] + source[vstart + 2] * mat[8] + 1.0 * mat[12],
        source[vstart] * mat[1] + source[vstart + 1] * mat[5] + source[vstart + 2] * mat[9] + 1.0 * mat[13],
        source[vstart] * mat[2] + source[vstart + 1] * mat[6] + source[vstart + 2] * mat[10] + 1.0 * mat[14],
        source[vstart] * mat[3] + source[vstart + 1] * mat[7] + source[vstart + 2] * mat[11] + 1.0 * mat[15]];
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        dest[i * 3] = (rez[0]) / (rez[3]);
        dest[i * 3 + 1] = (rez[1]) / (rez[3]);
        dest[i * 3 + 2] = (rez[2]) / (rez[3]);// + rect.top;//why is the +top even there?        
    }
    //console.log('eet: ' + transformedArray);
    //return transformedArray;
}

function linTransformRangeWithOffsets(dest, source, mat, sourceStart, sourceEndExclusive, destStart) {
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive);
    var psize = sourceEndExclusive / 3;
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive)

    for (var i = (sourceStart / 3); i < psize; i++) {
        var vstart = i * 3;
        var rez = [source[vstart] * mat[0] + source[vstart + 1] * mat[4] + source[vstart + 2] * mat[8] + 1.0 * mat[12],
        source[vstart] * mat[1] + source[vstart + 1] * mat[5] + source[vstart + 2] * mat[9] + 1.0 * mat[13],
        source[vstart] * mat[2] + source[vstart + 1] * mat[6] + source[vstart + 2] * mat[10] + 1.0 * mat[14],
            source[vstart] * mat[3] + source[vstart + 1] * mat[7] + source[vstart + 2] * mat[11] + 1.0 * mat[15]];
        var dStart = destStart + i * 3 - sourceStart;
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        dest[dStart] = (rez[0]) / (rez[3]);
        dest[dStart + 1] = (rez[1]) / (rez[3]);
        dest[dStart + 2] = (rez[2]) / (rez[3]);// + rect.top;//why is the +top even there?        
    }
    //console.log('eet: ' + transformedArray);
    //return transformedArray;
}

function linTransformRangeWithOffsetsMat3(dest, source, mat, sourceStart, sourceEndExclusive, destStart) {
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive);
    var psize = sourceEndExclusive / 3;
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive)

    for (var i = (sourceStart / 3); i < psize; i++) {
        var vstart = i * 3;
        var rez = [source[vstart] * mat[0] + source[vstart + 1] * mat[3] + source[vstart + 2] * mat[6],
        source[vstart] * mat[1] + source[vstart + 1] * mat[4] + source[vstart + 2] * mat[7],
        source[vstart] * mat[2] + source[vstart + 1] * mat[5] + source[vstart + 2] * mat[8]];
        var dStart = destStart + i * 3 - sourceStart;
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        dest[dStart] = (rez[0]);
        dest[dStart + 1] = (rez[1]);
        dest[dStart + 2] = (rez[2]);// + rect.top;//why is the +top even there?        
    }
    //console.log('eet: ' + transformedArray);
    //return transformedArray;
}

function linTransformRangeWithOffsetsForSkeletonMat3(dest, source, sourceStart, sourceEndExclusive, destStart, skeletonkey, joints, weights) {
    //console.log('from ' + rangeStart + ' to ' + rangeEndExclusive);
    var psize = sourceEndExclusive / 3;
    //console.log('from ' + sourceStart + ' to ' + sourceEndExclusive)
    var mat = mat4.create();
    var startTri = sourceStart / 3;
    var dStartDiff = destStart - sourceStart;
    //var currentSkellMat = mat4.create();
    //var currentWeight = 0;

    for (var i = startTri; i < psize; i++) {
        var dStart = dStartDiff + i * 3;
        var rez = [0.0, 0.0, 0.0, 0.0]
        var baseweightIndex = (i - startTri) * 4;
        ////for (var w = 0; w < 4; w++) {
        var weightjointdex = baseweightIndex;// + w;

        if (weights[weightjointdex] != 0.0) {
            ////if (skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix != currentSkellMat || currentWeight != weights[weightjointdex]) {
                ////currentSkellMat = skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix;
                ////currentWeight = weights[weightjointdex];

            mat4.multiplyScalar(mat, skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix, weights[weightjointdex]);
            if (weights[++weightjointdex] != 0.0) {
                mat4.multiplyScalarAndAdd(mat, mat, skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix, weights[weightjointdex]);//multiplyScalarAndAdd(out, a, b, scale)
                if (weights[++weightjointdex] != 0.0) {
                    mat4.multiplyScalarAndAdd(mat, mat, skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix, weights[weightjointdex]);
                    if (weights[++weightjointdex] != 0.0) {
                        mat4.multiplyScalarAndAdd(mat, mat, skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix, weights[weightjointdex]);
                    }
                }
            }
            ////}
            //console.log(weightjointdex);
            //console.log(joints[weightjointdex]);
            //console.log(weights[weightjointdex]);
            //mat4.multiplyScalar(mat, skeletonkey.skellynodes[joints[weightjointdex]].nodeobj.skellmatrix, weights[weightjointdex]);
            //console.log(mat);

            var vstart = i * 3;
            rez = [rez[0] + source[vstart] * mat[0] + source[vstart + 1] * mat[4] + source[vstart + 2] * mat[8] + 1.0 * mat[12],
            rez[1] + source[vstart] * mat[1] + source[vstart + 1] * mat[5] + source[vstart + 2] * mat[9] + 1.0 * mat[13],
            rez[2] + source[vstart] * mat[2] + source[vstart + 1] * mat[6] + source[vstart + 2] * mat[10] + 1.0 * mat[14],
            rez[3] + source[vstart] * mat[3] + source[vstart + 1] * mat[7] + source[vstart + 2] * mat[11] + 1.0 * mat[15]];



            //rez = [rez[0] + source[vstart] * mat[0] + source[vstart + 1] * mat[4] + source[vstart + 2] * mat[8],
            //rez[1] + source[vstart] * mat[1] + source[vstart + 1] * mat[5] + source[vstart + 2] * mat[9],
            //rez[2] + source[vstart] * mat[2] + source[vstart + 1] * mat[6] + source[vstart + 2] * mat[10]];
        }// else { break; }
        ////}
        dest[dStart] = (rez[0]);
        dest[dStart + 1] = (rez[1]);
        dest[dStart + 2] = (rez[2]);
    }
}


function QuatToEulers(quat) {
    var eulers = [0.0, 0.0, 0.0];
    //all thanks to wikipedia https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles thank you
    eulers[0] = Math.atan2(2 * (quat[0] * quat[1] + quat[2] * quat[3]), 1 - 2 * (quat[1] * quat[1] + quat[2] * quat[2]));
    eulers[1] = Math.asin(2 * (quat[0] * quat[2] - quat[3] * quat[1]));
    eulers[2] = Math.atan2(2 * (quat[0] * quat[3] + quat[1] * quat[2]), 1 - 2 * (quat[2] * quat[2] + quat[3] * quat[3]));
    eulers[0] = eulers[0] * 180.0 / Math.PI;
    eulers[1] = eulers[1] * 180.0 / Math.PI;
    eulers[2] = eulers[2] * 180.0 / Math.PI;
    return eulers;
}



function lin3Transform(mat4For3, vec3sarray) {
    var psize = vec3sarray.length / 3;
    var mat = mat4For3;
    var transformedArray = new Array(vec3sarray.length);

    for (var i = 0; i < psize; i++) {
        var vstart = i * 3;
        var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * mat[4] + vec3sarray[vstart + 2] * mat[8],
        vec3sarray[vstart] * mat[1] + vec3sarray[vstart + 1] * mat[5] + vec3sarray[vstart + 2] * mat[9],
        vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * mat[6] + vec3sarray[vstart + 2] * mat[10]];
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        transformedArray[i * 3] = (rez[0]);
        transformedArray[i * 3 + 1] = (rez[1]);
        transformedArray[i * 3 + 2] = (rez[2]);// + rect.top;//why is the +top even there?
    }
    //console.log('eet: ' + transformedArray);
    return transformedArray;
}

function lin3TransformMat3(mat, vec3sarray) {
    var psize = vec3sarray.length / 3;
    //var mat = mat4For3;
    var transformedArray = new Array(vec3sarray.length);

    for (var i = 0; i < psize; i++) {
        var vstart = i * 3;
        var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * mat[3] + vec3sarray[vstart + 2] * mat[6],
        vec3sarray[vstart] * mat[1] + vec3sarray[vstart + 1] * mat[4] + vec3sarray[vstart + 2] * mat[7],
        vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * mat[5] + vec3sarray[vstart + 2] * mat[8]];
        //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
        transformedArray[i * 3] = (rez[0]);
        transformedArray[i * 3 + 1] = (rez[1]);
        transformedArray[i * 3 + 2] = (rez[2]);// + rect.top;//why is the +top even there?
    }
    //console.log('eet: ' + transformedArray);
    return transformedArray;
}

function IsPointInTriangle(point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
    var px = point.x;
    var py = point.y;
    var ax = tri.a.x || tri.a[0];
    var ay = tri.a.y || tri.a[1];
    var bx = tri.b.x || tri.b[0];
    var by = tri.b.y || tri.b[1];
    var cx = tri.c.x || tri.c[0];
    var cy = tri.c.y || tri.c[1];
    //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
    //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

    var v0 = [cx - ax, cy - ay];
    var v1 = [bx - ax, by - ay];
    var v2 = [px - ax, py - ay];

    var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
    var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
    var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
    var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
    var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

    var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return ((u >= 0) && (v >= 0) && (u + v <= 1));
}

function IsPointInTriangleIncludeZ(point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
    var px = point.x;
    var py = point.y;
    var ax = tri.a.x || tri.a[0];
    var ay = tri.a.y || tri.a[1];
    var bx = tri.b.x || tri.b[0];
    var by = tri.b.y || tri.b[1];
    var cx = tri.c.x || tri.c[0];
    var cy = tri.c.y || tri.c[1];
    //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
    //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

    var v0 = [cx - ax, cy - ay];
    var v1 = [bx - ax, by - ay];
    var v2 = [px - ax, py - ay];

    var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
    var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
    var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
    var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
    var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

    var invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);//whole number was bad?

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    result = {};
    result.didHit = ((u >= 0.0) && (v >= 0.0) && (u + v <= 1.0));
    if (!result.didHit) {
        return result;
    } else {
        //var startz = tri.a.z;
        //var cmag = dot00;//Math.sqrt(dot00);
        //var cproj = dot02 / cmag;
        //var bmag = dot11;//Math.sqrt(dot11);
        //var bproj = dot12 / bmag;
        //result.hitz = bproj * (tri.b.z - startz) + cproj * (tri.c.z - startz) + startz; //console.log(result.hitz)

        //hey i think its better!
        var cmag = dot00;//Math.sqrt(dot00);
        var cproj = dot02 / cmag;//Math.sqrt(dot02 / cmag);
        var intermedPoint = { x: cproj * (tri.c.x - tri.a.x) + tri.a.x, y: cproj * (tri.c.y - tri.a.y) + tri.a.y, z: cproj * (tri.c.z - tri.a.z) + tri.a.z };
        var intermedDistRatio = Math.sqrt((tri.b.x - px) * (tri.b.x - px) + (tri.b.y - py) * (tri.b.y - py)) / Math.sqrt((tri.b.x - intermedPoint.x) * (tri.b.x - intermedPoint.x) + (tri.b.y - intermedPoint.y) * (tri.b.y - intermedPoint.y));

        result.hitz = tri.b.z + (intermedPoint.z - tri.b.z) * intermedDistRatio;

        return result;
    }
}

function UpdateObjAnimation(obj) {

    if (obj && obj.currentAnimation != null) {
        //console.log(obj);
        //console.log('todo');
        var anim = obj.prim.animations[obj.currentAnimation];
        //console.log(obj.currentAnimation);
        if (anim != null) {
            //if (!FREEZE) {
            obj.animframe += StageData.timeDelta;// / SLOWDOWN;//StageData.vticks;//StageData.timeDelta / SLOWDOWN;//(StageData.timeDelta / 4);
            //} else {
            //    obj.animframe += StageData.vticks;//+= StageData.timeDelta / 12.0;
            //}
            for (var i = 0; i < anim.components.length; i++) {
                var primcomp = anim.components[i];
                //reset positions from obj.prim.positions
                //console.log(obj.positionsBufferStart);
                for (var pp = 0; pp < obj.prim.positions.length; pp++) {
                    Entera.buffers.positions[obj.positionsBufferStart + pp] = obj.prim.positions[pp];
                }
                //rotation animation
                if (primcomp.type == Makarios.animTypeRot) {
                    obj.animcomps[i].currentframe = obj.animframe % (obj.animcomps[i].endTime + 1);

                    //console.log(obj.animcomps[i].endTime);
                    for (var f = 0; f < primcomp.keytimes.length; f++) {
                        var realkey = (obj.animcomps[i].currentKey + f) % primcomp.keytimes.length;
                        if ((obj.animcomps[i].currentframe >= primcomp.keytimes[realkey] * 1000 || (obj.animcomps[i].currentframe < primcomp.keytimes[0] * 1000 && realkey == 0)) &&
                            ((realkey == (primcomp.keytimes.length - 1)) || (obj.animcomps[i].currentframe < primcomp.keytimes[realkey + 1] * 1000))) {
                            obj.animcomps[i].currentKey = realkey;
                            //if (realkey >= primcomp.keytimes.length - 2 && realkey == 44) { //|| realkey <= 0) {
                            //    console.log(realkey + '   currentkey: ' + obj.animcomps[i].currentKey + '   keytimeslen:' + primcomp.keytimes.length);
                            //    console.log('currentframe: ' + obj.animcomps[i].currentframe + '   nexkeytime: ' + primcomp.keytimes[realkey + 1] * 1000);
                            //    console.log('keystart: ' + primcomp.keytimes[realkey] * 1000);
                            //    //console.log(realkey);
                            //    //FREEZE = true;
                            //}
                            f = primcomp.keytimes.length;
                        }
                    } 
                    //if (obj.animcomps[i].currentKey == 0 && obj.animframe % (obj.animcomps[i].endTime + 1) < 10.0) {
                    //    console.log(obj.animframe % (obj.animcomps[i].endTime + 1));
                    //    SLOWDOWN = 244.0
                    //} else {
                    //    SLOWDOWN = 1.0;//1.0;
                    //}

                    var quat = [0.0, 0.0, 0.0, 0.0];
                    var thekey = obj.animcomps[i].currentKey;

                    if (thekey == (primcomp.keytimes.length - 1) || obj.animcomps[i].currentframe == primcomp.keytimes[thekey] * 1000) {
                        //failsafe, when max should only be at max time
                        quat = [primcomp.keydeformations[thekey * 4 + 0], primcomp.keydeformations[thekey * 4 + 1],
                        primcomp.keydeformations[thekey * 4 + 2], primcomp.keydeformations[thekey * 4 + 3]];
                        //var ek = QuatToEulers(quat);
                        //Quaternion.fromEuler(quat, ek[2], ek[1], ek[0]);
                    } else {
                        //else interpolate
                        //for (var d = 0; d < 4; d++) {
                        //because we arent interpolating the quaternion, just the euler
                        //var val = primcomp.keydeformations[thekey * 4 + d];// + 
                        //(primcomp.keydeformations[(thekey + 1) * 4 + d] - primcomp.keydeformations[thekey * 4 + d]) * 
                        //((obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / ((1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey])));
                        //}
                        //interpolation method 2??
                        ////var q0 = quat = [primcomp.keydeformations[thekey * 4 + 0], primcomp.keydeformations[thekey * 4 + 1],
                        ////primcomp.keydeformations[thekey * 4 + 2], primcomp.keydeformations[thekey * 4 + 3]];
                        ////var q1 = [primcomp.keydeformations[(thekey + 1) * 4 + 0], primcomp.keydeformations[(thekey + 1) * 4 + 1],
                        ////    primcomp.keydeformations[(thekey + 1) * 4 + 2], primcomp.keydeformations[(thekey + 1) * 4 + 3]];
                        ////var e0 = QuatToEulers(q0);
                        ////var e1 = QuatToEulers(q1);
                        ////var euresult = [0.0, 0.0, 0.0];
                        ////for (var g = 0; g < 3; g++) {
                        ////    if (Math.abs(e1[g] - e0[g]) > 180.0) {
                        ////        if (e1[g] < e0[g]) {
                        ////            e1[g] += 360.0;
                        ////        } else if (e1[g] < e0[g]){
                        ////            e0[g] += 360.0;
                        ////        }
                        ////    }
                        ////    var val = e0[g] + 
                        ////        (e1[g] - e0[g]) * 
                        ////        ((obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / ((1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey])));
                        ////    euresult[g] = val;
                        ////}
                        ////Quaternion.fromEuler(quat, -euresult[2], euresult[1], -euresult[0]);//euresult[2], -euresult[1], -euresult[0]);
                        //end interpolation method 2

                        //thank you with a little help from https://github.khronos.org/glTF-Tutorials/gltfTutorial/gltfTutorial_007_Animations.html
                        //they say to use: interpolationValue = (currentTime - previousTime) / (nextTime - previousTime)
                        var interpolScale = (obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / (1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey]);
                        var q0 = quat = [primcomp.keydeformations[thekey * 4 + 0], primcomp.keydeformations[thekey * 4 + 1],
                        primcomp.keydeformations[thekey * 4 + 2], primcomp.keydeformations[thekey * 4 + 3]];
                        var q1 = [primcomp.keydeformations[(thekey + 1) * 4 + 0], primcomp.keydeformations[(thekey + 1) * 4 + 1],
                        primcomp.keydeformations[(thekey + 1) * 4 + 2], primcomp.keydeformations[(thekey + 1) * 4 + 3]];
                        Quaternion.slerp(quat, q0, q1, interpolScale);
                    }

                    var rotMatrix = mat3.create();
                    if (obj.animcomps[i].node != null) {
                        var animobjglindex = obj.animcomps[i].node;
                        var animobjskellindex = obj.animcomps[i].skellindex;
                        //console.log(obj.glnodes[animobjglindex].nodeobj);
                        //if (animobjskellindex != null && obj.skeletonkey != null && obj.skeletonkey.skellynodes[animobjskellindex] &&
                        //    obj.skeletonkey.skellynodes[animobjskellindex].nodeobj && obj.skeletonkey.skellynodes[animobjskellindex].nodeobj.skellmatrix) {
                        //    var skellobj = obj.skeletonkey.skellynodes[animobjskellindex].nodeobj;
                        //    console.log(skellobj);
                        if (animobjglindex != null && obj.glnodes[animobjglindex] != null && obj.glnodes[animobjglindex].nodeobj != null && obj.glnodes[animobjglindex].nodeobj.skellmatrix) {
                            var skellobj = obj.glnodes[animobjglindex].nodeobj;//obj.skeletonkey.skellynodes[animobjskellindex].nodeobj;
                            //console.log(skellobj);
                            //var ek = QuatToEulers(quat);
                            //Quaternion.fromEuler(quat, ek[2], -ek[1], -ek[0]);
                            //if (animobjglindex > 8) {
                            skellobj.applyanimrot = 1;
                            ////mat4.fromQuat(skellobj.skellmatrix, quat);
                            mat4.fromQuat(skellobj.matrot, quat);
                            //console.log(obj.currentAnimation);
                            //}
                        } else {
                            var nodalobj = obj.glnodes[obj.animcomps[i].node].nodeobj;
                            //console.log(obj.glnodes[obj.animcomps[i].node]);
                            //console.log(nodalobj);
                            mat3.fromQuat(rotMatrix, quat);
                            linTransformRangeWithOffsetsMat3(Entera.buffers.positions, nodalobj.prim.positions,
                                rotMatrix, nodalobj.startContPosIndex, nodalobj.startContPosIndex + nodalobj.positions.length, nodalobj.positionsBufferStart);
                        }

                    } else {
                        console.log(obj.animcomps[i]);
                        linTransformRangeWithOffsetsMat3(Entera.buffers.positions, obj.prim.positions,
                            rotMatrix, obj.startContPosIndex, obj.startContPosIndex + obj.positions.length, obj.positionsBufferStart);
                    }

                }



                //translation animation
                if (primcomp.type == Makarios.animTypeTrans) {
                    obj.animcomps[i].currentframe = obj.animframe % (obj.animcomps[i].endTime + 1);
                    for (var f = 0; f < primcomp.keytimes.length; f++) {
                        var realkey = (obj.animcomps[i].currentKey + f) % primcomp.keytimes.length;
                        if ((obj.animcomps[i].currentframe >= primcomp.keytimes[realkey] * 1000 || (obj.animcomps[i].currentframe < primcomp.keytimes[0] * 1000 && realkey == 0)) &&
                            ((realkey == (primcomp.keytimes.length - 1)) || (obj.animcomps[i].currentframe < primcomp.keytimes[realkey + 1] * 1000))) {
                            obj.animcomps[i].currentKey = realkey;
                            f = primcomp.keytimes.length;
                        }
                    }

                    var vec = [0.0, 0.0, 0.0];
                    var thekey = obj.animcomps[i].currentKey;

                    if (thekey == (primcomp.keytimes.length - 1) || obj.animcomps[i].currentframe == primcomp.keytimes[thekey] * 1000) {
                        //failsafe, when max should only be at max time
                        vec = [primcomp.keydeformations[thekey * 3 + 0], primcomp.keydeformations[thekey * 3 + 1],
                        primcomp.keydeformations[thekey * 3 + 2]];
                    } else {
                        //else interpolate
                        for (var d = 0; d < 3; d++) {
                            var val = primcomp.keydeformations[thekey * 3 + d] +
                                (primcomp.keydeformations[(thekey + 1) * 3 + d] - primcomp.keydeformations[thekey * 3 + d]) *
                                ((obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / ((1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey])));
                            vec[d] = val;
                        }
                        //interpolation method 2??
                        ////var q0 = quat = [primcomp.keydeformations[thekey * 4 + 0], primcomp.keydeformations[thekey * 4 + 1],
                        ////primcomp.keydeformations[thekey * 4 + 2], primcomp.keydeformations[thekey * 4 + 3]];
                        ////var q1 = [primcomp.keydeformations[(thekey + 1) * 4 + 0], primcomp.keydeformations[(thekey + 1) * 4 + 1],
                        ////    primcomp.keydeformations[(thekey + 1) * 4 + 2], primcomp.keydeformations[(thekey + 1) * 4 + 3]];
                        ////var e0 = QuatToEulers(q0);
                        ////var e1 = QuatToEulers(q1);
                        ////var euresult = [0.0, 0.0, 0.0];
                        ////for (var g = 0; g < 3; g++) {
                        ////    if (Math.abs(e1[g] - e0[g]) > 180.0) {
                        ////        if (e1[g] < e0[g]) {
                        ////            e1[g] += 360.0;
                        ////        } else if (e1[g] < e0[g]){
                        ////            e0[g] += 360.0;
                        ////        }
                        ////    }
                        ////    var val = e0[g] + 
                        ////        (e1[g] - e0[g]) * 
                        ////        ((obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / ((1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey])));
                        ////    euresult[g] = val;
                        ////}
                        //end interpolation method 2
                    }

                    var transMatrix = mat3.create();
                    if (obj.animcomps[i].node != null) {
                        var animobjglindex = obj.animcomps[i].node;
                        var animobjskellindex = obj.animcomps[i].skellindex;
                        if (animobjglindex != null && obj.glnodes[animobjglindex] != null && obj.glnodes[animobjglindex].nodeobj != null && obj.glnodes[animobjglindex].nodeobj.skellmatrix) {
                            var skellobj = obj.glnodes[animobjglindex].nodeobj;
                            //console.log(vec);
                            mat4.translate(skellobj.skellmatrix, skellobj.skellmatrix, vec);
                            skellobj.applyanimtran = 1;
                            mat4.translate(transMatrix, transMatrix, vec);
                            skellobj.mattran = mat4.create();
                            mat4.translate(skellobj.mattran, skellobj.mattran, vec);
                            //}
                        } else {
                            var nodalobj = obj.glnodes[obj.animcomps[i].node].nodeobj;
                            //console.log(obj.glnodes[obj.animcomps[i].node]);
                            //console.log(nodalobj);
                            mat4.translate(transMatrix, transMatrix, vec);
                            linTransformRangeWithOffsets(Entera.buffers.positions, nodalobj.prim.positions,
                                transMatrix, nodalobj.startContPosIndex, nodalobj.startContPosIndex + nodalobj.positions.length, nodalobj.positionsBufferStart);
                        }

                    } else {
                        mat4.translate(transMatrix, transMatrix, vec);
                        linTransformRangeWithOffsets(Entera.buffers.positions, obj.prim.positions,
                            transMatrix, obj.startContPosIndex, obj.startContPosIndex + obj.positions.length, obj.positionsBufferStart);
                    }

                }

                //morph animation aka blendshape aka shapekey
                if (primcomp.type == Makarios.animTypeMorph) {
                    //get the "true" frame based on time
                    obj.animcomps[i].currentframe = obj.animframe % (obj.animcomps[i].endTime + 1);
                    for (var f = 0; f < primcomp.keytimes.length; f++) {
                        var realkey = (obj.animcomps[i].currentKey + f) % primcomp.keytimes.length;
                        if (obj.animcomps[i].currentframe >= primcomp.keytimes[realkey] * 1000 &&
                            ((realkey == (primcomp.keytimes.length - 1)) || (obj.animcomps[i].currentframe < primcomp.keytimes[realkey + 1] * 1000))) {
                            obj.animcomps[i].currentKey = realkey;
                            f = primcomp.keytimes.length;
                        }
                    }

                    var newweights = new Float32Array(obj.prim.weights.length);
                    var thekey = obj.animcomps[i].currentKey;
                    if (thekey == (primcomp.keytimes.length - 1) || obj.animcomps[i].currentframe == primcomp.keytimes[thekey] * 1000) {
                        //failsafe, when max should only be at max time
                        for (var knw = 0; knw < newweights.length; knw++) {
                            newweights[knw] = primcomp.keydeformations[thekey * obj.prim.weights.length + knw];
                        }
                    } else {
                        //else interpolate
                        for (var nw = 0; nw < newweights.length; nw++) {
                            var nowid = thekey * obj.prim.weights.length + nw;
                            var nexid = (thekey + 1) * obj.prim.weights.length + nw;

                            var dev = primcomp.keydeformations[nowid] +
                                (primcomp.keydeformations[nexid] - primcomp.keydeformations[nowid]) *
                                ((obj.animcomps[i].currentframe - 1000.0 * primcomp.keytimes[thekey]) / ((1000.0 * primcomp.keytimes[(thekey + 1)] - 1000.0 * primcomp.keytimes[thekey])));
                            newweights[nw] = dev;//primcomp.keydeformations[thekey * obj.prim.weights.length + nw];
                        }
                    }

                    for (var fw = 0; fw < newweights.length; fw++) {
                        var morphposits = obj.prim.morphPosArrays[fw];
                        //console.log(morphposits);
                        for (var mp = 0; mp < morphposits.length; mp++) {
                            //entera edit
                            //console.log(morphposits[mp] * newweights[mp])
                            Entera.buffers.positions[obj.positionsBufferStart + mp] += morphposits[mp] * newweights[fw];
                        }
                    }
                }//morph animation done
            }
        } else if (obj.skeletonkey) {
            for (var sp = 0; sp < obj.prim.positions.length; sp++) {
                Entera.buffers.positions[obj.positionsBufferStart + sp] = obj.prim.positions[sp];
            }
        }
    } else if (obj.skeletonkey) {
        for (var sp2 = 0; sp2 < obj.prim.positions.length; sp2++) {
            Entera.buffers.positions[obj.positionsBufferStart + sp2] = obj.prim.positions[sp2];
        }
    }
}



const Makarios = (function () {
    var self = this;

    self.helloworld = function () { console.log('hello world'); };

    self.animTypeRot = 1;
    self.animTypeTrans = 2;
    self.animTypeScale = 3;
    self.animTypeMorph = 4;

    self.uiState = {};
    self._useAlphaInTexture = false;
    self._useSingleDrawCall = false;
    self.SetUseAlphaInTextureBuffer = function (val) {
        _useAlphaInTexture = val;
    };
    self.UseAlphaInTextureBuffer = function () {
        return _useAlphaInTexture;
    };
    self.SetUseSingleDrawCall = function (val) {
        _useSingleDrawCall = val;
    };
    self.UseSingleDrawCall = function () {
        return _useSingleDrawCall;
    };

    self.itemsToPreload = 0;
    self.isPreloading = function () {
        return self.itemsToPreload > 0;
    }

    self.instantiate = function (prim, textureUrl, objectOnFrame, customprops, idealstartTime) {
        var newobj = StageData.instantiate(prim, textureUrl, objectOnFrame, customprops);
        if (idealstartTime != null && StageData.vticks > idealstartTime) {
            var trueVTicks = StageData.vticks;
            var trueTimeDelta = StageData.timeDelta;
            StageData.vticks = idealstartTime;
            StageData.timeDelta = trueTimeDelta - (trueVTicks - idealstartTime);
            newobj.ObjectOnFrame(newobj);
            StageData.vticks = trueVTicks;
            StageData.timeDelta = trueTimeDelta;
        }
        return newobj;
    }
    self.instantiateChild = function (parent, prim, textureUrl, objectOnFrame, customprops, idealstartTime) {
        var inst = StageData.instantiateChild(parent, prim, textureUrl, objectOnFrame, customprops);
        Entera.handleNewObj(inst);
        return inst;
    }
    self.destroy = function (inst) {
        StageData.destroy(inst);
    }

    self.SetAnimation = function (obj, animname, withReset) {
        if (!withReset && obj.currentAnimation == animname) { return; }
        obj.currentAnimation = animname;
        obj.animframe = 0;
        var anim = obj.prim.animations[obj.currentAnimation];
        if (anim != null) {
            obj.animcomps = [];
            for (var c = 0; c < anim.components.length; c++) {
                var newcomp = {
                    currentframe: 0,
                    currentKey: 0,
                    endTime: anim.components[c].keytimes[anim.components[c].keytimes.length - 1] * 1000,
                    node: anim.components[c].node,
                    skellindex: anim.components[c].node != null ? obj.glnodes[anim.components[c].node].skellindex : null
                };
                obj.animcomps.push(newcomp);
            }
            //console.log(obj.animcomps);
        }
    }

    self.setStepsForCelShading = function (stepCount) {
        ggl.useProgram(globalMainProgramInfo.program);
        ggl.uniform1f(globalMainProgramInfo.uniformLocations.ucelStep, stepCount);
    }

    self.preloadGltfPrimitiveFromJsResource = function (pathloc, primname, defaultTransform) {
        if (Primitives.shapes[primname]) { return; }
        console.log(primname + '==');

        self.itemsToPreload++;
        GltfConverter.getPrimitiveFromJsResource(pathloc, function (res) {
            console.log('==' + primname);
            Primitives.shapes[primname] = res.prim;
            Primitives.shapes[primname].animations = [];
            if (res.animations) {
                for (var a = 0; a < res.animations.length; a++) {
                    Primitives.animations.push(res.animations[a]);
                    Primitives.shapes[primname].animations[res.animations[a].name] = Primitives.animations[Primitives.animations.length - 1];
                }
            }
            if (defaultTransform != null) {
                console.log(primname + ' applying default transofrm');
                self.applyDefaultTransformRecursive(Primitives.shapes[primname], primname, defaultTransform);
                //linTransformRange(Primitives.shapes[primname].positions, Primitives.shapes[primname].positions, defaultTransform, 0, Primitives.shapes[primname].positions.length);
                //linTransformRange(Primitives.shapes[primname].vertexNormals, Primitives.shapes[primname].vertexNormals, defaultTransform, 0, Primitives.shapes[primname].vertexNormals.length);
            }
            self.itemsToPreload--;
        });
    };

    self.applyDefaultTransformRecursive = function (primnode, primname, defaultTransform) {

        //if (primnode.inverseBaseMat) {
        //    mat4.multiply(primnode.inverseBaseMat, primnode.inverseBaseMat, defaultTransform);
        //}
        //if (primnode.prim && primnode.prim.inverseBaseMat) {
        //    mat4.multiply(primnode.prim.inverseBaseMat, primnode.prim.inverseBaseMat, defaultTransform);
        //}
        linTransformRange(primnode.positions, primnode.positions, defaultTransform, 0, primnode.positions.length);
        linTransformRange(primnode.vertexNormals, primnode.vertexNormals, defaultTransform, 0, primnode.vertexNormals.length);
        console.log(primnode.positions);
        for (var c = 0; c < primnode.children.length; c++) {
            self.applyDefaultTransformRecursive(primnode.children[c], primname, defaultTransform);
        }
    }

    self.writeToUI = function (text, pos, font, dontClear) {
        self.uiState.text = text;
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);
        gui.fillStyle = '#DDBB00';//;'yellow';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        //base was 28 for height 480 (at 4:3) so 120 - 7
        var newfontsize = (Math.floor(ui.height * 7.0 / 120.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';
        gui.textAlign = 'center';
        //gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
        gui.fillText(text, ui.width / 2.0, ui.height / 2.1);
        uiState.hasany = true;
    }

    self.IsMobileDetected = function () {
        if (/Mobi/.test(navigator.userAgent)) {
            // mobile!
            return true;
        }
    };

    self.gpuLevel = 1;
    self.SetGPULevel = function (val) {
        gpuLevel = val;
    };
    self.IsGPUTrash = function () {
        return gpuLevel == 0;
    };

    self.rewriteToUI = function () {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);
        gui.fillStyle = '#DDBB00';//;'yellow';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);

        //base was 28 for height 480 (at 4:3) so 120 - 7
        var newfontsize = (Math.floor(ui.height * 7.0 / 120.0) * 1).toString();
        console.log(newfontsize);
        gui.font = 'bold small-caps ' + newfontsize + 'px serif';
        gui.textBaseline = 'hanging';
        gui.textAlign = 'center';
        //gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
        gui.fillText(self.uiState.text, ui.width / 2.0, ui.height / 2.1);
        uiState.hasany = true;
    }

    self.drawImage = function (image) {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        //with a little thanks to https://stackoverflow.com/questions/8977369/drawing-png-to-a-canvas-element-not-showing-transparency thank you!
        gui.drawImage(image, 20, 20);
    };

    self.setCamDist = function (newdist) {
        var oldDist = camDist;
        camDist = newdist;

        if (camDist < 2.0) {
            camDist = 2.0;
        } else if (camDist > maxCamDist) {
            camDist = maxCamDist;
        }

        var distDel = camDist - oldDist;
        if (distDel == 0.0) {
            return;
        }
        console.log(camDist);

        if (gmod == null) {
            gmod = mat4.create();
            mat4.translate(gmod,     // destination matrix
                gmod,     // matrix to translate
                [-0.0, 0.0, -camDist]);
        }
        else {
            gmod[14] = -1.0 * camDist;
        }
    };

    return self;
})();


