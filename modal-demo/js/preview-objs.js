/**
 * @author Andrey Kaipov
 */

(function() {

    var scene, camera, renderer, cameraControls;

    // We make a global object for easy "removal" from the scene.
    var loadedObject = new THREE.Group();


    (function init() {

        // Scene.
        scene = new THREE.Scene();

        // Renderer.
        renderer = new THREE.WebGLRenderer( { alpha: true } );
        renderer.setClearColor( 0x010101, 0.1 );
        renderer.setSize( window.innerWidth, window.innerHeight, false );
        $('#modal-body-graphics').append( renderer.domElement );

        var aspectRatio = window.innerWidth / window.innerHeight;
        var verticalFOV = 80; // in degs
        var nearPlane = 0.1;
        var farPlane = 50;
        camera = new THREE.PerspectiveCamera( verticalFOV, aspectRatio, nearPlane, farPlane );
        camera.position.set( 0, 1, 1.5 );
        scene.add( camera );


        // Camera controls.
        cameraControls = new THREE.OrbitControls( camera, renderer.domElement );

        // Lights.
        var directionalLightAbove = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLightAbove.position.set( 0, 1, 0 );
        scene.add( directionalLightAbove );

        var directionalLightBelow = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLightBelow.position.set( 0, -1, 0 );
        scene.add( directionalLightBelow );

    })();


    // Continuously draw the scene and update controls.
    (function animate() {

        requestAnimationFrame( animate );
        cameraControls.update();
        renderer.render( scene, camera );

    })();


    // On an image click, get the data-obj-ul and load it into the scene.
    // If the object was already loaded into the scene, don't add it into the scene,
    // just mark it visible and change its colors.
    $("img").click( function( event ) {

        var originImage = event.target;
        var objURL = originImage.getAttribute( 'data-obj-url' );
        var fileName = objURL.slice( objURL.lastIndexOf('/') + 1 );

        $('.modal-title').text( fileName );
        $('.download-obj').attr( 'href', objURL );

        // Detect if this file has already been loaded into the scene, and if so assign it to loadedObject.
        var objAlreadyInScene = scene.children.some( function( child ) {
            return (child.__originImage__ === originImage) && (loadedObject = child);
        });

        if ( objAlreadyInScene ) {
            assignMaterialsToObject( loadedObject );
            loadedObject.visible = true;
        }
        else {
            $.ajax({
                url: objURL,
                success: function( fileAsString ) {

                    loadedObject = new THREE.OBJLoader().parse( triangulateConvex( fileAsString ) );

                    normalizeAndCenterObject( loadedObject );
                    assignMaterialsToObject( loadedObject );

                    loadedObject.__originImage__ = event.target; // Mark origin image.
                    loadedObject.scale.multiplyScalar(1.3);
                    scene.add( loadedObject );

                } // end success
            }); // end ajax
        }

    });


    // When we click outside the modal, reset the controls, reset the camera, and make the loadedObject invisible.
    $('#preview-obj-modal').on('hidden.bs.modal', function () {

        cameraControls.reset();
        camera.position.set( 0, 1, 1.5 );
        loadedObject.visible = false;

    });


    // We want for our object's scale to appear the same size even as we resize the modal.
    // To achieve this, we continuously adjust the camera's aspect ratio and its FOV while resizing the modal.
    // See the awesome response from WestLangley here: https://github.com/mrdoob/three.js/issues/1406.
    $('.modal-dialog').resizable({

        alsoResize: renderer.domElement,

        minWidth: 0.3 * window.innerWidth,
        minHeight: 0.4 * window.innerHeight,
        maxWidth: 0.9 * window.innerWidth,
        maxHeight: 0.9 * window.innerHeight,

        handles: 'se',

        // Upon creation of the resizable modal, create a listener on the parent that will stop the bubbling
        // resize event. Otherwise, this event will trigger a window resize, which we'd like to have also.
        // See https://bugs.jqueryui.com/ticket/7514 and http://stackoverflow.com/a/15903765/4085283.
        create: function () {
            $(this).parent().on('resize', function ( event ) {
                event.stopPropagation();
            });
        },

        start: function() {
            renderer.__originalHeight__ = $('canvas').height();
            camera.__tanFOV__ = Math.tan( ((Math.PI / 180) * camera.fov / 2) ); // in degs
        },

        resize: function( event, ui ) {
            renderer.setSize( $('canvas').width(), $('canvas').height() );
            camera.aspect = $('canvas').width() / $('canvas').height();
            camera.fov = (360 / Math.PI) * Math.atan( camera.__tanFOV__ * ($('canvas').height() / renderer.__originalHeight__) );
            camera.updateProjectionMatrix();
        }

    });

    // Makes the modal draggable by its header, but not on the text.
    $('.modal').draggable({

        handle: '.modal-header',
        cancel: '.modal-header h4',
        appendTo: 'body'

    });

    var startingCanvasWidth = $('canvas').width();
    var startingCanvasHeight = $('canvas').height();

    $(window).resize( function() {

        $('.modal-dialog').removeAttr( 'style' );
        $('canvas').removeAttr( 'style' );


        $('.modal-dialog').resizable( 'option', 'minWidth', 0.3 * window.innerWidth );
        $('.modal-dialog').resizable( 'option', 'minHeight', 0.4 * window.innerHeight );
        $('.modal-dialog').resizable( 'option', 'maxWidth', 0.9 * window.innerWidth );
        $('.modal-dialog').resizable( 'option', 'maxHeight', 0.9 * window.innerHeight );
        // $('.modal-dialog').css( 'position', 'relative' );
        // $('.modal-dialog').css( 'width', startingModalWidth );
        // $('.modal-dialog').css( 'height', startingModalHeight );
        // $('.modal').modal('hide');
                    // renderer.setSize( $('canvas').width(), $('canvas').height() );
        // camera.aspect = window.innerWidth / window.innerHeight;
        // camera.updateProjectionMatrix();

        // var currentMinWidth = $('.modal-dialog').resizable( 'option', 'minWidth' );
        // var currentMinHeight = $('.modal-dialog').resizable( 'option', 'minHeight' );
        // var currentMaxWidth = $('.modal-dialog').resizable( 'option', 'maxWidth' );
        // var currentMaxHeight = $('.modal-dialog').resizable( 'option', 'maxHeight' );

        // proportions, yo.
        //

        //
        // var percentChangeWidth = startingModalWidth / startingWindowWidth;
        // var percentChangeHeight = startingModalHeight / startingWindowHeight;
        //
        // var newModalWidth = window.innerWidth * percentChangeWidth;
        // var newModalHeight = window.innerHeight * percentChangeHeight;
        //
            // renderer.setSize( $('canvas').width(), $('canvas').height() );
        // $('.modal-dialog').width( startingModalWidth );
        // $('.modal-dialog').height( startingModalHeight );


        //
        // var newCanvasWidth = 0.3 * $('canvas').width();
        // var newCanvasHeight = 0.4 * $('canvas').height();
        //
        // $('canvas').width( startingCanvasWidth );
        // $('canvas').height( startingCanvasHeight );

            //
        // // //
        // $('.modal-dialog').width( 0.5 * window.innerWidth );
        // $('.modal-dialog').height( 0.6 * window.innerHeight );
        // $('canvas').width( 0.5 * window.innerWidth );
        // $('canvas').height( 0.531 * window.innerHeight );

    });


    /*========== The following are little helper functions. ==========*/


    // Triangulates the faces in an obj file as if they were convex polygons.
    function triangulateConvex( fileAsString ) {

        var lines = fileAsString.split('\n');
        var fileAsStringTriangulated = "";

        lines.forEach( function( line ) {

            line = line.trim();

            if ( line[0] === 'f' && line[1] === ' ' ) {

                var faceVertices = line.split(/\s+/);
                var fixedVertex = faceVertices[1];

                for ( let k = 2; k <= faceVertices.length - 2; k++ ) {
                    fileAsStringTriangulated += 'f' + ' ' + fixedVertex
                                                    + ' ' + faceVertices[k]
                                                    + ' ' + faceVertices[k + 1] + '\n';
                }

            }
            else {
                fileAsStringTriangulated += line + '\n';
            }

        });

        return fileAsStringTriangulated;

    }


    // Takes in an object, and gives each mesh of the object a random color and some other stuff.
    function assignMaterialsToObject( object ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.material = new THREE.MeshPhongMaterial({
                    color: Math.random() * 0xffffff,
                    emissive: 0x000000,
                    shading: THREE.FlatShading,
                    side: THREE.DoubleSide
                });

            }

        });

    }


    // With r74 OBJLoader, o and g tags are processed as their own separate meshes (and hence their own geometries).
    // Because of this, we have to jump through a couple of hoops to normalize and center the entire object properly.
    // This function is rather overkill for obj files that contain no groups, but it's necessary if we want
    // to be able to correctly display obj files that will produce several meshes. The alternative is to strip out
    // all of the group tags when parsing, but then we won't be able to assing different colors to each mesh!
    function normalizeAndCenterObject( object ) {

        // Merge all of the geometries to find the the total bounding sphere for the loadedObject.
        // Merging BufferGeometries don't work for some reason, so we convert them into a regular geometry.
        var mergedGeometry = new THREE.Geometry();

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
                mergedGeometry.merge( geometry );

            }

        });

        // Normalize our object.
        mergedGeometry.computeBoundingSphere();
        var r = mergedGeometry.boundingSphere.radius;
        object.scale.set( 1/r, 1/r, 1/r );

        // Now we center each geometry with respect to the mergedGeometry's bounding box.
        // See line 10030 of three.js r74 for a similar calculation.
        mergedGeometry.computeBoundingBox();
        var offset = mergedGeometry.boundingBox.center().negate();

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.geometry.translate( offset.x, offset.y, offset.z );

            }

        });

        mergedGeometry.dispose();

    }

})();
