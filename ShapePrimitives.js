// JavaScript source code
// Now create an array of positions for the square.
const Primitives = (function () {
    const mat4 = glMatrix.mat4;
    var shapes = {};
    var animations = [];

    var instantiate = function(prim, globalid, textureUrl){
		var newInst = {};
        newInst.id = globalid;
        newInst.matrix = prim.matrix ? mat4.clone(prim.matrix) : mat4.create();
        newInst.children = [];

        if (!prim.isComposite) {
            newInst.positions = new Array(prim.positions.length).fill().map(function (x, ind) { return prim.positions[ind]; });
            newInst.textureCoordinates = new Array(prim.textureCoordinates.length).fill().map(function (x, ind) { return prim.textureCoordinates[ind]; });
            newInst.indices = new Array(prim.indices.length).fill().map(function (x, ind) { return prim.indices[ind]; });
            newInst.vertexNormals = new Array(prim.vertexNormals.length).fill().map(function (x, ind) { return prim.vertexNormals[ind]; });
        } else {
            newInst.positions = new Array();
            newInst.textureCoordinates = new Array();
            newInst.indices = new Array();
            newInst.vertexNormals = new Array();
            
            for (var i = 0; i < prim.components; i++) {
                var compMat = mat4.create();
                glMatrix.mat4.rotate(compMat,  // destination matrix
                    compMat,  // matrix to rotate
                    1.7 * i,   // amount to rotate in radians
                    [0, 1, 0]);
                glMatrix.mat4.translate(compMat,     // destination matrix
                    compMat,     // matrix to translate
                    [0.0, 0.0, 0.0]);
                newInst.positions = newInst.positions.concat(linTransform(compMat, prim.positions));
                newInst.textureCoordinates = newInst.positions.concat(prim.textureCoordinates);
                newInst.indices = newInst.positions.concat(prim.indices.map(function (x, ind) { return prim.positions[ind] + newInst.indices.length; }));
                newInst.vertexNormals = newInst.positions.concat(prim.vertexNormals);
            }
        }
        
		newInst.useParentMatrix = new Array(newInst.positions.length / 3).fill().map(x => 0.0);
		newInst.isGrounded = true,
        newInst.confirmGrounded = true,
        newInst.velocity = {
            y: 0.0
            };
        newInst.textureUrl = textureUrl;
        newInst.textureImage = null;
		
		return newInst;
    }

    var getVertextNormals = function (prim) {
        if (prim.vertexNormals && prim.vertexNormals.length > 0) {
            return prim.vertexNormals;
        }
        var vnorms = new Array(prim.positions.length);
        var numfaces = prim.indices.length / 3;
        for (var f = 0; f < numfaces; f++) {
            var startPoint = [prim.positions[3 * prim.indices[3 * f] + 0], prim.positions[3 * prim.indices[3 * f] + 1], prim.positions[3 * prim.indices[3 * f] + 2]];
            var vec1 = glMatrix.vec3.fromValues(prim.positions[3 * prim.indices[3 * f + 1] + 0] - prim.positions[3 * prim.indices[3 * f] + 0],
                                                prim.positions[3 * prim.indices[3 * f + 1] + 1] - prim.positions[3 * prim.indices[3 * f] + 1],
                                                prim.positions[3 * prim.indices[3 * f + 1] + 2] - prim.positions[3 * prim.indices[3 * f] + 2]);
            var vec2 = glMatrix.vec3.fromValues(prim.positions[3 * prim.indices[3 * f + 2] + 0] - prim.positions[3 * prim.indices[3 * f] + 0],
                                                prim.positions[3 * prim.indices[3 * f + 2] + 1] - prim.positions[3 * prim.indices[3 * f] + 1],
                                                prim.positions[3 * prim.indices[3 * f + 2] + 2] - prim.positions[3 * prim.indices[3 * f] + 2]);
            var xprod = glMatrix.vec3.create();
            var result = [];
            glMatrix.vec3.cross(xprod, vec1, vec2);
            //console.log(xprod);
            var posNormEndpoint = [xprod[0] + startPoint[0], xprod[1] + startPoint[1], xprod[2] + startPoint[2]];
            var posNormLenComparer = posNormEndpoint[0] * posNormEndpoint[0] + posNormEndpoint[1] * posNormEndpoint[1] + posNormEndpoint[2] * posNormEndpoint[2];
            var negNormEndpoint = [xprod[0] - startPoint[0], xprod[1] - startPoint[1], xprod[2] - startPoint[2]];
            var negNormLenComparer = negNormEndpoint[0] * negNormEndpoint[0] + negNormEndpoint[1] * negNormEndpoint[1] + negNormEndpoint[2] * negNormEndpoint[2];

            var len = Math.sqrt(xprod[0] * xprod[0] + xprod[1] * xprod[1] + xprod[2] * xprod[2]);
            if (negNormLenComparer > posNormLenComparer) {
                result = [-xprod[0] / len, -xprod[1] / len, -xprod[2] / len];
            } else {
                result = [xprod[0] / len, xprod[1] / len, xprod[2] / len];
            }
            vnorms[3 * prim.indices[3 * f] + 0] = result[0];
            vnorms[3 * prim.indices[3 * f] + 1] = result[1];
            vnorms[3 * prim.indices[3 * f] + 2] = result[2];

            vnorms[3 * prim.indices[3 * f + 1] + 0] = result[0];
            vnorms[3 * prim.indices[3 * f + 1] + 1] = result[1];
            vnorms[3 * prim.indices[3 * f + 1] + 2] = result[2];

            vnorms[3 * prim.indices[3 * f + 2] + 0] = result[0];
            vnorms[3 * prim.indices[3 * f + 2] + 1] = result[1];
            vnorms[3 * prim.indices[3 * f + 2] + 2] = result[2];
        }
        prim.vertexNormals = vnorms;
        ////console.log(prim.vertexNormals);
        return prim.vertexNormals;
    }

    shapes["tetrahedron"] = {
        id: 1,
        isComposite: false,
        positions: [
            // base
            -1.0, -0.408, .577,
            1.0, -0.408, .577,
            0.0, -0.408, -1.155,

            // Back face
            0.0, 1.225, 0.0,
            1.0, -0.408, .577,
            0.0, -0.408, -1.155,

            // Top face
            0.0, 1.225, 0.0,
            -1.0, -0.408, .577,
            1.0, -0.408, .577,

            // Bottom face
            0.0, 1.225, 0.0,
            -1.0, -0.408, .577,
            0.0, -0.408, -1.155
        ],

        textureCoordinates: [
            // Front
            0.0, 1.0,//mess up numba 1 face if first says 1.0
            1.0, 1.0,
            1.0, 0.0,
            // Back
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            // Top
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            // Bottom
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0
            ],

        indices: [
            0, 1, 2, 
            3, 4, 5,
            6, 7, 8, 
            9, 10, 11
        ],

        vertexNormals: [
            // Front
            /* 0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0 */
            ]
    }; 

    shapes["cube"] = {
        id: 0,
        isComposite: false,
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
    }; //shapes["cube"] = shapes["tetrahedron"];

    shapes["doubletetrahedron"] = {
        id: 2,
        isComposite: true,
        components: [{
            type: "tetrahedron",
            offset: [0.0, 0.0, 0.0],
            rotation: [-180.0, 0.0, 0.0],
            scaling: [1.0, 1.0, 1.0]
        }, {
                type: "tetrahedron",
                offset: [0.0, 0.0, 0.0],
                rotation: [-180.0, 0.0, 0.0],
                scaling: [1.0, 1.0, 1.0]
            }]
        
    };

    return {
        'shapes': shapes,
        'instantiate': instantiate,
        'getVertextNormals': getVertextNormals,
        'animations': animations
    };
})();