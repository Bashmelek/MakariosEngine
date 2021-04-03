
const SkyboxRenderer = (function () {

    //stolen i mean adapted from https://github.com/xdsopl/webgl/blob/master/cubemap.html
    var skyboxVsSource = `
            attribute vec2 attribute_vertex_position;
        uniform vec3 uniform_camera_up;
        uniform vec3 uniform_camera_right;
        uniform vec3 uniform_camera_dir;
        uniform float uniform_camera_near;
        uniform float uniform_camera_far;
        varying vec3 varying_pixel_position;
        void main()
        {
        gl_Position = vec4(uniform_camera_far * attribute_vertex_position, uniform_camera_far, uniform_camera_far);
        varying_pixel_position =
        attribute_vertex_position[0] * uniform_camera_right +
        attribute_vertex_position[1] * uniform_camera_up +
        uniform_camera_dir * uniform_camera_near;
        }
    `;
    var skyboxFsSource = `
precision highp float;


        
float srgb(float v)
        {
        v = clamp(v, 0.0, 1.0);
        float K0 = 0.03928;
        float a = 0.055;
        float phi = 12.92;
        float gamma = 2.4;
        return v <= K0 / phi ? v * phi : (1.0 + a) * pow(v, 1.0 / gamma) - a;
        }
        float linear(float v)
        {
        v = clamp(v, 0.0, 1.0);
        float K0 = 0.03928;
        float a = 0.055;
        float phi = 12.92;
        float gamma = 2.4;
        return v <= K0 ? v / phi : pow((v + a) / (1.0 + a), gamma);
        }
        vec4 argb(vec3 c)
        {
        return vec4(srgb(c.r), srgb(c.g), srgb(c.b), 1.0);
        }
        vec3 texture(samplerCube sampler, vec3 c)
        {
        vec3 s = textureCube(sampler, c).rgb;
        return vec3(linear(s.r), linear(s.g), linear(s.b));
        }


        varying vec3 varying_pixel_position;
        uniform samplerCube uniform_cubemap;
        void main()
        {
            vec3 dir = normalize(varying_pixel_position);
            vec3 sample = texture(uniform_cubemap, vec3(-1.0, 1.0, 1.0) * dir);
            gl_FragColor = argb(sample);
        }
    `;


    ////var canvas, gl, attribute_vertex_position, quad_buffer;
    var skygl;

    var skyprogram;

    var uniform_camera_up, uniform_camera_right, uniform_camera_origin;
    var uniform_camera_dir, uniform_camera_near, uniform_camera_far;
    var uniform_cubemap, cubemap_texture, cubemap_image, cubemap_counter;
    var last_x, last_y;
    var request = 0;

    var camera = {
        up: [0.0, 1.0, 0.0],
        right: [1.0, 0.0, 0.0],
        dir: [0.0, 0.0, -1.0],
        origin: [0.0, 0.0, 0.0],
        near: 2.5,
        far: 100.0
    };
    var isLoaded = false;
    var cubemap_counter = 0;

    var drawSkybox = function ( ) {
        if (!isLoaded) { return; }

        //console.log('drawed dasky?');
        var skyg_l = skygl;
        skygl.useProgram(skyprogram);

        //skyg_l.clear(skyg_l.COLOR_BUFFER_BIT);

        skyg_l.clearDepth(1.0);                 // Clear everything
        skyg_l.enable(skyg_l.DEPTH_TEST);           // Enable depth testing
        skyg_l.depthFunc(skyg_l.LEQUAL);            // Near things obscure far things
        ////skyg_l.clear(skyg_l.COLOR_BUFFER_BIT); //return;
        //if (++request % 2 != 0) { return; }

        skyg_l.uniform3f(uniform_camera_up, camera.up[0], camera.up[1], camera.up[2]);

        var rotation = glMatrix.mat4.create();
        mat4.rotate(rotation, rotation, 0.01 * 0.1, [0, 1, 0]);
        camera.right = lin3Transform(rotation, camera.right)
        camera.dir = lin3Transform(rotation, camera.dir)

        skyg_l.uniform3fv(uniform_camera_right, camera.right);//camera.right[0], camera.right[1], camera.right[2]);
        skyg_l.uniform3fv(uniform_camera_origin, camera.origin);//[0], camera.origin[1], camera.origin[2]);
        skyg_l.uniform3fv(uniform_camera_dir, camera.dir);//[0], camera.dir[1], camera.dir[2]);
        skyg_l.uniform1f(uniform_camera_near, camera.near);
        skyg_l.uniform1f(uniform_camera_far, 190.0);//camera.far);
        skyg_l.uniform1i(uniform_cubemap, 0);
        skyg_l.bindBuffer(skyg_l.ARRAY_BUFFER, quad_buffer);
        skyg_l.vertexAttribPointer(attribute_vertex_position, 2, skyg_l.FLOAT, false, 0, 0);
        skyg_l.drawArrays(skyg_l.TRIANGLE_STRIP, 0, 4);
        //request++;// = 0;
    }

    var compileSkyboxRenderer = function() {
        var vertex_shader = skygl.createShader(skygl.VERTEX_SHADER);
        skygl.shaderSource(vertex_shader, skyboxVsSource);
        skygl.compileShader(vertex_shader);

        if (!skygl.getShaderParameter(vertex_shader, skygl.COMPILE_STATUS)) {
            alert("vertex shader:\n" + skygl.getShaderInfoLog(vertex_shader));
            return;
        }

        var fragment_shader = skygl.createShader(skygl.FRAGMENT_SHADER);
        //var source = skyboxFsSource;
        //    "precision highp float;\n";

        //source += document.getElementById("argb-srgb").text;

        //source += document.getElementById("fragment-shader").text;

        skygl.shaderSource(fragment_shader, skyboxFsSource);
        skygl.compileShader(fragment_shader);

        if (!skygl.getShaderParameter(fragment_shader, skygl.COMPILE_STATUS)) {
            alert("fragment shader:\n" + skygl.getShaderInfoLog(fragment_shader));
            return;
        }

        var program = skygl.createProgram();
        skygl.attachShader(program, vertex_shader);
        skygl.attachShader(program, fragment_shader);
        skygl.linkProgram(program);

        if (!skygl.getProgramParameter(program, skygl.LINK_STATUS)) {
            alert("linker error:\n" + skygl.getProgramInfoLog(program));
            return;
        }

        skygl.useProgram(program);

        attribute_vertex_position = skygl.getAttribLocation(program, "attribute_vertex_position");
        skygl.enableVertexAttribArray(attribute_vertex_position);
        uniform_camera_up = skygl.getUniformLocation(program, "uniform_camera_up");
        uniform_camera_right = skygl.getUniformLocation(program, "uniform_camera_right");
        uniform_camera_origin = skygl.getUniformLocation(program, "uniform_camera_origin");
        uniform_camera_dir = skygl.getUniformLocation(program, "uniform_camera_dir");
        uniform_camera_near = skygl.getUniformLocation(program, "uniform_camera_near");
        uniform_camera_far = skygl.getUniformLocation(program, "uniform_camera_far");
        uniform_cubemap = skygl.getUniformLocation(program, "uniform_cubemap");

        skyprogram = program;
    }


    var onload_cubemap = function () {
        if (++cubemap_counter < 6)
            return;
        cubemap_texture = skygl.createTexture();
        skygl.bindTexture(skygl.TEXTURE_CUBE_MAP, cubemap_texture);
        // wtf? no SRGB in webgl?
        for (var i = 0; i < 6; i++)
            skygl.texImage2D(skygl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, skygl.RGBA, skygl.RGBA, skygl.UNSIGNED_BYTE, cubemap_image[i]);
        // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // linear interpolation in srgb color space .. just great :(
        skygl.texParameteri(skygl.TEXTURE_CUBE_MAP, skygl.TEXTURE_MAG_FILTER, skygl.LINEAR);
        skygl.texParameteri(skygl.TEXTURE_CUBE_MAP, skygl.TEXTURE_MIN_FILTER, skygl.LINEAR);
        isLoaded = true;
        console.log('skyboxxer isLoaded');
        //draw();
    };
    var load_cubemap = function (src) {
        cubemap_counter = 0;
        cubemap_image = [];
        for (var i = 0; i < 6; i++) {
            cubemap_image[i] = new Image();
            cubemap_image[i].onload = onload_cubemap;
            cubemap_image[i].src = src[i];
        }
    };


    var initialize = (function () {
        canvas = document.getElementById("glCanvas");
        skygl = canvas.getContext("webgl");
        if (!skygl)
            skygl = canvas.getContext("experimental-webgl");

        if (!skygl) {
            alert("could not get webgl context");
            return;
        }

        skygl.clearColor(0.0, 0.0, 0.0, 1.0);

        quad_buffer = skygl.createBuffer();
        skygl.bindBuffer(skygl.ARRAY_BUFFER, quad_buffer);
        var vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
        skygl.bufferData(skygl.ARRAY_BUFFER, new Float32Array(vertices), skygl.STATIC_DRAW);

        compileSkyboxRenderer();

        var cubemap = [];
        var sides = ["posx", "negx", "posy", "negy", "posz", "negz"];
        for (var i = 0; i < 6; i++)
            cubemap.push("skybox" + "/" + sides[i] + ".jpg");//cubemap.push("cubemap" + "/" + sides[i] + ".jpg");
        load_cubemap(cubemap);

        console.log('starten skyboxxer');
        //draw();
        //console.log('add listner');
        //const ui = document.querySelector('#uiCanvas');
        //ui.addEventListener("mousedown", mouse_down, false);
        //document.addEventListener("mouseup", mouse_up, false);
    })();

    return { 'drawSkybox': drawSkybox}

})();
