// JavaScript source code
// Now create an array of positions for the square.
const MyFirstPhysics = (function () {
    const mat4 = glMatrix.mat4;
    var objects = [];


    function initVelocity(obj) {
        obj.isGrounded = true,
            obj.confirmGrounded = true,
            obj.velocity = {
                y: 0.0
            };
    };

    objects.push({
        id: 0,
        positions: [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

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

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ],

        textureCoordinates: [
            // Front
            0.0, 1.0,//mess up numba 1 face if first says 1.0
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Back
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Top
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Bottom
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Right
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Left
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ],

        indices: [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23
        ],

        vertexNormals: [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            // Right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Left
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0
        ]
    });



    objects.push({
        id: 1,
        positions: [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

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

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ],

        textureCoordinates: [
            // Front
            1.0, 1.0,//mess up numba 1 face
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Back
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Top
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Bottom
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Right
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Left
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ],

        indices: [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23
        ],

        vertexNormals: [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            // Right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Left
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0
        ]
    });

    //floor
    objects.push({
        id: 3,
        positions: [

            // Top face
            -5.0, 0.0, -10.0,
            -5.0, 0.0, 10.0,
            10.0, 0.0, 10.0,
            10.0, 0.0, -10.0,
            // slope face
            -5.0, 0.0, -10.0,
            -5.0, 0.0, 10.0,
            -10.0, 1.0, 10.0,
            -10.0, 1.0, -10.0,
        ],

        textureCoordinates: [
            // Top
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // slope
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ],

        indices: [
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
        ],

        vertexNormals: [
            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
        ]
    });


    objects[0].useParentMatrix = new Array(objects[0].positions.length / 3).fill().map(x => 0.0);
    //objects[0].useParentMatrix = objects[0].useParentMatrix.map(x => 0.0);
    objects[0].matrix = mat4.create();
    objects[1].matrix = mat4.create();
    mat4.translate(objects[1].matrix,     // destination matrix
        objects[1].matrix,     // matrix to translate
        [-3.5, 0.0, 0.0]);
    mat4.rotate(objects[1].matrix,  // destination matrix
        objects[1].matrix,  // matrix to rotate
        .3,   // amount to rotate in radians
        [0, 1, 0]);
    objects[1].useParentMatrix = new Array(objects[1].positions.length / 3).fill().map(x => 0.0);
    //objects[1].useParentMatrix = objects[1].useParentMatrix.map(x => 0.0);
    objects[0].children = [];
    objects[1].children = [];
    initVelocity(objects[0]);
    initVelocity(objects[1]);

    //objects[0].collider = {
    //    type: 'rotationlesscylinder',
    //    radius: 1.0,
    //    height: 1.0
    //};

    objects[0].collider = {
        //type: 'yrotbox',
        //hwidth: 1,
        //hdepth: 1
        type: 'rotationlesscylinder',
        radius: 1.0,
        hheight: 1.0
    };

    objects[1].collider = {
        type: 'yrotbox',
        hwidth: 1,
        hdepth: 1,
        hheight: 1.0
        //type: 'rotationlesscylinder',
        //radius: 1.0,
        //height: 1.0
    };

    objects[2].useParentMatrix = new Array(objects[2].positions.length / 3).fill().map(x => 0.0);
    //objects[0].useParentMatrix = objects[0].useParentMatrix.map(x => 0.0);
    objects[2].matrix = mat4.create();
    objects[2].children = [];
    mat4.translate(objects[2].matrix,     // destination matrix
        objects[2].matrix,     // matrix to translate
        [0, -1.0, 0.0]);


    objects[0].children.push({
        id: 2,
        positions: [
            // latches onto parents Right face

            1.6, -1.0, -1.0,
            1.6, 1.0, -1.0,
            1.6, 1.0, 1.0,
            1.6, -1.0, 1.0,
        ],

        textureCoordinates: [
            // Front
            0.0, 1.0,//mess up numba 1 face
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            // Back
            //0.0, 1.0,
            //1.0, 1.0,
            //1.0, 0.0,
            //0.0, 0.0,
            //// Top
            //0.0, 1.0,
            //1.0, 1.0,
            //1.0, 0.0,
            //0.0, 0.0,
            //// Bottom
            //0.0, 1.0,
            //1.0, 1.0,
            //1.0, 0.0,
            //0.0, 0.0,
            //// Right
            //0.0, 1.0,
            //1.0, 1.0,
            //1.0, 0.0,
            //0.0, 0.0
        ],

        indices: [
            //16, 17, 18, 16, 18, 19,   // parent right
            16, 17, 24, 17, 24, 25,//this back
            17, 18, 25, 18, 25, 26,//this top
            18, 19, 26, 19, 26, 27,//this front
            16, 19, 27, 16, 27, 24,//this bot
            24, 25, 26, 24, 26, 27//this right

        ],

        vertexNormals: [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            //0.0, 0.0, -1.0,
            //0.0, 0.0, -1.0,
            //0.0, 0.0, -1.0,
            //0.0, 0.0, -1.0,

            //// Top
            //0.0, 1.0, 0.0,
            //0.0, 1.0, 0.0,
            //0.0, 1.0, 0.0,
            //0.0, 1.0, 0.0,

            //// Bottom
            //0.0, -1.0, 0.0,
            //0.0, -1.0, 0.0,
            //0.0, -1.0, 0.0,
            //0.0, -1.0, 0.0,

            //// Right
            //1.0, 0.0, 0.0,
            //1.0, 0.0, 0.0,
            //1.0, 0.0, 0.0,
            //1.0, 0.0, 0.0
        ]
    });
    objects[0].children[0].matrix = mat4.create();
    mat4.rotate(objects[0].children[0].matrix,  // destination matrix
        objects[0].children[0].matrix,  // matrix to rotate
        .2,   // amount to rotate in radians
        [0, 0, 1]); //101

    objects[0].children[0].useParentMatrix = new Array(objects[0].children[0].positions.length / 3).fill().map(function (x, ind) { return 1.0 }/*return objects[0].children[0].indices[ind] < 24 ? -10.0 : -10.0 }*/);;
    //objects[0].children[0].useParentMatrix = (objects[0].children[0].useParentMatrix2).map(x => 2);//function (x) { return 2/*return objects[0].children[0].indices[ind] < 24 ? 1.0 : 1.0 */ });
    for (var bs = 0; bs < objects[0].children[0].useParentMatrix.length; bs++) {
        //objects[0].children[0].useParentMatrix[bs] = 2 + bs;
    }


    var Init = function () {
        StageData.ticks = 0;

        var ob1 = Makarios.instantiate(objects[0], 'grumpycss.jpg', null, {});
        ob1.matrix = objects[0].matrix;
        ob1.collider = objects[0].collider;
        var ob2 = Makarios.instantiate(objects[1], 'meeseeks can do.jpg', null, {});
        ob2.matrix = objects[1].matrix;
        ob2.collider = objects[1].collider;
        var ob3 = Makarios.instantiate(objects[2], 'smile1.jpg', null, {});
        ob3.matrix = objects[2].matrix;
        //ob3.collider = objects[2].collider;


        var ob4 = Makarios.instantiateChild(ob1, objects[0].children[0], 'plainsky.jpg', null, {});
        ob4.matrix = objects[0].children[0].matrix;
        //ob1.children.push(ob4);
        console.log(ob4)

        initVelocity(ob1);
        initVelocity(ob2);

        //glMatrix.mat4.translate(StageData.objects[0].matrix,     // destination matrix
        //    StageData.objects[0].matrix,     // matrix to translate
        //    [-3.5, 0.0, 0.0]);
        //glMatrix.mat4.rotate(StageData.objects[0].matrix,  // destination matrix
        //    StageData.objects[0].matrix,  // matrix to rotate
        //    .7,   // amount to rotate in radians
        //    [0, 1, 0]);

        //var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 2, 'smile1.jpg', {});
        //glMatrix.mat4.translate(obj2.matrix,     // destination matrix
        //    obj2.matrix,     // matrix to translate
        //    [3.5, 0.0, 0.0]);
        //setTimeout(function () {
        //    var obj2 = Makarios.instantiate(Primitives.shapes["cube"], 'meeseeks can do.jpg', disappearingItem, {});
        //    glMatrix.mat4.translate(obj2.matrix,     // destination matrix
        //        obj2.matrix,     // matrix to translate
        //        [3.5, 0.0, 0.0]);
        //}, 4000);
    };

    var OnFrame = function () {
        FrameLogic.onFrame();
    };

    //console.log(objects[0].children[0].indices)
    //console.log(objects[0].useParentMatrix)
    //console.log(objects[0].children[0].useParentMatrix)
    //return { 'objects': objects };
    return { 'Init': Init, 'OnFrame': OnFrame };
})();