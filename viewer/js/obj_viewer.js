// Name: Andrey Kaipov
// Class: CAP 4993
// Professor: Wei Zeng
//
// This program demonstrates how we can use Three.js for 3D Graphics tasks.
// Three.js is a fairly lightweight 3D library using WebGL. http://threejs.org/

/*
to do:
- triangulation of .obj files !!! DONE !!!
- make wasd camera controllable. scroll-wheel only zooms.
    Kinda done. It could be better. The OrbitControls mess with the keyboard input,
    so I just made the keyboard controls just rotate around the origin or something like that.
    I might just take these out...
- allow objects to be selectable
    - We can easily multiply objects and give them their own controls, but they have to be
      selectable if we want a dynamic amount of objects. Look into Raytracjer.js for this.
- add customizable lights.
- allow translation of added objects, because objects all clump together at
the origin.
- allow fps be customizable..
- add standard geometries (cubes, spheres, etc.)
*/

init();
lights();
animate();


// The scene is where everything is placed.
// The camera is what looks at the scene.
// The renderer will display our beautifully crafted scene.
// The controls allow you to move around the scene with the camera.
var scene, camera, renderer, mouseControls, keyboard, objectControls;

var selectedObject;
var raycaster;

// The array that holds all of our loaded objects.
var loadedObjects = [];

/* Initializes our scene, camera, renderer, and controls. */
function init() {

    // Scene.
    scene = new THREE.Scene();

    // Camera.
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
    var aspectRatio = canvasWidth / canvasHeight;
    var verticalFOV = 80; // in degrees
    var nearPlane = 0.1;
    var farPlane = 8000;

    camera = new THREE.PerspectiveCamera( verticalFOV, aspectRatio, nearPlane, farPlane );
    camera.position.set( 0, 0, 5 );
    scene.add( camera );

    // The renderer provides a place for ThreeJS to draw our scene.
    // Specifically, it provides a <canvas> element which we add to our HTML document.
    renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setClearColor( 0x010101, 0.1 );
    document.body.appendChild( renderer.domElement );
    renderer.setSize( canvasWidth, canvasHeight );

    // Add controls so we can pan around with the mouse and arrow-keys.
    keyboard = new THREEx.KeyboardState();
    mouseControls = new THREE.OrbitControls( camera, renderer.domElement );


    // Adds debug axes centered at (0,0,0). Remember: xyz ~ rgb. Solid is positive, dashed is negative.
    createAxes( 100 );

    loadedObjectMaterial = new THREE.MeshPhongMaterial({
        color: 0x5c54dc,
        emissive: 0x000000,
        shading: THREE.FlatShading,
        side: THREE.DoubleSide, // important.
        reflectivity: 1
    });

    // Client-side upload, and triangulate to temp file. JS does not allow full path so we create a temporary path.
    // See http://stackoverflow.com/a/24818245/4085283, and http://stackoverflow.com/a/21016088/4085283.
    document.getElementById("i_file").addEventListener("change", function(event) {

        var file = event.target.files[0];
        var filePath = window.URL.createObjectURL( file );

        var loadedObject = create3DObject( filePath, file.name, loadedObjectMaterial );
        scene.add( loadedObject );

        // Add the file path as an attribute to the object.
        // We'll need it again if the user wants to triangulate. See gui.js.
        loadedObject.userData.filePath = filePath;

        console.log( "File was loaded successfully." +
                     "\nName: " + file.name +
                     "\nSize: " + file.size + " bytes" );

        loadedObjects.push( loadedObject );

        // Create controls for each loaded object, attach them to the loaded object,
        // and add them to the scene so we can actually see them.
        var objectControls = new THREE.TransformControls( camera, renderer.domElement );
        objectControls.addEventListener( 'change', render );
        objectControls.attach( loadedObject );
        scene.add( objectControls );

        // Associate the objectControls with the loadedObject. See gui.js in triangulation button.
        objectControls.name = "Controller for " + loadedObject.uuid;

        // Make the most recently loaded object the selected object.
        selectedObject = loadedObject;

    });

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
}


function onDocumentTouchStart( event ) {

    event.preventDefault();

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    // The true flag is for intersecting descendents of whatever is intersected.
    var intersects = raycaster.intersectObjects( loadedObjects, true );

    // intersects[0] is the mesh the raycaster intersects.
    if ( intersects.length > 0 ) {

        // The selected object is the objContainer for the object the intersected mesh belongs to!
        selectedObject = intersects[0].object.parent.parent;

        console.log("You selected " + intersects[0].object.parent.name + ".");

        selectedObject.children[0].children[0].material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff,
            emissive: 0x000000,
            shading: THREE.FlatShading,
            side: THREE.DoubleSide, // important.
            reflectivity: 1
        });

        var geometry = selectedObject.children[0].children[0].geometry;
        document.getElementById("vertices").innerHTML = "Vertices: " + geometry.num_vertices;
        document.getElementById("edges").innerHTML = "Edges: " + 3/2 * geometry.num_faces;
        document.getElementById("faces").innerHTML = "Faces: " + geometry.num_faces;
        document.getElementById("genus").innerHTML = "Genus: " + geometry.genus;

    }

}


/* Creates some lights and adds them to the scene. */
function lights() {

    var ambientLight = new THREE.AmbientLight( 0xffffff );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 0, 1, 1 );
    scene.add( directionalLight );

}



// This container will hold our output in the following function, since OBJLoader() seems to have issues
// returning the object it loaded. This seems like a poor trick since now our actual Object3D is nested
// within a dummy Object3D, but it's from mrdoob himself http://stackoverflow.com/a/22977590/4085283
// We want for this container to be global so that scaling and rotational properties can be inherited by
// any of the objects put inside this container. See gui.js for that.
var objContainer;

