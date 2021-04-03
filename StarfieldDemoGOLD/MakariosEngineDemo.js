const mat4 = glMatrix.mat4;

var MakTextures = {};

const fsSource = `
            //varying lowp vec4 vColor;
            varying highp vec2 vTextureCoord;
            varying highp vec3 vLighting;

            uniform sampler2D uSampler;

            void main(void) {
                //gl_FragColor = vColor;//vec4(1.0, 0.0, 0.0, 1.0);
                ////gl_FragColor = texture2D(uSampler, vTextureCoord);
                highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
                gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
            }
        `;

// Vertex shader program
const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            //attribute vec4 aVertexColor;
            attribute vec2 aTextureCoord;
            attribute float aUseParentMatrix;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            uniform mat4 uParentMatrix;
            uniform float uMatrixLevel;

            //varying lowp vec4 vColor;
            varying highp vec2 vTextureCoord;
            varying highp vec3 vLighting;

            void main(void) {
                if(aUseParentMatrix >= uMatrixLevel) {
                    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;//aVertexPosition;//uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                }
                else {
                    gl_Position = uProjectionMatrix * uParentMatrix * aVertexPosition;//aVertexPosition;//uProjectionMatrix * uParentMatrix * aVertexPosition;
                }
                //gl_Position[0] += -4.0;
                //gl_Position[1] += -4.0;
                //gl_Position[2] += -14.0;
                //vColor = aVertexColor;
                vTextureCoord = aTextureCoord;

                // Apply lighting effect
                highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);
                highp vec3 directionalLightColor = vec3(1, 1, 1);
                highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
                highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
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
var gtextureCoordBuffer = {};
function initBuffers(gl) {
    ggl = gl;
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    //const positions = ObjData.positions;
    var positions = [];
    for (var pobs = 0; pobs < StageData.objects.length; pobs++) {
        if (!StageData.objects[pobs]) { continue; }
        var oldcount = positions.length;
        positions = positions.concat(StageData.objects[pobs].positions);
        for (var pobsi = 0; pobsi < StageData.objects[pobs].children.length; pobsi++) {
            positions = positions.concat(StageData.objects[pobs].children[pobsi].positions);
        }
    }

    //console.log(positions);
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);


    const textureCoordBuffer = gl.createBuffer();
    gtextureCoordBuffer = textureCoordBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    var textureCoordinates = [];
    for (var tobs = 0; tobs < StageData.objects.length; tobs++) {
        if (!StageData.objects[tobs]) { continue; }
        var oldcount = textureCoordinates.length;
        textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].textureCoordinates);
        for (var tobsi = 0; tobsi < StageData.objects[tobs].children.length; tobsi++) {
            textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].children[tobsi].textureCoordinates);
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);


    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    var indices = [];
    var oldcount = 0;
    var startdex = 0;
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
    } //console.log('indz be:'); console.log(indices);


    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);


    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    //const vertexNormals = ObjData.vertexNormals;
    var vertexNormals = [];
    for (var vobs = 0; vobs < StageData.objects.length; vobs++) {
        if (!StageData.objects[vobs]) { continue; }
        var oldcount = vertexNormals.length;
        vertexNormals = vertexNormals.concat(StageData.objects[vobs].vertexNormals);
        for (var vobsi = 0; vobsi < StageData.objects[vobs].children.length; vobsi++) {
            vertexNormals = vertexNormals.concat(StageData.objects[vobs].children[vobsi].vertexNormals);
        }
    }

    //vertexNormals = vertexNormals.concat(vertexNormals);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
        gl.STATIC_DRAW);



    const useParentMatrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, useParentMatrixBuffer);

    //const vertexNormals = ObjData.vertexNormals;
    var useParentMatrix = [];
    for (var pmobs = 0; pmobs < StageData.objects.length; pmobs++) {
        if (!StageData.objects[pmobs]) { continue; }
        var oldcount = useParentMatrix.length;
        useParentMatrix = useParentMatrix.concat(StageData.objects[pmobs].useParentMatrix);
        for (var pmobsi = 0; pmobsi < StageData.objects[pmobs].children.length; pmobsi++) {
            useParentMatrix = useParentMatrix.concat(StageData.objects[pmobs].children[pmobsi].useParentMatrix);
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(useParentMatrix),
        gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
        normal: normalBuffer,
        useParentMatrix: useParentMatrixBuffer,
    };
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
    image.src = url;

    MakTextures[url] = texture;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}


