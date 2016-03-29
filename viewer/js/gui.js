/**
  * @author Andrey Kaipov
  */

// See the source for this. It's really innovative and helped a lot.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial

createGUI();



function createGUI() {

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    console.log(gui);
    createGuiScale( gui );
    createGuiRotation( gui );
    createGuiTranslation( gui );
    createGuiMaterial( gui );
    createTriangulation( gui );

    // Start with a collpased GUI.
    gui.close();

}


function createGuiScale( gui ) {

    var parameters = {
        scaleX : 1,
        scaleY : 1,
        scaleZ : 1
    };

    var scaleFolder = gui.addFolder( "Scale" );

    scaleFolder.add( parameters, 'scaleX', 1, 100 ).step(1).name( "scale x" ).onChange(
        function( value ) { selectedObject.scale.setX( value ); }
    );
    scaleFolder.add( parameters, 'scaleY', 1, 100 ).step(1).name( "scale y" ).onChange(
        function( value ) { selectedObject.scale.setY( value ); }
    );
    scaleFolder.add( parameters, 'scaleZ', 1, 100 ).step(1).name( "scale z" ).onChange(
        function( value ) { selectedObject.scale.setZ( value ); }
    );

    scaleFolder.add( {
        // Reset object scale and reset gui sliders.
        // Without the .listen() method above, the gui sliders will not visually reset !
        resetScale: function() {
            parameters.scaleX = parameters.scaleY = parameters.scaleZ = 1;
            selectedObject.scale.set( 1, 1, 1 );
        }
    }, 'resetScale' ).name( "reset scale" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateScaleGui );

    function updateScaleGui() {
        requestAnimationFrame( updateScaleGui );
        if ( selectedObject != null ) {
            parameters.scaleX = selectedObject.scale.x;
            parameters.scaleY = selectedObject.scale.y;
            parameters.scaleZ = selectedObject.scale.z;
        }
        for ( var i in scaleFolder.__controllers )
            scaleFolder.__controllers[i].updateDisplay();
    }
}


function createGuiRotation( gui ) {

    // We need to start off with non-integer values because dat.gui is a little buggy.
    // See https://github.com/dataarts/dat.gui/issues/48 for more info.
    var parameters = {
        rotationX : 0.001,
        rotationY : 0.001,
        rotationZ : 0.001
    };

    var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );

    rotationFolder.add( parameters, 'rotationX', -Math.PI, Math.PI ).name( "rotate on x" ).onChange(
        function ( value ) { selectedObject.rotation.x = value; }
    );
    rotationFolder.add( parameters, 'rotationY', -Math.PI, Math.PI ).name( "rotate on y" ).onChange(
        function( value ) { selectedObject.rotation.y = value; }
    );
    rotationFolder.add( parameters, 'rotationZ', -Math.PI, Math.PI ).name( "rotate on z" ).onChange(
        function( value ) { selectedObject.rotation.z = value; }
    );

    // Set the sliders to start at 0. This is related to the above bug issue.
    parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;

    rotationFolder.add( {
        // Reset object rotation and reset gui sliders.
        resetRotation: function() {
            parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;
            selectedObject.rotation.set( 0, 0, 0 );
        }
    }, 'resetRotation' ).name( "reset rotation" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateRotationGui );

    function updateRotationGui() {
        requestAnimationFrame( updateRotationGui );
        if ( selectedObject != null ) {
            parameters.rotationX = selectedObject.rotation.x;
            parameters.rotationY = selectedObject.rotation.y;
            parameters.rotationZ = selectedObject.rotation.z;
        }
        for ( var i in rotationFolder.__controllers )
            rotationFolder.__controllers[i].updateDisplay();
    }
}


function createGuiTranslation( gui ) {

    var parameters = {
        translationX : 0.01,
        translationY : 0.01,
        translationZ : 0.01
    };

    var translationFolder = gui.addFolder( "Translation" );

    translationFolder.add( parameters, 'translationX', -20, 20 ).name( "translate x" ).onChange(
        function ( value ) { selectedObject.position.setX( value ); }
    );
    translationFolder.add( parameters, 'translationY', -20, 20 ).name( "translate y" ).onChange(
        function( value ) { selectedObject.position.setY( value ); }
    );
    translationFolder.add( parameters, 'translationZ', -20, 20 ).name( "translate z" ).onChange(
        function( value ) { selectedObject.position.setZ( value ); }
    );

    // Set the sliders to start at 0.
    parameters.translationX = parameters.translationY = parameters.translationZ = 0;

    translationFolder.add( {
        // Reset object translation and reset gui sliders.
        resetTranslation: function() {
            parameters.translationX = parameters.translationY = parameters.translationZ = 0;
            selectedObject.position.set( 0, 0, 0 );
        }
    }, 'resetTranslation' ).name( "reset translation" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateTranslationGui );

    function updateTranslationGui() {
        requestAnimationFrame( updateTranslationGui );
        if ( selectedObject != null ) {
            parameters.translationX = selectedObject.position.x;
            parameters.translationY = selectedObject.position.y;
            parameters.translationZ = selectedObject.position.z;
        }
        for ( var i in translationFolder.__controllers )
            translationFolder.__controllers[i].updateDisplay();
    }

}