/* Loads our 3D Object and returns it. */
function create3DObject( obj_url, obj_name, obj_material ) {

    objContainer = new THREE.Object3D();

    // Clear our container for safety.
    objContainer.children.length = 0;

    var loader = new THREE.OBJLoader();

    loader.load( obj_url, function ( object ) {

        object.name = obj_name;

        // Traverse the 3D Object's children to find the Mesh property.
        object.traverse( function( mesh ) {

            if ( mesh instanceof THREE.Mesh ) {

                // Assign the parameter material to the mesh.
                mesh.material = obj_material;

                // The updated version of OBJLoader uses a BufferGeometry for the loaded 3D Object by default.
                // It stores all of the geometry's data within buffers,
                // to reduce the cost of passing all of the data directly to the GPU. (?)
                // We unpack it to a Geometry first for easier manipulation!
                var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

                // Normalize geometry by scaling it down by it's bounding sphere's radius. Also centers it.
                geometry.normalize();

                // Compute face normals so we can we use flat shading.
                // Merge vertices to removes duplicates and update faces' vertices.
                // Compute vertex normals so we can use Phong shading (i.e. smooth shading).
                geometry.computeFaceNormals();
                geometry.mergeVertices();
                geometry.computeVertexNormals();

                // Compute and print vertices, edges, faces, and genus.
                // We use the Euler characteristic of a surface, 2 - 2g = V - E + F.
                // To use the above formula, notice that in any TRIANGULAR mesh, every face
                // touches three half-edges, so we have 2E = 3F.
                var numVertices = geometry.vertices.length;
                var numFaces = geometry.faces.length;
                var numEdges = 3/2 * numFaces;
                var genus = (1 - numVertices/2 + numFaces/4);

                document.getElementById("vertices").innerHTML = "Vertices: " + numVertices;
                document.getElementById("edges").innerHTML = "Edges: " + numEdges;
                document.getElementById("faces").innerHTML = "Faces: " + numFaces;
                document.getElementById("genus").innerHTML = "Genus: " + genus;

                // Convert back to a bufferGeometry for efficiency (??)
                mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

                // Store for later.
                mesh.geometry.num_vertices = numVertices;
                mesh.geometry.edges = numEdges;
                mesh.geometry.num_faces = numFaces;
                mesh.geometry.genus = genus;

            } // end if

        }); // end object.traverse

        objContainer.add( object );

    }); // end loader

    // Hide download button to the old triangulated obj file.
    // This has to be outside of the loader because loading is asynchronous.
    document.getElementById("download_link").style.display = "none";
    document.getElementById("download_hreaker").style.display = "none";

    return objContainer;

}


/* This recursively animates the scene using the awesome requestAnimationFrame. */
function animate() {
    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame.
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 30 ); // frame count goes to the denominator.

    render();
    keyboardUpdateCamera();

    for ( var i = 0; i < scene.children.length; i++ )
        if ( scene.children[i] instanceof THREE.TransformControls )
            keyboardUpdateControls( scene.children[i] );

}


/* This just renders once. */
function render() {
    renderer.render( scene, camera );
}


function keyboardUpdateCamera() {

    // Get the vector representing the direction in which the camera is looking.
    var dirVector = camera.getWorldDirection().multiplyScalar(0.10);

    if ( keyboard.pressed("W") ) {
        camera.position.add( dirVector );
        camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("S") ) {
        camera.position.sub( dirVector );
        camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("A") ) {
        camera.position.sub( dirVector.cross( new THREE.Vector3( 0, 1, 0) ) );
        camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("D") ) {
        camera.position.add( dirVector.cross( new THREE.Vector3( 0, 1, 0) ) );
        camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("F") ) {
        camera.position.sub( new THREE.Vector3(0, 0.1, 0) );
        // camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("R") ) {
        camera.position.add( new THREE.Vector3(0, 0.1, 0) );
        // camera.lookAt( mouseControls.target = camera.getWorldDirection() );
    }
    else if ( keyboard.pressed("Z") )
    {
        camera.position.set( 0, 0, 5 );
        mouseControls.target.set( 0, 0, 0 );
        camera.lookAt( 0, 0, 0 );
    }
    camera.updateProjectionMatrix();

}

function keyboardUpdateControls( objectControls ) {

    if ( keyboard.pressed("0") )
        objectControls.setSpace( objectControls.space === "local" ? "world" : "local" );

    if ( keyboard.pressed("ctrl") ) {
        objectControls.setTranslationSnap( 0.5 );
        objectControls.setRotationSnap( THREE.Math.degToRad( 15 ) );
    }

    if ( keyboard.pressed("1") )
        objectControls.setMode( "translate" );

    if ( keyboard.pressed("2") )
        objectControls.setMode( "rotate" );

    if ( keyboard.pressed("3") )
        objectControls.setMode( "scale" );

    if ( keyboard.pressed("plus") || keyboard.pressed("numpad_plus") )
        objectControls.setSize( objectControls.size + 0.1 );

    if ( keyboard.pressed("minus") || keyboard.pressed("numpad_minus") )
        objectControls.setSize( Math.max( objectControls.size - 0.1, 0.1 ) );

    objectControls.update();

}

window.addEventListener( 'keyup', function ( event ) {

    switch ( event.keyCode ) {

        case 17: // Ctrl
        objectControls.setTranslationSnap( null );
        objectControls.setRotationSnap( null );
        break;

    }

});

// Resize canvas when window is resized.
window.addEventListener( "resize", function() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    renderer.setSize( canvasWidth, canvasHeight );
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
});