var blah = 6.0;
var cubeRotation = 0.0;
var rez2 = [0, 0, 0, 0];
var gproj;
var gmod;
function drawScene(gl, programInfo, buffers, deltaTime) {
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
    const zFar = 160.0;
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
        //mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 1.9, [.3, 1, 0]);
    }

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);


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
    {
        const num = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }



    // tell webgl how to pull out the answer to whether to use parent matrix from buffer
    {
        const num = 1; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.useParentMatrix);
        gl.vertexAttribPointer(programInfo.attribLocations.useParentMatrix, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.useParentMatrix);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix);

    //if (StageData.objects[2] && !StageData.objects[2].textureImage) {
    //    const texture3 = loadTexture(gl, 'smile1.jpg');//png?
    //    StageData.objects[2].textureImage = texture3;
    //}

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.parentMatrix,
        false,
        modelViewMatrix);
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    RenderObjects(gl, programInfo, StageData.objects, modelViewMatrix, 0.0, { val: 0 });

    gproj = projectionMatrix;
    gmod = modelViewMatrix;
}

function RenderObjects(gl, programInfo, objects, parentmatrix, depth, offsetHolder) {
    for (var oj = 0; oj < objects.length; oj++) {
        if (!objects[oj]) { continue; };
        //const normalMatrix = mat4.create();
        //mat4.invert(normalMatrix, parentmatrix);
        //mat4.transpose(normalMatrix, normalMatrix);

        var mat0 = mat4.create();
        mat4.multiply(mat0,     // destination matrix
            parentmatrix,     // matrix to translate
            objects[oj].matrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            mat0);//modelViewMatrix
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
        if (!objects[oj].textureImage) {
            objects[oj].textureImage = loadTexture(gl, objects[oj].textureUrl);
        }
        gl.bindTexture(gl.TEXTURE_2D, objects[oj].textureImage);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        gl.uniform1f(programInfo.uniformLocations.matrixLevel, depth);
        {
            const vertexCount = objects[oj].indices.length;//36;
            const type = gl.UNSIGNED_SHORT;
            const offset = objects[oj].bufferOffset; //offsetHolder.val;//objects[oj].bufferOffset; //console.log('offset is:' + objects[oj].bufferOffset)
            offsetHolder.val += objects[oj].indices.length * 2;
            //if (StageData.ticks % 50 == 0) { console.log('offset is:' + objects[oj].bufferOffset); }
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            //gl.drawElements(gl.LINES, vertexCount, type, offset);
        }

        if (objects[oj].children && objects[oj].children.length > 0) {
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.parentMatrix,
                false,
                mat0);
            RenderObjects(gl, programInfo, objects[oj].children, mat0, depth + 1.0, offsetHolder);
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.parentMatrix,
                false,
                parentmatrix);
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

    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            useParentMatrix: gl.getAttribLocation(shaderProgram, 'aUseParentMatrix'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            parentMatrix: gl.getUniformLocation(shaderProgram, 'uParentMatrix'),
            matrixLevel: gl.getUniformLocation(shaderProgram, 'uMatrixLevel'),
        },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    var textures = [];

    console.log('startergo');
    theGame.Init();

    const buffers = initBuffers(gl);
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

    // Draw the scene repeatedly
    function render(now) {
        now *= 0.00004;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        //credit to gman at https://stackoverflow.com/questions/13870677/resize-viewport-canvas-according-to-browser-window-size
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const buffers = initBuffers(gl);

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
        //credit thank you https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        //gui.clearRect(0, 0, ui.width, ui.height);
        //gui.fillStyle = 'green';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);
        //gui.font = 'bold small-caps 24px serif';
        //gui.textBaseline = 'hanging';
        //gui.fillText('Slayer', 540, 10);
    }
    requestAnimationFrame(render);

    //Important! We used to use FrameLogic within perframelogicm1.js
    ////setInterval(FrameLogic.onFrame, 15);
    //now we use theGame
    setInterval(function () {
        StageData.ticks += 1;
        theGame.OnFrame();
        for (var c = 0; c < StageData.objects.length; c++) {
            if (StageData.objects[c] && StageData.objects[c].ObjectOnFrame) {
                StageData.objects[c].ObjectOnFrame(StageData.objects[c]);
            }
        }
    }, 5);//15

    //console.log(gl.GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS);

}

