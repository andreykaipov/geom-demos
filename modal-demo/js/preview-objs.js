/**
 * @author Andrey Kaipov / https://github.com/andreykaipov
 */

(function() {

    // Stuff.
    var scene, camera, renderer, stereoEffect, cameraControls;

    // Stereoscopic view off by default.
    var stereoView = false;

    // We make a global object for easy "removal" from the scene.
    var loadedObject = new THREE.Group();

    // Toggle the stereoscopic view when the button is clicked.
    $('.toggle-view-btn').click( function() {

        if ( stereoView ) {
            $('.toggle-view-text').text(' Stereoscopic View');
            stereoView = false;
            renderer.setSize( $('canvas').width(), $('canvas').height() );
        }
        else {
            $('.toggle-view-text').text(' Normal View');
            stereoView = true;
        }

    });

    (function init() {

        // Scene.
        scene = new THREE.Scene();

        // Renderer.
        renderer = new THREE.WebGLRenderer( { alpha: true } );

        // Stupid trick to use the width of Bootstrap's modal for the renderer's default size.
        // Since the modal is hidden by default, show it, use it's width, and hide it.
        $('#preview-obj-modal').modal('show');
        renderer.setSize( $('.modal-lg').width(), $('.modal-lg').width() / 2 );
        $('#preview-obj-modal').modal('hide');

        renderer.setClearColor( 0x010101, 0.1 );
        $('.modal-body').append( renderer.domElement );

        // Make a stereoscopic effect option for the renderer.
        stereoEffect = new THREE.StereoEffect( renderer );

        // Do the camera stuff.
        var aspectRatio = 2; // aspect ratio of 2:1, equivalent to the renderer's width/height ratio.
        var verticalFOV = 30; // in degs.
        var nearPlane = 0.1;
        var farPlane = 50;
        camera = new THREE.PerspectiveCamera( verticalFOV, aspectRatio, nearPlane, farPlane );
        camera.position.set( 0, 1, 3 );
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
        // cameraControls .update(); // Do I need this..?
        if ( stereoView ) {
            stereoEffect.render( scene, camera );
        }
        else {
            renderer.render( scene, camera );
        }

    })();

    // On an image click, get the data-obj-url and load the corresponding obj into the scene.
    // If the object was already loaded into the scene, just mark it visible and change its colors.
    $('img').click( function( event ) {

        var originImage = event.target;
        var objURL = originImage.getAttribute( 'data-obj-url' );
        var fileName = objURL.split('\\').pop().split('/').pop();

        $('.modal-title').text( fileName );
        $('.download-obj-btn').attr( 'href', objURL );

        // Detect if this file has already been loaded into the scene, and if so - assign it to loadedObject.
        var objAlreadyInScene = scene.children.some( function( child ) {
            return (child.userData.originImage === originImage) && (loadedObject = child);
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

                    loadedObject.userData.originImage = event.target; // Mark origin image.

                    scene.add( loadedObject );

                } // end success
            }); // end ajax
        }

    });

    // When we click outside the modal, reset the controls, reset the camera, and make the loadedObject invisible.
    $('#preview-obj-modal').on('hidden.bs.modal', function () {

        cameraControls.reset();
        camera.position.set( 0, 1, 3 );
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
            renderer.__originalHeight__ = renderer.getSize().height;
            camera.__tanFOV__ = Math.tan( ((Math.PI / 180) * camera.fov / 2) ); // in degs
        },

        resize: function( event, ui ) {
            renderer.setSize( $('canvas').width(), $('canvas').height() );
            camera.aspect = $('canvas').width() / $('canvas').height();
            camera.fov = (360 / Math.PI) * Math.atan( camera.__tanFOV__ * (renderer.getSize().height / renderer.__originalHeight__) );
            camera.updateProjectionMatrix();
        }

    });

    $(window).resize( function() {

        // Remove the new styles the jQuery UI resizable gives these two elements.
        // This allows for the Bootstrap CSS to responsively resize the modal instead.
        $('.modal-dialog').removeAttr( 'style' );
        $('canvas').removeAttr( 'style' );

        renderer.setSize( $('canvas').width(), $('canvas').height() );

        $('.modal-dialog').resizable( 'option', 'minWidth', 0.3 * window.innerWidth );
        $('.modal-dialog').resizable( 'option', 'minHeight', 0.4 * window.innerHeight );
        $('.modal-dialog').resizable( 'option', 'maxWidth', 0.9 * window.innerWidth );
        $('.modal-dialog').resizable( 'option', 'maxHeight', 0.9 * window.innerHeight );

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

                for ( var k = 2; k <= faceVertices.length - 2; k++ ) {
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
    // to be able to correctly display obj files that will contain several meshes. The alternative is to strip out
    // all of the group tags when parsing, but then we won't be able to assign different colors to each mesh!
    // Note: This does not make each mesh's geometry its own center! But we don't care about that here.
    // For a more sophisticated approach, see the OBJHandler.js of the OBJ Editor.
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