function createGuiMaterial( gui ) {

    var parameters = {
        side : THREE.DoubleSide,
        baseColor : 0x5c54dc,
        shading : THREE.FlatShading
    }

    var constants = {
        sideOptions : {
            "front side" : THREE.FrontSide,
            "back side" : THREE.BackSide,
            "double side" : THREE.DoubleSide
        },

        shadingOptions : {
            "flat shading" : THREE.FlatShading,
            "smooth shading" : THREE.SmoothShading
        }
    };

    var materialFolder = gui.addFolder( "Material" );

    materialFolder.addColor( parameters, 'baseColor' ).onChange(
        updateColor( loadedObjectMaterial.color )
    );

    materialFolder.add( parameters, 'shading', constants.shadingOptions ).onFinishChange(
        updateShading( loadedObjectMaterial )
    );

    materialFolder.add( parameters, 'side', constants.sideOptions ).onFinishChange(
        updateSide( loadedObjectMaterial )
    );

}


function createTriangulation( gui ) {

    gui.add( {
        triangulate: function() {

            // See http://stackoverflow.com/a/8197770/4085283 for the idea.
            $.ajax({
                url : selectedObject.userData.filePath,
                success : function( fileAsString ) {

                    var triangulatedFileAsString = triangulate( fileAsString );
                    var triangulatedFile = new Blob( [ triangulatedFileAsString ], { type: "text/plain" } );
                    triangulatedFile.name = selectedObject.children[0].name.slice(0,-4);

                    console.log( "Selected object was triangulated successfully." +
                                 "\nThe new size is " + triangulatedFile.size + " bytes.");

                    var newFilePath = window.URL.createObjectURL( triangulatedFile );

                    // for ( var i in scene.children ) {
                    //     if ( scene.children[i].uuid == selectedObject.uuid ) {
                    //         scene.remove( scene.children[i] );
                    //         break;
                    //     }
                    // }
                    // scene.remove(scene.getObjectByName(selectedObject.children[0].name));
                    // scene.remove(scene.getObjectByName(selectedObject.children[0].name).parent);

                    var triangulatedObject = create3DObject( newFilePath, triangulatedFile.name + "_triangulated", loadedObjectMaterial );

                    // Remove the object from the loadedObjects array also for raycaster to work normally !!!!!!
                    scene.remove(selectedObject);
                    var found = loadedObjects.indexOf(selectedObject);
                    loadedObjects.splice( found, 1, triangulatedObject );

                    scene.getObjectByName("Controller for " + selectedObject.uuid).detach();
                    scene.remove( scene.getObjectByName("Controller for " + selectedObject.uuid) );

                    scene.add(triangulatedObject);
                    triangulatedObject.scale.set( selectedObject.scale.x, selectedObject.scale.y, selectedObject.scale.z );
                    triangulatedObject.position.set( selectedObject.position.x, selectedObject.position.y, selectedObject.position.z );
                    triangulatedObject.rotation.set( selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z );

                    //
                    var objectControls = new THREE.TransformControls( camera, renderer.domElement );
                    objectControls.addEventListener( 'change', render );
                    objectControls.attach( triangulatedObject );
                    scene.add( objectControls );

                    /* ================== */

                    var download_link = document.getElementById("download_link");
                    download_link.style.display = "inline";
                    download_link.download = triangulatedFile.name + "_triangulated.obj";
                    download_link.href = newFilePath;

                    document.getElementById("download_hreaker").style.display = "block";
                }
            });

        }
    }, 'triangulate').name( "triangulate!" )

}


function getTriangulationButton() {
    var guiButtons = gui.getElementsByClassName("property-name");
    var triangulationButton;
    for ( var i = 0; i < guiButtons.length; i++ ) {
        if ( guiButtons[i].innerHTML === "triangulate!" )
            triangulationButton = guiButtons[i];
    };
    return triangulationButton;
}