window.onload = main;

var mouseisdown = false;
var isdragging = false;
var dragstartpoint = { x: 0, y: 0 };
var lastmousedownpoint = { x: 0, y: 0 };
window.addEventListener("mousedown", function (e) {
    //console.log('mousedown');
    mouseisdown = true;
    dragstartpoint = { x: e.clientX, y: e.clientY };
    lastmousedownpoint = { x: e.clientX, y: e.clientY };
})
window.addEventListener("mouseup", function (e) {
    //console.log('mouseup');
    mouseisdown = false;
})


window.addEventListener("keydown", function (e) {
    FrameLogic.keystates[e.keyCode] = true;
    //console.log('prezzed ' + e.keyCode);
})
window.addEventListener("keyup", function (e) {
    FrameLogic.keystates[e.keyCode] = false;
    if (e.keyCode == 32) {
        FrameLogic.spaceWasDown.value = false;
        console.log('uppnathim');
    }
})


window.addEventListener("click", function (e) {
    //console.log('clicky');

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

        recursiveCheckAllObjectsIfScreenPointHits(StageData.objects[objindex], null, objmatrix, [], hitstuff, { x: e.clientX, y: e.clientY });
    }
    //console.log(tricount);
    //console.log(hitstuff);
})

function recursiveCheckAllObjectsIfScreenPointHits(object, parent, itsfullmatrix, inheritedcoords, hitstuff, testpoint) {

    var tricount = object.indices.length / 3;

    var parentcoords = parent && parent.positions ? parent.positions : [];
    var properCoords = [];//getAllScreenCoords(itsfullmatrix, object.positions);

    //console.log(object.positions)
    properCoords = getAllScreenCoords(itsfullmatrix, object.positions);
    //console.log(properCoords)
    var screencoords = inheritedcoords.concat(properCoords); //console.log(inheritedcoords)

    /*
    for (var ac = 0; ac < object.indices.length; ac++) {
        var indexer = object.indices[ac];
        var newcoord = [];
        if (indexer < (parentcoords.length/3)) {
            newcoord.push(parentcoords[indexer * 3]);//inheritedCoords
            newcoord.push(parentcoords[indexer * 3 + 1]);
            newcoord.push(parentcoords[indexer * 3 + 2]); //console.log('old: ' + newcoord);

            screencoords = screencoords.concat(getAllScreenCoords(parentfullmatrix, newcoord));
        } else {
            newcoord.push(object.positions[(indexer - (parentcoords.length / 3)) * 3]);//properCoords
            newcoord.push(object.positions[(indexer - (parentcoords.length/3)) * 3 + 1]);
            newcoord.push(object.positions[(indexer - (parentcoords.length / 3)) * 3 + 2]); //console.log('new: ' + newcoord);

            screencoords = screencoords.concat(getAllScreenCoords(itsfullmatrix, newcoord));
        }
    }*/
    //console.log(inheritedCoords)
    //var screencoords = //getAllScreenCoords(parentfullmatrix, inheritedCoords).concat(getAllScreenCoords(itsfullmatrix, properCoords));
    //console.log(screencoords)
    var beenhit = false;
    var myhittris = [];
    for (var c = 0; c < tricount; c++) {
        var rez = IsPointInTriangleIncludeZ(testpoint, {
            a: { x: screencoords[object.indices[c * 3 + 0] * 3 + 0], y: screencoords[object.indices[c * 3 + 0] * 3 + 1], z: screencoords[object.indices[c * 3 + 0] * 3 + 2] },
            b: { x: screencoords[object.indices[c * 3 + 1] * 3 + 0], y: screencoords[object.indices[c * 3 + 1] * 3 + 1], z: screencoords[object.indices[c * 3 + 1] * 3 + 2] },
            c: { x: screencoords[object.indices[c * 3 + 2] * 3 + 0], y: screencoords[object.indices[c * 3 + 2] * 3 + 1], z: screencoords[object.indices[c * 3 + 2] * 3 + 2] },
        })
        if (rez.didHit) {
            hitstuff.tris.push({ triid: c, z: rez.hitz });
            myhittris.push({ triid: c, z: rez.hitz });
        }
        if (!beenhit) {
            hitstuff.objects.push(object.id);
            beenhit = true;
            //console.log({
            //    a: { x: screencoords[object.indices[c * 3 + 0] * 3 + 0], y: screencoords[object.indices[c * 3 + 0] * 3 + 1] },
            //    b: { x: screencoords[object.indices[c * 3 + 1] * 3 + 0], y: screencoords[object.indices[c * 3 + 1] * 3 + 1] },
            //    c: { x: screencoords[object.indices[c * 3 + 2] * 3 + 0], y: screencoords[object.indices[c * 3 + 2] * 3 + 1] },
            //});
        }

    }

    if (beenhit) {
        //get closest one in clip space aka normalized device coordinates ndc
        var lowestztri = { triid: 0, z: 9999 };
        for (var zt = 0; zt < myhittris.length; zt++) {
            if (lowestztri.z > myhittris[zt].z) {
                lowestztri = myhittris[zt];
            }
        }

        //var lowest
        if (lowestztri.z != 9999 && object.indices[lowestztri.triid * 3] >= (parentcoords.length / 3)) {
            object.textureCoordinates[(object.indices[lowestztri.triid * 3 + 0]) * 2] = object.textureCoordinates[(object.indices[lowestztri.triid * 3 + 0]) * 2] == 1.0 ? 0.0 : 1.0;

            ////const textureCoordBuffer = ggl.createBuffer();
            ggl.bindBuffer(ggl.ARRAY_BUFFER, gtextureCoordBuffer);

            var textureCoordinates = [];
            for (var tobs = 0; tobs < StageData.objects.length; tobs++) {
                if (!StageData.objects[tobs]) { continue; }
                var oldcount = textureCoordinates.length;
                textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].textureCoordinates);
                for (var tobsi = 0; tobsi < StageData.objects[tobs].children.length; tobsi++) {
                    textureCoordinates = textureCoordinates.concat(StageData.objects[tobs].children[tobsi].textureCoordinates);
                }
            }

            ggl.bufferData(ggl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                ggl.STATIC_DRAW);

            if (object.id == 1) {
                console.log(properCoords[2]);
                console.log('flippeditfor ' + lowestztri.triid + 'z: ' + lowestztri.z);
            }
        }
    }

    if (object.children) {
        for (var kid = 0; kid < object.children.length; kid++) {
            var kidmatrix = mat4.create();
            mat4.multiply(kidmatrix, itsfullmatrix, object.children[kid].matrix);
            recursiveCheckAllObjectsIfScreenPointHits(object.children[kid], object, kidmatrix, properCoords, hitstuff, testpoint)
        }
    }

}

