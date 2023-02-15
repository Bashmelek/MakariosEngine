// JavaScript source code

const ShadowShader = (function () {

    //stolen i mean adapted from https://github.com/aakshayy/toonshader-webgl/tree/master/shaders credit
    var shadowVsSource = `
        attribute vec4 aVertexPosition;
        attribute float aUseParentMatrix;

        attribute vec2 a_texcoord;

        //uniform mat4 u_view;
        uniform mat4 uProjectionMatrix;//???
        uniform mat4 uModelViewMatrix;
        uniform mat4 u_textureMatrix;//???
        uniform float uMatrixLevel;
        uniform mat4 uParentMatrix;

        uniform mat4 uViewMatrix;//???

        varying vec2 v_texcoord;
        varying vec4 v_projectedTexcoord;

        void main() {
            // Multiply the position by the matrix.
            vec4 pointWorldPos;
                mat4 worldSpaceMat = uModelViewMatrix;
                //if(aUseParentMatrix < uMatrixLevel) {
                //    worldSpaceMat = uParentMatrix;
                //}

          pointWorldPos = worldSpaceMat * aVertexPosition;

          gl_Position = uProjectionMatrix * uViewMatrix * pointWorldPos;
        

          // Pass the texture coord to the fragment shader.
          v_texcoord = a_texcoord;

          v_projectedTexcoord = u_textureMatrix * pointWorldPos;
            //v_projectedTexcoord[2] = v_projectedTexcoord[2] * 2.0;//
        }

    `;
    var shadowFsSource = `
        precision mediump float;

        // Passed in from the vertex shader.
        varying vec2 v_texcoord;
        varying vec4 v_projectedTexcoord;

        uniform vec4 u_colorMult;//???
        uniform sampler2D uSampler;//u_texture;

        void main() {
          vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
          bool inRange =
              projectedTexcoord.x >= 0.0 &&
              projectedTexcoord.x <= 1.0 &&
              projectedTexcoord.y >= 0.0 &&
              projectedTexcoord.y <= 1.0 &&
              projectedTexcoord.z >= 0.0 &&
              projectedTexcoord.z <= 1.0;

          // the 'r' channel has the depth values
          vec4 texColor = texture2D(uSampler, v_texcoord) * u_colorMult;
          float projectedAmount = inRange ? 1.0 : 0.0;
          gl_FragColor = texColor;
        }
    `;



    const depthTextureSize = 2048;// * 4;//4096;//16384;//4096;
    var depthTexture;
    var depthFramebuffer;
    var projScaler = 44.0;

    var canvas, attribute_vertex_position, attribute_vertex_normal, attribute_vertex_useParent, vertex_buffer;
    var wgl, uniform_parentMatrix, uniform_matrixLevel;

    var shaderprogram;

    var shadowColor;

    var uniform_modelViewMatrix, uniform_projectionMatrix, uniform_shadowColor;

    var isLoaded = false;
    var isSet = false;

    var getProjScaler = function () {
        return projScaler;
    };

    var setProjScaler = function (newval) {
        projScaler = newval;
    };

    var drawShadowsToTexture = function (modMat, projMat, vertices, indices, useParentMatrix, objects, lights) {// (projMat, modMat) {
        if (!isLoaded || !isSet || !lights || lights.length == 0) { return; }

        //console.log('drawed dasky?');
        wgl.useProgram(shaderprogram);
        ////wgl.activeTexture(wgl.TEXTURE7);
        //wgl.uniform1i(uniform_projectedTexture, 3);
        wgl.bindFramebuffer(wgl.FRAMEBUFFER, depthFramebuffer);

        ////wgl.enable(wgl.CULL_FACE);
        wgl.enable(wgl.DEPTH_TEST);

        wgl.clearDepth(1.0);                 // Clear everything
        wgl.enable(wgl.DEPTH_TEST);           // Enable depth testing
        wgl.depthFunc(wgl.LEQUAL);            // Near things obscure far things

        //set viewport. Important. Don't forget it!
        wgl.viewport(0, 0, depthTextureSize, depthTextureSize);

        ////wgl.clearColor(0.0, 0.4, 0.0, 1.0);
        wgl.clear(wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);


        textureMatrix = mat4.create();

        wgl.uniformMatrix4fv(
            uniform_textureMatrix,
            false,
            textureMatrix);

        var fullproj = mat4.create();
        var modnew = mat4.create();

        //just to test
        /*
        mat4.rotate(modnew,  // destination matrix
            modnew,  // matrix to rotate
            .192,//.252,//(Date.now() * .001),//-.452,//.7,   // amount to rotate in radians
            [1, 0, 0]); //console.log(Date.now() * .01);
        mat4.rotate(modnew,  // destination matrix
            modnew,  // matrix to rotate
            -1.752,//.7,   // amount to rotate in radians
            [0, 1, 0]);
        //console.log(projScaler);
        mat4.translate(modnew,     // destination matrix
            modnew,     // matrix to translate
            [-projScaler, -18.0, 0.0]);//
        */
        //console.log(lights);
        mat4.translate(modnew,     // destination matrix
            lights[0].lightmat,     // matrix to translate
            [0.0, 0.0, 0.0]);

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
            //console.log(modnew[12] + ',   ' + modnew[14]);

            var gnorm = vec3.create()
            gnorm[0] = lpoint[0]; gnorm[1] = 0.0; gnorm[2] = lpoint[2];
            vec3.normalize(gnorm, gnorm);

            ////mat4.multiply(modnew, transl, modnew);
            mat4.translate(modnew,     // destination matrix
                modnew,     // matrix to translate
                [gnorm[0] * projScaler - lpoint[0] * 1.0 - StageData.objects[0].matrix[12], 0.0 - StageData.objects[0].matrix[13], gnorm[2] * projScaler - lpoint[2] * 1.0 - StageData.objects[0].matrix[14]]);
            //modnew[12] += gnorm[0] * projScaler - lpoint[0];
            //modnew[14] -= gnorm[2] * projScaler - lpoint[2];
            modnew[14] -= projScaler;

            //modnew[12] += lpoint[0];
            //modnew[14] += lpoint[2];
            //modnew[14] = 8;
        }
        
         //testing only
        //var shadowBoundMat = mat4.create();
        //mat4.fromScaling(shadowBoundMat, [54.0, 54.0, 8.0]);
        //StageData.shadowBoundBox = new Array(Primitives.shapes["cube"].positions.length);
        //linTransformRange(StageData.shadowBoundBox, Primitives.shapes["cube"].positions, shadowBoundMat, 0, Primitives.shapes["cube"].positions.length, null);
        //linTransformRange(StageData.shadowBoundBox, StageData.shadowBoundBox, modnew, 0, Primitives.shapes["cube"].positions.length, null);
        //var maxShadowBound = -100.0;
        //var minShadowBound = 100.0;
        //var sb = StageData.shadowBoundBox;
        //for (var i = 2; i < StageData.shadowBoundBox.length; i += 3) {
        //    var zd = sb[i];
        //    if (zd > maxShadowBound) {
        //        maxShadowBound = zd;
        //    }
        //    if (zd < minShadowBound) {
        //        minShadowBound = zd;
        //    }
        //}
        //console.log(minShadowBound + ' toooo ' + maxShadowBound);
        //if (minShadowBound < 0.8) {
        //    console.log(StageData.shadowBoundBox);
        //}

         

        wgl.uniformMatrix4fv(
            uniform_projectionMatrix,
            false,
            projMat);
        //wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer); 
        //wgl.bufferData(wgl.ARRAY_BUFFER,
        //    new Float32Array(vertices),
        //    wgl.STATIC_DRAW);
        //wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer);
        //wgl.vertexAttribPointer(attribute_vertex_position, 3, wgl.FLOAT, false, 0, 0);
        //wgl.enableVertexAttribArray(attribute_vertex_position);


        //const indexBuffer = wgl.createBuffer();
        //wgl.bindBuffer(wgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        //wgl.bufferData(wgl.ELEMENT_ARRAY_BUFFER,
        //    new Uint32Array(indices), wgl.STATIC_DRAW);

        //const useParent = wgl.createBuffer();
        //wgl.bindBuffer(wgl.ARRAY_BUFFER, useParent);
        //wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(useParentMatrix),
        //    wgl.STATIC_DRAW);
        //wgl.vertexAttribPointer(attribute_vertex_useParent, 1, wgl.FLOAT, false, 0, 0);
        //wgl.enableVertexAttribArray(attribute_vertex_useParent);

        var baseParent = mat4.create();
        var baseNorm = mat4.create();
        wgl.uniformMatrix4fv(
                uniform_parentMatrix,
                false,
                baseParent);
        wgl.uniform1f(uniform_matrixLevel, 0.0);
        //for (var i = 0; i < objects.length; i++) {

        wgl.uniformMatrix4fv(
            uniform_viewMatrix,
            false,
            baseParent);

        for (var i = objects.length; i >= 0; i--) {
            //console.log(useParentMatrix);
            if (!objects[i]) { continue; };
            shadowMapObject(objects[i], modnew, 0.0, baseNorm);
        }

        //wgl.drawElements(wgl.TRIANGLES, indices.length, wgl.UNSIGNED_SHORT, 0);//vertices / 3, wgl.UNSIGNED_SHORT, 0);
        //console.log('outlined?');
        //wgl.drawArrays(wgl.TRIANGLE_STRIP, 0, 4);
        //request++;// = 0;

        //reset viewport. Also important. Don't forget it!
        wgl.bindFramebuffer(wgl.FRAMEBUFFER, null);
        wgl.viewport(0, 0, wgl.canvas.width, wgl.canvas.height);
        wgl.activeTexture(wgl.TEXTURE0);
    }


    var shadowMapObject = function (obj, parentmatrix, depth) {

        var mat0 = mat4.create();
        mat4.multiply(mat0,     // destination matrix
            parentmatrix,     // matrix to translate
            obj.matrix);

        //dont seem to need this? yet?
        //var thisMatForNorm = mat4.create();
        //var nMat = mat4.create();
        //mat4.multiply(thisMatForNorm,     // destination matrix
        //    baseMatrixForNorm,     // matrix to translate
        //    obj.matrix);
        //mat4.invert(nMat, thisMatForNorm);
        //mat4.transpose(nMat, nMat);
        //wgl.uniformMatrix4fv(
        //    uniform_normalMatrix,
        //    false,
        //    nMat);

        ////if (obj.shadowColor != null && (obj.shadowColor[0] != shadowColor[0] || obj.shadowColor[1] != shadowColor[1] || obj.shadowColor[2] != shadowColor[2])) {
        ////    shadowColor = obj.shadowColor;
        ////}

        const vertexCount = obj.indices.length;
        const offset = obj.indexOffset || 0;//obj.bufferOffset || 0;
        if (vertexCount > 0) {
            wgl.uniformMatrix4fv(
                uniform_parentMatrix,
                false,
                parentmatrix);
            //console.log(objects[oj].children[0]);
            wgl.uniform1f(uniform_matrixLevel, depth);

            wgl.uniformMatrix4fv(
                uniform_modelViewMatrix,
                false,
                depth > 0.0 ? mat0 : mat0);
            wgl.drawElements(wgl.TRIANGLES, vertexCount, wgl.UNSIGNED_INT, offset * 2);//UNSIGNED_SHORT

            //wgl.uniform1f(uniform_dir, -1.0);
            //wgl.drawElements(wgl.TRIANGLES, vertexCount, wgl.UNSIGNED_INT, offset * 2);
        }

        if (obj.children && obj.children.length > 0) {
            //wgl.uniformMatrix4fv(
            //    uniform_parentMatrix,
            //    false,
            //    mat0);
            ////console.log(objects[oj].children[0]);
            //wgl.uniform1f(uniform_matrixLevel, depth + 1.0);
            for (var c = 0; c < obj.children.length; c++) {
                if (!obj.children[c]) { continue; };
                shadowMapObject(obj.children[c], mat0, depth + 1.0);
            }
            //wgl.uniform1f(uniform_matrixLevel, depth);
            //wgl.uniformMatrix4fv(
            //    uniform_parentMatrix,
            //    false,
            //    parentmatrix);
        }
    }


    var compileOutlineRenderer = function () {
        var vertex_shader = wgl.createShader(wgl.VERTEX_SHADER);
        wgl.shaderSource(vertex_shader, shadowVsSource);
        wgl.compileShader(vertex_shader);

        if (!wgl.getShaderParameter(vertex_shader, wgl.COMPILE_STATUS)) {
            alert("vertex shader:\n" + wgl.getShaderInfoLog(vertex_shader));
            return;
        }

        var fragment_shader = wgl.createShader(wgl.FRAGMENT_SHADER);
        //var source = skyboxFsSource;
        //    "precision highp float;\n";

        //source += document.getElementById("argb-srgb").text;

        //source += document.getElementById("fragment-shader").text;

        wgl.shaderSource(fragment_shader, shadowFsSource);
        wgl.compileShader(fragment_shader);

        if (!wgl.getShaderParameter(fragment_shader, wgl.COMPILE_STATUS)) {
            alert("fragment shader:\n" + wgl.getShaderInfoLog(fragment_shader));
            return;
        }

        var program = wgl.createProgram();
        wgl.attachShader(program, vertex_shader);
        wgl.attachShader(program, fragment_shader);
        wgl.linkProgram(program);

        if (!wgl.getProgramParameter(program, wgl.LINK_STATUS)) {
            alert("linker error:\n" + wgl.getProgramInfoLog(program));
            return;
        }

        wgl.useProgram(program);

        attribute_vertex_position = wgl.getAttribLocation(program, "aVertexPosition");
        ////attribute_vertex_normal = wgl.getAttribLocation(program, "aVertexNormal");
        attribute_vertex_useParent = wgl.getAttribLocation(program, "aUseParentMatrix");
        wgl.enableVertexAttribArray(attribute_vertex_position);
        ////wgl.enableVertexAttribArray(attribute_vertex_normal);
        wgl.enableVertexAttribArray(attribute_vertex_useParent);

        uniform_modelViewMatrix = wgl.getUniformLocation(program, "uModelViewMatrix");
        uniform_projectionMatrix = wgl.getUniformLocation(program, "uProjectionMatrix");
        //uniform_shadowColor = wgl.getUniformLocation(program, "uShadowColor");
        //uniform_outlineWidth = wgl.getUniformLocation(program, "uOutlineWidth");
        ////uniform_normalMatrix = wgl.getUniformLocation(program, "uNormalMatrix");
        uniform_parentMatrix = wgl.getUniformLocation(program, "uParentMatrix");
        //uniform_matrixLevel = wgl.getUniformLocation(program, "uMatrixLevel");


        uniform_viewMatrix = wgl.getUniformLocation(program, "uViewMatrix");
        uniform_textureMatrix = wgl.getUniformLocation(program, "u_textureMatrix");
        ////uniform_projectedTexture = wgl.getUniformLocation(program, "u_projectedTexture");
        //uniform_view = wgl.getUniformLocation(program, "u_view");
        //uniform_dir = wgl.getUniformLocation(program, "udir");

        shaderprogram = program;
    }

    var setup = function (width, color) {
        isSet = false;
        wgl.useProgram(shaderprogram);

        shadowColor = color != null ? color : [1.0, 0.0, 0.0];
        outlineWidth = width != null ? width : -0.02;

        ////wgl.uniform3fv(uniform_shadowColor, shadowColor);


        //test only
        wgl.activeTexture(wgl.TEXTURE1);
        depthTexture = wgl.createTexture();
        //const depthTextureSize = 4096;// 512;// 512;
        wgl.bindTexture(wgl.TEXTURE_2D, depthTexture);
        wgl.texImage2D(
            wgl.TEXTURE_2D,      // target
            0,                  // mip level
            wgl.DEPTH_COMPONENT, // internal format
            depthTextureSize,   // width
            depthTextureSize,   // height
            0,                  // border
            wgl.DEPTH_COMPONENT, // format
            wgl.UNSIGNED_INT,//wgl.UNSIGNED_INT,    // type
            null);              // data
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MAG_FILTER, wgl.NEAREST);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MIN_FILTER, wgl.NEAREST);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_S, wgl.CLAMP_TO_EDGE);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_T, wgl.CLAMP_TO_EDGE);

        wgl.activeTexture(wgl.TEXTURE3);

        depthFramebuffer = wgl.createFramebuffer();
        wgl.bindFramebuffer(wgl.FRAMEBUFFER, depthFramebuffer);
        wgl.framebufferTexture2D(
            wgl.FRAMEBUFFER,       // target
            wgl.DEPTH_ATTACHMENT,  // attachment point  wgl.COLOR_ATTACHMENT0    wgl.DEPTH_ATTACHMENT
            wgl.TEXTURE_2D,        // texture target
            depthTexture,         // texture
            0);                   // mip level

        wgl.activeTexture(wgl.TEXTURE2);

        // create a color texture of the same size as the depth texture
        const unusedTexture = wgl.createTexture();
        wgl.bindTexture(wgl.TEXTURE_2D, unusedTexture);
        wgl.texImage2D(
            wgl.TEXTURE_2D,
            0,
            wgl.RGBA,
            depthTextureSize,
            depthTextureSize,
            0,
            wgl.RGBA,
            wgl.UNSIGNED_BYTE,
            null,
        );
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MAG_FILTER, wgl.NEAREST);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MIN_FILTER, wgl.NEAREST);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_S, wgl.CLAMP_TO_EDGE);
        wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_WRAP_T, wgl.CLAMP_TO_EDGE);

        // attach it to the framebuffer
        wgl.framebufferTexture2D(
            wgl.FRAMEBUFFER,        // target
            wgl.COLOR_ATTACHMENT0,  // attachment point
            wgl.TEXTURE_2D,         // texture target
            unusedTexture,         // texture
            0);                    // mip level


        wgl.activeTexture(wgl.TEXTURE0);
        
        //have to remove the framebuffer so we can render to canvas
        wgl.bindFramebuffer(wgl.FRAMEBUFFER, null);

        isSet = true;
    }

    var getDepthTexture = function () {
        return depthTexture;
    }

    var initialize = (function () {
        canvas = document.getElementById("glCanvas");
        wgl = canvas.getContext("webgl");
        if (!wgl)
            wgl = null;// canvas.getContext("experimental-webgl");

        if (!wgl) {
            alert("could not get webgl context");
            return;
        }

        //thank you q9f and ratchet freak https://computergraphics.stackexchange.com/questions/3637/how-to-use-32-bit-integers-for-element-indices-in-webgl-1-0
        var ext = wgl.getExtension('OES_element_index_uint');

        //thank you https://webglfundamentals.org/webgl/lessons/webgl-shadows.html tyref: funglshadows
        const ext2 = wgl.getExtension('WEBGL_depth_texture');
        if (!ext2) {
            return alert('need WEBGL_depth_texture');
        }

        ////console.log(ext);
        wgl.clearColor(0.0, 0.0, 0.0, 1.0);

        vertex_buffer = wgl.createBuffer();
        wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer);
        var vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
        wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(vertices), wgl.STATIC_DRAW);

        compileOutlineRenderer();

        isLoaded = true;
    })();

    return {
        'drawShadowsToTexture': drawShadowsToTexture,
        'setup': setup,
        'getDepthTexture': getDepthTexture,
        'getProjScaler': getProjScaler,
        'setProjScaler': setProjScaler,
        'textureDim': depthTextureSize
    }

})();


