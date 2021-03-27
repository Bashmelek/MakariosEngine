// JavaScript source code
// Now create an array of positions for the square.
const LevelData = (function () {
    const mat4 = glMatrix.mat4;

    var objects = [];

    objects.push(Primitives.instantiate(Primitives.shapes["cube"], 0));
    objects.push(Primitives.instantiate(Primitives.shapes["cube"], 1));

    mat4.translate(objects[0].matrix,     // destination matrix
        objects[0].matrix,     // matrix to translate
        [-3.5, 0.0, 0.0]);
    mat4.rotate(objects[0].matrix,  // destination matrix
        objects[0].matrix,  // matrix to rotate
        .7,   // amount to rotate in radians
        [0, 1, 0]);

    var obj2 = Primitives.instantiate(Primitives.shapes["cube"], 2)
    mat4.translate(obj2.matrix,     // destination matrix
        obj2.matrix,     // matrix to translate
        [3.5, 0.0, 0.0]);
    setTimeout(function () { objects.push(obj2) }, 4000);

    return { 'objects': objects };
})();