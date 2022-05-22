// JavaScript source code

const OutlineRenderer = (function () {

    //stolen i mean adapted from https://github.com/aakshayy/toonshader-webgl/tree/master/shaders credit
    var outlineVsSource = `
            attribute vec4 aVertexPosition; // vertex position
            attribute vec3 aVertexNormal; // vertex normal
            attribute float aUseParentMatrix;

            //uniform mat4 upvmMatrix; // the project view model matrix
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            uniform mat4 uNormalMatrix;
            uniform mat4 uParentMatrix;
            uniform float uMatrixLevel;
            uniform float udir;

            uniform float uOutlineWidth; // width of the outline


            varying highp vec3 vDebug;

            void main(void) {
                highp vec3 dummy = aVertexNormal;
                ////highp vec4 worldBase = aVertexPosition;
                ////highp vec4 worldOutline = aVertexPosition;

                ////dummy = vec3(1.0, 0.0, 0.0);
                ////dummy = vec3(5.0 * aVertexNormal[0], 5.0 * aVertexNormal[1], 5.0 * aVertexNormal[2]);

                //if(aUseParentMatrix >= uMatrixLevel) {
                //    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;//aVertexPosition;//uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                //}
                highp vec4 vertexZ;// = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition);// + vec4(0.0, 0.0, 0.0, 1.0) * uOutlineWidth);
                
                //if(aUseParentMatrix < uMatrixLevel) {
                //    vertexZ = uProjectionMatrix * uParentMatrix * vec4(aVertexPosition);//aVertexPosition;//uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                //}

                if(aUseParentMatrix >= uMatrixLevel) {
                    ////worldBase =  uModelViewMatrix * vec4(aVertexPosition);
                    ////worldOutline =  uModelViewMatrix * vec4(aVertexPosition + (vec4(normalize(aVertexNormal), udir) * uOutlineWidth));
                    vertexZ = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition);
                    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition + (vec4(normalize(aVertexNormal), udir) * uOutlineWidth));//aVertexPosition;//uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                }
                else {
                    vertexZ = uProjectionMatrix * uParentMatrix * vec4(aVertexPosition);
                    gl_Position = uProjectionMatrix * uParentMatrix * vec4(aVertexPosition + (vec4(normalize(aVertexNormal), udir) * uOutlineWidth));//aVertexPosition;//uProjectionMatrix * uParentMatrix * aVertexPosition;
                }

                //vDebug = vec3(0.0, (vertexZ[2] - gl_Position[2]) * 0.0, 0.0);
                if(gl_Position[2]/gl_Position[3] <= vertexZ[2]/vertexZ[3] - 0.0005)
                {
                    gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);
                    ////gl_Position = vec4(gl_Position[0], gl_Position[1]+ 0.055, gl_Position[2] + 0.055, gl_Position[3]);
                //vDebug = vec3(0.0, (vertexZ[2] - gl_Position[2]) * 100.0, 0.0);
                }
                else
                {
                    gl_Position[2] += 0.015;
                    ////gl_Position[2] = vertexZ[2] + 0.005;//// += 0.005;
                }

                //if(abs((worldBase.x) - (worldOutline.x)) > 0.003 || abs((worldBase.y) - (worldOutline.y)) > 0.003 || abs((worldBase.z) - (worldOutline.z)) > 0.003)//(sqrt(abs(dot(vertexZ.xyz / vertexZ.w, gl_Position.xyz / gl_Position.w))) > 10.13) ////( (50.0 * abs(distance(vertexZ.xyz / vertexZ.w, gl_Position.xyz / gl_Position.w))) >= 1000000.32)
                //if(abs(distance(worldBase.xyz / worldBase.w, worldOutline.xyz / worldOutline.w)) > .5)
                //{
                //    ////gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);
                //}
                //vDebug = vec3(0.0, (gl_Position[2] - vertexZ[2]) * 1.0, 0.0);
                //vDebug = vec3(50.0 * abs(distance(vertexZ.xyz / vertexZ.w, gl_Position.xyz / gl_Position.w)), 50.0 *abs(distance(gl_Position.xyz / gl_Position.w, vertexZ.xyz / vertexZ.w)), 0.0);
                //vDebug = vec3(90.0 * abs((worldBase.x) - (worldOutline.x)), 90.0 * abs((worldBase.y) - (worldOutline.y)), 90.0 * abs((worldBase.z) - (worldOutline.z)));
            }
    `;
    var outlineFsSource = `
            precision mediump float; // set float to medium precision
            uniform vec3 uOutlineColor; //outline Color

            varying highp vec3 vDebug;
            void main(void) {    
    
                ////gl_FragColor = vec4(vDebug, 1.0);// vec4(uOutlineColor, 1.0);//vec4(1.0, 1.0 - (vDebug[1] * 1.0), 0.0, 1.0);//vec4(uOutlineColor, 1.0);
                gl_FragColor = vec4(uOutlineColor, 1.0);

            } // end main
    `;



    var canvas, attribute_vertex_position, attribute_vertex_normal, attribute_vertex_useParent, vertex_buffer, normal_buffer;
    var wgl, uniform_parentMatrix, uniform_matrixLevel, uniform_normalMatrix;

    var shaderprogram;

    var outlineColor, outlineWidth;

    var uniform_camera_up, uniform_camera_right, uniform_camera_origin;
    var uniform_camera_dir, uniform_camera_near, uniform_camera_far;
    var uniform_cubemap, cubemap_texture, cubemap_image, cubemap_counter;

    var uniform_modelViewMatrix, uniform_projectionMatrix, uniform_outlineColor, uniform_outlineWidth;
    var last_x, last_y;
    var request = 0;

    var camera = {
        up: [0.0, 1.0, 0.0],
        right: [1.0, 0.0, 0.0],
        dir: [0.0, 0.0, -1.0],
        origin: [0.0, 0.0, 0.0],
        near: 2.5,//0.1,//2.5,
        far: 100.0
    };
    var isLoaded = false;
    var isSet = false;
    var cubemap_counter = 0;

    var drawOutline = function (modMat, projMat, vertices, normals, indices, useParentMatrix, objects) {// (projMat, modMat) {
        if (!isLoaded || !isSet) { return; }

        //console.log('drawed dasky?');
        wgl.useProgram(shaderprogram);

        //skyg_l.clear(skyg_l.COLOR_BUFFER_BIT);

        wgl.clearDepth(1.0);                 // Clear everything
        wgl.enable(wgl.DEPTH_TEST);           // Enable depth testing
        wgl.depthFunc(wgl.LEQUAL);            // Near things obscure far things
                
        //wgl.uniformMatrix4fv(uniform_modelViewMatrix,
        //    false, modMat);
        //wgl.uniformMatrix4fv(uniform_projectionMatrix,
        ////    false, projMat);
        //wgl.uniform3fv(uniform_outlineColor, [1.0, 1.0, 0.0]);
        //wgl.uniform1f(uniform_outlineWidth, -0.02);

        var fullproj = mat4.create();
        mat4.multiply(fullproj, projMat, modMat);//gproj, gmod
        wgl.uniformMatrix4fv(
            uniform_projectionMatrix,
            false,
            fullproj);
        var basemodelView = mat4.create();
        //wgl.uniformMatrix4fv(uniform_modelViewMatrix,
        //    false, basemodelView);

        //console.log(indices)
        wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer); 
        wgl.bufferData(wgl.ARRAY_BUFFER,
            new Float32Array(vertices),
            wgl.STATIC_DRAW);
        wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer);
        wgl.vertexAttribPointer(attribute_vertex_position, 3, wgl.FLOAT, false, 0, 0);
        wgl.enableVertexAttribArray(attribute_vertex_position);

        wgl.bindBuffer(wgl.ARRAY_BUFFER, normal_buffer);
        wgl.bufferData(wgl.ARRAY_BUFFER,
            new Float32Array(normals),
            wgl.STATIC_DRAW);
        wgl.bindBuffer(wgl.ARRAY_BUFFER, normal_buffer);
        wgl.vertexAttribPointer(attribute_vertex_normal, 3, wgl.FLOAT, false, 0, 0);
        wgl.enableVertexAttribArray(attribute_vertex_normal);

        const indexBuffer = wgl.createBuffer();
        wgl.bindBuffer(wgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        wgl.bufferData(wgl.ELEMENT_ARRAY_BUFFER,
            new Uint32Array(indices), wgl.STATIC_DRAW);

        const useParent = wgl.createBuffer();
        wgl.bindBuffer(wgl.ARRAY_BUFFER, useParent);
        wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(useParentMatrix),
            wgl.STATIC_DRAW);
        wgl.vertexAttribPointer(attribute_vertex_useParent, 1, wgl.FLOAT, false, 0, 0);
        wgl.enableVertexAttribArray(attribute_vertex_useParent);

        //var nMat = mat4.create();
        ////mat4.multiply(thisMatForNorm,     // destination matrix
        ////    baseMatrixForNorm,     // matrix to translate
        ////    objects[oj].matrix);
        //mat4.invert(nMat, nMat);
        //mat4.transpose(nMat, nMat);
        //gl.uniformMatrix4fv(
        //    programInfo.uniformLocations.normalMatrix,
        //    false,
        //    nMat);

        var baseParent = mat4.create();
        var baseNorm = mat4.create();
        wgl.uniformMatrix4fv(
                uniform_parentMatrix,
                false,
                baseParent);
        wgl.uniform1f(uniform_matrixLevel, 0.0);
        //for (var i = 0; i < objects.length; i++) {
        for (var i = objects.length; i >= 0; i--) {
            //console.log(useParentMatrix);
            if (!objects[i]) { continue; };
            outlineObject(objects[i], baseParent, 0.0, baseNorm)
        }

        //wgl.drawElements(wgl.TRIANGLES, indices.length, wgl.UNSIGNED_SHORT, 0);//vertices / 3, wgl.UNSIGNED_SHORT, 0);
        //console.log('outlined?');
        //wgl.drawArrays(wgl.TRIANGLE_STRIP, 0, 4);
        //request++;// = 0;
    }


    var outlineObject = function (obj, parentmatrix, depth, baseMatrixForNorm) {

        var mat0 = mat4.create();
        mat4.multiply(mat0,     // destination matrix
            parentmatrix,     // matrix to translate
            obj.matrix);
        wgl.uniformMatrix4fv(
            uniform_modelViewMatrix,
            false,
            depth > 0.0 ? mat0 : mat0);

        //dont seem to need this? yet?
        var thisMatForNorm = mat4.create();
        var nMat = mat4.create();
        mat4.multiply(thisMatForNorm,     // destination matrix
            baseMatrixForNorm,     // matrix to translate
            obj.matrix);
        mat4.invert(nMat, thisMatForNorm);
        mat4.transpose(nMat, nMat);
        wgl.uniformMatrix4fv(
            uniform_normalMatrix,
            false,
            nMat);

        if (obj.outlineColor != null && (obj.outlineColor[0] != outlineColor[0] || obj.outlineColor[1] != outlineColor[1] || obj.outlineColor[2] != outlineColor[2])) {
            outlineColor = obj.outlineColor;
            wgl.uniform3fv(uniform_outlineColor, obj.outlineColor);
        }

        const vertexCount = obj.indices.length;
        const offset = obj.indexOffset || 0;//obj.bufferOffset || 0;
        if (vertexCount > 0) {
            ////console.log(mat0);
            wgl.uniform1f(uniform_dir, 1.0);
            wgl.drawElements(wgl.TRIANGLES, vertexCount, wgl.UNSIGNED_INT, offset * 2);//UNSIGNED_SHORT

            wgl.uniform1f(uniform_dir, -1.0);
            wgl.drawElements(wgl.TRIANGLES, vertexCount, wgl.UNSIGNED_INT, offset * 2);
        }

        if (obj.children && obj.children.length > 0) {
            wgl.uniformMatrix4fv(
                uniform_parentMatrix,
                false,
                mat0);
            //console.log(objects[oj].children[0]);
            wgl.uniform1f(uniform_matrixLevel, depth + 1.0);
            for (var c = 0; c < obj.children.length; c++) {
                if (!obj.children[c]) { continue; };
                outlineObject(obj.children[c], mat0, depth + 1.0, thisMatForNorm);
            }
            wgl.uniform1f(uniform_matrixLevel, depth);
            wgl.uniformMatrix4fv(
                uniform_parentMatrix,
                false,
                parentmatrix);
        }
    }


    var compileOutlineRenderer = function () {
        var vertex_shader = wgl.createShader(wgl.VERTEX_SHADER);
        wgl.shaderSource(vertex_shader, outlineVsSource);
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

        wgl.shaderSource(fragment_shader, outlineFsSource);
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
        attribute_vertex_normal = wgl.getAttribLocation(program, "aVertexNormal");
        attribute_vertex_useParent = wgl.getAttribLocation(program, "aUseParentMatrix");
        wgl.enableVertexAttribArray(attribute_vertex_position);
        wgl.enableVertexAttribArray(attribute_vertex_normal);
        wgl.enableVertexAttribArray(attribute_vertex_useParent);

        uniform_modelViewMatrix = wgl.getUniformLocation(program, "uModelViewMatrix");
        uniform_projectionMatrix = wgl.getUniformLocation(program, "uProjectionMatrix");
        uniform_outlineColor = wgl.getUniformLocation(program, "uOutlineColor");
        uniform_outlineWidth = wgl.getUniformLocation(program, "uOutlineWidth");
        uniform_normalMatrix = wgl.getUniformLocation(program, "uNormalMatrix");
        uniform_parentMatrix = wgl.getUniformLocation(program, "uParentMatrix");
        uniform_matrixLevel = wgl.getUniformLocation(program, "uMatrixLevel");
        uniform_dir = wgl.getUniformLocation(program, "udir");

        shaderprogram = program;
    }

    var setup = function (width, color) {
        isSet = false;

        outlineColor = color != null ? color : [1.0, 0.0, 0.0];
        outlineWidth = width != null ? width : -0.02;

        wgl.uniform3fv(uniform_outlineColor, outlineColor);
        wgl.uniform1f(uniform_outlineWidth, outlineWidth);

        isSet = true;
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
        ////console.log(ext);
        wgl.clearColor(0.0, 0.0, 0.0, 1.0);

        vertex_buffer = wgl.createBuffer();
        normal_buffer = wgl.createBuffer();
        wgl.bindBuffer(wgl.ARRAY_BUFFER, vertex_buffer);
        var vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
        wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(vertices), wgl.STATIC_DRAW);

        compileOutlineRenderer();

        isLoaded = true;
    })();

    return {
        'drawOutline': drawOutline,
        'setup': setup,
    }

})();