onmousemove = function (e) {

    //the good code
    var rect = document.querySelector('#glCanvas').getBoundingClientRect();
    var goodvals = (320 + 320 * (rez2[0] / rez2[3]) + rect.left - e.clientX) + ' ,' + (240 - 240 * (rez2[1] / rez2[3]) + rect.top - e.clientY);
    //console.log( (320 + 320 * (rez2[0]/rez2[3]) + rect.left - e.clientX) + ' ,' + (240 - 240 * (rez2[1]/rez2[3]) + rect.top - e.clientY));
    if (mouseisdown) {
        //console.log(e.clientX + ', ' + e.clientY);
        //console.log((e.clientX - lastmousedownpoint.x) + ', ' + (e.clientY - lastmousedownpoint.y));
        var origmod = mat4.create();
        mat4.copy(origmod, gmod);
        var origproj = mat4.create();
        mat4.invert(origproj, gproj);
        var full = mat4.create();
        mat4.multiply(full, gproj, gmod);
        //mat4.multiply(origmod, gproj, gmod);
        //mat4.invert(origmod, origmod);
        //console.log(gmod);
        mat4.rotate(gmod, origmod, (e.clientX - lastmousedownpoint.x) * 0.001, [gmod[1], gmod[5], gmod[9]]);//[0, 1, 0]);//linTransform(gproj, [0, 1, 0]));// [0, 1, 0]);//linTransform(origmod, [0, 1, 0]));// [0, 1, 0]);
        mat4.rotate(gmod, gmod, (e.clientY - lastmousedownpoint.y) * 0.001, [gmod[0], gmod[4], gmod[8]]);//[1, 0, 0]);//linTransform(gproj, [1, 0, 0]));// [1, 0, 0]);//linTransform(origmod, [1, 0, 0]));
        lastmousedownpoint = { x: e.clientX, y: e.clientY };
    }
}

