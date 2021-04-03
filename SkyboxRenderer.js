
const SkyboxRenderer = (function () {

    //stolen i mean adapted from https://github.com/xdsopl/webgl/blob/master/cubemap.html
    var skyboxVsSource = `
            attribute vec2 attribute_vertex_position;
        uniform vec3 uniform_camera_up;
        uniform vec3 uniform_camera_right;
        uniform vec3 uniform_camera_dir;
        uniform float uniform_camera_near;
        varying vec3 varying_pixel_position;
        void main()
        {
        gl_Position = vec4(attribute_vertex_position, 0.0, 1.0);
        varying_pixel_position =
        attribute_vertex_position[0] * uniform_camera_right +
        attribute_vertex_position[1] * uniform_camera_up +
        uniform_camera_near * uniform_camera_dir;
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
    var camera = {
        up: [0.0, 1.0, 0.0],
        right: [1.0, 0.0, 0.0],
        dir: [0.0, 0.0, -1.0],
        origin: [0.0, 0.0, 0.0],
        near: 2.5,
        far: 100.0
    };

    var drawSkybox = function(gl, ) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3f(uniform_camera_up, camera.up[0], camera.up[1], camera.up[2]);
        gl.uniform3f(uniform_camera_right, camera.right[0], camera.right[1], camera.right[2]);
        gl.uniform3f(uniform_camera_origin, camera.origin[0], camera.origin[1], camera.origin[2]);
        gl.uniform3f(uniform_camera_dir, camera.dir[0], camera.dir[1], camera.dir[2]);
        gl.uniform1f(uniform_camera_near, camera.near);
        gl.uniform1f(uniform_camera_far, camera.far);
        gl.uniform1i(uniform_cubemap, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
        gl.vertexAttribPointer(attribute_vertex_position, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        request = 0;
    }

    var compileSkyboxRenderer = function() {
        var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertex_shader, skyboxVsSource);
        gl.compileShader(vertex_shader);

        if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
            alert("vertex shader:\n" + gl.getShaderInfoLog(vertex_shader));
            return;
        }

        var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
        //var source = skyboxFsSource;
        //    "precision highp float;\n";

        //source += document.getElementById("argb-srgb").text;

        //source += document.getElementById("fragment-shader").text;

        gl.shaderSource(fragment_shader, skyboxFsSource);
        gl.compileShader(fragment_shader);

        if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
            alert("fragment shader:\n" + gl.getShaderInfoLog(fragment_shader));
            return;
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("linker error:\n" + gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        attribute_vertex_position = gl.getAttribLocation(program, "attribute_vertex_position");
        gl.enableVertexAttribArray(attribute_vertex_position);
        uniform_camera_up = gl.getUniformLocation(program, "uniform_camera_up");
        uniform_camera_right = gl.getUniformLocation(program, "uniform_camera_right");
        uniform_camera_origin = gl.getUniformLocation(program, "uniform_camera_origin");
        uniform_camera_dir = gl.getUniformLocation(program, "uniform_camera_dir");
        uniform_camera_near = gl.getUniformLocation(program, "uniform_camera_near");
        uniform_camera_far = gl.getUniformLocation(program, "uniform_camera_far");
        uniform_cubemap = gl.getUniformLocation(program, "uniform_cubemap");
    }

    var initialize = function () {
        canvas = document.getElementById("glCanvas");
        gl = canvas.getContext("webgl");
        if (!gl)
            gl = canvas.getContext("experimental-webgl");

        if (!gl) {
            alert("could not get webgl context");
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        quad_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
        var vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        compileSkyboxRenderer();

        var cubemap = [];
        var sides = ["posx", "negx", "posy", "negy", "posz", "negz"];
        for (var i = 0; i < 6; i++)
            cubemap.push("skybox" + "/" + sides[i] + ".jpg");;//cubemap.push("cubemap" + "/" + sides[i] + ".jpg");
        load_cubemap(cubemap);

        //draw();
        //console.log('add listner');
        //const ui = document.querySelector('#uiCanvas');
        //ui.addEventListener("mousedown", mouse_down, false);
        //document.addEventListener("mouseup", mouse_up, false);
    }();

    return { 'drawSkybox': drawSkybox}

})();
