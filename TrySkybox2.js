const mat4 = glMatrix.mat4;

//copied from https://webgl2fundamentals.org/webgl/lessons/webgl-skybox.html 

//#version 300 es
var vertexShaderSource = `#version 300 es

in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1.0;
}
`;
//#version 300 es
var fragmentShaderSource = `#version 300 es
precision highp float;

uniform samplerCube u_skybox;
uniform mat4 u_viewMatrix;

in vec4 v_position;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 t = u_viewMatrix * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}
`;


//these two alternative shaders are from https://github.com/lesnitsky/webgl-month/blob/dev/src/shaders/
var skyboxVsSource = `
            attribute vec3 a_position;
            varying vec3 vTexCoord;

            uniform mat4 projectionMatrix;
            uniform mat4 u_viewMatrix;

            void main() {
                vTexCoord = a_position;//vec3(u_viewMatrix * vec4(a_position, 0.01)); //a_position;
                gl_Position = u_viewMatrix * vec4(a_position, 0.01); //vec4(a_position, 0.01);//u_viewMatrix * vec4(a_position, 0.01); //projectionMatrix * u_viewMatrix * vec4(a_position, 0.01);
    }
    `;
var skyboxFsSource = `
        precision mediump float;

        varying vec3 vTexCoord;
        uniform samplerCube u_skybox;

        void main() {
            //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);;//vec4(1.0, 0.0, 0.0, 1.0);
            gl_FragColor = textureCube(u_skybox, vTexCoord);
    }
    `;

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


//
//from the mozzilla tutorial
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

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector('#glCanvas');
    const ui = document.querySelector('#uiCanvas');//uiCanvas

    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // Use our boilerplate utils to compile the shaders and link into a program
    var program = initShaderProgram(gl, skyboxVsSource, skyboxFsSource);//(gl, vertexShaderSource, fragmentShaderSource);;// webglUtils.createProgramFromSources(gl,
        //[vertexShaderSource, fragmentShaderSource]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // lookup uniforms
    var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
    var viewDirectionProjectionInverseLocation =
        gl.getUniformLocation(program, "u_viewMatrix");

    // Create a vertex array object (attribute state)
    ////var vao = gl.createVertexArray();

    // and make it the one we're currently working with
    ////gl.bindVertexArray(vao);

    // Create a buffer for positions
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put the positions in the buffer
    setGeometry(gl);

    //gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);
    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);


    //note from https://learnopengl.com/Advanced-OpenGL/Cubemaps yes its opengl and not webgl but close enough right!
    //GL_TEXTURE_CUBE_MAP_POSITIVE_X 	Right
    //GL_TEXTURE_CUBE_MAP_NEGATIVE_X 	Left
    //GL_TEXTURE_CUBE_MAP_POSITIVE_Y 	Top
    //GL_TEXTURE_CUBE_MAP_NEGATIVE_Y 	Bottom
    //GL_TEXTURE_CUBE_MAP_POSITIVE_Z 	Back
    //GL_TEXTURE_CUBE_MAP_NEGATIVE_Z 	Front
    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: 'skybox/right.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: 'skybox/left.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: 'skybox/top.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: 'skybox/bottom.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: 'skybox/back.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: 'skybox/front.jpg',
        },
    ];
    var loadcont = 0;
    faceInfos.forEach((faceInfo) => {
        const { target, url } = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function () {
            // Now that the image has loaded make copy it to the texture.
            //////gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            //////gl.texImage2D(target, level, internalFormat, format, type, image);
            //////gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
        image.onload = function () {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            loadcont++;
            console.log(loadcont)
            if (loadcont == 6) {
                console.log('mipping!')
                setTimeout(function () { gl.generateMipmap(gl.TEXTURE_CUBE_MAP); }, 0);

                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

                console.log(texture);
                requestAnimationFrame(drawScene);
            }
            //////gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        };
    });


    function degToRad(d) {
        return d * Math.PI / 180.0;
    }

    var county = -100;
    for (var c = 0; c < 100; c++) {
        //console.log(c * county);
        county++;
    }

    //gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);


    //var fieldOfViewRadians = degToRad(60.0);

    //requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene(time) {
        // convert to seconds
        time *= 0.001;

        //webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        gl.clearColor(0.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Bind the attribute/buffer set we want.
        ////gl.bindVertexArray(vao);

        // Compute the projection matrix
        ////var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 160.0;
        var projectionMatrix = mat4.create();
        //console.log(mat4);
        //console.log(mat4.perspective);
        mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);
        mat4.translate(projectionMatrix,     // destination matrix
            projectionMatrix,     // matrix to translate
                [-7.0, 1.0, -12.0]);
        //    mat4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        // camera going in circle 2 units from origin looking at origin
        var cameraPosition = [Math.cos(time * .1), 0, Math.sin(time * .1)];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        /*var cameraMatrix = mat4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = mat4.inverse(cameraMatrix);

        // We only care about direciton so remove the translation
        viewMatrix[12] = 0;
        viewMatrix[13] = 0;
        viewMatrix[14] = 0;

        var viewDirectionProjectionMatrix =
            mat4.multiply(projectionMatrix, viewMatrix);
        var viewDirectionProjectionInverseMatrix =
            mat4.inverse(viewDirectionProjectionMatrix);

        // Set the uniforms
        gl.uniformMatrix4fv(
            viewDirectionProjectionInverseLocation, false,
            viewDirectionProjectionInverseMatrix);*/
        var altmat = mat4.create();
        mat4.perspective(altmat,
            fieldOfView,
            aspect,
            zNear,
            zFar);
        //mat4.translate(altmat,     // destination matrix
        //    altmat,     // matrix to translate
        //    [0.0, 0.0, -2.5]);
        mat4.invert(altmat, altmat);
        //mat4.rotate(altmat, altmat, 1.5, [1.0, 0.0, 0.0]);
        mat4.translate(altmat,     // destination matrix
            altmat,     // matrix to translate
            [0.0, 0.0, -1.6]);
        ////console.log(altmat);
        gl.uniformMatrix4fv(
            viewDirectionProjectionInverseLocation, false,
            altmat);//projectionMatrix);
        
        // Tell the shader to use texture unit 0 for u_skybox
        gl.uniform1i(skyboxLocation, 0);//gl.TEXTURE_CUBE_MAP

        // let our quad pass the depth test at 1.0
        gl.depthFunc(gl.LEQUAL);


        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        //console.log(texture);


        //////var positionBuffer = gl.createBuffer();
        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        //////gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put the positions in the buffer
        //////setGeometry(gl);
        //State.vertexBuffer.bind(gl);
        //gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 48);//6

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with the values that define a quad.
function setGeometry(gl) {
    //var positions = new Float32Array(
    //    [
    //        -1, -1,
    //        1, -1,
    //        -1, 1,
    //        -1, 1,
    //        1, -1,
    //        1, 1,
    //    ]);
    var positions = new Float32Array(
        [

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,

            1.0, -1.0, 1.0,
            //1.0, -1.0, -1.0,
            //1.0, 1.0, -1.0,

            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,

            -1.0, 1.0, 1.0,
            //1.0, 1.0, 1.0,
            //-1.0, -1.0, 1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0,

        ]);
    positions = new Float32Array(
        [
            //1.0, 1.0, 1.0,

            //-1.0, 1.0, 1.0,
            ////1.0, 1.0, 1.0,
            ////-1.0, -1.0, 1.0,

            //// Bottom face
            //-1.0, -1.0, -1.0,


            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, -1.0, -1.0,

            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, 1.0,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

main();
