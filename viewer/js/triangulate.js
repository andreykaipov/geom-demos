/**
  * @author Andrey Kaipov
  */

/* =========== Triangulation =========== */

/*
Takes in an .obj file given as a string, and triangulates the faces by fanning through the polygon
that makes up a face. This is done by fixing one vertex as the fan pivot, and then picking successive
over-lapping pairs of vertices.

Example:
The triangulation of the face, f 1 2 3 4 5, will form three faces: f 1 2 3, f 1 3 4, and f 1 4 5.
In general, the triangulation of an n-sided face will form (n-2) triangles.

Further, this script also removes vertex texture coordinates, vertex normals, and parameter space vertices.
We don't need these because we have no textures, and we compute our own normals.
See https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format for more details about the .obj format.

To do:
- Remove vertex texture coordinate and vertex normal indices from the input .obj string.
  That is, the face, f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3, should be written as f v1 v2 v3.
  The vt's and vn's have no effect on the render, but they're unnecessary data in the exported obj file.
*/
function triangulate( fileAsString ) {

    var lines = fileAsString.split(/[\r\n]/); // Windows and Unix linebreaks.

    var fileAsStringTriangulated = "";

    for (var i = 0; i < lines.length; i++) {

        var line = lines[i];
        var first_char = line[0];
        var second_char = line[1];

        if ( first_char === 'v' && second_char === ' ')
            fileAsStringTriangulated += (line + '\n');

        if ( first_char === 'f' && second_char === ' ') {

            var vertices = line.trim().substr(2).split(' ');
            var fixed_vertex = vertices[0];

            for ( var k = 1; k <= vertices.length - 2; k++ )
                fileAsStringTriangulated += 'f' + ' ' + fixed_vertex + ' '
                                                + vertices[k] + ' ' + vertices[k+1] + '\n';

        }
    }

    return fileAsStringTriangulated;

}