var halfheight = 240;
var halfwidth = 320;
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



function lin3Transform(mat4For3, vec3sarray) {
    var psize = vec3sarray.length / 3;
    var mat = mat4For3;
    var transformedArray = new Array(vec3sarray.length);

    for (var i = 0; i < psize; i++) {
        var vstart = i * 3;
        var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * mat[4] + vec3sarray[vstart + 2] * mat[8],
        vec3sarray[vstart] * mat[1] + vec3sarray[vstart + 1] * mat[5] + vec3sarray[vstart + 2] * mat[9],
        vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * mat[7] + vec3sarray[vstart + 2] * mat[10]];
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

    var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    result = {};
    result.didHit = ((u >= 0) && (v >= 0) && (u + v <= 1));
    if (!result.didHit) {
        return result;
    } else {
        var startz = tri.a.z;
        var cmag = dot00;//Math.sqrt(dot00);
        var cproj = dot02 / cmag;
        var bmag = dot11;//Math.sqrt(dot11);
        var bproj = dot12 / bmag;
        result.hitz = bproj * (tri.b.z - startz) + cproj * (tri.c.z - startz) + startz; //console.log(result.hitz)
        return result;
    }
}



const Makarios = (function () {
    var self = this;

    self.helloworld = function () { console.log('hell oworld'); };

    self.instantiate = function (prim, textureUrl, objectOnFrame, customprops) {
        return StageData.instantiate(prim, textureUrl, objectOnFrame, customprops);
    }
    self.destroy = function (inst) {
        StageData.destroy(inst);
    }

    self.writeToUI = function (text, pos, font, dontClear) {
        const ui = document.querySelector('#uiCanvas');
        const gui = ui.getContext('2d');
        gui.clearRect(0, 0, ui.width, ui.height);
        gui.fillStyle = '#DDBB00';//;'yellow';
        //gui.fillRect(10, 10, 100, 100);// + 400 - now * 10000);
        gui.font = 'bold small-caps 28px serif';
        gui.textBaseline = 'hanging';
        gui.fillText('Welcome to Makarios Labs', ui.width / 4.2, ui.height / 2.1);
    }

    return self;
})();


