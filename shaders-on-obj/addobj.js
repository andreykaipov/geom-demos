var mesh = new THREE.Mesh();
var customUniforms;
var camera, scene, renderer;
var controls;
var clock = new THREE.Clock();

function addObject( url ) {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
    camera.position.set(0,0,30);

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x111000);
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    var objLoader = new THREE.OBJLoader();
    var textureLoader = new THREE.TextureLoader();

    var lavaTexture = textureLoader.load('textures/blue-scratch.jpg', function( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1,1);
        texture.needsUpdate = true;
    });

    var noiseTexture = textureLoader.load('textures/lavatile.jpg', function( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1,1);
        texture.needsUpdate = true;
    });

    window.customUniforms = {
        fogDensity: { type: "f", value: 0.45 },
        fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() },
        uvScale: { type: "v2", value: new THREE.Vector2( 3.0, 1.0 ) },
        texture1: { type: "t", value: noiseTexture },
        texture2: { type: "t", value: lavaTexture }
    };

    var customMaterial = new THREE.ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide
    });

    $.ajax({
        url: url,
        success: function( fileAsString ) {
            var object = objLoader.parse( fileAsString );
            window.mesh = object.children[0];

            mesh.material = customMaterial;

            var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );
            mesh.geometry = new THREE.BufferGeometry().fromGeometry( assignUVs(geometry) );

            scene.add( object );
        }
    });

}

function assignUVs( geometry ) {
    geometry.computeBoundingBox();

    var max     = geometry.boundingBox.max;
    var min     = geometry.boundingBox.min;

    var offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs[0] = [];
    var faces = geometry.faces;

    for (i = 0; i < geometry.faces.length ; i++) {

        var v1 = geometry.vertices[faces[i].a];
        var v2 = geometry.vertices[faces[i].b];
        var v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
        ]);

    }

    geometry.uvsNeedUpdate = true;

    return geometry;
}

function animate() {
    requestAnimationFrame( animate );
    update();
    render();
}

function update() {
    var delta = clock.getDelta();
    customUniforms.time.value += delta;
    controls.update();
}

function render() {
    renderer.render( scene, camera );
}

window.addEventListener( 'resize', onWindowResizeCamera );

function onWindowResizeCamera() {
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}
